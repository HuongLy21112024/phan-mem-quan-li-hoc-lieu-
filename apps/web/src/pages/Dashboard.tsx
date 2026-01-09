import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { formatNumber, formatDate } from '@smartlearn/shared';
import { 
  Users, BookOpen, FileText, Download, Eye, TrendingUp, 
  Clock, ArrowRight, Upload as UploadIcon, Search as SearchIcon
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalCourses: number;
  totalMaterials: number;
  totalDownloads: number;
  totalViews: number;
}

interface Activity {
  activity_id: string;
  action: string;
  target_title: string;
  target_type: string;
  timestamp: string;
}

interface Course {
  course_id: string;
  course_code: string;
  title: string;
  instructor_name: string;
  enrollment_count: number;
  department: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  view: { label: 'Đã xem', color: 'bg-blue-100 text-blue-700', icon: Eye },
  download: { label: 'Đã tải', color: 'bg-green-100 text-green-700', icon: Download },
  upload: { label: 'Đã upload', color: 'bg-purple-100 text-purple-700', icon: UploadIcon },
  login: { label: 'Đăng nhập', color: 'bg-gray-100 text-gray-700', icon: Clock },
  search: { label: 'Tìm kiếm', color: 'bg-orange-100 text-orange-700', icon: SearchIcon },
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats for admin/lecturer
        if (user?.role === 'admin' || user?.role === 'lecturer') {
          const { data } = await api.get('/stats/overview');
          setStats(data.data);
        }

        // Fetch user's recent activities
        const activitiesRes = await api.get('/activities/me', { params: { limit: 5 } });
        setActivities(activitiesRes.data.data || []);

        // Fetch recommended courses
        const coursesRes = await api.get('/courses/recommended', { params: { limit: 5 } });
        setRecommendedCourses(coursesRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: 'Người dùng', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Khóa học', value: stats?.totalCourses || 0, icon: BookOpen, color: 'bg-green-500' },
    { label: 'Học liệu', value: stats?.totalMaterials || 0, icon: FileText, color: 'bg-purple-500' },
    { label: 'Lượt tải', value: stats?.totalDownloads || 0, icon: Download, color: 'bg-orange-500' },
    { label: 'Lượt xem', value: stats?.totalViews || 0, icon: Eye, color: 'bg-pink-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.full_name}!
        </h1>
        <p className="text-gray-500 mt-1">
          Chào mừng bạn đến với hệ thống học liệu SmartLearn
        </p>
      </div>

      {(user?.role === 'admin' || user?.role === 'lecturer') && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {statCards.map((stat, index) => (
                <div key={index} className="card">
                  <div className="flex items-center gap-4">
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Hoạt động gần đây
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Chưa có hoạt động nào</p>
              <p className="text-gray-400 text-xs mt-1">
                Bắt đầu bằng cách xem hoặc tải tài liệu
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const actionInfo = ACTION_LABELS[activity.action] || ACTION_LABELS.view;
                const Icon = actionInfo.icon;
                return (
                  <div
                    key={activity.activity_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${actionInfo.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.target_title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {actionInfo.label} • {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recommended Courses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Khóa học đề xuất
            </h2>
            <Link 
              to="/courses" 
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : recommendedCourses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Chưa có khóa học đề xuất</p>
              <Link 
                to="/courses" 
                className="text-primary-600 text-sm mt-2 inline-block hover:underline"
              >
                Khám phá khóa học
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedCourses.map((course) => (
                <Link
                  key={course.course_id}
                  to={`/courses/${course.course_id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                        {course.course_code}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate mt-1">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {course.instructor_name} • {course.enrollment_count} học viên
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
