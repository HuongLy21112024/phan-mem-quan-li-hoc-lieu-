import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { MaterialModel, CourseModel, ActivityModel, UserModel } from '@smartlearn/database';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';
import { upload, getMaterialType } from '../middlewares/upload';
import { validatePagination, generateId } from '@smartlearn/shared';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = validatePagination(
      Number(req.query.page),
      Number(req.query.limit)
    );
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { is_deleted: false };
    if (req.query.campus) filter.campus = req.query.campus;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.course_id) filter.course_id = req.query.course_id;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [materials, total] = await Promise.all([
      MaterialModel.find(filter).skip(skip).limit(limit).sort({ created_at: -1 }),
      MaterialModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: materials,
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

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const material = await MaterialModel.findOne({
      material_id: req.params.id,
      is_deleted: false,
    });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    await MaterialModel.updateOne(
      { material_id: req.params.id },
      { $inc: { view_count: 1 } }
    );

    res.json({ success: true, data: material });
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
    body('title').notEmpty().trim(),
    body('course_id').notEmpty(),
    body('type').isIn(['slide', 'video', 'document', 'quiz', 'assignment']),
    body('file_info').isObject(),
    body('file_info.checksum_md5').notEmpty(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const course = await CourseModel.findOne({ course_id: req.body.course_id });
      if (!course) {
        return res.status(404).json({ success: false, error: 'Course not found' });
      }

      const duplicate = await MaterialModel.findOne({
        'file_info.checksum_md5': req.body.file_info.checksum_md5,
        is_deleted: false,
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate file detected',
          duplicate: {
            material_id: duplicate.material_id,
            title: duplicate.title,
            course_code: duplicate.course_code,
          },
        });
      }

      const uploader = await UserModel.findOne({ user_id: req.user!.userId });

      const material = await MaterialModel.create({
        material_id: generateId('MAT'),
        title: req.body.title,
        description: req.body.description || '',
        course_id: course.course_id,
        course_code: course.course_code,
        campus: course.campus,
        department: course.department,
        type: req.body.type,
        file_info: req.body.file_info,
        uploader_id: req.user!.userId,
        uploader_name: uploader?.full_name || 'Unknown',
        visibility: req.body.visibility || 'course',
        tags: req.body.tags || [],
      });

      await ActivityModel.create({
        activity_id: generateId('ACT'),
        user_id: req.user!.userId,
        user_name: uploader?.full_name || 'Unknown',
        campus: req.user!.campus,
        action: 'upload',
        target_type: 'material',
        target_id: material.material_id,
        target_title: material.title,
        timestamp: new Date(),
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours(),
      });

      res.status(201).json({ success: true, data: material });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Upload file route
router.post(
  '/upload',
  authenticate,
  authorize('admin', 'lecturer'),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const { title, description, course_id, visibility, tags } = req.body;

      if (!title || !course_id) {
        // Delete uploaded file if validation fails
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          success: false, 
          error: 'Title and course_id are required' 
        });
      }

      // Find course
      const course = await CourseModel.findOne({ course_id });
      if (!course) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, error: 'Course not found' });
      }

      // Calculate MD5 checksum
      const fileBuffer = fs.readFileSync(req.file.path);
      const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');

      // Check for duplicates
      const duplicate = await MaterialModel.findOne({
        'file_info.checksum_md5': checksum,
        is_deleted: false,
      });

      if (duplicate) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          error: 'File trùng lặp đã tồn tại',
          duplicate: {
            material_id: duplicate.material_id,
            title: duplicate.title,
            course_code: duplicate.course_code,
          },
        });
      }

      const uploader = await UserModel.findOne({ user_id: req.user!.userId });
      const materialType = getMaterialType(req.file.mimetype);

      // Create material record
      const material = await MaterialModel.create({
        material_id: generateId('MAT'),
        title,
        description: description || '',
        course_id: course.course_id,
        course_code: course.course_code,
        campus: course.campus,
        department: course.department,
        type: materialType,
        file_info: {
          filename: req.file.filename,
          original_name: req.file.originalname,
          mime_type: req.file.mimetype,
          size_bytes: req.file.size,
          storage_path: req.file.path.replace(/\\/g, '/'),
          checksum_md5: checksum,
        },
        uploader_id: req.user!.userId,
        uploader_name: uploader?.full_name || 'Unknown',
        visibility: visibility || 'course',
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : [],
      });

      // Log activity
      await ActivityModel.create({
        activity_id: generateId('ACT'),
        user_id: req.user!.userId,
        user_name: uploader?.full_name || 'Unknown',
        campus: req.user!.campus,
        action: 'upload',
        target_type: 'material',
        target_id: material.material_id,
        target_title: material.title,
        metadata: {
          file_size_bytes: req.file.size,
          file_type: materialType,
        },
        timestamp: new Date(),
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours(),
      });

      res.status(201).json({ 
        success: true, 
        data: material,
        message: 'Upload thành công!'
      });
    } catch (error: unknown) {
      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.post('/check-duplicate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { checksum } = req.body;
    if (!checksum) {
      return res.status(400).json({ success: false, error: 'Checksum required' });
    }

    const duplicate = await MaterialModel.findOne({
      'file_info.checksum_md5': checksum,
      is_deleted: false,
    });

    res.json({
      success: true,
      data: {
        isDuplicate: !!duplicate,
        existing: duplicate ? {
          material_id: duplicate.material_id,
          title: duplicate.title,
          course_code: duplicate.course_code,
        } : null,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'lecturer'),
  async (req: AuthRequest, res: Response) => {
    try {
      const material = await MaterialModel.findOne({
        material_id: req.params.id,
        is_deleted: false,
      });

      if (!material) {
        return res.status(404).json({ success: false, error: 'Material not found' });
      }

      if (req.user!.role !== 'admin' && material.uploader_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      const updated = await MaterialModel.findOneAndUpdate(
        { material_id: req.params.id },
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
  authorize('admin', 'lecturer'),
  async (req: AuthRequest, res: Response) => {
    try {
      const material = await MaterialModel.findOne({
        material_id: req.params.id,
        is_deleted: false,
      });

      if (!material) {
        return res.status(404).json({ success: false, error: 'Material not found' });
      }

      if (req.user!.role !== 'admin' && material.uploader_id !== req.user!.userId) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      await MaterialModel.findOneAndUpdate(
        { material_id: req.params.id },
        { $set: { is_deleted: true } }
      );

      res.json({ success: true, message: 'Material deleted successfully' });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

router.post('/:id/download', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const material = await MaterialModel.findOne({
      material_id: req.params.id,
      is_deleted: false,
    });

    if (!material) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }

    // Check if file exists on disk
    const filePath = material.file_info.storage_path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        error: 'File không tồn tại trên hệ thống. Vui lòng liên hệ quản trị viên.' 
      });
    }

    // Update download count
    await MaterialModel.updateOne(
      { material_id: req.params.id },
      { $inc: { download_count: 1 } }
    );

    const user = await UserModel.findOne({ user_id: req.user!.userId });

    // Log activity
    await ActivityModel.create({
      activity_id: generateId('ACT'),
      user_id: req.user!.userId,
      user_name: user?.full_name || 'Unknown',
      campus: req.user!.campus,
      action: 'download',
      target_type: 'material',
      target_id: material.material_id,
      target_title: material.title,
      metadata: {
        file_size_bytes: material.file_info.size_bytes,
      },
      timestamp: new Date(),
      date: new Date().toISOString().split('T')[0],
      hour: new Date().getHours(),
    });

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(material.file_info.original_name)}"`);
    res.setHeader('Content-Type', material.file_info.mime_type);
    res.setHeader('Content-Length', material.file_info.size_bytes);

    // Stream file to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Lỗi khi đọc file' });
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
