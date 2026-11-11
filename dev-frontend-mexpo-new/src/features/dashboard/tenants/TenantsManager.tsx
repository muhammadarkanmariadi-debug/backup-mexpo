"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Store,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  MapPin,
  Loader2,
  Upload,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

import { Event } from "@/entities/event/event.entity";
import { Tenant, TenantProduct } from "@/entities/event/tenant.entity";
import { useList } from "@/shared/hooks/useList";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import {
  getTenantDetail,
  createTenant,
  updateTenant,
  deleteTenant,
  TenantProfilePayload,
} from "@/services/tenant.service";
import { getEventTenants } from "@/services/event-data.service";
import { TenantCategory, getTenantCategories } from "@/services/tenant-category.service";
import { getProducts } from "@/services/product.service";

import Input from "@/shared/components/form/Input";
import PhoneInput from "@/shared/components/form/PhoneInput";
import SearchBar from "@/shared/components/form/SearchBar";
import Button from "@/shared/components/button/Button";
import { Modal } from "@/shared/components/ui/Modal";
import { useConfirm } from "@/shared/components/ui/ConfirmDialog";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import LoadingState from "@/shared/components/ui/LoadingState";
import EmptyState from "@/shared/components/ui/EmptyState";
import ProductCard from "@/shared/components/cards/TenantProductCard";
import { APPROVAL_STATUS_LABELS, labelFor } from "@/shared/data/labels";

interface Props {
  event: Event;
}

const STATUS_TABS = ["", "APPROVED", "PENDING", "REJECTED"] as const;

const EMPTY_FORM: TenantProfilePayload = {
  name: "",
  description: "",
  phone: "",
  email: "",
  website: "",
  booth_number: "",
  category_id: "",
};

