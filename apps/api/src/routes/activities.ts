import { Router, Response } from 'express';
import { ActivityModel } from '@smartlearn/database';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';
import { validatePagination } from '@smartlearn/shared';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = validatePagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (req.query.campus) filter.campus = req.query.campus;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.user_id) filter.user_id = req.query.user_id;
    if (req.query.date) filter.date = req.query.date;

    const [activities, total] = await Promise.all([
      ActivityModel.find(filter).skip(skip).limit(limit).sort({ timestamp: -1 }),
      ActivityModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/user/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin' && req.user!.userId !== req.params.userId) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const { page, limit } = validatePagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      ActivityModel.find({ user_id: req.params.userId })
        .skip(skip)
        .limit(limit)
        .sort({ timestamp: -1 }),
      ActivityModel.countDocuments({ user_id: req.params.userId }),
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get current user's recent activities
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 20);

    const activities = await ActivityModel.find({ user_id: req.user!.userId })
      .limit(limit)
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      data: activities,
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
