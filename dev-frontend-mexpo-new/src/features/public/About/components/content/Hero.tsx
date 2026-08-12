import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, CalendarPlus } from "lucide-react";
import Button from "@/shared/components/button/Button";

/**
 * About page hero — full-width banner (per layout reference):
 * big 2-line bold headline + short supporting text + visual as background.
 * Uses the brand blue (`secondary`/`brand-500`) for accents and the site's
 * standard `card-e.png` hero visual to stay consistent with the rest of the
 * public site. Stacks vertically on mobile by default (text over image).
 */
const Hero = () => {
  return (
    <section className="relative mt-0 lg:mt-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col"
      >
        {/* Background visual - absolute to fill container */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <Image
            src="/images/carousel/carousel-01.png"
            alt="Suasana event dan expo yang dikelola MEXPO"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/85 via-gray-900/60 to-transparent" />
        </div>

        {/* Content - relative to dictate height */}
        <div className="relative flex flex-col justify-center gap-4 sm:gap-5 px-5 sm:px-8 lg:px-14 py-12 md:py-16 lg:py-20 max-w-3xl text-left text-white min-h-[320px] md:min-h-[384px]">
          <p className="font-jakarta text-xs sm:text-sm md:text-base text-white/85">
            Platform Manajemen Event &amp; Expo
          </p>
          <h1 className="font-public-sans font-extrabold text-3xl sm:text-5xl md:text-6xl leading-tight">
            Kelola Event &amp; Expo <span className="text-secondary">Jadi Mudah</span>
            <br />
            dengan Satu Platform Terintegrasi
          </h1>
          <p className="font-jakarta text-gray-100 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
            MEXPO menyatukan pendaftaran, check-in QR, workshop, tenant/POS,
            sertifikat digital, hingga laporan dalam satu sistem — cepat, akurat,
            dan siap dipakai di event apa pun.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              href="/dashboard/create"
              startIcon={<CalendarPlus className="w-4 h-4" />}
              className="bg-secondary text-white hover:bg-secondary/85"
            >
              Buat Event
            </Button>
            <Button
              href="/"
              variant="secondary"
              endIcon={<ArrowRight className="w-4 h-4" />}
              className="border border-white/40"
            >
              Jelajahi Event
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
