'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '../auth.schema';
import { useAuthStore } from '@/stores/auth.store';
import { registerAction } from '../auth.actions';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Checkbox from '@/shared/components/form/Checkbox';
import Input from '@/shared/components/form/Input';
import Button from '@/shared/components/button/Button';
import { toast } from 'sonner';

export function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    const result = await registerAction(data);

    if (!result.success || !result.data) {
      toast.error(result.message ?? 'Registrasi gagal');
      return;
    }

    toast.success(result.message ?? 'Registrasi berhasil');

    setUser(result.data.user);
    router.push('/verify-email');
  };

  return (
    <section className="w-full max-w-sm sm:max-w-md xl:max-w-lg">
      <div className="flex flex-col gap-6 font-public-sans">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="font-extrabold text-secondary text-5xl sm:text-6xl leading-tight">
            Sign Up
          </h1>
          <p className="font-medium text-gray-500 text-sm sm:text-base">
            Create your account to get started
          </p>
        </div>

        {serverError && (
          <div className="bg-red-500/10 p-3 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {serverError}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>

          <Controller
            control={control}
            name="full_name"
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                id="name"
                label="Full Name"
                placeholder="Enter your full name"
                error={!!errors.full_name}
                hint={errors.full_name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                id="email"
                label="Email"
                placeholder="Enter your email"
                error={!!errors.email}
                hint={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                {...field}
                type="text"
                id="phone"
                label="Phone Number"
                placeholder="Contoh: 081234567890"
                error={!!errors.phone}
                hint={errors.phone?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                {...field}
                type="password"
                id="password"
                label="Password"
                placeholder="Minimal 6 karakter"
                error={!!errors.password}
                hint={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <Input
                {...field}
                type="password"
                id="confirmPassword"
                label="Confirm Password"
                placeholder="Ulangi password"
                error={!!errors.confirmPassword}
                hint={errors.confirmPassword?.message}
              />
            )}
          />

          <Checkbox
            id="agreeTerms"
            label="I agree to the terms and conditions"
            checked={isChecked}
            onChange={() => setIsChecked(!isChecked)}
          />

          <div className="flex flex-col gap-3 mt-2">
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || !isChecked}
              className="w-full font-semibold"
            >
              {isSubmitting ? 'Signing Up...' : 'Sign Up'}
            </Button>
          </div>



        </form>
      </div>
    </section>
  );
}