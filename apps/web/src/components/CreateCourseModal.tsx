import { useState } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { DEPARTMENTS, CAMPUSES, CAMPUS_LABELS } from '@smartlearn/shared';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCourseModal({ isOpen, onClose, onSuccess }: CreateCourseModalProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    course_code: '',
    title: '',
    description: '',
    department: '',
    campus: user?.campus || 'hanoi',
    semester: '2024-2',
    credits: 3,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.course_code || !formData.title || !formData.department) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      await api.post('/courses', formData);
      toast.success('Tạo khóa học thành công!');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        course_code: '',
        title: '',
        description: '',
        department: '',
        campus: user?.campus || 'hanoi',
        semester: '2024-2',
        credits: 3,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Không thể tạo khóa học');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Tạo khóa học mới</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã khóa học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="course_code"
                value={formData.course_code}
                onChange={handleChange}
                placeholder="VD: IT101, MATH201"
                className="input uppercase"
                required
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên khóa học <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Nhập tên khóa học"
                className="input"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Mô tả ngắn về khóa học..."
                rows={3}
                className="input"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Khoa <span className="text-red-500">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Chọn khoa</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Campus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cơ sở
                </label>
                <select
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  className="input"
                >
                  {CAMPUSES.map((campus) => (
                    <option key={campus} value={campus}>
                      {CAMPUS_LABELS[campus]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Credits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tín chỉ
                </label>
                <input
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  min={1}
                  max={10}
                  className="input"
                />
              </div>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Học kỳ
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="input"
              >
                <option value="2024-1">2024-1 (Kỳ 1 năm 2024)</option>
                <option value="2024-2">2024-2 (Kỳ 2 năm 2024)</option>
                <option value="2025-1">2025-1 (Kỳ 1 năm 2025)</option>
                <option value="2025-2">2025-2 (Kỳ 2 năm 2025)</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary flex-1"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? 'Đang tạo...' : 'Tạo khóa học'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
