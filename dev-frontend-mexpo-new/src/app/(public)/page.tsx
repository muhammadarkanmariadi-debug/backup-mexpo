
import { getEvents } from '@/services/public.service';
import Events from '@/features/public/events/components/Events';

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialCategory = (resolvedParams?.filter as any) || "All Events";
  // Bounded fetch: the home page reveals more via "Muat Lebih Banyak" instead
  // of pulling the entire event catalog into the first paint.
  const events = await getEvents({ quantity: "24" });

  return (
    <Events
      events={events.data ?? []}
      initialCategory={initialCategory}
    />
  );
}
