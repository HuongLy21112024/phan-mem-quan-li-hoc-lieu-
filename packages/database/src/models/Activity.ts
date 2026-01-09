import mongoose, { Schema, Model } from 'mongoose';
import { IActivity } from '../types';

const ActivitySchema = new Schema<IActivity>({
  activity_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user_id: {
    type: String,
    required: true,
    index: true,
  },
  user_name: {
    type: String,
    required: true,
  },
  campus: {
    type: String,
    enum: ['hanoi', 'danang', 'hcm'],
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: ['view', 'download', 'upload', 'edit', 'delete', 'login', 'search'],
    required: true,
    index: true,
  },
  target_type: {
    type: String,
    enum: ['material', 'course', 'user'],
    required: true,
  },
  target_id: {
    type: String,
    required: true,
    index: true,
  },
  target_title: {
    type: String,
    default: '',
  },
  metadata: {
    ip_address: String,
    user_agent: String,
    device_type: String,
    browser: String,
    os: String,
    session_id: String,
    duration_seconds: Number,
    search_query: String,
    file_size_bytes: Number,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  date: {
    type: String,
    required: true,
    index: true,
  },
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },
});

ActivitySchema.index({ timestamp: -1 });
ActivitySchema.index({ user_id: 1, timestamp: -1 });
ActivitySchema.index({ target_id: 1, action: 1 });
ActivitySchema.index({ campus: 1, date: 1 });
ActivitySchema.index({ action: 1, date: 1 });

ActivitySchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 31536000 }
);

export const ActivityModel: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export { ActivitySchema as Activity };
