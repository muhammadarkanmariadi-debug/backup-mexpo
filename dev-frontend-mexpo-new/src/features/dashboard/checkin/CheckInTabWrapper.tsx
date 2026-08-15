"use client";

import { Event } from "@/entities/event/event.entity";
import { Workshop } from "@/entities/event/workshop.entity";
import { useApiQuery } from "@/lib/hooks/useApi";
import { keys } from "@/lib/query-keys";
import { getEventWorkshops } from "@/services/event-data.service";
import CheckInPage from "./CheckInPage";
import { LoadingSpinner } from "@/shared/components/ui/LoadingSpinner";

interface Props {
  event: Event;
}

export default function CheckInTabWrapper({ event }: Props) {
  const { data: workshops, isLoading } = useApiQuery<Workshop[]>(
    keys.workshops.list(event.uuid, {}),
    () => getEventWorkshops(event.uuid).then((res) => res.data ?? [])
  );

  if (isLoading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  return <CheckInPage event={event} workshops={workshops ?? []} />;
}
