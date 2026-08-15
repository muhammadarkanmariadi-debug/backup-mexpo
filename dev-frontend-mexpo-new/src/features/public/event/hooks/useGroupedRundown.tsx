import { useEffect, useState } from "react";
import { EventRundown } from "@/entities/event/rundown.entity";
import { useGroupByDate } from "@/shared/hooks/useGroupByDate";

export const useGroupedRundown = (rundown?: EventRundown[]) => {
  const [selectedDay, setSelectedDay] = useState<string>("");

  const { grouped, days } = useGroupByDate(rundown);

  useEffect(() => {
    if (days.length > 0 && (!selectedDay || !days.includes(selectedDay))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync selectedDay with available days
      setSelectedDay(days[0]);
    } else if (days.length === 0 && selectedDay !== "") {
      setSelectedDay("");
    }
  }, [days, selectedDay]);

  return {
    selectedDay,
    setSelectedDay,
    days,
    groupedRundown: grouped,
  };
};