export default function TenantsManager({ event }: Props) {
  const { confirm, dialogs } = useConfirm();

  // Selected tenant for detail view
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Modal state (add / edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [form, setForm] = useState<TenantProfilePayload>(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Product search in detail view
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const productPageSize = 6;

  // Server-backed list of tenants for this event
  const tenantList = useList<Tenant>(
    (q) => getEventTenants(event.uuid, q),
    [event.uuid],
    8
  );

  // Fetch tenant categories for dropdown selection
  const { data: categories } = useApiQuery<TenantCategory[]>(
    ["tenant-categories", "all"],
    () => getTenantCategories(),
    { staleTime: 60 * 1000 }
  );
  const categoriesList = categories ?? [];

  // Query detail of selected tenant (when opened)
  const {
    data: activeTenant,
    isLoading: loadingSelectedDetail,
    refetch: refetchSelectedDetail,
  } = useApiQuery<Tenant | null>(
    keys.tenants.detail(selectedTenantId || ""),
    () => getTenantDetail(selectedTenantId!),
    { enabled: Boolean(selectedTenantId) }
  );

  // Query products of selected tenant
  const {
    data: productsData,
    isLoading: loadingProducts,
  } = useApiQuery<TenantProduct[]>(
    keys.products.all(selectedTenantId || ""),
    () => getProducts(selectedTenantId!),
    { enabled: Boolean(selectedTenantId) }
  );
  const tenantProducts = productsData ?? activeTenant?.tenantProducts ?? [];

  // Mutations
  const saveMutation = useApiMutation(
    async () => {
      const payload: TenantProfilePayload = {
        name: form.name.trim(),
        description: form.description?.trim() ?? "",
        phone: form.phone.trim(),
        ...(form.category_id ? { category_id: form.category_id } : {}),
        ...(form.booth_number?.trim() ? { booth_number: form.booth_number.trim() } : {}),
        ...(form.email?.trim() ? { email: form.email.trim() } : {}),
        ...(form.website?.trim() ? { website: form.website.trim() } : {}),
      };

      if (editingTenant) {
        return updateTenant(editingTenant.uuid, payload, logoFile ?? undefined);
      }
      return createTenant(event.uuid, payload, logoFile ?? undefined);
    },
    {
      successMessage: editingTenant ? "Data penyewa berhasil diperbarui." : "Penyewa baru berhasil ditambahkan.",
      errorMessage: "Gagal menyimpan data penyewa.",
      notify: toast,
      onSuccess: () => {
        setIsModalOpen(false);
        setEditingTenant(null);
        setForm(EMPTY_FORM);
        setLogoFile(null);
        setPhotoPreview("");
        tenantList.refetch();
        if (selectedTenantId) {
          void refetchSelectedDetail();
        }
      },
    }
  );

  const deleteMutation = useApiMutation(
    (tenantId: string) => deleteTenant(tenantId),
    {
      successMessage: "Penyewa berhasil dihapus.",
      errorMessage: "Gagal menghapus penyewa.",
      notify: toast,
      onSuccess: () => {
        if (selectedTenantId) {
          setSelectedTenantId(null);
        }
        tenantList.refetch();
      },
    }
  );

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingTenant(null);
    setForm(EMPTY_FORM);
    setLogoFile(null);
    setPhotoPreview("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setForm({
      name: tenant.name ?? "",
      description: tenant.description ?? "",
      phone: tenant.phone ?? "",
      email: tenant.email ?? "",
      website: tenant.website ?? "",
      booth_number: tenant.booth_number ?? "",
      category_id: tenant.category_id || tenant.category?.uuid || "",
    });
    setLogoFile(null);
    setPhotoPreview(tenant.logo ?? "");
    setIsModalOpen(true);
  };

  // Confirm and Delete
  const handleDeleteTenant = async (tenant: Tenant) => {
    const ok = await confirm(
      `Apakah Anda yakin ingin menghapus penyewa "${tenant.name}"? Data booth dan produk terkait akan dihapus.`
    );
    if (!ok) return;
    deleteMutation.mutate(tenant.uuid);
  };

  // Handle logo change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran logo maksimal 5 MB.");
      return;
    }
    setLogoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const isBlobPreview = photoPreview.startsWith("blob:") || photoPreview.startsWith("data:");
  const safePreview = isBlobPreview ? photoPreview : encodeURI(photoPreview || "");

  // Products filtering & pagination in detail mode
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return tenantProducts;
    const q = productSearch.toLowerCase();
    return tenantProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [tenantProducts, productSearch]);

  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / productPageSize));
  const paginatedProducts = useMemo(() => {
    const start = (productPage - 1) * productPageSize;
    return filteredProducts.slice(start, start + productPageSize);
  }, [filteredProducts, productPage, productPageSize]);

  // ─────────────────────────────────────────────────────────────
  // 1. DETAIL VIEW (when selectedTenantId is active)
  // ─────────────────────────────────────────────────────────────
  if (selectedTenantId) {
    if (loadingSelectedDetail && !activeTenant) {
      return (
        <div className="py-8">
          <LoadingState type="skeleton-card" count={1} />
        </div>
      );
    }

    if (!activeTenant) {
      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedTenantId(null)}
            className="flex items-center gap-2 font-bold text-secondary text-sm hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Penyewa
          </button>
          <EmptyState
            title="Penyewa tidak ditemukan"
            subtitle="Data penyewa tidak dapat dimuat atau telah dihapus."
          />
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in duration-300 fade-in">
        {dialogs}

        {/* Back and Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedTenantId(null);
              setProductSearch("");
              setProductPage(1);
            }}
            className="flex items-center gap-2 font-bold text-secondary text-sm hover:underline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Penyewa
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(activeTenant)}
              className="flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Data Penyewa</span>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDeleteTenant(activeTenant)}
              className="flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Penyewa</span>
            </Button>
          </div>
        </div>

        {/* Tenant Header Card */}
        <div className="bg-white shadow-sm border border-brand-100 rounded-3xl overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 via-brand-500 to-indigo-600 h-28 sm:h-36">
            <div className="-bottom-8 sm:-bottom-10 left-6 sm:left-8 absolute bg-white shadow-md p-2 border border-gray-100 rounded-2xl w-20 h-20 sm:w-24 sm:h-24">
              {activeTenant.logo ? (
                <Image
                  width={150}
                  height={150}
                  src={encodeURI(activeTenant.logo)}
                  className="rounded-xl w-full h-full object-contain"
                  alt={activeTenant.name}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl text-gray-400">
                  <Store className="w-8 h-8" />
                </div>
              )}
            </div>
          </div>

          <div className="px-6 sm:px-8 pt-12 sm:pt-14 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {activeTenant.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {activeTenant.category?.name && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-secondary border border-blue-100">
                      {activeTenant.category.name}
                    </span>
                  )}
                  {activeTenant.booth_number && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      <MapPin className="w-3 h-3 text-gray-500" />
                      Booth: {activeTenant.booth_number}
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start ${
                  activeTenant.status === "APPROVED"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : activeTenant.status === "PENDING"
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                }`}
              >
                {labelFor(APPROVAL_STATUS_LABELS, activeTenant.status, activeTenant.status)}
              </span>
            </div>

            <p className="mt-4 text-gray-600 text-sm leading-relaxed max-w-3xl whitespace-pre-line">
              {activeTenant.description || "Belum ada deskripsi profil untuk penyewa ini."}
            </p>

            {/* Quick Contact Grid */}
            <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-secondary shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Nomor Telepon</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {activeTenant.phone || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-secondary shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Surel</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {activeTenant.email || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-secondary shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Website</p>
                  {activeTenant.website ? (
                    <a
                      href={
                        activeTenant.website.startsWith("http")
                          ? activeTenant.website
                          : `https://${activeTenant.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-secondary hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{activeTenant.website}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-gray-800">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tenant Products Section */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-secondary" />
                Daftar Produk ({tenantProducts.length})
              </h3>
              <p className="text-xs text-gray-500">
                Produk yang didaftarkan oleh penyewa ini untuk dipamerkan dan dijual.
              </p>
            </div>

            <div className="w-full sm:w-72">
              <SearchBar
                search={productSearch}
                setSearch={(val: string) => {
                  setProductSearch(val);
                  setProductPage(1);
                }}
                placeholder="Cari produk penyewa..."
              />
            </div>
          </div>

          {loadingProducts ? (
            <LoadingState type="skeleton-card" count={2} />
          ) : paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.uuid} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={productSearch ? "Produk tidak ditemukan" : "Belum Ada Produk"}
              subtitle={
                productSearch
                  ? `Tidak ada produk yang cocok dengan pencarian "${productSearch}".`
                  : "Penyewa ini belum menambahkan katalog produk."
              }
            />
          )}

          {totalProductPages > 1 && (
            <div className="pt-2 flex justify-center">
              <DataPagination
                currentPage={productPage}
                totalPages={totalProductPages}
                itemsPerPage={productPageSize}
                totalItems={filteredProducts.length}
                onPageChange={setProductPage}
                onItemsPerPageChange={() => {}}
              />
            </div>
          )}
        </div>

        {/* Modal for Edit */}
        {renderModal()}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. MAIN LIST VIEW
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {dialogs}

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <Store className="w-6 h-6 text-secondary" />
            Kelola Penyewa (Tenant)
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Pantau dan kelola profil penyewa, penempatan booth, dan produk untuk event ini.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Penyewa</span>
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((status) => {
            const isActive = (tenantList.filters.status || "") === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  tenantList.applyFilter("status", status);
                  tenantList.setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-secondary text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status === "" ? "Semua Status" : labelFor(APPROVAL_STATUS_LABELS, status, status)}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <SearchBar
              search={tenantList.search}
              setSearch={(val: string) => {
                tenantList.applySearch(val);
                tenantList.setPage(1);
              }}
              placeholder="Cari berdasarkan nama penyewa, booth, atau deskripsi..."
            />
          </div>

          {categoriesList.length > 0 && (
            <div className="w-full sm:w-60">
              <select
                value={tenantList.filters.category_id || ""}
                onChange={(e) => {
                  tenantList.applyFilter("category_id", e.target.value);
                  tenantList.setPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-secondary transition-colors"
              >
                <option value="">Semua Kategori</option>
                {categoriesList.map((cat) => (
                  <option key={cat.uuid} value={cat.uuid}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tenants Cards Grid */}
      {tenantList.loading ? (
        <div className="py-6">
          <LoadingState type="skeleton-card" count={3} />
        </div>
      ) : tenantList.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tenantList.items.map((tenant) => (
            <div
              key={tenant.uuid}
              className="bg-white border border-gray-200/80 hover:border-secondary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Header row with Logo, Name, Badges */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 border border-gray-100 p-2 shrink-0 flex items-center justify-center overflow-hidden">
                    {tenant.logo ? (
                      <Image
                        src={encodeURI(tenant.logo)}
                        alt={tenant.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Store className="w-8 h-8 text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                        {tenant.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          tenant.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : tenant.status === "PENDING"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {labelFor(APPROVAL_STATUS_LABELS, tenant.status, tenant.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {tenant.category?.name && (
                        <span className="text-xs font-semibold text-secondary bg-blue-50 px-2 py-0.5 rounded-md">
                          {tenant.category.name}
                        </span>
                      )}
                      {tenant.booth_number && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          Booth: {tenant.booth_number}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {tenant.description || "Tidak ada deskripsi."}
                    </p>
                  </div>
                </div>

                {/* Contact Pills */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  {tenant.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {tenant.phone}
                    </span>
                  )}
                  {tenant.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      {tenant.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTenantId(tenant.uuid)}
                  className="flex items-center gap-1.5 text-xs flex-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Detail & Produk</span>
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(tenant)}
                    className="p-2 text-gray-500 hover:text-secondary hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Profil Penyewa"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTenant(tenant)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Penyewa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={tenantList.search ? "Penyewa tidak ditemukan" : "Belum Ada Penyewa"}
          subtitle={
            tenantList.search
              ? `Tidak ada penyewa yang sesuai dengan filter atau kata kunci "${tenantList.search}".`
              : "Belum ada penyewa yang terdaftar pada event ini. Klik tombol Tambah Penyewa di atas untuk mendaftarkan booth penyewa."
          }
        />
      )}

      {/* Pagination */}
      {tenantList.totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <DataPagination
            currentPage={tenantList.page}
            totalPages={tenantList.totalPages}
            itemsPerPage={tenantList.pageSize}
            totalItems={tenantList.total}
            onPageChange={tenantList.setPage}
            onItemsPerPageChange={(size) => {
              tenantList.setPageSize(size);
              tenantList.setPage(1);
            }}
          />
        </div>
      )}

      {/* Modal for Add / Edit */}
      {renderModal()}
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // Modal Component
  // ─────────────────────────────────────────────────────────────
  function renderModal() {
    return (
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTenant ? "Edit Data Penyewa" : "Tambah Penyewa Baru"}
        maxWidth="max-w-2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) {
              toast.error("Nama penyewa wajib diisi.");
              return;
            }
            if (!form.phone.trim()) {
              toast.error("Nomor telepon penyewa wajib diisi.");
              return;
            }
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          {/* Logo Upload Section */}
          <div>
            <label className="block mb-2 font-medium text-gray-700 text-xs sm:text-sm">
              Logo Penyewa
            </label>
            <div className="flex items-start gap-4">
              <div className="relative flex justify-center items-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl w-28 h-28 overflow-hidden shrink-0">
                {photoPreview ? (
                  <Image
                    src={safePreview}
                    alt="Preview"
                    fill
                    unoptimized={isBlobPreview}
                    className="object-contain p-1"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-2">
                    Belum ada logo
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    <Upload className="w-3.5 h-3.5" /> Pilih Logo
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setPhotoPreview("");
                    }}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    Hapus Logo
                  </button>
                )}
                <p className="text-[11px] text-gray-400">
                  Format JPG, PNG, atau GIF (Maksimal 5 MB)
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Nama Penyewa / Tenant"
                required
                placeholder="Contoh: Kopi Nusantara / Tech Innovate"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1.5 font-medium text-gray-700 text-xs sm:text-sm">
                Kategori Tenant
              </label>
              <select
                value={form.category_id || ""}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 focus:outline-none focus:border-secondary transition-colors"
              >
                <option value="">Pilih Kategori (Opsional)</option>
                {categoriesList.map((cat) => (
                  <option key={cat.uuid} value={cat.uuid}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Nomor Booth"
                placeholder="Contoh: A-01 / Stand 12"
                value={form.booth_number || ""}
                onChange={(e) => setForm({ ...form, booth_number: e.target.value })}
              />
            </div>

            <div>
              <PhoneInput
                label="Nomor Telepon PIC"
                required
                value={form.phone}
                onChange={(val) => setForm({ ...form, phone: val })}
              />
            </div>

            <div>
              <Input
                label="Surel (Email PIC)"
                type="email"
                placeholder="pic@tenant.com"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Website (Opsional)"
                placeholder="https://example.com"
                value={form.website || ""}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <Input
                label="Deskripsi Tenant"
                type="text-area"
                placeholder="Jelaskan mengenai booth, produk, atau layanan penyewa..."
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>

            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingTenant ? "Simpan Perubahan" : "Tambah Penyewa"}</span>
            </Button>
          </div>
        </form>
      </Modal>
    );
  }
}
