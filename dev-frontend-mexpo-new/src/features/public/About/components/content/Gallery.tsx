import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";

/**
 * About page — gallery/showcase section (per layout reference):
 * responsive grid, 3 columns on desktop, 2 on tablet, 1 on mobile.
 * Every item keeps a consistent aspect ratio + rounded corners, with a
 * brand-tinted overlay label. Images are free-license Unsplash photos of
 * events/expos (see list below) — all served via `images.unsplash.com`,
 * which is already allowlisted in `next.config.ts`.
 *
 * Image sources (Unsplash License — free for commercial use, no attribution
 * required):
 *   1. photo-1540575467063-178a50c2df87 — konferensi/audiens
 *   2. photo-1505373877841-8d25f7d46678 — keynote/presentasi
 *   3. photo-1511578314322-379afb476865 — kerumunan acara
 *   4. photo-1475721027785-f74eccf877e2 — pameran/konferensi
 *   5. photo-1523580494863-6f3031224c94 — wisuda/kelulusan
 *   6. photo-1559223607-a43c990c692c — lokakarya/tim
 */

const gallery = [
  { id: 1, src: "photo-1540575467063-178a50c2df87", label: "Konferensi" },
  { id: 2, src: "photo-1505373877841-8d25f7d46678", label: "Presentasi" },
  { id: 3, src: "photo-1511578314322-379afb476865", label: "Acara Publik" },
  { id: 4, src: "photo-1475721027785-f74eccf877e2", label: "Pameran" },
  { id: 5, src: "photo-1523580494863-6f3031224c94", label: "Kelulusan" },
  { id: 6, src: "photo-1559223607-a43c990c692c", label: "Lokakarya" },
];

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const Gallery = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mb-16 sm:mb-20"
    >
      <div className="flex items-center gap-2 mb-6 sm:mb-8">
        <div className="bg-secondary/10 p-2 rounded-xl">
          <Camera className="w-5 h-5 text-secondary" />
        </div>
        <h2 className="font-public-sans font-bold text-gray-900 text-xl sm:text-2xl md:text-3xl">
          Galeri <span className="text-secondary">Kegiatan</span>
        </h2>
      </div>

      <div className="gap-4 sm:gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="relative group aspect-[4/3] overflow-hidden rounded-2xl"
          >
            <Image
              src={img(item.src)}
              alt={`Galeri kegiatan MEXPO — ${item.label}`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
            <span className="absolute bottom-3 left-4 font-public-sans font-semibold text-white text-sm">
              {item.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default Gallery;
