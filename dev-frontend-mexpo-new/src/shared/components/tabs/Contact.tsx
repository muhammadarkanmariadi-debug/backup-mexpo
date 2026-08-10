import { EventContact } from "@/entities/event/contact.entity";
import ContentTitle2 from "@/shared/components/ui/ContentTitle2";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import SearchBar from "@/shared/components/form/SearchBar";
import { usePagination } from "@/shared/hooks/usePagination";
import React, { useState } from "react";

const ContactsTab = ({ contactList }: { contactList: EventContact[] }) => {
  const [search, setSearch] = useState("");

  const filteredContacts = contactList && contactList.length > 0 
    ? contactList.filter((contact) =>
        contact.name.toLowerCase().includes(search.toLowerCase())
      ) 
    : [];

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    setPage,
    setItemsPerPage,
    paginate,
  } = usePagination<EventContact>({
    totalItems: filteredContacts?.length || 0,
    initialPageSize: 5,
  });

  const paginatedContacts = paginate(filteredContacts);

  return (
    <div className="mx-auto px-2 sm:px-4 md:px-6 lg:px-0 w-full max-w-7xl">
      <div className="flex flex-col mb-5">
        <ContentTitle2 variant="tertiary" title="Get in touch with us" category="Contacts" />
        <SearchBar search={search} setSearch={setSearch} placeholder="Search Contacts..." />
      </div>

      {filteredContacts.length > 0 ? (
        <>
          <div className="hidden sm:grid gap-4 grid-cols-3 bg-blue-500 mx-auto px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl  font-semibold text-white text-xs sm:text-sm md:text-base">
            <div>Name</div>
            <div>Email</div>
            <div>Phone</div>
          </div>

          <div className="space-y-3 mt-3 mb-5">
            {paginatedContacts.map((contact, index) => (
              <div
                key={index}
                className="flex flex-col sm:grid sm:grid-cols-3 gap-1 sm:gap-4 sm:items-center bg-white px-4 sm:px-6 py-3 sm:py-5 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-colors"
              >
                <div className="font-medium text-gray-900 text-sm sm:text-base">
                  <span className="sm:hidden font-semibold text-gray-500 text-xs">Name: </span>
                  {contact.name}
                </div>
                <div className="text-gray-700 text-xs sm:text-sm md:text-base break-all">
                  <span className="sm:hidden font-semibold text-gray-500 text-xs">Email: </span>
                  {contact.email}
                </div>
                <div className="text-gray-700 text-xs sm:text-sm md:text-base">
                  <span className="sm:hidden font-semibold text-gray-500 text-xs">Phone: </span>
                  {contact.phone_number}
                </div>
              </div>
            ))}
          </div>

          {filteredContacts.length > 5 && (
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={setPage}
              onItemsPerPageChange={setItemsPerPage}
              pageSizeOptions={[5, 10, 20]}
            />
          )}
        </>
      ) : (
        <div className="text-center text-gray-500">No contacts found</div>
      )}
    </div>
  );
};

export default ContactsTab;
