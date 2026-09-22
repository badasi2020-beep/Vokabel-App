import type { HistoryEntry } from "../types";
import { startOfDay, startOfWeek } from "./recurrence";

export type Period = "day" | "week" | "month" | "year" | "all";

export const periodLabels: Record<Period, string> = {
  day: "Tag",
  week: "Woche",
  month: "Monat",
  year: "Jahr",
  all: "Gesamt"
};

export function periodStart(period: Period, now: Date = new Date()): Date | null {
  switch (period) {
    case "day":
      return startOfDay(now);
    case "week":
      return startOfWeek(now);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
      return null;
  }
}

export function filterByPeriod(history: HistoryEntry[], period: Period, now: Date = new Date()): HistoryEntry[] {
  const start = periodStart(period, now);
  if (!start) return history;
  return history.filter((h) => new Date(h.completedAt) >= start);
}
