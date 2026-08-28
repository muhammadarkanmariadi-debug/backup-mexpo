'use client';

import { User } from '@/entities/auth/user.entity';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const REMEMBER_KEY = 'mexpo-remembered-email';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  rememberedEmail: string;
  setUser: (user: User) => void;
  clearUser: () => void;
  setRememberedEmail: (email: string, remember: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      rememberedEmail: '',

      setUser: (user) => set({ user, isAuthenticated: true }),

      clearUser: () => set({ user: null, isAuthenticated: false }),

      setRememberedEmail: (email, remember) => {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, email);
          set({ rememberedEmail: email });
        } else {
          localStorage.removeItem(REMEMBER_KEY);
          set({ rememberedEmail: '' });
        }
      },
    }),
    {
      name: 'mexpo-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (typeof window === 'undefined' || !state) return;
        const email = localStorage.getItem(REMEMBER_KEY);
        if (email) state.rememberedEmail = email;
      },
    },
  ),
);