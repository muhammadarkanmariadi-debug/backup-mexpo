import Footer  from '@/widgets/Footer';
import Navbar from '@/widgets/Navbar';

interface PublicTemplateProps {
  children: React.ReactNode;
}

export function PublicTemplate({ children }: PublicTemplateProps) {
  // AuthProvider is mounted once in the root layout (FIX-15) — do not remount it here.
  return (
    <div className="flex flex-col min-h-screen text-white">
      <Navbar />
      <main className="flex-1 min-h-[70vh] sm:min-h-[80vh]">{children}</main>
      <Footer />
    </div>
  );
}
