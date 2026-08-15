

import MexpoCard from '@/features/auth/auth/components/MexpoCard';
import BackLink from '@/shared/components/ui/BackLink';

interface AuthTemplateProps {
  children: React.ReactNode;
}

export function AuthTemplate({ children }: AuthTemplateProps) {
  return (
    <div className="flex flex-col bg-background w-full min-h-screen">
      <BackLink variant="hero" label="Kembali ke Beranda" hideOnRoutes={["/events"]} />

      <main className="flex flex-1 justify-center items-center px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex lg:flex-row flex-col justify-between items-center gap-12 lg:gap-16 w-full max-w-7xl">

          {/* Left: Form Content */}
          <div className="flex flex-col gap-6 w-full lg:w-1/2">
            {children}
          </div>

          {/* Right: Mexpo Card */}
          <div className="flex justify-center lg:justify-end w-full lg:w-1/2">
            <MexpoCard />
          </div>

        </div>
      </main>
    </div>
  );
}
