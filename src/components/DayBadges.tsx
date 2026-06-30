"use client";

import { WEEKEND_DAYS, type DayOfWeek } from "@/data/types";
import { useTranslation } from "@/i18n/I18nProvider";

export function DayBadges({ days }: { days: DayOfWeek[] }) {
  const { dayName } = useTranslation();

  return (
    <ul className="flex flex-wrap gap-1.5">
      {days.map((day) => {
        const isWeekend = WEEKEND_DAYS.includes(day);
        return (
          <li
            key={day}
            className={
              "rounded-full px-2.5 py-1 text-xs font-semibold " +
              (isWeekend
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200")
            }
          >
            {dayName(day, "long")}
          </li>
        );
      })}
    </ul>
  );
}
