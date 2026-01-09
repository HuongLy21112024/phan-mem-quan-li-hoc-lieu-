import { Router, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { UserModel } from '@smartlearn/database';
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
    if (req.query.role) filter.role = req.query.role;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { full_name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter).skip(skip).limit(limit).sort({ created_at: -1 }),
      UserModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
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

router.get('/:id', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findOne({ user_id: req.params.id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(
  '/',
  authorize('admin'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('full_name').notEmpty().trim(),
    body('role').isIn(['admin', 'lecturer', 'student']),
    body('campus').isIn(['hanoi', 'danang', 'hcm']),
    body('department').notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const existing = await UserModel.findOne({ email: req.body.email });
      if (existing) {
        return res.status(400).json({ success: false, error: 'Email already exists' });
      }

      const user = await UserModel.create({
        user_id: `USR${Date.now()}`,
        email: req.body.email,
        password_hash: req.body.password,
        full_name: req.body.full_name,
        role: req.body.role,
        campus: req.body.campus,
        department: req.body.department,
        status: 'active',
      });

      res.status(201).json({ success: true, data: user });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.put('/:id', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findOneAndUpdate(
      { user_id: req.params.id },
      { $set: { ...req.body, updated_at: new Date() } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findOneAndUpdate(
      { user_id: req.params.id },
      { $set: { status: 'inactive' } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
