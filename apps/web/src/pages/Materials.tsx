import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { MATERIAL_TYPE_LABELS, MATERIAL_TYPES, formatFileSize, formatDate } from '@smartlearn/shared';
import { FileText, Search, Download, Eye, Filter, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import UploadModal from '@/components/UploadModal';

interface Material {
  material_id: string;
  title: string;
  description: string;
  course_code: string;
  type: string;
  file_info: {
    original_name: string;
    size_bytes: number;
  };
  uploader_name: string;
  download_count: number;
  view_count: number;
  created_at: string;
}

interface Course {
  course_id: string;
  course_code: string;
  title: string;
}

export default function Materials() {
  const { user } = useAuthStore();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const canUpload = user?.role === 'admin' || user?.role === 'lecturer';

  const fetchMaterials = async () => {
    try {
      const { data } = await api.get('/materials', {
        params: {
          limit: 30,
          search: search || undefined,
          type: typeFilter || undefined,
        },
      });
      setMaterials(data.data);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchMaterials, 300);
    return () => clearTimeout(debounce);
  }, [search, typeFilter]);

  useEffect(() => {
    // Fetch courses for upload modal
    if (canUpload) {
      api.get('/courses', { params: { limit: 100 } })
        .then(({ data }) => setCourses(data.data))
        .catch(console.error);
    }
  }, [canUpload]);

  const handleDownload = async (material: Material) => {
    try {
      toast.loading('Đang tải xuống...', { id: 'download' });
      
      const response = await api.post(
        `/materials/${material.material_id}/download`,
        {},
        { responseType: 'blob' }
      );

      // Create blob URL and trigger download
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
      fetchMaterials(); // Refresh to update download count
    } catch (error: any) {
      // Handle blob error response
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

  const handleUploadSuccess = () => {
    fetchMaterials();
    toast.success('Upload thành công!');
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Học liệu</h1>
          <p className="text-gray-500">Kho tài liệu học tập số</p>
        </div>

        <div className="flex gap-3">
          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-1" />
              Upload tài liệu
            </button>
          )}

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input pl-10 pr-8"
            >
              <option value="">Tất cả loại</option>
              {MATERIAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MATERIAL_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
        courses={courses}
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Không tìm thấy học liệu nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <div
              key={material.material_id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary-100 p-3 rounded-lg">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{material.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {material.description || 'Không có mô tả'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(material)}
                      className="btn btn-primary shrink-0"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Tải xuống
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                      {MATERIAL_TYPE_LABELS[material.type]}
                    </span>
                    <span className="bg-primary-50 text-primary-600 px-2 py-1 rounded text-xs font-medium">
                      {material.course_code}
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
                    <span>{material.uploader_name}</span>
                    <span>{formatDate(material.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
