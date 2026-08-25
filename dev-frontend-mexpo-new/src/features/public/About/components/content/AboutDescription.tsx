import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { CalendarCheck2, UserCheck, QrCode, BarChart3 } from "lucide-react";
import { getPlatformStats } from "@/services/public.service";
import { keys } from "@/lib/query-keys";

/**
 * About page — description section:
 * 2–3 short paragraphs on the left, with real live platform stats on the right.
 */
const AboutDescription = () => {
  const { data: statsResponse } = useQuery({
    queryKey: keys.platform.stats,
    queryFn: () => getPlatformStats(),
    staleTime: 60 * 1000,
  });

  const statsData = statsResponse?.data;

  const stats = [
    {
      value: statsData?.events ?? 0,
      suffix: (statsData?.events ?? 0) > 0 ? "+" : "",
      label: "Event & Expo",
      icon: CalendarCheck2,
    },
    {
      value: statsData?.users ?? 0,
      suffix: (statsData?.users ?? 0) > 0 ? "+" : "",
      label: "Pengguna Aktif",
      icon: UserCheck,
    },
    {
      value: statsData?.checkIns ?? 0,
      suffix: (statsData?.checkIns ?? 0) > 0 ? "+" : "",
      label: "Pindai QR Check-in",
      icon: QrCode,
    },
    {
      value: statsData?.modules ?? 15,
      suffix: "+",
      label: "Modul & Fitur",
      icon: BarChart3,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mt-10 mb-16 sm:mt-14 sm:mb-20"
    >
      <div className="gap-10 lg:gap-14 grid grid-cols-1 lg:grid-cols-[1fr_auto]">
        {/* ── Paragraphs ── */}
        <div className="space-y-4 sm:space-y-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-secondary/10 p-2 rounded-xl">
              <QrCode className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="font-public-sans font-bold text-gray-900 text-xl sm:text-2xl md:text-3xl">
              Tentang <span className="text-secondary">MEXPO</span>
            </h2>
          </div>

          <p className="font-jakarta text-gray-600 text-sm sm:text-base leading-relaxed">
            <strong className="text-gray-800">MEXPO</strong> adalah platform
            manajemen event dan expo berbasis web yang menyatukan seluruh proses
            penyelenggaraan — dari pendaftaran peserta, penerbitan tiket, hingga
            check-in menggunakan QR code — dalam satu sistem yang mudah dipakai
            oleh panitia, tenant, dan pengunjung.
          </p>

          <p className="font-jakarta text-gray-600 text-sm sm:text-base leading-relaxed">
            Tujuan kami sederhana: membantu penyelenggara menjalankan acara
            dengan lebih rapi, cepat, dan transparan. Dengan data yang tercatat
            otomatis — mulai dari jumlah pendaftar, kehadiran per booth,
            transaksi tenant, hingga kehadiran workshop dan seminar — keputusan
            berbasis data menjadi lebih mudah dan akurat.
          </p>

          <p className="font-jakarta text-gray-600 text-sm sm:text-base leading-relaxed">
            Berawal dari kebutuhan event expo di SMK Telkom Malang, MEXPO
            berkembang menjadi solusi yang melayani berbagai jenis acara:
            expo, career fair, seminar, pameran, hingga market day. Setiap
            pembaruan didasarkan pada masukan langsung dari para penyelenggara,
            sehingga fiturnya selalu relevan dengan kebutuhan nyata di lapangan.
          </p>
        </div>

        {/* ── Stats panel (thin vertical divider from the paragraphs) ── */}
        <div className="border-t lg:border-t-0 lg:border-l border-gray-200 pt-6 lg:pt-0 lg:pl-10 w-full lg:w-72">
          <dl className="flex flex-row flex-wrap lg:flex-col gap-x-6 gap-y-8">
            {stats.map((s) => (
              <div key={s.label} className="min-w-[120px] lg:min-w-0">
                <dt className="sr-only">{s.label}</dt>
                <dd className="flex items-baseline gap-1 font-public-sans font-extrabold text-secondary text-3xl sm:text-4xl leading-none tabular-nums">
                  <CountUp
                    end={s.value}
                    duration={2}
                    separator="."
                    enableScrollSpy
                    scrollSpyOnce
                  />
                  <span className="text-xl sm:text-2xl">{s.suffix}</span>
                  <s.icon className="ml-1 w-5 h-5 text-brand-400" />
                </dd>
                <dd className="mt-2 text-gray-500 text-xs sm:text-sm font-medium">
                  {s.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </motion.section>
  );
};

export default AboutDescription;
