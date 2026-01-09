import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  campus: string;
  department: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    
    if (data.data.user.role !== 'admin') {
      throw new Error('Bạn không có quyền truy cập trang quản trị');
    }

    localStorage.setItem('adminAccessToken', data.data.accessToken);
    localStorage.setItem('adminRefreshToken', data.data.refreshToken);
    set({ user: data.data.user, isAuthenticated: true });
  },

  logout: () => {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (refreshToken) {
      api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      if (data.data.role !== 'admin') {
        throw new Error('Not admin');
      }
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
