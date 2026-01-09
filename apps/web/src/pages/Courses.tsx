import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { CAMPUS_LABELS } from '@smartlearn/shared';
import { BookOpen, Search, Users, Calendar, Plus } from 'lucide-react';
import CreateCourseModal from '@/components/CreateCourseModal';

interface Course {
  course_id: string;
  course_code: string;
  title: string;
  description: string;
  campus: string;
  department: string;
  instructor_name: string;
  semester: string;
  credits: number;
  enrollment_count: number;
}

export default function Courses() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreate = user?.role === 'admin' || user?.role === 'lecturer';

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses', {
        params: { limit: 20, search: search || undefined },
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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khóa học</h1>
          <p className="text-gray-500">Danh sách các khóa học trong hệ thống</p>
        </div>

        <div className="flex gap-3">
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tạo khóa học
            </button>
          )}

          <div className="relative w-full md:w-64">
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
      </div>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchCourses}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Không tìm thấy khóa học nào</p>
          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-primary-600 hover:underline mt-2"
            >
              Tạo khóa học đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Link
              key={course.course_id}
              to={`/courses/${course.course_id}`}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                    {course.course_code}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-1 truncate">
                    {course.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                {course.description || 'Chưa có mô tả'}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.enrollment_count}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {course.semester}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-500">
                  {course.instructor_name} • {CAMPUS_LABELS[course.campus]}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
