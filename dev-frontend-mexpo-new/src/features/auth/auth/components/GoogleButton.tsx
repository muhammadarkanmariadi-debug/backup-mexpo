'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { googleLoginAction } from '../auth.actions';
import {
  loadGoogleIdentityScript,
  renderGoogleButton,
} from '@/shared/utils/google';

/**
 * "Continue with Google" — loads Google Identity Services and renders the
 * official button. The returned id_token is sent to the backend (`/auth/google`)
 * which verifies it and issues the app JWT (httpOnly cookie via server action).
 */
export function GoogleButton() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const busyRef = useRef(false);
  const router = useRouter();
  const { syncProfile } = useAuth();

  const resolvePostLoginPath = (): string => {
    if (typeof window === 'undefined') return '/';
    const raw = new URLSearchParams(window.location.search).get('next');
    if (!raw) return '/';
    // Open-redirect guard (same rule as loginAction).
    if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
      return '/';
    }
    return raw;
  };

  useEffect(() => {
    let cancelled = false;
    const element = containerRef.current;
    if (!element) return;

    const handleCredential = async (credential: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        const result = await googleLoginAction(credential);
        if (!result.success || !result.data) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        await syncProfile();
        router.push(resolvePostLoginPath());
      } catch {
        toast.error('Gagal masuk dengan Google');
      } finally {
        busyRef.current = false;
      }
    };

    loadGoogleIdentityScript().then((ok) => {
      if (!ok || cancelled) return;
      renderGoogleButton(element, handleCredential);
    });

    return () => {
      cancelled = true;
    };
  }, [router, syncProfile]);

  return (
    <div className="flex flex-col items-stretch gap-3">
      <div className="relative flex items-center justify-center">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="px-3 text-xs text-gray-400">atau</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <div
        ref={containerRef}
        className="flex min-h-11 items-center justify-center"
      />
    </div>
  );
}