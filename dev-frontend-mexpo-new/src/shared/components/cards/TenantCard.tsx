import { Tenant } from '@/entities/event/tenant.entity'
import { Eye, Mail, Phone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export const TenantCard = ({
  tenant,
  onSeeProduct,
}: {
  tenant: Tenant
  onSeeProduct: (tenant: Tenant) => void
  categoryName?: string
}) => {
  return (
    <div className='slide-in-from-bottom-2 flex sm:flex-row flex-col items-center sm:items-start gap-6 bg-blue-50/30 hover:shadow-lg p-6 border border-blue-200 rounded-2xl transition-shadow animate-in duration-500 fade-in'>
      <div className='flex justify-center items-center bg-white shadow-sm p-4 border border-gray-100 rounded-xl w-32 sm:w-40 h-32 sm:h-40 shrink-0'>
        {tenant.logo ? (
          <Image
            width={150}
            height={150}
            src={tenant.logo}
            alt={tenant.name}
            className='max-w-full max-h-full object-contain'
          />
        ) : (
          <div className='font-bold text-gray-300'>Belum Ada Logo</div>
        )}
      </div>

      <div className='flex-1 w-full sm:text-left text-center'>
        <h3 className='mb-1 font-bold text-secondary text-2xl sm:text-3xl'>
          {tenant.name}
        </h3>
        <p className='font-medium text-secondary'>
          {tenant.category?.name || 'Tanpa Kategori'}
        </p>
        <p className='mb-6 text-gray-500 text-sm'>{tenant.description}</p>
      </div>

      <div className='flex flex-col gap-3 w-full sm:w-auto min-w-[150px]'>
        <button
          onClick={() => onSeeProduct(tenant)}
          className='flex justify-center items-center gap-2 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-full w-full font-bold text-white text-sm transition-colors'
        >
          <Eye className='w-4 h-4' /> Lihat Produk
        </button>
        <Link
          href={`mailto:${tenant.email}`}
          className='flex justify-center items-center gap-2 bg-white hover:bg-blue-50 px-4 py-2 border border-secondary rounded-full w-full font-bold text-secondary text-sm transition-colors'
        >
          <Mail className='w-4 h-4' /> Surel
        </Link>
        <Link
          href={`tel:${tenant.phone}`}
          className='flex justify-center items-center gap-2 bg-white hover:bg-blue-50 px-4 py-2 border border-secondary rounded-full w-full font-bold text-secondary text-sm transition-colors'
        >
          <Phone className='w-4 h-4' /> Telepon
        </Link>
      </div>
    </div>
  )
}
