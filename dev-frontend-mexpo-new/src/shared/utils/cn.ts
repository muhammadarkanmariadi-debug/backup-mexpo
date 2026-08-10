// src/shared/utils/cn.ts
// Utility untuk menggabungkan class names (clsx + tailwind-merge)

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
