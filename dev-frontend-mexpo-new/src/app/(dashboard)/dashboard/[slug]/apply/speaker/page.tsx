import { getEventByUuidByMe } from "@/services/event.service";
import SpeakerApplyForm from "@/features/dashboard/visitor/SpeakerApplyForm";
import PageShell from "@/shared/components/ui/PageShell";
import { notFound } from "next/navigation";

export default async function SpeakerApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getEventByUuidByMe(slug);
  
  if (!res.data) {
    notFound();
  }

  return (
    <PageShell maxWidth="3xl" className="py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Daftar sebagai Pembicara</h1>
      <p className="text-gray-600 mb-8">Isi formulir di bawah ini untuk mengajukan diri sebagai pembicara di {res.data.name}.</p>
      <SpeakerApplyForm event={res.data} />
    </PageShell>
  );
}
