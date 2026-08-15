// src/shared/components/tabs/TabListShell.tsx
// Shared shell for the public event tab lists (Sponsors / Speakers / Tenant /
// Workshop / Contact / Agenda): page wrapper + ContentTitle2 header + SearchBar.
// Each tab keeps its own list/grid rendering inside `children`.

import { ReactNode } from "react";

import ContentTitle2 from "@/shared/components/ui/ContentTitle2";
import SearchBar from "@/shared/components/form/SearchBar";

interface TabListShellProps {
  category: string;
  title: string;
  searchPlaceholder: string;
  search: string;
  setSearch: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export default function TabListShell({
  category,
  title,
  searchPlaceholder,
  search,
  setSearch,
  children,
  className,
}: TabListShellProps) {
  return (
    <div
      className={`mx-auto px-2 sm:px-4 md:px-6 lg:px-0 w-full max-w-7xl animate-in duration-500 fade-in ${
        className ?? ""
      }`}
    >
      <div className="flex flex-col mb-5">
        <ContentTitle2 category={category} title={title} />
        <SearchBar
          search={search}
          setSearch={setSearch}
          placeholder={searchPlaceholder}
        />
      </div>
      {children}
    </div>
  );
}