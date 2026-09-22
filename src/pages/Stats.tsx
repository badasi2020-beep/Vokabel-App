import { useMemo, useState } from "react";
import { useStore } from "../store/store";
import { filterByPeriod, periodLabels, type Period } from "../lib/period";

const periods: Period[] = ["day", "week", "month", "year", "all"];

export function Stats() {
  const { data } = useStore();
  const [period, setPeriod] = useState<Period>("week");

  const entries = useMemo(() => filterByPeriod(data.history, period), [data.history, period]);

  const totalCount = entries.length;
  const totalPoints = entries.reduce((sum, e) => sum + (e.points ?? 0), 0);

  const perPerson = useMemo(() => {
    return data.people.map((person) => {
      const personEntries = entries.filter((e) => e.personId === person.id);
      return {
        person,
        count: personEntries.length,
        points: personEntries.reduce((sum, e) => sum + (e.points ?? 0), 0)
      };
    });
  }, [data.people, entries]);

  const perCategory = useMemo(() => {
    return data.categories
      .map((category) => {
        const categoryEntries = entries.filter((e) => e.categoryId === category.id);
        return { category, count: categoryEntries.length };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data.categories, entries]);

  const maxPersonCount = Math.max(1, ...perPerson.map((p) => p.count));

  return (
    <div className="pt-2 space-y-6">
      <h1 className="font-serif text-2xl text-forest">Statistik</h1>

      <div className="flex gap-2 flex-wrap">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-pill text-sm font-medium border ${
              period === p ? "bg-forest text-cream-soft border-forest" : "border-cream-deep text-forest"
            }`}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      <div className="bg-cream-soft rounded-card shadow-card p-4 text-center">
        <p className="font-serif text-3xl text-forest">{totalCount}</p>
        <p className="text-sm text-forest-soft mt-1">
          gemeinsam erledigt{totalPoints !== 0 ? ` · ${totalPoints > 0 ? "+" : ""}${totalPoints} Punkte` : ""}
        </p>
        <p className="text-xs text-forest-soft mt-2">
          „Wir haben beide etwas gemacht.“
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-forest-soft uppercase tracking-wide">Pro Person</h2>
        <div className="space-y-2">
          {perPerson.map(({ person, count, points }) => (
            <div key={person.id} className="bg-cream-soft rounded-card shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-forest">{person.name}</span>
                <span className="text-sm text-forest-soft">
                  {count} {count === 1 ? "Aufgabe" : "Aufgaben"}
                  {points !== 0 ? ` · ${points > 0 ? "+" : ""}${points} Punkte` : ""}
                </span>
              </div>
              <div className="h-2 rounded-pill bg-cream-deep overflow-hidden">
                <div
                  className="h-full rounded-pill"
                  style={{
                    width: `${(count / maxPersonCount) * 100}%`,
                    backgroundColor: person.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {perCategory.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-forest-soft uppercase tracking-wide">Nach Kategorie</h2>
          <div className="bg-cream-soft rounded-card shadow-card p-4 space-y-2">
            {perCategory.map(({ category, count }) => (
              <div key={category.id} className="flex items-center justify-between text-sm">
                <span>
                  {category.icon} {category.name}
                </span>
                <span className="text-forest-soft">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
