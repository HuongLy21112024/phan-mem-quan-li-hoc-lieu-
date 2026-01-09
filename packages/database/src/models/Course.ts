import mongoose, { Schema, Model } from 'mongoose';
import { ICourse } from '../types';

const CourseSchema = new Schema<ICourse>(
  {
    course_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    course_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
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
    instructor_id: {
      type: String,
      required: true,
      index: true,
    },
    instructor_name: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    enrollment_count: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    metadata: {
      syllabus_url: String,
      max_students: { type: Number, default: 50 },
      schedule: String,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

CourseSchema.index({ campus: 1, department: 1 });
CourseSchema.index({ title: 'text', description: 'text' });

export const CourseModel: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export { CourseSchema as Course };
