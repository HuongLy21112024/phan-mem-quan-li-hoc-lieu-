export type UserRole = 'admin' | 'lecturer' | 'student';
export type Campus = 'hanoi' | 'danang' | 'hcm';
export type MaterialType = 'slide' | 'video' | 'document' | 'quiz' | 'assignment';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  campus: Campus;
  department: string;
  role?: UserRole;
}

export interface UserPublic {
  user_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  campus: Campus;
  department: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

export interface CoursePublic {
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
  status: string;
  enrollment_count: number;
  tags: string[];
  created_at: string;
}

export interface MaterialPublic {
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
  };
  uploader_id: string;
  uploader_name: string;
  visibility: string;
  download_count: number;
  view_count: number;
  rating: {
    average: number;
    count: number;
  };
  tags: string[];
  created_at: string;
}

export interface StatsOverview {
  totalUsers: number;
  totalCourses: number;
  totalMaterials: number;
  totalDownloads: number;
  totalViews: number;
  usersByCampus: Record<Campus, number>;
  materialsByType: Record<MaterialType, number>;
}

export interface DailyStats {
  date: string;
  downloads: number;
  views: number;
  uploads: number;
  uniqueUsers: number;
}

export interface ActivityStats {
  campus: Campus;
  actions: { action: string; count: number }[];
  total: number;
}
