'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '../auth.schema';
import { loginAction } from '../auth.actions';
import { useAuthStore } from '@/stores/auth.store';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Checkbox from '@/shared/components/form/Checkbox';
import Link from 'next/link';
import Input from '@/shared/components/form/Input';
import Button from '@/shared/components/button/Button';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { GoogleButton } from './GoogleButton';

export function LoginForm() {
  const router = useRouter();
  const setRememberedEmail = useAuthStore((state) => state.setRememberedEmail);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const { syncProfile } = useAuth()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * Read the `?next=` query param set by src/proxy.ts when a logged-out user
   * hit a protected page (/dashboard, /profile). After a successful login we
   * return them to that page instead of always dropping them on `/`.
   *
   * We read it from window.location (client-only) rather than useSearchParams
   * because /auth is statically prerendered in this Next 16 build and
   * useSearchParams would require an extra Suspense boundary (see the
   * /verify-email + / home fixes). Reading at submit time avoids that entirely.
   */
  const resolvePostLoginPath = (): string => {
    if (typeof window === "undefined") return "/";
    const raw = new URLSearchParams(window.location.search).get("next");
    if (!raw) return "/";
    // Open-redirect guard: only allow same-origin absolute paths starting with
    // a single "/" (blocks "//evil.com", "/\evil.com", "http://...", etc.).
    if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
      return "/";
    }
    return raw;
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    const result = await loginAction(data);

    if (!result.success || !result.data) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    await syncProfile()
    setRememberedEmail(data.email, isChecked);
    router.push(resolvePostLoginPath());
  };

  return (
    <section className="w-full max-w-sm sm:max-w-md xl:max-w-lg">
      <div className="flex flex-col gap-6 font-public-sans">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-extrabold text-secondary text-5xl sm:text-6xl leading-tight">
            Masuk
          </h1>
          <p className="font-medium text-gray-500 text-sm sm:text-base">
            Masukkan email dan kata sandi Anda untuk melanjutkan
          </p>
        </div>

        {serverError && (
          <div className="bg-red-500/10 p-3 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {serverError}
          </div>
        )}

        {/* Google sign-in */}
        <GoogleButton />

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                id="email"
                placeholder="Masukkan email Anda"
                label="Surel"
                error={!!errors.email}
                hint={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                {...field}
                id="password"
                type="password"
                placeholder="Masukkan kata sandi Anda"
                label="Kata Sandi"
                error={!!errors.password}
                hint={errors.password?.message}
              />
            )}
          />

          {/* Remember me & Forgot password */}
          <div className="flex flex-row justify-between items-center gap-2 font-medium text-gray-600 text-sm">
            <Checkbox
              onChange={() => setIsChecked(!isChecked)}
              id="rememberMe"
              checked={isChecked}
              label="Ingat saya"
            />
            <Link
              href="/forgot-passwords"
              className="text-secondary hover:underline shrink-0"
            >
              Lupa kata sandi?
            </Link>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3 mt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full font-semibold"
            >
              {isSubmitting ? 'Masuk...' : 'Masuk'}
            </Button>
          </div>

        </form>
      </div>
    </section>
  );
}