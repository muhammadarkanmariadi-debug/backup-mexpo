import React from "react";
import { EventSpeaker } from "@/entities/event/speaker.entity";
import { useClientList } from "@/shared/hooks/useClientList";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { SpeakerCard } from "../cards/SpeakerCard";
import TabListShell from "./TabListShell";

const SpeakersTab = ({ speakers = [] }: { speakers: EventSpeaker[] }) => {
  const list = useClientList<EventSpeaker>({
    items: speakers,
    pageSize: 8,
    getSearch: (s) => `${s.name} ${s.bio || ""}`,
    getSortValue: (s) => s.name,
  });

  return (
    <TabListShell
      category="Pembicara"
      title="Pembicara Kami"
      searchPlaceholder="Cari Pembicara..."
      search={list.search}
      setSearch={list.applySearch}
    >
      {list.paged.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {list.paged.map((speaker) => (
            <SpeakerCard key={speaker.uuid} speaker={speaker} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">Tidak ada pembicara ditemukan</div>
      )}

      {/* Pagination Controls */}
      {list.totalItems > 8 && (
        <DataPagination
          currentPage={list.page}
          totalPages={list.totalPages}
          itemsPerPage={list.itemsPerPage}
          totalItems={list.totalItems}
          onPageChange={list.setPage}
          onItemsPerPageChange={() => {}}
          pageSizeOptions={[4, 8, 12, 16]}
        />
      )}
    </TabListShell>
  );
};

export default SpeakersTab;
