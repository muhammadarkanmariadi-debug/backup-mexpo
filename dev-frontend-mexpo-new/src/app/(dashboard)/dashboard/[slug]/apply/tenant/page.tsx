import { getEventByUuidByMe } from "@/services/event.service";
import TenantApplyForm from "@/features/dashboard/visitor/TenantApplyForm";
import PageShell from "@/shared/components/ui/PageShell";
import { notFound } from "next/navigation";

export default async function TenantApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getEventByUuidByMe(slug);
  
  if (!res.data) {
    notFound();
  }

  return (
    <PageShell maxWidth="3xl" className="py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Daftar sebagai Tenant</h1>
      <p className="text-gray-600 mb-8">Isi formulir di bawah ini untuk mengajukan diri sebagai tenant di {res.data.name}.</p>
      <TenantApplyForm event={res.data} />
    </PageShell>
  );
}
