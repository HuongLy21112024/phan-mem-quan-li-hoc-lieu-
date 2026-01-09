/**
 * Script tạo dữ liệu mẫu cho hệ thống SmartLearn
 * Theo yêu cầu tài liệu HocLieuSo_TaiLieu_ChiTiet.md:
 * - Users: 200 bản ghi (100 HN, 50 ĐN, 50 HCM)
 * - Courses: 50 bản ghi (25 HN, 15 ĐN, 10 HCM)
 * - Materials: 300 bản ghi
 * - Activities: 500 bản ghi (30 ngày gần nhất)
 * Tổng: >= 1000 bản ghi
 */

import { connectDB, disconnectDB } from './connection';
import { UserModel, CourseModel, MaterialModel, ActivityModel } from './models';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// ============ CONSTANTS ============
const DEPARTMENTS = [
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

const COURSE_PREFIXES: Record<string, string> = {
  'Công nghệ thông tin': 'IT',
  'Toán học': 'MATH',
  'Vật lý': 'PHY',
  'Hóa học': 'CHEM',
  'Sinh học': 'BIO',
  'Ngữ văn': 'LIT',
  'Lịch sử': 'HIS',
  'Địa lý': 'GEO',
  'Tiếng Anh': 'ENG',
  'Giáo dục học': 'EDU',
};

const COURSE_TITLES: Record<string, string[]> = {
  'Công nghệ thông tin': ['Nhập môn lập trình', 'Cấu trúc dữ liệu', 'Cơ sở dữ liệu', 'Mạng máy tính', 'Trí tuệ nhân tạo'],
  'Toán học': ['Giải tích 1', 'Đại số tuyến tính', 'Xác suất thống kê', 'Toán rời rạc', 'Phương trình vi phân'],
  'Vật lý': ['Cơ học', 'Điện từ học', 'Quang học', 'Vật lý hiện đại', 'Nhiệt động lực học'],
  'Hóa học': ['Hóa đại cương', 'Hóa hữu cơ', 'Hóa vô cơ', 'Hóa phân tích', 'Hóa lý'],
  'Sinh học': ['Sinh học đại cương', 'Di truyền học', 'Sinh thái học', 'Vi sinh vật học', 'Sinh học phân tử'],
  'Ngữ văn': ['Văn học Việt Nam', 'Văn học thế giới', 'Ngôn ngữ học', 'Lý luận văn học', 'Phương pháp nghiên cứu văn học'],
  'Lịch sử': ['Lịch sử Việt Nam', 'Lịch sử thế giới', 'Khảo cổ học', 'Phương pháp nghiên cứu lịch sử', 'Lịch sử văn hóa'],
  'Địa lý': ['Địa lý tự nhiên', 'Địa lý kinh tế', 'Địa lý nhân văn', 'Bản đồ học', 'GIS và viễn thám'],
  'Tiếng Anh': ['Ngữ pháp tiếng Anh', 'Kỹ năng nghe', 'Kỹ năng nói', 'Kỹ năng viết', 'Dịch thuật'],
  'Giáo dục học': ['Tâm lý học giáo dục', 'Phương pháp giảng dạy', 'Đánh giá trong giáo dục', 'Quản lý giáo dục', 'Công nghệ giáo dục'],
};

const VIETNAMESE_FIRST_NAMES = ['Văn', 'Thị', 'Hữu', 'Minh', 'Hoàng', 'Thanh', 'Quốc', 'Ngọc', 'Đức', 'Tuấn'];
const VIETNAMESE_MIDDLE_NAMES = ['Anh', 'Bình', 'Cường', 'Dũng', 'Hải', 'Hùng', 'Khoa', 'Long', 'Nam', 'Phong'];
const VIETNAMESE_LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];

const MATERIAL_TITLES: Record<string, string[]> = {
  slide: ['Bài giảng', 'Slide thuyết trình', 'Tổng quan', 'Giới thiệu', 'Tóm tắt'],
  video: ['Video bài giảng', 'Hướng dẫn thực hành', 'Demo', 'Webinar', 'Tutorial'],
  document: ['Tài liệu tham khảo', 'Giáo trình', 'Sách điện tử', 'Bài đọc', 'Nghiên cứu'],
  quiz: ['Bài kiểm tra', 'Câu hỏi ôn tập', 'Trắc nghiệm', 'Đề thi mẫu', 'Self-assessment'],
  assignment: ['Bài tập', 'Đồ án', 'Project', 'Thực hành', 'Case study'],
};

