import Image from "next/image";
import { EventSpeaker } from "@/entities/event/speaker.entity";

export const SpeakerCard = ({ speaker }: { speaker: EventSpeaker }) => {
  return (
    <div className="bg-white hover:shadow-lg border border-gray-100 shadow-sm rounded-xl overflow-hidden transition-shadow">
      <div className="relative h-48 sm:h-56 w-full bg-gray-50 flex items-center justify-center">
        {speaker.photo ? (
          <Image
            src={speaker.photo}
            alt={speaker.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="text-gray-300 font-medium">Tanpa Gambar</div>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h4 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{speaker.name}</h4>
        <p className="text-gray-500 text-sm line-clamp-3">{speaker.bio || "Belum ada biografi."}</p>
      </div>
    </div>
  );
};
