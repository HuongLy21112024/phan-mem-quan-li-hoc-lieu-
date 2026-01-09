export const CAMPUSES = ['hanoi', 'danang', 'hcm'] as const;

export const CAMPUS_LABELS: Record<string, string> = {
  hanoi: 'Hà Nội',
  danang: 'Đà Nẵng',
  hcm: 'TP. Hồ Chí Minh',
};

export const ROLES = ['admin', 'lecturer', 'student'] as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  lecturer: 'Giảng viên',
  student: 'Sinh viên',
};

export const MATERIAL_TYPES = ['slide', 'video', 'document', 'quiz', 'assignment'] as const;

export const MATERIAL_TYPE_LABELS: Record<string, string> = {
  slide: 'Slide bài giảng',
  video: 'Video',
  document: 'Tài liệu',
  quiz: 'Bài kiểm tra',
  assignment: 'Bài tập',
};

export const VISIBILITY_OPTIONS = ['public', 'course', 'private'] as const;

export const VISIBILITY_LABELS: Record<string, string> = {
  public: 'Công khai',
  course: 'Trong khóa học',
  private: 'Riêng tư',
};

export const DEPARTMENTS = [
  'Công nghệ thông tin',
  'Toán học',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Ngữ văn',
  'Lịch sử',
  'Địa lý',
  'Tiếng Anh',
  'Giáo dục học',
];

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    CHANGE_PASSWORD: '/api/auth/change-password',
  },
  USERS: '/api/users',
  COURSES: '/api/courses',
  MATERIALS: '/api/materials',
  ACTIVITIES: '/api/activities',
  STATS: {
    OVERVIEW: '/api/stats/overview',
    DAILY: '/api/stats/daily',
    MATERIALS: '/api/stats/materials',
    USERS: '/api/stats/users',
    CAMPUS: '/api/stats/campus',
    REALTIME: '/api/stats/realtime',
  },
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
};

export const FILE_SIZE_LIMITS = {
  MAX_SIZE: 50 * 1024 * 1024,
  ALLOWED_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'video/webm',
    'image/jpeg',
    'image/png',
    'application/json',
  ],
};
