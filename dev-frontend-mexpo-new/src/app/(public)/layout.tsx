// src/app/public/layout.tsx
// Layout utama halaman publik — menggunakan PublicTemplate

import { PublicTemplate } from '@/templates/PublicTemplate';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicTemplate>{children}</PublicTemplate>;
}
