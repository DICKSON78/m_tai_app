import { create } from 'zustand';
import api from '../api/client';
import { User } from '../api/types';
import { saveToken, saveUser, getToken, getUser, clearAuth } from '../utils/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (login: string, password: string) => {
    const res = await api.post('/login', { login, password });
    const { token, user } = res.data;
    await saveToken(token);
    await saveUser(user);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    try { await api.post('/logout'); } catch {}
    await clearAuth();
    set({ user: null, token: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    try {
      const token = await getToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const res = await api.get('/user');
      const user = res.data;
      await saveUser(user);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      await clearAuth();
      set({ isLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const res = await api.get('/user');
      const user = res.data;
      await saveUser(user);
      set({ user });
    } catch {}
  },
}));
