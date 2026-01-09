import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';
import { MATERIAL_TYPE_LABELS, formatFileSize, formatDate } from '@smartlearn/shared';
import { FileText, Search, Trash2, Download, Eye, Plus, X, Upload, FileUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface Material {
  material_id: string;
  title: string;
  course_code: string;
  type: string;
  file_info: {
    size_bytes: number;
    original_name: string;
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
  campus: string;
}

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [courses, setCourses] = useState<Course[]>([]);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    course_id: '',
    visibility: 'course',
  });

  const fetchMaterials = async () => {
    try {
      const { data } = await api.get('/materials', {
        params: { limit: 50, search: search || undefined },
      });
      setMaterials(data.data);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses', { params: { limit: 100 } });
      setCourses(data.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchMaterials, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (materialId: string) => {
    if (!confirm('Bạn có chắc muốn xóa học liệu này?')) return;

    try {
      await api.delete(`/materials/${materialId}`);
      toast.success('Đã xóa học liệu');
      fetchMaterials();
    } catch {
      toast.error('Không thể xóa học liệu');
    }
  };

  const handleDownload = async (material: Material) => {
    try {
      const response = await api.post(`/materials/${material.material_id}/download`, {}, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = material.file_info.original_name || `${material.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Đang tải xuống...');
      fetchMaterials(); // Refresh to update download count
    } catch (error: any) {
      const message = error.response?.data?.error || 'Không thể tải xuống file';
      toast.error(message);
    }
  };

  // File upload handlers
  const openUploadModal = () => {
    setSelectedFile(null);
    setUploadForm({
      title: '',
      description: '',
      course_id: courses.length > 0 ? courses[0].course_id : '',
      visibility: 'course',
    });
    setUploadProgress(0);
    setShowUploadModal(true);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'video/mp4',
      'video/webm',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Loại file không được hỗ trợ. Chỉ hỗ trợ: PDF, Word, PowerPoint, MP4, WebM');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error('File quá lớn. Tối đa 500MB');
      return;
    }

    setSelectedFile(file);
    // Auto-fill title from filename
    if (!uploadForm.title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadForm(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Vui lòng chọn file để upload');
      return;
    }

    if (!uploadForm.title || !uploadForm.course_id) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('course_id', uploadForm.course_id);
    formData.append('visibility', uploadForm.visibility);

    try {
      await api.post('/materials/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      toast.success('Upload thành công!');
      setShowUploadModal(false);
      fetchMaterials();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Không thể upload file';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý học liệu</h1>
          <p className="text-gray-500">Danh sách tài liệu trong hệ thống</p>
        </div>
        <button
          onClick={openUploadModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm học liệu
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm học liệu..."
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
        ) : materials.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy học liệu</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Học liệu
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Loại
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Người tải lên
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Kích thước
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Thống kê
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Ngày tạo
                  </th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {materials.map((material) => (
                  <tr key={material.material_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{material.title}</p>
                        <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                          {material.course_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">
                        {MATERIAL_TYPE_LABELS[material.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{material.uploader_name}</td>
                    <td className="px-4 py-3 text-sm">
                      {formatFileSize(material.file_info.size_bytes)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {material.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {material.download_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(material.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownload(material)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.material_id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Thêm học liệu mới</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-4 space-y-4">
              {/* File Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragActive
                  ? 'border-primary-500 bg-primary-50'
                  : selectedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-primary-400'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm"
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileUp className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium text-green-700">{selectedFile.name}</p>
                      <p className="text-sm text-green-600">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">Kéo thả file vào đây</p>
                    <p className="text-sm text-gray-400 mt-1">hoặc click để chọn file</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Hỗ trợ: PDF, Word, PowerPoint, MP4, WebM (tối đa 500MB)
                    </p>
                  </>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-500">
                    Đang upload... {uploadProgress}%
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="input w-full"
                  placeholder="Nhập tiêu đề học liệu"
                  required
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="input w-full"
                  rows={2}
                  placeholder="Mô tả ngắn về học liệu"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khóa học <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadForm.course_id}
                  onChange={(e) => setUploadForm({ ...uploadForm, course_id: e.target.value })}
                  className="input w-full"
                  required
                  disabled={uploading}
                >
                  <option value="">-- Chọn khóa học --</option>
                  {courses.map((course) => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quyền truy cập
                </label>
                <select
                  value={uploadForm.visibility}
                  onChange={(e) => setUploadForm({ ...uploadForm, visibility: e.target.value })}
                  className="input w-full"
                  disabled={uploading}
                >
                  <option value="public">Công khai</option>
                  <option value="course">Trong khóa học</option>
                  <option value="private">Riêng tư</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn flex-1"
                  disabled={uploading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Đang upload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
