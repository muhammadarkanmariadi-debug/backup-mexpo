import { EventSponsor } from "@/entities/event/sponsor.entity";
import React from "react";
import { useClientList } from "@/shared/hooks/useClientList";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { SponsorCard } from "../cards/SponsorCard";
import TabListShell from "./TabListShell";

const SponsorsTab = ({ sponsors = [] }: { sponsors: EventSponsor[] }) => {
  const list = useClientList<EventSponsor>({
    items: sponsors,
    pageSize: 8,
    getSearch: (s) => `${s.name} ${s.level || ""}`,
    getSortValue: (s) => s.name,
  });

  return (
    <TabListShell
      category="Sponsor"
      title="Sponsor Kami"
      searchPlaceholder="Cari Sponsor..."
      search={list.search}
      setSearch={list.applySearch}
    >
      {/* Grid Container */}
      {list.paged.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {list.paged.map((sponsor, index) => (
            <div key={sponsor.uuid || index}>
              <SponsorCard sponsor={sponsor} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">Tidak ada sponsor ditemukan</div>
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

export default SponsorsTab;
