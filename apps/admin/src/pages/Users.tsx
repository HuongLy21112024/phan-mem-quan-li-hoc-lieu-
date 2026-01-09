import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CAMPUS_LABELS, ROLE_LABELS, DEPARTMENTS, formatDate } from '@smartlearn/shared';
import { Users as UsersIcon, Search, Trash2, Plus, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  campus: string;
  department: string;
  status: string;
  created_at: string;
}

interface AddUserForm {
  email: string;
  password: string;
  full_name: string;
  role: string;
  campus: string;
  department: string;
}

interface EditUserForm {
  full_name: string;
  role: string;
  campus: string;
  department: string;
  status: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [campusFilter, setCampusFilter] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Add user form
  const [addForm, setAddForm] = useState<AddUserForm>({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    campus: 'hanoi',
    department: DEPARTMENTS[0],
  });
  
  // Edit user form
  const [editForm, setEditForm] = useState<EditUserForm>({
    full_name: '',
    role: '',
    campus: '',
    department: '',
    status: '',
  });

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users', {
        params: {
          limit: 50,
          search: search || undefined,
          role: roleFilter || undefined,
          campus: campusFilter || undefined,
        },
      });
      setUsers(data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, roleFilter, campusFilter]);

  const handleDelete = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn vô hiệu hóa người dùng này?')) return;

    try {
      await api.delete(`/users/${userId}`);
      toast.success('Đã vô hiệu hóa người dùng');
      fetchUsers();
    } catch {
      toast.error('Không thể vô hiệu hóa người dùng');
    }
  };

  // Add user handlers
  const openAddModal = () => {
    setAddForm({
      email: '',
      password: '',
      full_name: '',
      role: 'student',
      campus: 'hanoi',
      department: DEPARTMENTS[0],
    });
    setShowAddModal(true);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    // Validation
    if (!addForm.email || !addForm.password || !addForm.full_name) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (addForm.password.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/users', addForm);
      toast.success('Thêm người dùng thành công');
      setShowAddModal(false);
      fetchUsers();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Không thể thêm người dùng';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit user handlers
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      role: user.role,
      campus: user.campus,
      department: user.department,
      status: user.status,
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !editingUser) return;
    
    setSubmitting(true);
    try {
      await api.put(`/users/${editingUser.user_id}`, editForm);
      toast.success('Cập nhật người dùng thành công');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Không thể cập nhật người dùng';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500">Danh sách người dùng trong hệ thống</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm người dùng
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">Tất cả vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="lecturer">Giảng viên</option>
            <option value="student">Sinh viên</option>
          </select>
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">Tất cả cơ sở</option>
            <option value="hanoi">Hà Nội</option>
            <option value="danang">Đà Nẵng</option>
            <option value="hcm">TP.HCM</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy người dùng</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Người dùng
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Vai trò
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Cơ sở
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Khoa
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                    Trạng thái
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
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {user.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : user.role === 'lecturer'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {CAMPUS_LABELS[user.campus]}
                    </td>
                    <td className="px-4 py-3 text-sm">{user.department}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Chỉnh sửa"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Vô hiệu hóa"
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

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Thêm người dùng mới</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="input w-full"
                  placeholder="example@hnue.edu.vn"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="input w-full"
                  placeholder="Tối thiểu 8 ký tự"
                  minLength={8}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="input w-full"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="input w-full"
                >
                  <option value="student">Sinh viên</option>
                  <option value="lecturer">Giảng viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cơ sở
                </label>
                <select
                  value={addForm.campus}
                  onChange={(e) => setAddForm({ ...addForm, campus: e.target.value })}
                  className="input w-full"
                >
                  <option value="hanoi">Hà Nội</option>
                  <option value="danang">Đà Nẵng</option>
                  <option value="hcm">TP. Hồ Chí Minh</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khoa
                </label>
                <select
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  className="input w-full"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn flex-1"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? 'Đang xử lý...' : 'Thêm người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Chỉnh sửa người dùng</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 mb-2">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{editingUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai trò
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="input w-full"
                >
                  <option value="student">Sinh viên</option>
                  <option value="lecturer">Giảng viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cơ sở
                </label>
                <select
                  value={editForm.campus}
                  onChange={(e) => setEditForm({ ...editForm, campus: e.target.value })}
                  className="input w-full"
                >
                  <option value="hanoi">Hà Nội</option>
                  <option value="danang">Đà Nẵng</option>
                  <option value="hcm">TP. Hồ Chí Minh</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khoa
                </label>
                <select
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="input w-full"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="input w-full"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Vô hiệu hóa</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                  className="btn flex-1"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? 'Đang xử lý...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
