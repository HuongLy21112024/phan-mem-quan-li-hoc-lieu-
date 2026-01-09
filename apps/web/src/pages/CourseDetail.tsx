import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { CAMPUS_LABELS, MATERIAL_TYPE_LABELS, formatFileSize } from '@smartlearn/shared';
import { BookOpen, FileText, Download, Eye, ArrowLeft, User, Calendar, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadModal from '@/components/UploadModal';

interface Course {
  course_id: string;
  course_code: string;
  title: string;
  description: string;
  campus: string;
  department: string;
  instructor_id: string;
  instructor_name: string;
  semester: string;
  credits: number;
  enrollment_count: number;
}

interface Material {
  material_id: string;
  title: string;
  type: string;
  file_info: {
    original_name: string;
    size_bytes: number;
  };
  download_count: number;
  view_count: number;
}

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchData = async () => {
    try {
      const [courseRes, materialsRes] = await Promise.all([
        api.get(`/courses/${id}`),
        api.get('/materials', { params: { course_id: id, limit: 50 } }),
      ]);
      setCourse(courseRes.data.data);
      setMaterials(materialsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDownload = async (material: Material) => {
    try {
      toast.loading('Đang tải xuống...', { id: 'download' });
      
      const response = await api.post(
        `/materials/${material.material_id}/download`,
        {},
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.file_info.original_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Tải xuống thành công!', { id: 'download' });
      fetchData();
    } catch (error: any) {
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const json = JSON.parse(text);
          toast.error(json.error || 'Không thể tải xuống', { id: 'download' });
        } catch {
          toast.error('Không thể tải xuống', { id: 'download' });
        }
      } else {
        toast.error(
          error.response?.data?.error || 'File không tồn tại trên hệ thống', 
          { id: 'download' }
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-40 bg-gray-200 rounded mb-6"></div>
        <div className="h-60 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy khóa học</p>
        <Link to="/courses" className="text-primary-600 hover:underline mt-2 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại
      </Link>

      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary-100 p-4 rounded-xl">
            <BookOpen className="w-8 h-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
              {course.course_code}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{course.title}</h1>
            <p className="text-gray-500 mt-2">{course.description || 'Chưa có mô tả'}</p>

            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {course.instructor_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {course.semester}
              </span>
              <span>{course.credits} tín chỉ</span>
              <span>{CAMPUS_LABELS[course.campus]}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Học liệu ({materials.length})
          </h2>
          {(user?.role === 'admin' || user?.role === 'lecturer') && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              Thêm tài liệu
            </button>
          )}
        </div>

        {/* Upload Modal */}
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            fetchData();
            setShowUploadModal(false);
          }}
          courses={course ? [{ 
            course_id: course.course_id, 
            course_code: course.course_code, 
            title: course.title 
          }] : []}
          defaultCourseId={course?.course_id}
        />

        {materials.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Chưa có học liệu nào</p>
            {(user?.role === 'admin' || user?.role === 'lecturer') && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="text-primary-600 hover:underline mt-2"
              >
                Thêm tài liệu đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <div
                key={material.material_id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="bg-gray-100 p-2 rounded">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{material.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                      {MATERIAL_TYPE_LABELS[material.type]}
                    </span>
                    <span>{formatFileSize(material.file_info.size_bytes)}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {material.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {material.download_count}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(material)}
                  className="btn btn-primary"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
