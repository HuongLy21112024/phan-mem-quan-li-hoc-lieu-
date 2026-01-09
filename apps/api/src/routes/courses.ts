import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { CourseModel, UserModel } from '@smartlearn/database';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';
import { validatePagination, generateId } from '@smartlearn/shared';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = validatePagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { status: 'active' };
    if (req.query.campus) filter.campus = req.query.campus;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.instructor_id) filter.instructor_id = req.query.instructor_id;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { course_code: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [courses, total] = await Promise.all([
      CourseModel.find(filter).skip(skip).limit(limit).sort({ created_at: -1 }),
      CourseModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: courses,
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

// Get recommended courses for current user (based on campus)
router.get('/recommended', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5, 10);
    
    // Find courses matching user's campus
    const filter: Record<string, unknown> = { 
      status: 'active',
      campus: req.user!.campus
    };

    // Exclude courses the user is teaching
    if (req.user!.role === 'lecturer') {
      filter.instructor_id = { $ne: req.user!.userId };
    }

    const courses = await CourseModel.find(filter)
      .limit(limit)
      .sort({ enrollment_count: -1, created_at: -1 });

    res.json({
      success: true,
      data: courses,
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const course = await CourseModel.findOne({ course_id: req.params.id });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    res.json({ success: true, data: course });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  '/',
  authenticate,
  authorize('admin', 'lecturer'),
  [
    body('course_code').notEmpty().trim().toUpperCase(),
    body('title').notEmpty().trim(),
    body('campus').isIn(['hanoi', 'danang', 'hcm']),
    body('department').notEmpty().trim(),
    body('credits').isInt({ min: 1, max: 10 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const existing = await CourseModel.findOne({ course_code: req.body.course_code });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Course code already exists' });
      }

      const instructor = await UserModel.findOne({ user_id: req.user!.userId });

      const course = await CourseModel.create({
        course_id: generateId('CRS'),
        course_code: req.body.course_code,
        title: req.body.title,
        description: req.body.description || '',
        campus: req.body.campus,
        department: req.body.department,
        instructor_id: req.user!.userId,
        instructor_name: instructor?.full_name || 'Unknown',
        semester: req.body.semester || '2024-2',
        credits: req.body.credits,
        status: 'active',
        tags: req.body.tags || [],
      });

      res.status(201).json({ success: true, data: course });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'lecturer'),
  async (req: AuthRequest, res: Response) => {
    try {
      const course = await CourseModel.findOne({ course_id: req.params.id });
      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }

      if (req.user!.role !== 'admin' && course.instructor_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      const updated = await CourseModel.findOneAndUpdate(
        { course_id: req.params.id },
        { $set: { ...req.body, updated_at: new Date() } },
        { new: true }
      );

      res.json({ success: true, data: updated });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const course = await CourseModel.findOneAndUpdate(
        { course_id: req.params.id },
        { $set: { status: 'inactive' } },
        { new: true }
      );

      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }

      res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
