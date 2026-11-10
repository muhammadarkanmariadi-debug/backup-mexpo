
import { getEvents } from '@/services/public.service';
import Events from '@/features/public/events/components/Events';
import {
  EVENT_SECTION_KEYS,
  eventSectionParams,
  type EventSections,
  type EventSectionTotals,
} from '@/features/public/events/utils/eventSections';

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialCategory = (resolvedParams?.filter as any) || "All Events";

  // "Terlaris" picks from the latest events; each overview section (akan
  // datang / berlangsung / selesai) is fetched separately so one category can
  // never crowd the others out of a shared page.
  const [latest, ...sectionResults] = await Promise.all([
    getEvents({ quantity: "24" }),
    ...EVENT_SECTION_KEYS.map((section) => getEvents(eventSectionParams(section))),
  ]);

  const initialSections = {} as EventSections;
  const initialSectionTotals = {} as EventSectionTotals;
  EVENT_SECTION_KEYS.forEach((section, i) => {
    initialSections[section] = sectionResults[i].data ?? [];
    initialSectionTotals[section] = sectionResults[i].meta.counts;
  });

  return (
    <Events
      events={latest.data ?? []}
      initialSections={initialSections}
      initialSectionTotals={initialSectionTotals}
      initialCategory={initialCategory}
    />
  );
}
