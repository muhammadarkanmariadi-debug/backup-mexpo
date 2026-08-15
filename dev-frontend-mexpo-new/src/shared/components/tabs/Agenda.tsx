"use client";
import { EventRundown } from "@/entities/event/rundown.entity";
import React from "react";
import { useGroupedRundown } from "../../../features/public/event/hooks/useGroupedRundown";
import { formatTabDate, formatDateWithDay, formatTime } from "@/shared/utils/format";
import TabListShell from "./TabListShell";
import { DataPagination } from "@/shared/components/ui/DataPagination";
import { useState, useMemo } from "react";
import { Clock } from "lucide-react";

const PAGE_SIZE = 10;

const AgendaTab = ({ rundown }: { rundown?: EventRundown[] }) => {

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filteredRundown = useMemo(() => {
    return rundown?.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [rundown, search]);
  const { selectedDay, setSelectedDay, days, groupedRundown } = useGroupedRundown(filteredRundown);

  const rows = groupedRundown[selectedDay] ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  return (
    <TabListShell
      category="Agenda"
      title="Lihat Jadwal Kami"
      searchPlaceholder="Cari agenda..."
      search={search}
      setSearch={(v) => { setSearch(v); setPage(1); }}
    >
      {/* Header Tabs */}
        {days.length > 0 ? (
          <div>
            <div className="bg-white shadow-sm border border-gray-200 rounded-t-lg">
              <div className="flex border-gray-200 border-b overflow-x-auto scrollbar-hide">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => { setSelectedDay(day); setPage(1); }}
                    className={`flex-1 min-w-[80px] sm:min-w-[100px] px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold font-public-sans uppercase transition-colors ${selectedDay === day
                      ? "bg-brand-500 text-white border-b-2 border-brand-600"
                      : "text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {formatTabDate(day)}
                  </button>
                ))}
              </div>

              {/* Title Bar */}
              <div className="bg-brand-500 px-4 sm:px-6 py-3 sm:py-4 text-white">
                <h1 className="font-public-sans font-bold text-lg sm:text-xl uppercase">
                  {selectedDay && formatDateWithDay(selectedDay)}
                </h1>
                <p className="mt-1 font-jakarta text-brand-100 text-xs sm:text-sm">
                  Agenda
                </p>
              </div>
            </div>

            {/* Schedule Table */}
            <div className="bg-white shadow-sm border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
              {rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 border-gray-200 border-b">
                        <th className="px-3 sm:px-6 py-2 sm:py-3 w-24 sm:w-32 font-public-sans font-semibold text-gray-600 text-xs text-left uppercase tracking-wider">
                          Waktu
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 w-16 sm:w-24 font-public-sans font-semibold text-gray-600 text-xs text-left uppercase tracking-wider"></th>
                        <th className="px-3 sm:px-6 py-2 sm:py-3 font-public-sans font-semibold text-gray-600 text-xs text-left uppercase tracking-wider">
                          Kegiatan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pageRows.map((item, index) => (
                        <tr
                          key={item.uuid || index}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-3 sm:px-6 py-3 sm:py-4 font-jakarta font-medium text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                            {formatTime(item.start_time)} -{" "}
                            {formatTime(item.end_time)}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex justify-center items-center bg-brand-500 rounded-full w-6 sm:w-8 h-6 sm:h-8">
                              <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-white" />
                            </div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4">
                            <div>
                              <p className="mb-1 font-public-sans font-semibold text-gray-900 text-sm sm:text-base">
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="font-jakarta text-gray-600 text-xs sm:text-sm">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 sm:px-6 py-8 sm:py-12 font-jakarta text-gray-500 text-sm sm:text-base text-center">
                  Belum ada agenda untuk hari ini
                </div>
              )}
            </div>

            {rows.length > 0 && (
              <div className="justify-end px-0">
                <DataPagination
                  currentPage={page}
                  totalPages={totalPages}
                  itemsPerPage={PAGE_SIZE}
                  totalItems={rows.length}
                  onPageChange={(p) => setPage(p)}
                  onItemsPerPageChange={() => {}}
                  pageSizeOptions={[PAGE_SIZE]}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-8 sm:py-12 font-jakarta text-gray-500 text-sm sm:text-base text-center">
            Belum ada agenda
          </div>
        )}
    </TabListShell>
  );
};

export default AgendaTab;
