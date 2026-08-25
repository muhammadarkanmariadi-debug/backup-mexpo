"use client";

import { useState } from "react";
import PageHeader from "@/shared/components/ui/PageHeader";
import PageShell from "@/shared/components/ui/PageShell";
import { Event } from "@/entities/event/event.entity";
import { TenantsTab } from "./components/TenantsTab";
import { UsersTab } from "./components/UsersTab";

interface Props {
  event: Event;
}

export default function VerificationPage({ event }: Props) {
  const [activeTab, setActiveTab] = useState<"TENANT" | "VISITOR">("TENANT");

  return (
    <PageShell className="py-8">
      <PageHeader title="Verifikasi" subtitle={event.name} />

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("TENANT")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "TENANT"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Penyewa
          </button>
          <button
            onClick={() => setActiveTab("VISITOR")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === "VISITOR"
                ? "border-secondary text-secondary"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Pengunjung
          </button>
        </nav>
      </div>

      <div className="mt-4">
        {activeTab === "TENANT" && <TenantsTab event={event} />}
        {activeTab === "VISITOR" && <UsersTab event={event} />}
      </div>
    </PageShell>
  );
}
