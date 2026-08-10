// src/app/public/layout.tsx
// Layout utama halaman publik — menggunakan PublicTemplate

import { AuthTemplate } from '@/templates/AuthTemplate';


export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthTemplate>{children}</AuthTemplate>;
}
