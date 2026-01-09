
**Hướng dẫn truy cập web trực tiếp**

Web App (Học viên) http://13.250.104.165/ Trang chính dành cho sinh viên/giảng viên. 

Admin Portal http://13.250.104.165/admin/ Trang quản trị hệ thống.

API Server http://13.250.104.165/api 

API Health Check http://13.250.104.165/health Kiểm tra trạng thái hệ thống.


# SmartLearn - Hệ thống Học liệu mở

Hệ thống quản lý học liệu số phân tán sử dụng MongoDB, Node.js và React.

## Cấu trúc dự án

```
smartlearn-monorepo/
├── apps/
│   ├── api/          # Backend API (Node.js/Express)
│   ├── web/          # Frontend cho users (React + Vite)
│   └── admin/        # Admin Dashboard (React + Vite)
├── packages/
│   ├── database/     # MongoDB models và connection
│   └── shared/       # Shared types và utilities
├── turbo.json        # Turborepo configuration
└── package.json      # Root package.json
```

## Yêu cầu

- Node.js >= 18.0.0
- npm >= 10.0.0
- MongoDB Atlas account

## Cài đặt

1. Clone repository và cài đặt dependencies:

```bash
cd smartlearn-monorepo
npm install
```

2. Tạo file `.env` trong thư mục `apps/api`:

```bash
cp apps/api/.env.example apps/api/.env
```

3. Cập nhật biến môi trường trong `apps/api/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smartlearn
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
```

## Chạy ứng dụng

### Development mode

```bash
# Chạy tất cả apps cùng lúc
npm run dev

# Hoặc chạy từng app riêng lẻ
cd apps/api && npm run dev     # API: http://localhost:3001
cd apps/web && npm run dev     # Web: http://localhost:3000
cd apps/admin && npm run dev   # Admin: http://localhost:3002
```

### Seed dữ liệu mẫu

```bash
cd packages/database
npm run db:seed
```

### Build production

```bash
npm run build
```

## Tài khoản mặc định

Sau khi seed dữ liệu:

- **Admin**: admin@hnue.edu.vn / Admin@123

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/refresh` - Làm mới token
- `GET /api/auth/me` - Lấy thông tin user

### Users (Admin only)
- `GET /api/users` - Danh sách users
- `POST /api/users` - Tạo user
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

### Courses
- `GET /api/courses` - Danh sách khóa học
- `POST /api/courses` - Tạo khóa học
- `PUT /api/courses/:id` - Cập nhật khóa học
- `DELETE /api/courses/:id` - Xóa khóa học

### Materials
- `GET /api/materials` - Danh sách học liệu
- `POST /api/materials` - Upload học liệu
- `POST /api/materials/check-duplicate` - Kiểm tra trùng lặp
- `POST /api/materials/:id/download` - Tải học liệu

### Statistics
- `GET /api/stats/overview` - Thống kê tổng quan
- `GET /api/stats/daily` - Thống kê theo ngày
- `GET /api/stats/realtime` - Thống kê thời gian thực
- `GET /api/stats/campus/:campus` - Thống kê theo cơ sở

## Tính năng chính

- ✅ Xác thực JWT với refresh token
- ✅ Phân quyền RBAC (Admin/Lecturer/Student)
- ✅ Sharding theo Campus hoặc CourseID
- ✅ Chống trùng lặp học liệu bằng MD5 hash
- ✅ Thống kê real-time với aggregation pipeline
- ✅ Rate limiting bảo vệ API
- ✅ Dashboard quản trị với charts

## Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose)
- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Auth**: JWT, bcrypt
- **Charts**: Chart.js
- **State**: Zustand
- **Build**: Turborepo

## License

MIT
