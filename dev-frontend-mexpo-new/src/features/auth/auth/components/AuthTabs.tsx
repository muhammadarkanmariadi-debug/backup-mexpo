// src/app/auth/auth/AuthTabs.tsx
// Client component — tab switch antara Login dan Register

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm, RegisterForm } from '@/features/auth/auth';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/stores/auth.store';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'register';

export function AuthTabs() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const { user, isAuthenticated } = useAuthStore();
  const { isLoadingAuth } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && user) {
      const raw = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
      const target = (raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\')) ? raw : '/dashboard';
      router.replace(target);
    }
  }, [isLoadingAuth, isAuthenticated, user, router]);

  return (
    <div>
      {/* Tab Buttons */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-200 dark:bg-gray-800 max-w-100 mx-auto mb-6">
        <button
          onClick={() => setMode('login')}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            mode === 'login'
              ? 'bg-secondary text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400 ',
          )}
        >
          Masuk
        </button>
        <button
          onClick={() => setMode('register')}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
            mode === 'register'
              ? 'bg-secondary text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-400',
          )}
        >
          Daftar
        </button>
      </div>

      {/* Form */}
      <div className="max-w-100 mx-auto">
        {mode === 'login' ? <LoginForm /> : <RegisterForm />}

        {/* Toggle */}
        <p className="text-left text-sm text-slate-400 mt-6">
          {mode === 'login' ? (
            <>
              Belum punya akun?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                Daftar sekarang
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                Masuk
              </button>
            </>
          )}
        </p>
      </div>

    </div>
  );
}
