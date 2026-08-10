import React, { useState } from "react";
import { EventSpeaker } from "@/entities/event/speaker.entity";
import ContentTitle2 from "@/shared/components/ui/ContentTitle2";
import { usePagination } from "@/shared/hooks/usePagination";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { SpeakerCard } from "../cards/SpeakerCard";
import SearchBar from "@/shared/components/form/SearchBar";

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

    totalItems: speakers?.length || 0,
    initialPageSize: 4,
  });




  const paginatedSpeakers: EventSpeaker[] = paginate(filteredSpeakers);

  return (
    <div className="mx-auto px-2 sm:px-4 md:px-6 lg:px-0 w-full max-w-7xl">
      <div className="flex flex-col flex-col mb-5">
        <ContentTitle2
          category="Speakers"
          title="Meet Our Speakers"
        />

        <SearchBar search={search} setSearch={setSearch} placeholder="Search Speakers..." />

      </div>

      {filteredSpeakers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {paginatedSpeakers.map((speaker) => (
            <SpeakerCard key={speaker.uuid} speaker={speaker} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">No speakers found</div>
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
    </div>
  );
};

export default SpeakersTab;
