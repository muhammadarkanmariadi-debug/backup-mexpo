// src/shared/components/ErrorPage.tsx
import Link from 'next/link'

type ErrorPageProps = {
  code: 400 | 401 | 403 | 404 | 500 | 503 | number
  title?: string | null

  primaryAction?: { label: string; href: string }
  onRetry?: () => void
}

const STATUS_META: Record<ErrorPageProps['code'], { color: string; badge: string, description: string }> = {
  400: { color: 'text-orange-600', badge: 'bg-orange-50', description: 'Permintaan tidak valid atau tidak dapat diproses.' },
  401: { color: 'text-yellow-600', badge: 'bg-yellow-50', description: 'Anda tidak memiliki akses atau sesi login telah berakhir.' },
  403: { color: 'text-orange-600', badge: 'bg-orange-50', description: 'Akses ke sumber daya ini ditolak.' },
  404: { color: 'text-secondary', badge: 'bg-brand-50', description: 'Halaman atau data yang Anda cari tidak ditemukan.' },
  500: { color: 'text-red-600', badge: 'bg-red-50', description: 'Terjadi kesalahan pada server. Silakan coba lagi beberapa saat lagi.' },
  503: { color: 'text-red-600', badge: 'bg-red-50', description: 'Layanan tidak tersedia sementara waktu. Silakan coba lagi.' },
}

export const ErrorPage = ({
  code,
  title,

  primaryAction,
  onRetry,
}: ErrorPageProps) => {
  const meta = STATUS_META[code] || { color: 'text-red-600', badge: 'bg-red-50', description: 'Terjadi kesalahan tidak terduga.' }
  const { color, badge, description } = meta

  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4'>
      <span
        className={`text-xs font-semibold px-3 py-1 rounded-full tracking-wide ${badge} ${color}`}
      >
        {code}
      </span>

      <p
        className={`text-6xl sm:text-7xl font-semibold leading-none ${color}`}
      >
        {code}
      </p>

      <h1 className='text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white'>
        {title}
      </h1>

      <p className='text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed'>
        {description}
      </p>

      <div className='flex gap-3 mt-2'>
        <Link
          href='/'
          className='px-5 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300'
        >
          ← Kembali
        </Link>

        {onRetry && (
          <button
            onClick={onRetry}
            className='px-5 py-2 rounded-xl text-sm font-semibold border border-transparent bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300'
          >
            Coba Lagi
          </button>
        )}

        {primaryAction && (
          <Link
            href={primaryAction.href}
            className='px-5 py-2 rounded-xl text-sm font-semibold border border-transparent bg-gray-900 text-white hover:bg-gray-800 transition-all duration-300'
          >
            {primaryAction.label}
          </Link>
        )}
      </div>
    </div>
  )
}