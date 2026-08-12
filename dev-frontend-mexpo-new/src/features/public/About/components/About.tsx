"use client";

import { motion } from "framer-motion";

import Hero from "./content/Hero";
import AboutDescription from "./content/AboutDescription";
import Gallery from "./content/Gallery";
import { CoreFeature } from "./content/CoreFeature";
import CoreValue from "./content/CoreValue";


import { QrCode, BarChart3, Users, Zap } from "lucide-react";

const features = [
  {
    icon: <QrCode className="w-5 h-5" />,
    title: "QR Check-in",
    description:
      "Menggantikan daftar kertas dan antrean lambat dengan check-in QR instan untuk pintu masuk yang mulus.",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Analitik Real-time",
    description:
      "Data kehadiran dan transaksi tampil langsung, membantu panitia mengoptimalkan jalannya acara.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Manajemen Peserta",
    description:
      "Database terpusat untuk seluruh informasi peserta, preferensi, dan komunikasi.",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Setup Cepat",
    description:
      "Peluncuran event dalam hitungan menit, bukan hari — siap dipakai tim mana pun.",
  },
];

const coreValues = [
  {
    icon: QrCode,
    title: "Andal",
    description: "Sistem yang tetap stabil saat tekanan tertinggi.",
  },
  {
    icon: BarChart3,
    title: "Inovatif",
    description: "Terus menyempurnakan alur kerja penyelenggaraan.",
  },
  {
    icon: Users,
    title: "Transparan",
    description: "Data peserta terlindungi dan tercatat jelas.",
  },
  {
    icon: Zap,
    title: "Efisien",
    description: "Meminimalkan langkah untuk kecepatan operasional.",
  },
];

const About = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
    >
      <div className="mx-auto px-4 py-8 max-w-7xl">
        {/* ─── 1. Hero banner full-width ─── */}
        <Hero />

        {/* ─── 2. Deskripsi + panel statistik ─── */}
        <AboutDescription />

        {/* ─── 3. Galeri / showcase ─── */}
        <Gallery />

        {/* ─── Fitur inti ─── */}
        <CoreFeature feature={features} />

        {/* ─── Nilai inti ─── */}
        <CoreValue coreValues={coreValues} />

     
      </div>
    </motion.div>
  );
};

export default About;