type Campus = 'hanoi' | 'danang' | 'hcm';
type UserRole = 'admin' | 'lecturer' | 'student';
type MaterialType = 'slide' | 'video' | 'document' | 'quiz' | 'assignment';
type ActionType = 'view' | 'download' | 'upload' | 'login' | 'search';

// ============ HELPERS ============
function generateId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMD5(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

function generateVietnameseName(): string {
  const lastName = randomElement(VIETNAMESE_LAST_NAMES);
  const middleName = randomElement(VIETNAMESE_MIDDLE_NAMES);
  const firstName = randomElement(VIETNAMESE_FIRST_NAMES);
  return `${lastName} ${middleName} ${firstName}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ SEED FUNCTIONS ============

interface UserData {
  user_id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  campus: Campus;
  department: string;
  status: 'active' | 'inactive';
}

async function seedUsers(): Promise<UserData[]> {
  console.log('\n📦 Seeding Users...');
  console.log('   Target: 200 users (100 HN, 50 DN, 50 HCM)');
  
  const users: UserData[] = [];
  
  // Pre-hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const lecturerPassword = await bcrypt.hash('Lecturer@123', 12);
  const studentPassword = await bcrypt.hash('Student@123', 12);
  
  // Admin account
  users.push({
    user_id: generateId('USR'),
    email: 'admin@hnue.edu.vn',
    password_hash: adminPassword,
    full_name: 'Quản trị viên hệ thống',
    role: 'admin',
    campus: 'hanoi',
    department: 'Công nghệ thông tin',
    status: 'active',
  });

  // Distribution: 100 HN, 50 DN, 50 HCM
  const campusConfig: { campus: Campus; count: number }[] = [
    { campus: 'hanoi', count: 99 },   // 99 + 1 admin = 100
    { campus: 'danang', count: 50 },
    { campus: 'hcm', count: 50 },
  ];

  let userIndex = 1;
  
  for (const { campus, count } of campusConfig) {
    // 20% lecturers, 80% students per campus
    const lecturerCount = Math.floor(count * 0.2);
    const studentCount = count - lecturerCount;

    // Create lecturers
    for (let i = 0; i < lecturerCount; i++) {
      const department = randomElement(DEPARTMENTS);
      users.push({
        user_id: generateId('USR'),
        email: `lecturer${userIndex}@hnue.edu.vn`,
        password_hash: lecturerPassword,
        full_name: `GV. ${generateVietnameseName()}`,
        role: 'lecturer',
        campus,
        department,
        status: 'active',
      });
      userIndex++;
    }

    // Create students
    for (let i = 0; i < studentCount; i++) {
      const department = randomElement(DEPARTMENTS);
      users.push({
        user_id: generateId('USR'),
        email: `student${userIndex}@hnue.edu.vn`,
        password_hash: studentPassword,
        full_name: generateVietnameseName(),
        role: 'student',
        campus,
        department,
        status: Math.random() > 0.05 ? 'active' : 'inactive', // 5% inactive
      });
      userIndex++;
    }
  }

  await UserModel.insertMany(users);
  
  const stats = {
    hanoi: users.filter(u => u.campus === 'hanoi').length,
    danang: users.filter(u => u.campus === 'danang').length,
    hcm: users.filter(u => u.campus === 'hcm').length,
    lecturers: users.filter(u => u.role === 'lecturer').length,
    students: users.filter(u => u.role === 'student').length,
  };
  
  console.log(`   ✅ Created ${users.length} users`);
  console.log(`      - Hà Nội: ${stats.hanoi}, Đà Nẵng: ${stats.danang}, HCM: ${stats.hcm}`);
  console.log(`      - Giảng viên: ${stats.lecturers}, Sinh viên: ${stats.students}`);
  
  return users;
}

interface CourseData {
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
}

async function seedCourses(users: UserData[]): Promise<CourseData[]> {
  console.log('\n📦 Seeding Courses...');
  console.log('   Target: 50 courses (25 HN, 15 DN, 10 HCM)');
  
  const courses: CourseData[] = [];
  const lecturers = users.filter(u => u.role === 'lecturer' || u.role === 'admin');
  
  // Distribution: 25 HN, 15 DN, 10 HCM
  const campusConfig: { campus: Campus; count: number }[] = [
    { campus: 'hanoi', count: 25 },
    { campus: 'danang', count: 15 },
    { campus: 'hcm', count: 10 },
  ];

  let courseIndex = 100;
  const usedCodes = new Set<string>();

  for (const { campus, count } of campusConfig) {
    const campusLecturers = lecturers.filter(l => l.campus === campus);
    
    for (let i = 0; i < count; i++) {
      const department = randomElement(DEPARTMENTS);
      const prefix = COURSE_PREFIXES[department];
      const titles = COURSE_TITLES[department];
      
      // Generate unique course code
      let courseCode: string;
      do {
        courseCode = `${prefix}${courseIndex++}`;
      } while (usedCodes.has(courseCode));
      usedCodes.add(courseCode);

      const deptLecturers = campusLecturers.filter(l => l.department === department);
      const lecturer = deptLecturers.length > 0 
        ? randomElement(deptLecturers)
        : campusLecturers.length > 0 
          ? randomElement(campusLecturers)
          : randomElement(lecturers);

      courses.push({
        course_id: generateId('CRS'),
        course_code: courseCode,
        title: randomElement(titles),
        description: `Khóa học ${randomElement(titles)} thuộc khoa ${department}. Cung cấp kiến thức nền tảng và nâng cao cho sinh viên.`,
        campus,
        department,
        instructor_id: lecturer.user_id,
        instructor_name: lecturer.full_name,
        semester: randomElement(['2024-1', '2024-2', '2025-1']),
        credits: randomInt(2, 4),
        status: 'active',
        enrollment_count: randomInt(20, 60),
        tags: [prefix.toLowerCase(), department.toLowerCase().replace(/\s+/g, '-'), 'semester-2024'],
      });
    }
  }

  await CourseModel.insertMany(courses);
  
  const stats = {
    hanoi: courses.filter(c => c.campus === 'hanoi').length,
    danang: courses.filter(c => c.campus === 'danang').length,
    hcm: courses.filter(c => c.campus === 'hcm').length,
  };
  
  console.log(`   ✅ Created ${courses.length} courses`);
  console.log(`      - Hà Nội: ${stats.hanoi}, Đà Nẵng: ${stats.danang}, HCM: ${stats.hcm}`);
  
  return courses;
}

interface MaterialData {
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
  visibility: 'public' | 'course' | 'private';
  download_count: number;
  view_count: number;
  rating: { average: number; count: number };
  tags: string[];
  is_deleted: boolean;
}

async function seedMaterials(users: UserData[], courses: CourseData[]): Promise<MaterialData[]> {
  console.log('\n📦 Seeding Materials...');
  console.log('   Target: 300 materials (distributed across courses)');
  
  const materials: MaterialData[] = [];
  const lecturers = users.filter(u => u.role === 'lecturer' || u.role === 'admin');
  const checksums = new Set<string>();

  const MATERIAL_TYPES: MaterialType[] = ['slide', 'video', 'document', 'quiz', 'assignment'];
  
  const mimeTypes: Record<MaterialType, string> = {
    slide: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    video: 'video/mp4',
    document: 'application/pdf',
    quiz: 'application/json',
    assignment: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  const extensions: Record<MaterialType, string> = {
    slide: '.pptx',
    video: '.mp4',
    document: '.pdf',
    quiz: '.json',
    assignment: '.docx',
  };

  // Distribute ~6 materials per course (300 / 50 = 6)
  for (const course of courses) {
    const materialsPerCourse = randomInt(4, 8);
    const courseLecturers = lecturers.filter(l => l.campus === course.campus);
    const uploader = courseLecturers.find(l => l.user_id === course.instructor_id) || randomElement(courseLecturers);

    for (let i = 0; i < materialsPerCourse; i++) {
      if (materials.length >= 300) break;

      const type = randomElement(MATERIAL_TYPES);
      const titlePrefix = randomElement(MATERIAL_TITLES[type]);

      // Generate unique checksum (duplicate detection)
      let checksum: string;
      do {
        checksum = generateMD5(`${course.course_id}-${type}-${i}-${Date.now()}-${Math.random()}`);
      } while (checksums.has(checksum));
      checksums.add(checksum);

      const chapterNum = i + 1;
      
      materials.push({
        material_id: generateId('MAT'),
        title: `${titlePrefix} - Chương ${chapterNum}: ${course.title}`,
        description: `${titlePrefix} cho khóa học ${course.course_code}. Nội dung bao gồm các kiến thức cơ bản và nâng cao về ${course.title}.`,
        course_id: course.course_id,
        course_code: course.course_code,
        campus: course.campus,
        department: course.department,
        type,
        file_info: {
          filename: `${generateId('file')}${extensions[type]}`,
          original_name: `${course.course_code}_Chuong${chapterNum}_${type}${extensions[type]}`,
          mime_type: mimeTypes[type],
          size_bytes: type === 'video' ? randomInt(50000000, 200000000) : randomInt(100000, 10000000),
          storage_path: `/storage/${course.campus}/${course.department}/${course.course_code}/${type}/`,
          checksum_md5: checksum,
        },
        uploader_id: uploader.user_id,
        uploader_name: uploader.full_name,
        visibility: randomElement(['public', 'course', 'course', 'private']), // 50% course visibility
        download_count: randomInt(10, 200),
        view_count: randomInt(50, 500),
        rating: {
          average: Math.round((randomInt(35, 50) / 10) * 10) / 10, // 3.5 - 5.0
          count: randomInt(5, 50),
        },
        tags: [type, course.course_code.toLowerCase(), course.department.toLowerCase().replace(/\s+/g, '-')],
        is_deleted: false,
      });
    }
  }

  // Fill remaining if needed
  while (materials.length < 300) {
    const course = randomElement(courses);
    const type = randomElement(MATERIAL_TYPES);
    const titlePrefix = randomElement(MATERIAL_TITLES[type]);
    const courseLecturers = lecturers.filter(l => l.campus === course.campus);
    const uploader = randomElement(courseLecturers);

    let checksum: string;
    do {
      checksum = generateMD5(`extra-${materials.length}-${Date.now()}-${Math.random()}`);
    } while (checksums.has(checksum));
    checksums.add(checksum);

    materials.push({
      material_id: generateId('MAT'),
      title: `${titlePrefix} bổ sung - ${course.title}`,
      description: `Tài liệu bổ sung cho khóa học ${course.course_code}.`,
      course_id: course.course_id,
      course_code: course.course_code,
      campus: course.campus,
      department: course.department,
      type,
      file_info: {
        filename: `${generateId('file')}${extensions[type]}`,
        original_name: `${course.course_code}_extra_${type}${extensions[type]}`,
        mime_type: mimeTypes[type],
        size_bytes: randomInt(100000, 5000000),
        storage_path: `/storage/${course.campus}/${course.department}/${course.course_code}/${type}/`,
        checksum_md5: checksum,
      },
      uploader_id: uploader.user_id,
      uploader_name: uploader.full_name,
      visibility: 'course',
      download_count: randomInt(5, 50),
      view_count: randomInt(20, 100),
      rating: { average: 4.0, count: randomInt(1, 10) },
      tags: [type, course.course_code.toLowerCase()],
      is_deleted: false,
    });
  }

  await MaterialModel.insertMany(materials);
  
  const typeStats = MATERIAL_TYPES.map(t => `${t}: ${materials.filter(m => m.type === t).length}`).join(', ');
  
  console.log(`   ✅ Created ${materials.length} materials`);
  console.log(`      - By type: ${typeStats}`);
  console.log(`      - Unique checksums: ${checksums.size} (duplicate detection ready)`);
  
  return materials;
}

async function seedActivities(users: UserData[], materials: MaterialData[]): Promise<void> {
  console.log('\n📦 Seeding Activities...');
  console.log('   Target: 500 activities (last 30 days)');
  
  const activities: {
    activity_id: string;
    user_id: string;
    user_name: string;
    campus: Campus;
    action: ActionType;
    target_type: 'material' | 'course' | 'user';
    target_id: string;
    target_title: string;
    metadata: {
      ip_address: string;
      user_agent: string;
      device_type: string;
      browser: string;
      os: string;
      session_id: string;
      duration_seconds?: number;
      search_query?: string;
      file_size_bytes?: number;
    };
    timestamp: Date;
    date: string;
    hour: number;
  }[] = [];

  const ACTIONS: ActionType[] = ['view', 'download', 'upload', 'login', 'search'];
  const ACTION_WEIGHTS = { view: 40, download: 30, login: 15, search: 10, upload: 5 }; // Percentage
  
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
  const devices = ['desktop', 'mobile', 'tablet'];
  const oses = ['Windows 10', 'Windows 11', 'macOS', 'Linux', 'iOS', 'Android'];

  const now = new Date();

  // Generate weighted action selection
  function getWeightedAction(): ActionType {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const [action, weight] of Object.entries(ACTION_WEIGHTS)) {
      cumulative += weight;
      if (rand < cumulative) return action as ActionType;
    }
    return 'view';
  }

  for (let i = 0; i < 500; i++) {
    const user = randomElement(users);
    const material = randomElement(materials);
    const action = getWeightedAction();
    
    // Random timestamp within last 30 days
    const daysAgo = randomInt(0, 29);
    const hoursAgo = randomInt(0, 23);
    const minutesAgo = randomInt(0, 59);
    
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(hoursAgo, minutesAgo, randomInt(0, 59));

    const metadata: typeof activities[0]['metadata'] = {
      ip_address: `192.168.${randomInt(1, 255)}.${randomInt(1, 255)}`,
      user_agent: `Mozilla/5.0 (${randomElement(oses)}) ${randomElement(browsers)}/${randomInt(80, 120)}.0`,
      device_type: randomElement(devices),
      browser: randomElement(browsers),
      os: randomElement(oses),
      session_id: `sess_${generateId('')}`,
    };

    // Add action-specific metadata
    if (action === 'view') {
      metadata.duration_seconds = randomInt(30, 1800); // 30s to 30min
    } else if (action === 'download') {
      metadata.file_size_bytes = material.file_info.size_bytes;
    } else if (action === 'search') {
      metadata.search_query = randomElement(['python', 'java', 'database', 'algorithm', 'network', material.course_code]);
    }

    activities.push({
      activity_id: generateId('ACT'),
      user_id: user.user_id,
      user_name: user.full_name,
      campus: user.campus,
      action,
      target_type: 'material',
      target_id: material.material_id,
      target_title: material.title,
      metadata,
      timestamp,
      date: timestamp.toISOString().split('T')[0],
      hour: timestamp.getHours(),
    });
  }

  // Sort by timestamp descending
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  await ActivityModel.insertMany(activities);
  
  const actionStats = ACTIONS.map(a => `${a}: ${activities.filter(act => act.action === a).length}`).join(', ');
  
  console.log(`   ✅ Created ${activities.length} activities`);
  console.log(`      - By action: ${actionStats}`);
  console.log(`      - Date range: ${activities[activities.length - 1].date} to ${activities[0].date}`);
}

// ============ MAIN ============
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     SmartLearn - Database Seed Script                      ║');
  console.log('║     Tạo dữ liệu mẫu theo tài liệu HocLieuSo                ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('\n❌ MONGODB_URI not set!');
    console.error('   Please create .env file with MONGODB_URI or set environment variable.');
    process.exit(1);
  }

  try {
    console.log('\n🔌 Connecting to MongoDB...');
    await connectDB(mongoUri);
    console.log('   ✅ Connected successfully!');

    console.log('\n🗑️  Clearing existing data...');
    await Promise.all([
      UserModel.deleteMany({}),
      CourseModel.deleteMany({}),
      MaterialModel.deleteMany({}),
      ActivityModel.deleteMany({}),
    ]);
    console.log('   ✅ Cleared all collections');

    // Seed data
    const users = await seedUsers();
    await sleep(100);
    
    const courses = await seedCourses(users);
    await sleep(100);
    
    const materials = await seedMaterials(users, courses);
    await sleep(100);
    
    await seedActivities(users, materials);

    // Final summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    SEED SUMMARY                            ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    
    const [userCount, courseCount, materialCount, activityCount] = await Promise.all([
      UserModel.countDocuments(),
      CourseModel.countDocuments(),
      MaterialModel.countDocuments(),
      ActivityModel.countDocuments(),
    ]);
    
    console.log(`║  👤 Users:      ${userCount.toString().padStart(6)}                                  ║`);
    console.log(`║  📚 Courses:    ${courseCount.toString().padStart(6)}                                  ║`);
    console.log(`║  📄 Materials:  ${materialCount.toString().padStart(6)}                                  ║`);
    console.log(`║  📊 Activities: ${activityCount.toString().padStart(6)}                                  ║`);
    console.log(`║  ─────────────────────────────────────────────────────     ║`);
    console.log(`║  📦 Total:      ${(userCount + courseCount + materialCount + activityCount).toString().padStart(6)} records                         ║`);
    console.log('╚════════════════════════════════════════════════════════════╝');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📝 Default accounts:');
    console.log('   - Admin:    admin@hnue.edu.vn / Admin@123');
    console.log('   - Lecturer: lecturer1@hnue.edu.vn / Lecturer@123');
    console.log('   - Student:  student1@hnue.edu.vn / Student@123');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

main();
