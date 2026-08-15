
import { Suspense } from 'react';
import { getEvents } from '@/services/public.service';

import Events from '@/features/public/events/components/Events';

export default async function HomePage() {
  // Bounded fetch: the home page reveals more via "Muat Lebih Banyak" instead
  // of pulling the entire event catalog into the first paint.
  const events = await getEvents({ quantity: "24" });

  return (
    <Suspense fallback={null}>
      <Events events={events.data ?? []} />
    </Suspense>
  );
}
