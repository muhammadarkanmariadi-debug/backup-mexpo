// src/app/auth/auth/page.tsx
// Halaman auth — login & register tabs

import { AuthTemplate } from '@/templates/AuthTemplate';
import { AuthTabs } from '../../../features/auth/auth/components/AuthTabs';
import { AuthProvider } from '@/context/AuthContext';


export const metadata = {
  title: 'Masuk atau Daftar',
};

export default function AuthPage() {
  return (


    <AuthTabs />


  );
}
