


import React, { useState } from "react";
import { EventContact } from "@/entities/event/contact.entity";
import ContentTitle2 from "@/shared/components/ui/ContentTitle2";

const ContactsTab = ({ contactList }: { contactList: EventContact[] }) => {
  if (!contactList || contactList.length === 0) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-0 w-full max-w-7xl">
        <h3 className="mb-4 sm:mb-6 font-public-sans font-bold text-gray-900 text-xl sm:text-2xl">
          Contacts
        </h3>
        <div className="px-4 sm:px-6 py-8 sm:py-12 font-jakarta text-gray-500 text-sm sm:text-base text-center">
          No contacts information available
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto  w-full max-w-7xl">
      <ContentTitle2 variant="tertiary" title="Get in touch with us" category="Contacts" />

      <div className="hidden sm:grid gap-4 grid-cols-3 bg-blue-500 mx-auto px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl  font-semibold text-white text-xs sm:text-sm md:text-base">
        <div>Name</div>
        <div>Email</div>
        <div>Phone</div>
      </div>

      <div className="space-y-3 mt-3">
        {contactList.map((contact, index) => (
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
    </div>
  );
};

export default ContactsTab;
