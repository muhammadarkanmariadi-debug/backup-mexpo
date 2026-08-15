import React, { useState } from "react";
import { EventSpeaker } from "@/entities/event/speaker.entity";
import { usePagination } from "@/shared/hooks/usePagination";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { SpeakerCard } from "../cards/SpeakerCard";
import TabListShell from "./TabListShell";

const SpeakersTab = ({ speakers }: { speakers: EventSpeaker[] }) => {
  const [search, setSearch] = useState("");

  const filteredSpeakers = speakers.filter((speaker) =>
    speaker.name.toLowerCase().includes(search.toLowerCase())
  );

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    setPage,
    setItemsPerPage,
    paginate,
  } = usePagination<EventSpeaker>({
    totalItems: filteredSpeakers.length,
    initialPageSize: 4,
    resetDeps: [search],
  });




  const paginatedSpeakers: EventSpeaker[] = paginate(filteredSpeakers);

  return (
    <TabListShell
      category="Pembicara"
      title="Pembicara Kami"
      searchPlaceholder="Cari Pembicara..."
      search={search}
      setSearch={setSearch}
    >
      {filteredSpeakers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {paginatedSpeakers.map((speaker) => (
            <SpeakerCard key={speaker.uuid} speaker={speaker} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">Tidak ada pembicara ditemukan</div>
      )}


      {/* Pagination Controls */}
      {filteredSpeakers.length > 4 && (
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={setPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[4, 8, 12, 16]}
        />
      )}
    </TabListShell>
  );
};

export default SpeakersTab;
