"use client";

import { useMemo, useState } from "react";
import { Award, CalendarDays, Loader2, MapPin, Printer, X } from "lucide-react";

import { Event } from "@/entities/event/event.entity";
import { CertificateTemplate } from "@/entities/event/certificate-template.entity";
import { useAuthStore } from "@/stores/auth.store";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getMyCertificates, Certificate } from "@/services/workshop.service";
import { getActiveCertificateTemplate } from "@/services/certificate.service";
import { buildCertificateData } from "@/features/certificates/certificate-fields";
import { CertificatePreview } from "@/features/certificates/CertificatePreview";
import { PreviewErrorBoundary } from "@/features/certificates/PreviewErrorBoundary";
import { dateFormat, formatDateWithDay } from "@/shared/utils/format";
import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import SearchBar from "@/shared/components/form/SearchBar";
import { DataPagination } from "@/shared/components/ui/DataPagination";

const PAGE_SIZES = [6, 12, 24] as const;

/** Case-insensitive match on the workshop title, location and check-in date. */
function matchesSearch(c: Certificate, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    c.workshop?.title,
    c.workshop?.location,
    c.checkin_at ? formatDateWithDay(c.checkin_at) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function CertificateCard({
  certificate,
  onOpen,
}: {
  certificate: Certificate;
  onOpen: () => void;
}) {
  const { workshop, checkin_at } = certificate;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
      <div className="relative flex h-24 items-center justify-center bg-linear-to-br from-brand-50 via-white to-brand-100">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
          <Award className="h-6 w-6" />
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-brand-600 ring-1 ring-brand-100">
          Sertifikat
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 sm:text-base">
          {workshop?.title ?? "Workshop"}
        </h3>

        <ul className="space-y-1.5 text-xs text-gray-500">
          <li className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="truncate">
              {checkin_at
                ? `Check-in ${formatDateWithDay(checkin_at)}`
                : "Selesai"}
            </span>
          </li>
          {workshop?.location ? (
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{workshop.location}</span>
            </li>
          ) : null}
        </ul>

        <button
          type="button"
          onClick={onOpen}
          className="mt-auto inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-secondary/85"
        >
          <Award className="h-4 w-4" /> Lihat sertifikat
        </button>
      </div>
    </article>
  );
}

/** Plain HTML certificate: used when the event has no template, or when the
 * template canvas cannot be drawn. */
function LegacyCertificate({
  participantName,
  eventName,
  certificate,
}: {
  participantName: string;
  eventName: string;
  certificate: Certificate;
}) {
  return (
    <>
      <div
        id="certificate-print"
        className="rounded-xl border-4 border-double border-brand-300 p-8 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
          Sertifikat Partisipasi
        </p>
        <p className="mt-4 text-sm text-gray-500">Diberikan kepada</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{participantName}</p>
        <p className="mt-6 text-sm text-gray-600">
          atas partisipasinya dalam lokakarya
        </p>
        <p className="mt-1 text-lg font-bold text-brand-600">
          {certificate.workshop?.title}
        </p>
        <p className="mt-6 text-sm text-gray-500">{eventName}</p>
        <p className="mt-1 text-xs text-gray-400">
          {certificate.checkin_at ? formatDateWithDay(certificate.checkin_at) : ""}
        </p>
      </div>
      <div className="mt-4 flex">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary/80"
        >
          <Printer className="h-4 w-4" /> Cetak
        </button>
      </div>
    </>
  );
}

export default function CertificatesPage({ event }: { event: Event }) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState<Certificate | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);

  const { data: items, isLoading: loading } = useApiQuery<Certificate[]>(
    keys.certificates.mine,
    () => getMyCertificates(event.uuid),
  );

  // A10 upgrade — the event may define a Konva template; fall back to the
  // legacy hardcoded HTML block when none is configured.
  const { data: template } = useApiQuery<CertificateTemplate | null>(
    keys.certificateTemplates.active(event.uuid),
    () => getActiveCertificateTemplate(event.uuid),
    { retry: 0, enabled: !loading },
  );

  const all = useMemo(() => (Array.isArray(items) ? items : []), [items]);
  const filtered = useMemo(
    () => all.filter((c) => matchesSearch(c, search)),
    [all, search],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const previewData = useMemo(() => {
    if (!open || !user) return null;
    return buildCertificateData({
      participantName: user.full_name ?? "-",
      eventName: event.name,
      workshopTitle: open.workshop?.title ?? "",
      date: open.checkin_at ? dateFormat(open.checkin_at) : dateFormat(new Date().toISOString()),
      organizerName: event.organizer_name,
      certificateNumber: `MXP-${event.uuid.slice(0, 4).toUpperCase()}-${open.uuid.slice(0, 8).toUpperCase()}`,
    });
  }, [open, user, event]);

  const renderLegacy = (certificate: Certificate) => (
    <LegacyCertificate
      participantName={user?.full_name ?? "-"}
      eventName={event.name}
      certificate={certificate}
    />
  );

  return (
    <PageShell className="py-8">
      <PageHeader
        title="Sertifikat"
        subtitle="Sertifikat untuk workshop yang sudah kamu ikuti"
        align="center"
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </div>
      ) : all.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Award className="h-6 w-6" />
          </div>
          <p className="text-sm text-gray-500">
            Belum ada sertifikat. Sertifikat diterbitkan setelah kamu check-in
            ke sebuah workshop.
          </p>
        </div>
      ) : (
        <>
          <div className="mx-auto mb-6 max-w-md">
            <SearchBar
              search={search}
              setSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Cari workshop atau lokasi..."
            />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-gray-500">
              Tidak ada sertifikat yang cocok dengan &ldquo;{search}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((c) => (
                <CertificateCard
                  key={c.uuid}
                  certificate={c}
                  onOpen={() => setOpen(c)}
                />
              ))}
            </div>
          )}

          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
            onItemsPerPageChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            pageSizeOptions={PAGE_SIZES}
          />
        </>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6">
            {!previewData ? (
              <div className="py-10 text-center text-sm text-gray-500">
                Memuat data…
              </div>
            ) : template?.template ? (
              <PreviewErrorBoundary
                key={open.uuid}
                fallback={(error) => (
                  <>
                    <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
                      Template sertifikat event ini belum bisa ditampilkan, jadi
                      sertifikat standar dipakai. ({error.message})
                    </p>
                    {renderLegacy(open)}
                  </>
                )}
              >
                <CertificatePreview
                  template={template.template}
                  data={previewData}
                  title={`sertifikat-${open.workshop?.title ?? "workshop"}`}
                />
              </PreviewErrorBoundary>
            ) : (
              renderLegacy(open)
            )}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                <X className="h-4 w-4" /> Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
