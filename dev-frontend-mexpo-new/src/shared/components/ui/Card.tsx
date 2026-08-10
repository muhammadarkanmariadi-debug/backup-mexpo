// src/shared/components/ui/Card.tsx
// Komponen Card container generik

import { cn } from '@/shared/utils/cn';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm',
        hover &&
          'transition-all duration-300 hover:border-slate-700 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1',
        className,
      )}
    >
      {children}
    </div>
  );
}
