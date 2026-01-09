import mongoose, { Schema, Model } from 'mongoose';
import { IMaterial } from '../types';

const MaterialSchema = new Schema<IMaterial>(
  {
    material_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    course_id: {
      type: String,
      required: true,
      index: true,
    },
    course_code: {
      type: String,
      required: true,
    },
    campus: {
      type: String,
      enum: ['hanoi', 'danang', 'hcm'],
      required: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['slide', 'video', 'document', 'quiz', 'assignment'],
      required: true,
      index: true,
    },
    file_info: {
      filename: { type: String, required: true },
      original_name: { type: String, required: true },
      mime_type: { type: String, required: true },
      size_bytes: { type: Number, required: true },
      storage_path: { type: String, required: true },
      checksum_md5: { type: String, required: true },
    },
    uploader_id: {
      type: String,
      required: true,
      index: true,
    },
    uploader_name: {
      type: String,
      required: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'course', 'private'],
      default: 'course',
    },
    download_count: {
      type: Number,
      default: 0,
    },
    view_count: {
      type: Number,
      default: 0,
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

MaterialSchema.index({ campus: 1, course_id: 1 });
MaterialSchema.index({ course_id: 1, type: 1 });
MaterialSchema.index({ 'file_info.checksum_md5': 1 });
MaterialSchema.index({ created_at: -1 });
MaterialSchema.index({ title: 'text', description: 'text' });

MaterialSchema.statics.findDuplicate = async function (checksum: string) {
  return this.findOne({
    'file_info.checksum_md5': checksum,
    is_deleted: false,
  });
};

export const MaterialModel: Model<IMaterial> =
  mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);

export { MaterialSchema as Material };
