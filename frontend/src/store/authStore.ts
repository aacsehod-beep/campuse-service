import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authAPI } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; hostel?: string; phone?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.login({ email, password });
          const { token, user } = data;
          localStorage.setItem('campushub_token', token);
          connectSocket(token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await authAPI.register(formData);
          const { token, user } = data;
          localStorage.setItem('campushub_token', token);
          connectSocket(token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('campushub_token');
        disconnectSocket();
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },

      fetchMe: async () => {
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.user });
        } catch {
          // Ignore
        }
      },
    }),
    {
      name: 'campushub_auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
