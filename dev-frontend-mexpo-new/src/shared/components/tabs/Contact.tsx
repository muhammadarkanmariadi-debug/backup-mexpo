import { EventContact } from "@/entities/event/contact.entity";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { useClientList } from "@/shared/hooks/useClientList";
import React from "react";
import TabListShell from "./TabListShell";

const ContactsTab = ({ contactList = [] }: { contactList: EventContact[] }) => {
  const list = useClientList<EventContact>({
    items: contactList,
    pageSize: 5,
    getSearch: (c) => `${c.name} ${c.email || ""} ${c.phone_number || ""}`,
    getSortValue: (c) => c.name,
  });

  return (
    <TabListShell
      category="Kontak"
      title="Hubungi Kami"
      searchPlaceholder="Cari Kontak..."
      search={list.search}
      setSearch={list.applySearch}
    >
      {list.paged.length > 0 ? (
        <>
          <div className="hidden sm:grid gap-4 grid-cols-3 bg-brand-500 mx-auto px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl  font-semibold text-white text-xs sm:text-sm md:text-base">
            <div>Nama</div>
            <div>Surel</div>
            <div>Telepon</div>
          </div>

          <div className="space-y-3 mt-3 mb-5">
            {list.paged.map((contact, index) => (
              <div
                key={contact.uuid || index}
                className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-4 sm:items-center bg-white px-4 sm:px-6 py-3 sm:py-5 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-colors"
              >
                <div className="font-medium text-gray-900 text-sm sm:text-base">
                  <span className="sm:hidden font-semibold text-gray-500 text-xs">Nama: </span>
                  {contact.name}
                </div>
                <div className="text-gray-700 text-xs sm:text-sm md:text-base break-all">
                  <span className="sm:hidden font-semibold text-gray-500 text-xs">Surel: </span>
                  {contact.email}
                </div>
                <div className="text-gray-700 text-xs sm:text-sm md:text-base">
                  <span className="sm:hidden font-semibold text-gray-500 text-xs">Telepon: </span>
                  {contact.phone_number}
                </div>
              </div>
            ))}
          </div>

          {list.totalItems > 5 && (
            <DataPagination
              currentPage={list.page}
              totalPages={list.totalPages}
              itemsPerPage={list.itemsPerPage}
              totalItems={list.totalItems}
              onPageChange={list.setPage}
              onItemsPerPageChange={() => {}}
              pageSizeOptions={[5, 10, 20]}
            />
          )}
        </>
      ) : (
        <div className="text-center text-gray-500">Tidak ada kontak ditemukan</div>
      )}
    </TabListShell>
  );
};

export default ContactsTab;
