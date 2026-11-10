import Image from "next/image";
import { Gift, Package } from "lucide-react";

import { SouvenirCatalogItem } from "@/entities/event/event.entity";
import ContentTitle2 from "@/shared/components/ui/ContentTitle2";

/** Public souvenir catalog: what visitors can redeem with their points. */
export default function SouvenirCatalogSection({ items }: { items: SouvenirCatalogItem[] }) {
  if (items.length === 0) return null;

  return (
    <section id="souvenir" className="border-t border-gray-100 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ContentTitle2 category="Katalog Souvenir" title="Tukarkan Poinmu dengan Souvenir" />
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Kumpulkan poin dengan mengunjungi booth, mengikuti seminar, atau bertransaksi di event ini,
          lalu tukarkan di meja souvenir dengan menunjukkan QR Anda.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${
                item.soldOut ? "opacity-60" : ""
              }`}
            >
              <div className="relative aspect-square bg-gray-50">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-300">
                    <Package className="h-10 w-10" />
                  </div>
                )}
                {item.soldOut && (
                  <span className="absolute left-2 top-2 rounded-full bg-gray-900/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                    Stok habis
                  </span>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-1 text-sm font-bold text-gray-900">{item.name}</p>
                {item.description && (
                  <p className="line-clamp-2 text-xs text-gray-500">{item.description}</p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-secondary">
                    <Gift className="h-3.5 w-3.5" /> {item.minPoints} poin
                  </span>
                  {item.remaining != null && !item.soldOut && (
                    <span className="text-[11px] text-gray-400">Sisa {item.remaining}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
