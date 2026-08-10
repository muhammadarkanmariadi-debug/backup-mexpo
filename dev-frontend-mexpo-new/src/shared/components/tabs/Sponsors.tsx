import ContentTitle2 from "@/shared/components/ui/ContentTitle2";
import { EventSponsor } from "@/entities/event/sponsor.entity";
import React, { useState } from "react";
import { usePagination } from "@/shared/hooks/usePagination";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { SponsorCard } from "../cards/SponsorCard";
import SearchBar from "@/shared/components/form/SearchBar";

const SponsorsTab = ({ sponsors }: { sponsors: EventSponsor[] }) => {
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    setPage,
    setItemsPerPage,
    paginate,
  } = usePagination<EventSponsor>({
    totalItems: sponsors?.length || 0,
    initialPageSize: 4,
  });

  const [search, setSearch] = useState("");

  const filteredSponsors = sponsors.filter((sponsor) =>
    sponsor.name.toLowerCase().includes(search.toLowerCase())
  );


  const paginatedSponsors = paginate(filteredSponsors);

  return (
    <div className="mx-auto px-2 sm:px-4 md:px-6 lg:px-0 w-full max-w-7xl">
      <div className="flex flex-col flex-col mb-5">
        <ContentTitle2
          category="Sponsors"
          title="Meet Our Sponsors"
        />

        <SearchBar search={search} setSearch={setSearch} placeholder="Search Sponsors..." />

      </div>
      {/* Grid Container */}
      {filteredSponsors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {paginatedSponsors.map((sponsor, index) => (
            <div key={sponsor.uuid || index}>
              <SponsorCard sponsor={sponsor} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">No sponsors found</div>
      )}


      {/* Pagination Controls */}
      {filteredSponsors.length > 3 && (
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

export default SponsorsTab;
