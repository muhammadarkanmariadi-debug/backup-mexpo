

'use server';

import { User } from '@/entities/auth/user.entity';


import { LoginFormData, RegisterFormData } from './auth.schema';
import { deleteCookies } from '@/shared/utils/cookies';
import { login, register, googleLogin } from '../../../services/auth.service';


export interface AuthActionResult<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
}

export async function loginAction(data: LoginFormData): Promise<AuthActionResult> {


  if (!data.email || !data.password) {
    return { success: false, message: 'Email dan kata sandi wajib diisi', data: null };
  }

  try {
    const result = await login(data);
    if (!result.status) {
      return { success: false, message: result.message || "Gagal masuk", data: null };
    }
    return { success: result.status, message: result.message || "Berhasil masuk", data: result.token };
  } catch {
    return { success: false, message: "Terjadi kesalahan server", data: null };
  }
}


export async function registerAction(data: RegisterFormData): Promise<AuthActionResult<{ user: User }>> {
  const name = data.full_name;
  const email = data.email;
  const password = data.password;
  const phone = data.phone;


  if (!email || !password || !name || !phone) {
    return { success: false, message: 'Kolom wajib diisi', data: null };
  }

  try {
    const result = await register(data);

    if (!result.status) {
      return { success: false, message: result.message || "Gagal mendaftar", data: null };
    }

    return { success: true, message: result.message || "Pendaftaran berhasil", data: result.data as { user: User } };

  } catch {
    return { success: false, message: 'Terjadi kesalahan server', data: null };
  }
}

export async function googleLoginAction(credential: string): Promise<AuthActionResult<string>> {
  if (!credential) {
    return { success: false, message: 'Kredensial Google kosong', data: null };
  }

  try {
    const result = await googleLogin(credential);
    if (!result.status) {
      return { success: false, message: result.message || "Gagal masuk dengan Google", data: null };
    }
    return { success: true, message: result.message || "Berhasil masuk", data: result.token ?? null };
  } catch {
    return { success: false, message: 'Terjadi kesalahan server', data: null };
  }
}

export async function logoutAction(): Promise<void> {
  await deleteCookies("token");


}
