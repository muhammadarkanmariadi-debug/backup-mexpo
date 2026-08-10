import { useMemo } from "react";
import { Event } from "@/entities/event/event.entity";
import { getEventCategory } from "@/shared/utils/validateEventCategory";



export function useGroupedEvents(events: Event[], search: string) {
  return useMemo(() => {
    return events.reduce(
      (acc, event) => {
        const matchesSearch =
          !search ||
          event.name.toLowerCase().includes(search.toLowerCase()) ||
          event.description?.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return acc;

        const cat = getEventCategory(event.start_date, event.end_date) || 'On Going';
        acc[cat].push(event);
        return acc;
      },
      { Upcoming: [] as Event[], "On Going": [] as Event[], Past: [] as Event[] }
    );
  }, [events, search]);
}