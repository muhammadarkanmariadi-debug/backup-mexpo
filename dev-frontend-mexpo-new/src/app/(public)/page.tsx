
import { getEvents } from '@/services/public.service';

import Events from '@/features/public/events/components/Events';

export default async function HomePage() {
  const events = await getEvents({});

  return (
    <Events events={events.data} />
  );
}
