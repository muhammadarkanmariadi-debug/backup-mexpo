
import { Suspense } from 'react';
import { getEvents } from '@/services/public.service';

import Events from '@/features/public/events/components/Events';

export default async function HomePage() {
  const events = await getEvents({});

  return (
    <Suspense fallback={null}>
      <Events events={events.data ?? []} />
    </Suspense>
  );
}
