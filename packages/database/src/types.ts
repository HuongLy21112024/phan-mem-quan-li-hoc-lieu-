import { Document, Types } from 'mongoose';

export type UserRole = 'admin' | 'lecturer' | 'student';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type Campus = 'hanoi' | 'danang' | 'hcm';
export type MaterialType = 'slide' | 'video' | 'document' | 'quiz' | 'assignment';
export type Visibility = 'public' | 'course' | 'private';
export type ActionType = 'view' | 'download' | 'upload' | 'edit' | 'delete' | 'login' | 'search';

export interface IUser extends Document {
  _id: Types.ObjectId;
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  campus: Campus;
  department: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  status: UserStatus;
  preferences: {
    language: string;
    notifications: boolean;
    theme: string;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ICourse extends Document {
  _id: Types.ObjectId;
  course_id: string;
  course_code: string;
  title: string;
  description: string;
  campus: Campus;
  department: string;
  instructor_id: string;
  instructor_name: string;
  semester: string;
  credits: number;
  status: 'active' | 'inactive';
  enrollment_count: number;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  metadata: {
    syllabus_url?: string;
    max_students: number;
    schedule?: string;
  };
}

export interface IMaterial extends Document {
  _id: Types.ObjectId;
  material_id: string;
  title: string;
  description: string;
  course_id: string;
  course_code: string;
  campus: Campus;
  department: string;
  type: MaterialType;
  file_info: {
    filename: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    storage_path: string;
    checksum_md5: string;
  };
  uploader_id: string;
  uploader_name: string;
  visibility: Visibility;
  download_count: number;
  view_count: number;
  rating: {
    average: number;
    count: number;
  };
  tags: string[];
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export interface IActivity extends Document {
  _id: Types.ObjectId;
  activity_id: string;
  user_id: string;
  user_name: string;
  campus: Campus;
  action: ActionType;
  target_type: 'material' | 'course' | 'user';
  target_id: string;
  target_title: string;
  metadata: {
    ip_address?: string;
    user_agent?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    session_id?: string;
    duration_seconds?: number;
    search_query?: string;
    file_size_bytes?: number;
  };
  timestamp: Date;
  date: string;
  hour: number;
}

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}
