// src/app/auth/auth/page.tsx
// Halaman auth — login & register tabs

import { AuthTabs } from '../../../features/auth/auth/components/AuthTabs';


export const metadata = {
  title: 'Masuk atau Daftar',
};

export default function AuthPage() {
  return (


    <AuthTabs />


  );
}
