"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Coins,
  FileQuestion,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Store,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import {
  getAdminOverview,
  AdminOverviewData,
} from "@/services/admin-dashboard.service";
import EventList from "../dashboard/Eventlist";
import ApprovalQueue from "@/features/dashboard/approvals/ApprovalQueue";
import SettlementList from "@/features/dashboard/settlements/SettlementList";
import UserManager from "@/features/dashboard/users/UserManager";
import TenantCategoryManager from "@/features/dashboard/tenant-categories/TenantCategoryManager";
import InboxPage from "@/features/dashboard/inbox/InboxPage";
import FaqManager from "@/features/dashboard/cms/FaqManager";
import AboutManager from "@/features/dashboard/cms/AboutManager";
import DashboardSidebarLayout, {
  SidebarTabGroup,
} from "@/features/dashboard/shared/DashboardSidebarLayout";
import { GeometricBannerBg } from "@/shared/components/ui/GeometricBanner";

function formatIDR(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function SuperAdminDashboard() {
  const user = useAuthStore((s) => s.user);

  const [activeGroupId, setActiveGroupId] = useState("ringkasan");
  const [activeSubTabId, setActiveSubTabId] = useState("overview");

  const switchTab = (groupId: string, subTabId: string) => {
    setActiveGroupId(groupId);
    setActiveSubTabId(subTabId);
  };

  const {
    data: overview,
    isLoading,
    refetch,
    isFetching,
  } = useApiQuery<AdminOverviewData>(
    keys.adminOverview,
    () => getAdminOverview(),
    {
      staleTime: 30 * 1000,
    },
  );

  const overviewContent = (
    <div className="space-y-8">
      {/* ── Top Header with Mexpo Geometric Branding ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10 shadow-lg border border-blue-400/20 text-white">
        <GeometricBannerBg className="rounded-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
           
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-outfit text-white">
              Halo, {user?.full_name || "Super Admin"} 
            </h1>
            <p className="text-blue-50/90 text-sm sm:text-base leading-relaxed">
              Pusat kendali ekosistem Mexpo. Pantau metrik platform, verifikasi
              rilis event, kelola akun, transaksi tiket, dan kustomisasi konten secara terpusat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 bg-white text-secondary hover:bg-blue-50 font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 text-secondary" />
              Buat Event
            </Link>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm cursor-pointer"
              title="Perbarui Data"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Perbarui
            </button>
          </div>
        </div>
      </div>

      {/* ── Action Required Alert Hub (Only if items pending) ── */}
      {overview?.actionsNeeded && overview.actionsNeeded.total > 0 && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-secondary font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-secondary" />
              <span>Perlu Tindakan Anda ({overview.actionsNeeded.total} Item Menunggu)</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">Prioritas Verifikasi</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {overview.actionsNeeded.pendingApprovals > 0 && (
              <button
                type="button"
                onClick={() => switchTab("event-ops", "approvals")}
                className="w-full text-left flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-secondary hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-secondary flex items-center justify-center font-bold text-xs group-hover:bg-secondary group-hover:text-white transition-colors">
                    {overview.actionsNeeded.pendingApprovals}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 group-hover:text-secondary transition-colors">
                      Persetujuan Event
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Menunggu review rilis
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
              </button>
            )}

            {overview.actionsNeeded.pendingSettlements > 0 && (
              <button
                type="button"
                onClick={() => switchTab("keuangan", "settlements")}
                className="w-full text-left flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-secondary hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-secondary flex items-center justify-center font-bold text-xs group-hover:bg-secondary group-hover:text-white transition-colors">
                    {overview.actionsNeeded.pendingSettlements}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 group-hover:text-secondary transition-colors">
                      Settlement Tiket
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Menunggu transfer EO
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
              </button>
            )}

            {overview.actionsNeeded.unreadInquiries > 0 && (
              <button
                type="button"
                onClick={() => switchTab("cms", "inbox")}
                className="w-full text-left flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100 hover:border-secondary hover:shadow-sm transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-secondary flex items-center justify-center font-bold text-xs group-hover:bg-secondary group-hover:text-white transition-colors">
                    {overview.actionsNeeded.unreadInquiries}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 group-hover:text-secondary transition-colors">
                      Pesan Pertanyaan
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Pesan baru belum dibaca
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── KPI Metric Cards ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Loader2 className="w-6 h-6 animate-spin mr-3 text-secondary" />
          <span className="text-sm">Memuat metrik platform Mexpo...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Event */}
          <button
            type="button"
            onClick={() => switchTab("ringkasan", "events")}
            className="text-left bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Total Event
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 font-outfit">
              {overview?.events.total ?? 0}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-50">
              <span className="text-secondary font-semibold">
                {overview?.events.published ?? 0} Aktif
              </span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">
                {overview?.events.pending ?? 0} Pending
              </span>
              <span>•</span>
              <span>{overview?.events.drafted ?? 0} Draft</span>
            </div>
          </button>

          {/* Card 2: Pengguna Terdaftar */}
          <button
            type="button"
            onClick={() => switchTab("pengguna", "users")}
            className="text-left bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Pengguna Terdaftar
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 font-outfit">
              {overview?.users.total ?? 0}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-50">
              <span className="text-gray-700 font-semibold">
                {overview?.users.regular ?? 0} Pengguna
              </span>
              <span>•</span>
              <span className="text-secondary font-semibold">
                {overview?.users.superadmins ?? 0} Admin
              </span>
            </div>
          </button>

          {/* Card 3: Gross Volume Tiket */}
          <button
            type="button"
            onClick={() => switchTab("keuangan", "settlements")}
            className="text-left bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Gross Volume Tiket
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate font-outfit">
              {formatIDR(overview?.financials.grossVolume ?? 0)}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
              <span>Fee Platform:</span>
              <span className="text-secondary font-bold">
                {formatIDR(overview?.financials.platformFee ?? 0)}
              </span>
            </div>
          </button>

          {/* Card 4: Kotak Pertanyaan */}
          <button
            type="button"
            onClick={() => switchTab("cms", "inbox")}
            className="text-left bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all space-y-3 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Pesan Pertanyaan
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                <Inbox className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-gray-900 font-outfit">
              {overview?.inquiries.total ?? 0}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-50">
              <span>Status Pesan:</span>
              <span
                className={`font-semibold ${
                  (overview?.inquiries.unread ?? 0) > 0
                    ? "text-secondary font-bold"
                    : "text-gray-500"
                }`}
              >
                {overview?.inquiries.unread ?? 0} Belum Dibaca
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── Modul Administrasi Utama ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Modul Administrasi &amp; Kontrol
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Akses langsung panel operasional, approval sistem, verifikasi keuangan, dan CMS publik
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module 1: Persetujuan Event */}
          <button
            type="button"
            onClick={() => switchTab("event-ops", "approvals")}
            className="text-left group p-5 bg-white rounded-2xl border border-gray-100 hover:border-secondary hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                <ShieldAlert className="w-5 h-5" />
              </div>
              {(overview?.events.pending ?? 0) > 0 && (
                <span className="bg-blue-50 text-secondary border border-blue-100 font-bold text-xs px-2.5 py-0.5 rounded-full">
                  {overview?.events.pending} pending
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-secondary transition-colors">
                Persetujuan Event
              </h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Verifikasi kelayakan dan permohonan publikasi event dari EO sebelum tayang di direktori publik.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary pt-2 border-t border-gray-50">
              <span>Tinjau Pengajuan</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Module 2: Settlement Tiket */}
          <button
            type="button"
            onClick={() => switchTab("keuangan", "settlements")}
            className="text-left group p-5 bg-white rounded-2xl border border-gray-100 hover:border-secondary hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                <Wallet className="w-5 h-5" />
              </div>
              {(overview?.financials.pendingSettlements ?? 0) > 0 && (
                <span className="bg-blue-50 text-secondary border border-blue-100 font-bold text-xs px-2.5 py-0.5 rounded-full">
                  {overview?.financials.pendingSettlements} payout
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-secondary transition-colors">
                Settlement &amp; Payout
              </h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Rekap saldo penjualan tiket escrow Midtrans dan konfirmasi pencairan dana ke rekening EO.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary pt-2 border-t border-gray-50">
              <span>Kelola Settlement</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Module 3: Manajemen Pengguna */}
          <button
            type="button"
            onClick={() => switchTab("pengguna", "users")}
            className="text-left group p-5 bg-white rounded-2xl border border-gray-100 hover:border-secondary hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-secondary transition-colors">
                Manajemen Pengguna
              </h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Kelola hak akses peran akun (User / Superadmin), status aktifasi, serta audit direktori anggota.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary pt-2 border-t border-gray-50">
              <span>Kelola User</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Module 4: Kotak Pertanyaan Masuk */}
          <button
            type="button"
            onClick={() => switchTab("cms", "inbox")}
            className="text-left group p-5 bg-white rounded-2xl border border-gray-100 hover:border-secondary hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                <Inbox className="w-5 h-5" />
              </div>
              {(overview?.inquiries.unread ?? 0) > 0 && (
                <span className="bg-blue-50 text-secondary border border-blue-100 font-bold text-xs px-2.5 py-0.5 rounded-full">
                  {overview?.inquiries.unread} baru
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-secondary transition-colors">
                Kotak Pertanyaan Masuk
              </h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Kelola, baca, dan tanggapi pesan/pertanyaan pengunjung dari form kontak website.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary pt-2 border-t border-gray-50">
              <span>Buka Kotak Masuk</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Module 5: CMS FAQ */}
          <button
            type="button"
            onClick={() => switchTab("cms", "cms-faq")}
            className="text-left group p-5 bg-white rounded-2xl border border-gray-100 hover:border-secondary hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="bg-gray-100 text-gray-600 font-semibold text-xs px-2 py-0.5 rounded-full">
                CMS
              </span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-secondary transition-colors">
                Kustomisasi FAQ
              </h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Tambah, perbarui pertanyaan &amp; jawaban, susun urutan, dan kelola kategori bantuan website.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary pt-2 border-t border-gray-50">
              <span>Kelola FAQ</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Module 6: CMS About */}
          <button
            type="button"
            onClick={() => switchTab("cms", "cms-about")}
            className="text-left group p-5 bg-white rounded-2xl border border-gray-100 hover:border-secondary hover:shadow-md transition-all flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all">
                <FileQuestion className="w-5 h-5" />
              </div>
              <span className="bg-gray-100 text-gray-600 font-semibold text-xs px-2 py-0.5 rounded-full">
                CMS
              </span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base group-hover:text-secondary transition-colors">
                Kustomisasi Halaman About
              </h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Ubah banner hero, narasi visi misi, kurasi foto galeri, dan nilai keunggulan platform.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary pt-2 border-t border-gray-50">
              <span>Kelola Konten About</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* ── Recent Activity / Operational Queues ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Pending Events */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Event Menunggu Persetujuan
              </h3>
              <p className="text-xs text-gray-400">
                Pengajuan rilis publik terbaru dari penyelenggara
              </p>
            </div>
            <button
              type="button"
              onClick={() => switchTab("event-ops", "approvals")}
              className="text-xs font-bold text-secondary hover:underline cursor-pointer"
            >
              Lihat Semua →
            </button>
          </div>

          {overview?.recentPendingEvents &&
          overview.recentPendingEvents.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {overview.recentPendingEvents.map((evt) => (
                <div
                  key={evt.uuid}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {evt.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      Penyelenggara: {evt.organizer_name || "-"} •{" "}
                      {formatDate(evt.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchTab("event-ops", "approvals")}
                    className="shrink-0 text-xs font-semibold bg-blue-50 hover:bg-secondary text-secondary hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Tinjau
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-secondary/60 mx-auto mb-2" />
              Semua permohonan publikasi event telah diproses.
            </div>
          )}
        </div>

        {/* Right: Recent Inquiries */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Pesan Pengunjung Terbaru
              </h3>
              <p className="text-xs text-gray-400">
                Pertanyaan masuk dari form kontak publik
              </p>
            </div>
            <button
              type="button"
              onClick={() => switchTab("cms", "inbox")}
              className="text-xs font-bold text-secondary hover:underline cursor-pointer"
            >
              Buka Kotak Masuk →
            </button>
          </div>

          {overview?.recentInquiries && overview.recentInquiries.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {overview.recentInquiries.map((inq) => (
                <div
                  key={inq.uuid}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {inq.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inq.status === "UNREAD"
                            ? "bg-blue-50 text-secondary border border-blue-100"
                            : inq.status === "REPLIED"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {inq.status === "UNREAD"
                          ? "Baru"
                          : inq.status === "REPLIED"
                          ? "Dibalas"
                          : "Dibaca"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {inq.subject}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {formatDate(inq.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchTab("cms", "inbox")}
                    className="shrink-0 text-xs font-semibold bg-gray-100 hover:bg-secondary text-gray-700 hover:text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Buka
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 text-xs">
              <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              Belum ada pesan pengunjung yang masuk.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const tabGroups: SidebarTabGroup[] = [
    {
      id: "ringkasan",
      label: "Ringkasan",
      subTabs: [
        {
          id: "overview",
          label: "Dashboard Utama",
          icon: LayoutDashboard,
          content: overviewContent,
        },
        {
          id: "events",
          label: "Direktori Event",
          icon: Calendar,
          badge: overview?.events.total ?? undefined,
          content: (
            <div className="space-y-4">
              <EventList
                hideHero={true}
                title="Direktori & Manajemen Event"
                subtitle="Telusuri, pantau status, dan kelola seluruh event dalam ekosistem Mexpo"
              />
            </div>
          ),
        },
      ],
    },
    {
      id: "event-ops",
      label: "Event & Verifikasi",
      subTabs: [
        {
          id: "approvals",
          label: "Persetujuan Event",
          icon: ShieldAlert,
          badge: overview?.events.pending || undefined,
          badgeColor: "bg-amber-100 text-amber-700",
          content: <ApprovalQueue />,
        },
        {
          id: "tenant-categories",
          label: "Kategori Tenant",
          icon: Store,
          content: <TenantCategoryManager />,
        },
      ],
    },
    {
      id: "keuangan",
      label: "Keuangan",
      subTabs: [
        {
          id: "settlements",
          label: "Settlement & Payout",
          icon: Wallet,
          badge: overview?.financials.pendingSettlements || undefined,
          badgeColor: "bg-blue-100 text-secondary",
          content: <SettlementList />,
        },
      ],
    },
    {
      id: "pengguna",
      label: "Akses & Pengguna",
      subTabs: [
        {
          id: "users",
          label: "Manajemen Akun",
          icon: UserCheck,
          badge: overview?.users.total || undefined,
          content: <UserManager />,
        },
      ],
    },
    {
      id: "cms",
      label: "Konten & Bantuan",
      subTabs: [
        {
          id: "inbox",
          label: "Kotak Pesan Masuk",
          icon: Inbox,
          badge: overview?.inquiries.unread || undefined,
          badgeColor: "bg-blue-100 text-secondary",
          content: <InboxPage />,
        },
        {
          id: "cms-faq",
          label: "Kustomisasi FAQ",
          icon: HelpCircle,
          content: <FaqManager />,
        },
        {
          id: "cms-about",
          label: "Kustomisasi About",
          icon: FileQuestion,
          content: <AboutManager />,
        },
      ],
    },
  ];

  const sidebarHeader = (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
        <ShieldCheck className="w-5 h-5 text-secondary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-sm text-gray-900 truncate">
          {user?.full_name || "Super Admin"}
        </p>
        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-secondary">
          SUPERADMIN
        </span>
      </div>
    </div>
  );

  const headerActions = (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard/create"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/90 text-white font-semibold text-xs transition-colors shadow-xs"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Buat Event</span>
      </Link>
      <button
        onClick={() => refetch()}
        disabled={isFetching}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
        title="Perbarui Data"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Perbarui</span>
      </button>
    </div>
  );

  return (
    <DashboardSidebarLayout
      groups={tabGroups}
      activeGroupId={activeGroupId}
      activeSubTabId={activeSubTabId}
      onTabChange={(gId, sId) => {
        setActiveGroupId(gId);
        setActiveSubTabId(sId);
      }}
      sidebarHeader={sidebarHeader}
      actions={headerActions}
      backHref="/"
      backLabel="Kembali ke Beranda"
    />
  );
}
