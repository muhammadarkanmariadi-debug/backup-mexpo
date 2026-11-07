"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Edit2,
  ExternalLink,
  HelpCircle,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import {
  createFaq,
  deleteFaq,
  FaqItem,
  FaqListResult,
  getAdminFaqs,
  reorderFaqs,
  updateFaq,
} from "@/services/faq.service";
import Button from "@/shared/components/button/Button";

const DEFAULT_CATEGORIES = [
  "Semua",
  "Umum",
  "Akun",
  "Event",
  "Pembayaran",
  "Kehadiran & Sertifikat",
  "Lokakarya",
  "Penyewa & Pembicara",
];

export default function FaqManager() {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [formErrors, setFormErrors] = useState<{ question?: string; answer?: string }>({});

  // Form states
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "Umum",
    customCategory: "",
    is_published: true,
  });

  const queryParams: Record<string, string> = {};
  if (selectedCategory !== "Semua") queryParams.category = selectedCategory;
  if (search.trim()) queryParams.search = search.trim();

  const {
    data: faqData,
    isLoading,
    refetch,
    isFetching,
  } = useApiQuery<FaqListResult>(keys.faqs.adminList(queryParams), () =>
    getAdminFaqs(queryParams),
  );

  const faqs: FaqItem[] = faqData?.items || [];
  const categories: string[] = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...(faqData?.categories || [])]),
  );

  // Mutations
  const { mutate: saveCreate, isPending: isCreating } = useApiMutation(
    createFaq,
    {
      onSuccess: () => {
        toast.success("FAQ berhasil ditambahkan!");
        closeModal();
        refetch();
      },
      onError: (err: any) => toast.error(err.message),
    },
  );

  const { mutate: saveUpdate, isPending: isUpdating } = useApiMutation(
    (args: { uuid: string; payload: any }) =>
      updateFaq(args.uuid, args.payload),
    {
      onSuccess: () => {
        toast.success("FAQ berhasil diperbarui!");
        closeModal();
        refetch();
      },
      onError: (err: any) => toast.error(err.message),
    },
  );

  const { mutate: removeFaq, isPending: isDeleting } = useApiMutation(
    deleteFaq,
    {
      onSuccess: () => {
        toast.success("FAQ berhasil dihapus");
        refetch();
      },
      onError: (err: any) => toast.error(err.message),
    },
  );

  const { mutate: doReorder } = useApiMutation(reorderFaqs, {
    onSuccess: () => {
      toast.success("Urutan berhasil diperbarui");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreateModal = () => {
    setEditingFaq(null);
    setFormData({
      question: "",
      answer: "",
      category: "Umum",
      customCategory: "",
      is_published: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (faq: FaqItem) => {
    setEditingFaq(faq);
    const isStandard = DEFAULT_CATEGORIES.includes(faq.category);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: isStandard ? faq.category : "Lainnya",
      customCategory: isStandard ? "" : faq.category,
      is_published: faq.is_published,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingFaq(null);
    setFormErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof formErrors = {};
    if (!formData.question.trim()) nextErrors.question = "Pertanyaan wajib diisi.";
    if (!formData.answer.trim()) nextErrors.answer = "Jawaban wajib diisi.";
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const finalCategory =
      formData.category === "Lainnya"
        ? formData.customCategory.trim() || "Umum"
        : formData.category;

    const payload = {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      category: finalCategory,
      is_published: formData.is_published,
    };

    if (editingFaq) {
      saveUpdate({ uuid: editingFaq.uuid, payload });
    } else {
      saveCreate(payload);
    }
  };

  const handleTogglePublish = (faq: FaqItem) => {
    saveUpdate({
      uuid: faq.uuid,
      payload: { is_published: !faq.is_published },
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const currentItem = faqs[index];
    const targetItem = faqs[targetIndex];

    doReorder([
      { uuid: currentItem.uuid, order: targetItem.order },
      { uuid: targetItem.uuid, order: currentItem.order },
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-1">
            <Link
              href="/dashboard"
              className="hover:text-secondary flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-bold">CMS FAQ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 text-secondary" />
            Kustomisasi Konten FAQ
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola pertanyaan dan jawaban yang sering diajukan pada halaman
            bantuan publik (/faq).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/faq"
            target="_blank"
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            Lihat Halaman Publik
          </Link>
          <Button
            onClick={openCreateModal}
            variant="primary"
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            Tambah FAQ Baru
          </Button>
        </div>
      </div>

      {/* ── Controls: Search & Category Tabs ── */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari pertanyaan, jawaban, atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary focus:bg-white transition-all"
            />
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 self-start sm:self-auto bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Segarkan
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-secondary text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── FAQ List Table / Cards ── */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="w-7 h-7 animate-spin mb-3" />
            <span className="text-sm">Memuat daftar FAQ...</span>
          </div>
        ) : faqs.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {faqs.map((faq: FaqItem, index: number) => (
              <div
                key={faq.uuid}
                className="p-5 hover:bg-gray-50/60 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                {/* Content */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-secondary/10 text-secondary font-bold text-xs px-2.5 py-0.5 rounded-full">
                      {faq.category}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        faq.is_published
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {faq.is_published ? "Tayang" : "Draft / Nonaktif"}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base">
                    {faq.question}
                  </h3>

                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-3">
                    {faq.answer}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                  {/* Up / Down Reorder */}
                  <div className="flex items-center bg-gray-100 rounded-xl p-0.5">
                    <button
                      onClick={() => handleMove(index, "up")}
                      disabled={index === 0}
                      className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all rounded-lg hover:bg-white"
                      title="Geser ke Atas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, "down")}
                      disabled={index === faqs.length - 1}
                      className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-all rounded-lg hover:bg-white"
                      title="Geser ke Bawah"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Toggle publish button */}
                  <button
                    onClick={() => handleTogglePublish(faq)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      faq.is_published
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {faq.is_published ? "Nonaktifkan" : "Tayangkan"}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => openEditModal(faq)}
                    className="p-2 rounded-xl text-gray-600 hover:text-secondary hover:bg-blue-50 transition-colors"
                    title="Edit FAQ"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Apakah Anda yakin ingin menghapus pertanyaan "${faq.question}"?`,
                        )
                      ) {
                        removeFaq(faq.uuid);
                      }
                    }}
                    disabled={isDeleting}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    title="Hapus FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
            <HelpCircle className="w-10 h-10 text-gray-300" />
            <p className="font-semibold text-gray-700 text-sm">
              Tidak ada data FAQ ditemukan
            </p>
            <p className="text-xs text-gray-400">
              Klik &quot;Tambah FAQ Baru&quot; untuk membuat entri pertanyaan pertama.
            </p>
          </div>
        )}
      </div>

      {/* ── Modal Add / Edit FAQ ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingFaq ? "Edit Pertanyaan FAQ" : "Tambah FAQ Baru"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Category Select */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Kategori
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  {DEFAULT_CATEGORIES.filter((c) => c !== "Semua").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Lainnya">+ Tambah Kategori Baru</option>
                </select>
              </div>

              {formData.category === "Lainnya" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Nama Kategori Baru
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sponsor, Merchandise..."
                    value={formData.customCategory}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customCategory: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
              )}

              {/* Question */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Pertanyaan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bagaimana cara check-in QR Code?"
                  value={formData.question}
                  onChange={(e) => {
                    setFormData({ ...formData, question: e.target.value });
                    setFormErrors((p) => ({ ...p, question: undefined }));
                  }}
                  aria-invalid={!!formErrors.question}
                  className={`w-full bg-gray-50 border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 ${
                    formErrors.question
                      ? "border-error-500 focus:ring-error-500/30"
                      : "border-gray-200 focus:ring-secondary"
                  }`}
                />
                {formErrors.question && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-error-500">
                    {formErrors.question}
                  </p>
                )}
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Jawaban Lengkap
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tulis jawaban lengkap yang jelas dan mudah dipahami pengguna..."
                  value={formData.answer}
                  onChange={(e) => {
                    setFormData({ ...formData, answer: e.target.value });
                    setFormErrors((p) => ({ ...p, answer: undefined }));
                  }}
                  aria-invalid={!!formErrors.answer}
                  className={`w-full bg-gray-50 border rounded-xl p-3.5 text-xs text-gray-900 focus:outline-none focus:ring-2 resize-y ${
                    formErrors.answer
                      ? "border-error-500 focus:ring-error-500/30"
                      : "border-gray-200 focus:ring-secondary"
                  }`}
                />
                {formErrors.answer && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-error-500">
                    {formErrors.answer}
                  </p>
                )}
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="publishToggle"
                  checked={formData.is_published}
                  onChange={(e) =>
                    setFormData({ ...formData, is_published: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-secondary focus:ring-secondary border-gray-300"
                />
                <label
                  htmlFor="publishToggle"
                  className="text-xs font-medium text-gray-700 cursor-pointer"
                >
                  Tayangkan langsung di halaman publik
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isCreating || isUpdating}
                  className="px-5 py-2 text-xs font-bold"
                >
                  {isCreating || isUpdating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 inline" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan FAQ"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
