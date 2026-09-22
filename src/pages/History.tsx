import { useMemo } from "react";
import { useStore } from "../store/store";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

function formatDuration(seconds?: number): string | null {
  if (!seconds) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "<1 Min";
  if (minutes < 60) return `${minutes} Min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} Std ${rest} Min` : `${hours} Std`;
}

export function History() {
  const { data } = useStore();

  const sorted = useMemo(
    () => [...data.history].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
    [data.history]
  );

  return (
    <div className="pt-2 space-y-4">
      <h1 className="font-serif text-2xl text-forest">Historie</h1>

      {sorted.length === 0 && (
        <p className="text-sm text-forest-soft">
          Noch nichts eingetragen. Sobald etwas erledigt wird, erscheint es hier.
        </p>
      )}

      <div className="space-y-2">
        {sorted.map((entry) => {
          const person = data.people.find((p) => p.id === entry.personId);
          const category = data.categories.find((c) => c.id === entry.categoryId);
          const duration = formatDuration(entry.durationSeconds);
          return (
            <div
              key={entry.id}
              className="bg-cream-soft rounded-card shadow-card px-4 py-3 flex items-center gap-3"
            >
              <div
                className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-cream-soft font-serif font-semibold text-sm"
                style={{ backgroundColor: person?.color ?? "#2F3E33" }}
              >
                {person?.name.trim().charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-forest truncate">{entry.taskName}</p>
                <p className="text-xs text-forest-soft truncate">
                  {person?.name ?? "Unbekannt"} · {dateFormatter.format(new Date(entry.completedAt))}
                  {category ? ` · ${category.icon} ${category.name}` : ""}
                  {duration ? ` · ${duration}` : ""}
                </p>
              </div>
              {typeof entry.points === "number" && (
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-pill ${
                    entry.points >= 0 ? "bg-cream-deep text-forest" : "bg-clay/15 text-clay"
                  }`}
                >
                  {entry.points > 0 ? `+${entry.points}` : entry.points}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
