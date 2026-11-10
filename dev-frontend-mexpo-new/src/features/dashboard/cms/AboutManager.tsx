"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  Check,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useApiMutation, useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import {
  AboutGalleryItem,
  AboutHeroContent,
  AboutStoryContent,
  AboutValueItem,
  getAllSiteContents,
  updateSiteContent,
  uploadContentImage,
} from "@/services/site-content.service";
import Button from "@/shared/components/button/Button";

export default function AboutManager() {
  const [activeTab, setActiveTab] = useState<"hero" | "story" | "gallery" | "values">("hero");

  // Fetch all site contents
  const { data: siteData, isLoading, refetch } = useApiQuery<Record<string, any>>(
    keys.siteContents.all,
    () => getAllSiteContents(),
  );

  // Form states
  const [heroForm, setHeroForm] = useState<AboutHeroContent>({
    tagline: "",
    headline: "",
    highlightText: "",
    description: "",
    backgroundImage: "",
  });

  const [storyForm, setStoryForm] = useState<AboutStoryContent>({
    heading: "",
    paragraphs: [],
  });

  const [galleryList, setGalleryList] = useState<AboutGalleryItem[]>([]);
  const [valuesList, setValuesList] = useState<AboutValueItem[]>([]);

  // Sync state when data loads
  useEffect(() => {
    if (siteData) {
      if (siteData.about_hero) {
        setHeroForm(siteData.about_hero);
      }
      if (siteData.about_story) {
        setStoryForm(siteData.about_story);
      }
      if (Array.isArray(siteData.about_gallery)) {
        setGalleryList(siteData.about_gallery);
      }
      if (Array.isArray(siteData.about_values)) {
        setValuesList(siteData.about_values);
      }
    }
  }, [siteData]);

  // Mutations
  const { mutate: saveContent, isPending: isSaving } = useApiMutation(
    (args: { sectionKey: string; content: any }) =>
      updateSiteContent(args.sectionKey, args.content),
    {
      onSuccess: () => {
        toast.success("Perubahan konten berhasil disimpan!");
        refetch();
      },
      onError: (err: any) => toast.error(err.message),
    },
  );

  // Upload image mutation
  const [isUploading, setIsUploading] = useState(false);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadContentImage(file);
      if (res.status && res.data && res.data.url) {
        setHeroForm((prev) => ({ ...prev, backgroundImage: res.data.url }));
        toast.success("Foto banner berhasil diunggah!");
      } else {
        toast.error(res.message || "Gagal mengunggah foto");
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Terjadi kesalahan saat mengunggah foto");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadContentImage(file);
      if (res.status && res.data && res.data.url) {
        const newItem: AboutGalleryItem = {
          id: Date.now(),
          src: res.data.url,
          label: "Foto Baru",
        };
        setGalleryList((prev) => [...prev, newItem]);
        toast.success("Foto galeri baru ditambahkan!");
      } else {
        toast.error(res.message || "Gagal mengunggah foto");
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Terjadi kesalahan saat mengunggah foto");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault();
    saveContent({ sectionKey: "about_hero", content: heroForm });
  };

  const handleSaveStory = (e: React.FormEvent) => {
    e.preventDefault();
    saveContent({ sectionKey: "about_story", content: storyForm });
  };

  const handleSaveGallery = () => {
    saveContent({ sectionKey: "about_gallery", content: galleryList });
  };

  const handleSaveValues = () => {
    saveContent({ sectionKey: "about_values", content: valuesList });
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
            <span className="text-gray-900 font-bold">CMS About</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-secondary" />
            Kustomisasi Halaman About
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ubah teks narasi, banner utama, kurasi foto dokumentasi galeri, dan
            nilai keunggulan platform Mexpo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/about"
            target="_blank"
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            Lihat Halaman Publik
          </Link>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="bg-white rounded-3xl p-2 border border-gray-200 shadow-sm flex flex-wrap gap-2">
        {(
          [
            { id: "hero", label: "Banner Hero", icon: Sparkles },
            { id: "story", label: "Narasi & Cerita", icon: FileText },
            { id: "gallery", label: "Galeri Foto", icon: Camera },
            { id: "values", label: "Nilai Keunggulan", icon: Check },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-secondary text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ── */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-16 border border-gray-200 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-7 h-7 animate-spin mb-3" />
          <span className="text-sm">Memuat konten halaman about...</span>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          {/* ════ TAB 1: HERO BANNER ════ */}
          {activeTab === "hero" && (
            <form onSubmit={handleSaveHero} className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Banner Hero Utama
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Bagian banner teratas yang menyambut pengunjung saat membuka
                  halaman Tentang Kami (/about).
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Tagline Kecil (Badge)
                  </label>
                  <input
                    type="text"
                    value={heroForm.tagline}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, tagline: e.target.value })
                    }
                    placeholder="Contoh: Platform Manajemen Event & Expo"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Judul Utama (Baris 1)
                  </label>
                  <input
                    type="text"
                    value={heroForm.headline}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, headline: e.target.value })
                    }
                    placeholder="Contoh: Kelola Event & Expo Jadi Mudah"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Teks Highlight Warna (Baris 2)
                  </label>
                  <input
                    type="text"
                    value={heroForm.highlightText}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, highlightText: e.target.value })
                    }
                    placeholder="Contoh: dengan Satu Platform Terintegrasi"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Paragraf Pengantar
                  </label>
                  <textarea
                    rows={3}
                    value={heroForm.description}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, description: e.target.value })
                    }
                    placeholder="Tuliskan pengantar singkat tentang fungsi Mexpo..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                {/* Banner Image */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Foto Background Banner
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="relative w-full sm:w-48 h-28 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shrink-0">
                      {heroForm.backgroundImage ? (
                        <Image
                          src={heroForm.backgroundImage}
                          alt="Banner Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1">
                      <input
                        type="text"
                        value={heroForm.backgroundImage}
                        onChange={(e) =>
                          setHeroForm({
                            ...heroForm,
                            backgroundImage: e.target.value,
                          })
                        }
                        placeholder="Atau masukkan URL gambar..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary"
                      />

                      <label className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {isUploading ? "Mengunggah..." : "Unggah Foto dari Komputer"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleHeroImageUpload}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-bold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan Banner Hero
                </Button>
              </div>
            </form>
          )}

          {/* ════ TAB 2: NARASI & CERITA ════ */}
          {activeTab === "story" && (
            <form onSubmit={handleSaveStory} className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Narasi Visi &amp; Cerita MEXPO
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Paragraf penjelasan tentang asal-usul, visi, dan misi platform
                  MEXPO di SMK Telkom Malang.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Judul Bagian
                  </label>
                  <input
                    type="text"
                    value={storyForm.heading}
                    onChange={(e) =>
                      setStoryForm({ ...storyForm, heading: e.target.value })
                    }
                    placeholder="Contoh: Tentang MEXPO"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-700">
                      Paragraf Penjelasan
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setStoryForm({
                          ...storyForm,
                          paragraphs: [...storyForm.paragraphs, ""],
                        })
                      }
                      className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Paragraf
                    </button>
                  </div>

                  {storyForm.paragraphs.map((p, idx) => (
                    <div key={idx} className="relative flex items-start gap-2">
                      <textarea
                        rows={3}
                        value={p}
                        onChange={(e) => {
                          const updated = [...storyForm.paragraphs];
                          updated[idx] = e.target.value;
                          setStoryForm({ ...storyForm, paragraphs: updated });
                        }}
                        placeholder={`Tulis paragraf ke-${idx + 1}...`}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                      {storyForm.paragraphs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = storyForm.paragraphs.filter(
                              (_, i) => i !== idx,
                            );
                            setStoryForm({ ...storyForm, paragraphs: updated });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                          title="Hapus Paragraf"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-xs font-bold flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan Narasi Cerita
                </Button>
              </div>
            </form>
          )}

          {/* ════ TAB 3: GALERI FOTO ════ */}
          {activeTab === "gallery" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Galeri Dokumentasi Kegiatan
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Kurasi foto-foto kegiatan event expo, seminar, dan kelulusan
                    yang ditampilkan di grid galeri.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 bg-secondary text-white hover:bg-secondary/90 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm">
                    <Plus className="w-4 h-4" />
                    {isUploading ? "Mengunggah..." : "Tambah Foto Baru"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAddGalleryImage}
                      disabled={isUploading}
                    />
                  </label>

                  <Button
                    onClick={handleSaveGallery}
                    variant="primary"
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Galeri
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {galleryList.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col group"
                  >
                    <div className="relative h-44 w-full bg-gray-200">
                      <Image
                        src={item.src}
                        alt={item.label}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3 flex items-center justify-between gap-2 bg-white">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const updated = [...galleryList];
                          updated[index].label = e.target.value;
                          setGalleryList(updated);
                        }}
                        placeholder="Label Foto..."
                        className="text-xs font-semibold text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-secondary focus:outline-none px-1 py-0.5 w-full"
                      />
                      <button
                        onClick={() => {
                          const updated = galleryList.filter((_, i) => i !== index);
                          setGalleryList(updated);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ TAB 4: NILAI KEUNGGULAN ════ */}
          {activeTab === "values" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Nilai Inti &amp; Keunggulan Mexpo
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Kartu keunggulan nilai platform (Andal, Inovatif, Transparan,
                    Efisien) yang tertera di halaman About.
                  </p>
                </div>

                <Button
                  onClick={handleSaveValues}
                  variant="primary"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Save className="w-4 h-4" />
                  Simpan Nilai Keunggulan
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {valuesList.map((val, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-gray-50/70 rounded-2xl border border-gray-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Keunggulan #{idx + 1}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Judul Nilai
                      </label>
                      <input
                        type="text"
                        value={val.title}
                        onChange={(e) => {
                          const updated = [...valuesList];
                          updated[idx].title = e.target.value;
                          setValuesList(updated);
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Deskripsi Penjelasan
                      </label>
                      <textarea
                        rows={2}
                        value={val.description}
                        onChange={(e) => {
                          const updated = [...valuesList];
                          updated[idx].description = e.target.value;
                          setValuesList(updated);
                        }}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
