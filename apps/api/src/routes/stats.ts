import { Router, Response } from 'express';
import { UserModel, CourseModel, MaterialModel, ActivityModel } from '@smartlearn/database';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/overview', authorize('admin', 'lecturer'), async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalMaterials,
      downloadStats,
      viewStats,
      usersByCampus,
      materialsByType,
    ] = await Promise.all([
      UserModel.countDocuments({ status: 'active' }),
      CourseModel.countDocuments({ status: 'active' }),
      MaterialModel.countDocuments({ is_deleted: false }),
      MaterialModel.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: null, total: { $sum: '$download_count' } } },
      ]),
      MaterialModel.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: null, total: { $sum: '$view_count' } } },
      ]),
      UserModel.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$campus', count: { $sum: 1 } } },
      ]),
      MaterialModel.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalMaterials,
        totalDownloads: downloadStats[0]?.total || 0,
        totalViews: viewStats[0]?.total || 0,
        usersByCampus: Object.fromEntries(
          usersByCampus.map((item) => [item._id, item.count])
        ),
        materialsByType: Object.fromEntries(
          materialsByType.map((item) => [item._id, item.count])
        ),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/daily', authorize('admin', 'lecturer'), async (req: AuthRequest, res: Response) => {
  try {
    const days = Number(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyStats = await ActivityModel.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          action: { $in: ['view', 'download', 'upload'] },
        },
      },
      {
        $group: {
          _id: {
            date: '$date',
            action: '$action',
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user_id' },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          actions: {
            $push: {
              action: '$_id.action',
              count: '$count',
            },
          },
          uniqueUsers: { $addToSet: '$uniqueUsers' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formattedStats = dailyStats.map((day) => {
      const stats: Record<string, number> = { downloads: 0, views: 0, uploads: 0 };
      day.actions.forEach((a: { action: string; count: number }) => {
        if (a.action === 'download') stats.downloads = a.count;
        if (a.action === 'view') stats.views = a.count;
        if (a.action === 'upload') stats.uploads = a.count;
      });
      return {
        date: day._id,
        ...stats,
        uniqueUsers: [...new Set(day.uniqueUsers.flat())].length,
      };
    });

    res.json({ success: true, data: formattedStats });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/realtime', authorize('admin', 'lecturer'), async (_req: AuthRequest, res: Response) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentActivities, hourlyStats, topMaterials] = await Promise.all([
      ActivityModel.find({ timestamp: { $gte: last24h } })
        .sort({ timestamp: -1 })
        .limit(20),
      ActivityModel.aggregate([
        { $match: { timestamp: { $gte: last24h } } },
        {
          $group: {
            _id: '$hour',
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MaterialModel.aggregate([
        { $match: { is_deleted: false } },
        {
          $project: {
            material_id: 1,
            title: 1,
            download_count: 1,
            view_count: 1,
            engagement: { $add: ['$download_count', { $multiply: ['$view_count', 0.1] }] },
          },
        },
        { $sort: { engagement: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        recentActivities,
        hourlyStats: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: hourlyStats.find((h) => h._id === i)?.count || 0,
        })),
        topMaterials,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/campus/:campus', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const campus = req.params.campus;

    const [users, courses, materials, activities] = await Promise.all([
      UserModel.countDocuments({ campus, status: 'active' }),
      CourseModel.countDocuments({ campus, status: 'active' }),
      MaterialModel.countDocuments({ campus, is_deleted: false }),
      ActivityModel.aggregate([
        { $match: { campus } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        campus,
        users,
        courses,
        materials,
        activities: Object.fromEntries(
          activities.map((item) => [item._id, item.count])
        ),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/materials', authorize('admin', 'lecturer'), async (req: AuthRequest, res: Response) => {
  try {
    const [byType, byDepartment, topDownloaded, topViewed] = await Promise.all([
      MaterialModel.aggregate([
        { $match: { is_deleted: false } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalDownloads: { $sum: '$download_count' },
            totalViews: { $sum: '$view_count' },
          },
        },
      ]),
      MaterialModel.aggregate([
        { $match: { is_deleted: false } },
        {
          $group: {
            _id: '$department',
            count: { $sum: 1 },
            totalDownloads: { $sum: '$download_count' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      MaterialModel.find({ is_deleted: false })
        .sort({ download_count: -1 })
        .limit(10)
        .select('material_id title course_code download_count'),
      MaterialModel.find({ is_deleted: false })
        .sort({ view_count: -1 })
        .limit(10)
        .select('material_id title course_code view_count'),
    ]);

    res.json({
      success: true,
      data: { byType, byDepartment, topDownloaded, topViewed },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
