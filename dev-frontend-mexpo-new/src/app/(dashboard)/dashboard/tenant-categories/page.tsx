import { Metadata } from "next";
import TenantCategoryManager from "@/features/dashboard/tenant-categories/TenantCategoryManager";
import PageShell from "@/shared/components/ui/PageShell";

export const metadata: Metadata = {
  title: "Manajemen Kategori Tenant | Mexpo",
};

export default function TenantCategoriesPage() {
  return (
    <PageShell className="py-8">
      <TenantCategoryManager />
    </PageShell>
  );
}
