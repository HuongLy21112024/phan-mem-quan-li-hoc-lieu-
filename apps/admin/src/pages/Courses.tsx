import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CAMPUS_LABELS } from '@smartlearn/shared';
import { BookOpen, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Course {
  course_id: string;
  course_code: string;
  title: string;
  campus: string;
  department: string;
  instructor_name: string;
  semester: string;
  enrollment_count: number;
  status: string;
  created_at: string;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses', {
        params: { limit: 50, search: search || undefined },
      });
      setCourses(data.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchCourses, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleDelete = async (courseId: string) => {
    if (!confirm('Bạn có chắc muốn xóa khóa học này?')) return;

    try {
      await api.delete(`/courses/${courseId}`);
      toast.success('Đã xóa khóa học');
      fetchCourses();
    } catch {
      toast.error('Không thể xóa khóa học');
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý khóa học</h1>
          <p className="text-gray-500">Danh sách khóa học trong hệ thống</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy khóa học</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Khóa học
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Giảng viên
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Cơ sở
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Học kỳ
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Đăng ký
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courses.map((course) => (
                  <tr key={course.course_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                          {course.course_code}
                        </span>
                        <p className="font-medium mt-1">{course.title}</p>
                        <p className="text-sm text-gray-500">{course.department}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{course.instructor_name}</td>
                    <td className="px-4 py-3 text-sm">
                      {CAMPUS_LABELS[course.campus]}
                    </td>
                    <td className="px-4 py-3 text-sm">{course.semester}</td>
                    <td className="px-4 py-3 text-sm">{course.enrollment_count}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(course.course_id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
