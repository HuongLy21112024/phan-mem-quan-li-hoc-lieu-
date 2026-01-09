import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Allowed file types
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  slide: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'],
};

const ALL_ALLOWED_TYPES = Object.values(ALLOWED_MIME_TYPES).flat();

// Size limits per type (in bytes)
const SIZE_LIMITS: Record<string, number> = {
  document: 50 * 1024 * 1024,   // 50MB
  slide: 100 * 1024 * 1024,     // 100MB
  video: 500 * 1024 * 1024,     // 500MB
  archive: 200 * 1024 * 1024,   // 200MB
};

// Get upload directory path
function getUploadDir(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dir = path.join(__dirname, '../../uploads/materials', String(year), month);
  
  // Create directory if not exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  return dir;
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, getUploadDir());
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Loại file không được hỗ trợ: ${file.mimetype}`));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // Max 500MB
  },
});

// Helper to get file type category
export function getFileTypeCategory(mimetype: string): string {
  for (const [category, types] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (types.includes(mimetype)) {
      return category;
    }
  }
  return 'document';
}

// Helper to get Material type from mime
export function getMaterialType(mimetype: string): string {
  if (ALLOWED_MIME_TYPES.video.includes(mimetype)) return 'video';
  if (ALLOWED_MIME_TYPES.slide.includes(mimetype)) return 'slide';
  return 'document';
}

export { SIZE_LIMITS, ALLOWED_MIME_TYPES };
