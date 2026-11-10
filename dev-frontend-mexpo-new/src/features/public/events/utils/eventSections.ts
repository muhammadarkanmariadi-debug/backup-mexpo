import { Event } from "@/entities/event/event.entity";

export type EventSectionKey = "Upcoming" | "On Going" | "Past";
export type EventSections = Record<EventSectionKey, Event[]>;
export type EventSectionTotals = Record<EventSectionKey, number>;

export const EVENT_SECTION_KEYS: EventSectionKey[] = ["Upcoming", "On Going", "Past"];

/** Events shown per carousel on the "Semua Event" overview. */
const EVENT_SECTION_SIZE = 6;

export interface EventSectionFilters {
  search?: string;
  event_type?: string;
  ticket_mode?: string;
}

/**
 * Query for one overview section. Each section is fetched on its own so a long
 * tail of past events can never push upcoming ones out of a shared page
 * (the old single "first N by start date" fetch did exactly that). Upcoming and
 * on-going events come soonest-first; past events most-recent-first.
 */
export function eventSectionParams(
  section: EventSectionKey,
  filters: EventSectionFilters = {},
): Record<string, string> {
  const params: Record<string, string> = {
    page: "1",
    quantity: String(EVENT_SECTION_SIZE),
    category: section,
    sort_by: section === "Past" ? "date-desc" : "date-asc",
  };
  if (filters.search) params.search = filters.search;
  if (filters.event_type) params.event_type = filters.event_type;
  if (filters.ticket_mode) params.ticket_mode = filters.ticket_mode;
  return params;
}
