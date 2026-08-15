'use client'

import { useState } from 'react'
import { ArrowLeft, Eye, Mail, Phone, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'


import { TenantCard } from '@/shared/components/cards/TenantCard'
import { Tenant, TenantProduct } from '@/entities/event/tenant.entity'

import TabListShell from './TabListShell'
import SearchBar from '@/shared/components/form/SearchBar'
import { usePagination } from '@/shared/hooks/usePagination'
import { DataPagination } from '@/shared/components/ui/DataPagination'
import ProductCard from '@/shared/components/cards/TenantProductCard'

export const TenantTab = ({ tenantData }: { tenantData: Tenant[] }) => {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [search, setSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')

  const filteredTenants = tenantData.filter(tenant =>
    tenant.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredProducts = selectedTenant?.tenantProducts?.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  ) || []

  const {
    currentPage: tenantPage,
    totalPages: tenantTotalPages,
    itemsPerPage: tenantItemsPerPage,
    setPage: setTenantPage,
    setItemsPerPage: setTenantItemsPerPage,
    paginate: paginateTenants,
  } = usePagination<Tenant>({
    totalItems: filteredTenants.length,
    initialPageSize: 4,
  })

  const {
    currentPage: productPage,
    totalPages: productTotalPages,
    itemsPerPage: productItemsPerPage,
    setPage: setProductPage,
    setItemsPerPage: setProductItemsPerPage,
    paginate: paginateProducts,
  } = usePagination<TenantProduct>({
    totalItems: filteredProducts.length,
    initialPageSize: 4,
  })

  const paginatedTenants = paginateTenants(filteredTenants)

  if (selectedTenant) {

    const paginatedProducts = paginateProducts(filteredProducts)
    return (
      <div className='space-y-4 sm:space-y-6 md:space-y-8 w-full mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-0 animate-in duration-500 fade-in'>
        <button
          onClick={() => {
            setSelectedTenant(null)
            setProductSearch('')
            setProductPage(1)
          }}
          className='flex items-center gap-1.5 sm:gap-2 font-bold text-secondary text-sm sm:text-base hover:underline'
        >
          <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5' /> Kembali ke Daftar
        </button>

        <div className='bg-white shadow-sm border border-brand-100 rounded-2xl sm:rounded-3xl overflow-hidden'>
          <div className='relative bg-gradient-to-r from-brand-500 to-brand-400 h-20 sm:h-24 md:h-32'>
            <div className='-bottom-8 sm:-bottom-10 left-4 sm:left-6 md:left-8 absolute bg-white shadow-lg p-1.5 sm:p-2 border border-gray-100 rounded-xl sm:rounded-2xl w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24'>
              <Image
                width={150}
                height={150}
                src={selectedTenant.logo || 'https://via.placeholder.com/150'}
                className='rounded-lg w-full h-full object-contain'
                alt='logo'
              />
            </div>
          </div>

          <div className='px-4 sm:px-6 md:px-8 pt-10 sm:pt-12 md:pt-14 pb-4 sm:pb-6 md:pb-8'>
            <div className='flex lg:flex-row flex-col justify-between items-start gap-2'>
              <div>
                <h2 className='font-extrabold text-gray-900 text-xl sm:text-2xl md:text-3xl'>
                  {selectedTenant.name}
                </h2> 

                <p className='font-medium text-secondary text-sm sm:text-base'>
                  {selectedTenant.category?.name}
                </p>
              </div>
              <span
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${selectedTenant.status === 'APPROVED'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-yellow-100 text-yellow-600'
                  }`}
              >
                {selectedTenant.status}
              </span>
            </div>
            <p className='mt-2 sm:mt-3 md:mt-4 max-w-2xl text-gray-600 text-xs sm:text-sm md:text-base'>
              {selectedTenant.description}
            </p>
          </div>
        </div>

        <div className='gap-4 sm:gap-6 md:gap-8 grid grid-cols-1 lg:grid-cols-3'>
          <div className='space-y-4 sm:space-y-6 lg:col-span-2'>
            <h3 className='flex items-center gap-2 font-bold text-gray-800 text-lg sm:text-xl md:text-2xl'>
              <ShoppingBag className='w-5 h-5 sm:w-6 sm:h-6 text-secondary' /> Produk
            </h3>
            <SearchBar
              placeholder='Cari Produk...'
              search={productSearch}
              setSearch={setProductSearch}
            />
            <div className='gap-3 sm:gap-4 grid grid-cols-1 sm:grid-cols-2'>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product: TenantProduct) => (
                  <ProductCard key={product.uuid} product={product} />
                ))
              ) : (
                <div className='col-span-full bg-gray-50 py-8 sm:py-12 rounded-2xl text-gray-400 text-sm sm:text-base text-center'>
                  Belum ada produk.
                </div>
              )}
             
              {filteredProducts.length > productItemsPerPage && (
                <div className="col-span-full mt-4">
                  <DataPagination
                    totalItems={filteredProducts.length}
                    currentPage={productPage}
                    totalPages={productTotalPages}
                    onPageChange={setProductPage}
                    itemsPerPage={productItemsPerPage}
                    onItemsPerPageChange={setProductItemsPerPage}
                    pageSizeOptions={[4, 8, 12, 16]}
                  />
                </div>
              )}
            </div>
          
          </div>

          <div className='space-y-4 sm:space-y-6'>
            <div className='space-y-3 sm:space-y-4 bg-white shadow-sm p-4 sm:p-5 md:p-6 border border-gray-100 rounded-2xl'>
              <h4 className='font-bold text-gray-800 text-sm sm:text-base'>Info Kontak</h4>
              <div className='space-y-2 sm:space-y-3'>
                <div className='flex items-center gap-2 sm:gap-3 text-gray-600 text-xs sm:text-sm'>
                  <Mail className='flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary' />{' '}
                  <span className='break-all'>{selectedTenant.email || 'Tidak ada email'}</span>
                </div>
                <div className='flex items-center gap-2 sm:gap-3 text-gray-600 text-xs sm:text-sm'>
                  <Phone className='flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary' />{' '}
                  {selectedTenant.phone || 'Tidak ada telepon'}
                </div>
                {selectedTenant.website && (
                  <div className='flex items-center gap-2 sm:gap-3 text-gray-600 text-xs sm:text-sm'>
                    <Eye className='flex-shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary' />
                    <Link
                      href={
                        selectedTenant.website.startsWith('http')
                          ? selectedTenant.website
                          : `https://${selectedTenant.website}`
                      }
                      target='_blank'
                      rel='noopener noreferrer'
                      className='hover:underline break-all'
                    >
                      {selectedTenant.website}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TabListShell
      category="Penyewa"
      title="Penyewa Kami"
      searchPlaceholder="Cari Penyewa..."
      search={search}
      setSearch={setSearch}
    >
      {filteredTenants.length > 0 ? (
        <div className='grid grid-cols-1 gap-4 sm:gap-6'>
          {paginatedTenants.map(tenant => (
            <TenantCard
              key={tenant.uuid}
              tenant={tenant}
              onSeeProduct={() => setSelectedTenant(tenant)}
              categoryName={tenant.category?.name || 'Tanpa Kategori'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">Tidak ada penyewa ditemukan</div>
      )}

      {filteredTenants.length > tenantItemsPerPage && (
        <DataPagination
          currentPage={tenantPage}
          totalPages={tenantTotalPages}
          itemsPerPage={tenantItemsPerPage}
          totalItems={filteredTenants.length}
          onPageChange={setTenantPage}
          onItemsPerPageChange={setTenantItemsPerPage}
          pageSizeOptions={[4, 8, 12, 16]}
        />
      )}
    </TabListShell>
  )
}

export default TenantTab
