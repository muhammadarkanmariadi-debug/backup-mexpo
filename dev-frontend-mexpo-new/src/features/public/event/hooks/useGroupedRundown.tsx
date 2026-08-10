import { useEffect, useState, useMemo } from "react";
import { EventRundown } from "@/entities/event/rundown.entity";

export const useGroupedRundown = (rundown?: EventRundown[]) => {
  const [selectedDay, setSelectedDay] = useState<string>("");

  const { groupedRundown, days } = useMemo(() => {
    if (!rundown || rundown.length === 0) {
      return { groupedRundown: {}, days: [] };
    }

    const grouped: { [key: string]: EventRundown[] } = {};

    rundown.forEach((item) => {
      const date = item.start_time.split("T")[0];

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });

    Object.keys(grouped).forEach((date) => {
      grouped[date].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      );
    });

    const sortedDays = Object.keys(grouped).sort();
    return { groupedRundown: grouped, days: sortedDays };
  }, [rundown]);

  useEffect(() => {
    if (days.length > 0 && (!selectedDay || !days.includes(selectedDay))) {
      setSelectedDay(days[0]);
    } else if (days.length === 0 && selectedDay !== "") {
      setSelectedDay("");
    }
  }, [days, selectedDay]);

  return {
    selectedDay,
    setSelectedDay,
    days,
    groupedRundown,
  };
};
