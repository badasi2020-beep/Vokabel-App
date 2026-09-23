import { useState } from "react";
import { BarChart3, PartyPopper, Tag, Trophy, Users } from "lucide-react";
import { CategoryIcon } from "../components/CategoryIcon";
import { isDue } from "../lib/utils";
import type { Store } from "../types";

type Range = "woche" | "monat" | "jahr";

export function StatsPage({ store }: { store: Store }) {
  const [range, setRange] = useState<Range>("woche");
  const since = new Date();
  since.setDate(since.getDate() - (range === "monat" ? 30 : range === "jahr" ? 365 : 7));

  const completions = store.completions.filter((entry) => new Date(entry.completedAt) >= since);
  const points =
    completions.reduce((sum, item) => sum + (item.pointsSnapshot || 0), 0) +
    store.activities.filter((item) => new Date(item.createdAt) >= since).reduce((sum, item) => sum + item.points, 0);

  const byPerson = store.people
    .map((person) => ({
      ...person,
      count: completions.filter((item) => item.personId === person.id).length,
      points: completions.filter((item) => item.personId === person.id).reduce((sum, item) => sum + (item.pointsSnapshot || 0), 0)
    }))
    .filter((person) => person.count || completions.length === 0);

  const byCategory = store.categories
    .map((cat) => ({ ...cat, count: completions.filter((item) => item.categoryId === cat.id).length }))
    .filter((cat) => cat.count);

  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const dayCounts = days.map((label, index) => ({
    label,
    count: completions.filter((item) => (new Date(item.completedAt).getDay() + 6) % 7 === index).length
  }));
  const max = Math.max(...dayCounts.map((item) => item.count), 1);

  const openTaskCount = store.tasks.filter((task) => isDue(task, store.completions)).length;
  const topScore = Math.max(0, ...byPerson.map((person) => person.points));
  const leaders = topScore > 0 ? byPerson.filter((person) => person.points === topScore) : [];
  const leader = leaders.length === 1 ? leaders[0] : null;

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <h1>Statistik</h1>
        </div>
      </div>
      <div className="toolbar">
        {(
          [
            ["woche", "Diese Woche"],
            ["monat", "Dieser Monat"],
            ["jahr", "Dieses Jahr"]
          ] as [Range, string][]
        ).map(([value, label]) => (
          <button key={value} className={`filter-pill ${range === value ? "active" : ""}`} onClick={() => setRange(value)} data-testid={`button-range-${value}`}>
            {label}
          </button>
        ))}
      </div>
      {range === "woche" && store.weeklyPrize.trim() && (
        <section className="card card-pad" style={{ marginBottom: 18 }}>
          <div className="section-head">
            <div>
              <div className="section-label">Preis der Woche</div>
              <h2 style={{ marginTop: 5 }}>{store.weeklyPrize}</h2>
            </div>
            {openTaskCount === 0 ? <PartyPopper size={20} color="hsl(var(--primary))" /> : <Trophy size={20} color="hsl(var(--muted-foreground))" />}
          </div>
          {openTaskCount === 0 ? (
            <p className="stat-note">🎉 Alle Wochenaufgaben sind erledigt – der Preis ist verdient!</p>
          ) : (
            <p className="stat-note">
              Noch {openTaskCount} {openTaskCount === 1 ? "Wochenaufgabe" : "Wochenaufgaben"} offen, bis der Preis sicher ist.
            </p>
          )}
          {leader && <p className="stat-note" style={{ marginTop: 6 }}>🏆 Extra für {leader.name} – aktuell die meisten Punkte diese Woche.</p>}
        </section>
      )}
      <div className="grid grid-three">
        <div className="card stat-tile">
          <div className="section-label">Erledigt</div>
          <div className="stat-value">{completions.length}</div>
          <div className="stat-note">Aufgaben in diesem Zeitraum</div>
        </div>
        <div className="card stat-tile">
          <div className="section-label">Gemeinsame Punkte</div>
          <div className="stat-value">{points}</div>
          <div className="stat-note">Für sichtbare kleine Schritte</div>
        </div>
        <div className="card stat-tile">
          <div className="section-label">Kategorien</div>
          <div className="stat-value">{byCategory.length}</div>
          <div className="stat-note">Bereiche, in denen ihr wirkt</div>
        </div>
      </div>
      <div className="grid grid-two" style={{ marginTop: 18 }}>
        <section className="card card-pad">
          <div className="section-head">
            <div>
              <div className="section-label">Verlauf</div>
              <h2 style={{ marginTop: 5 }}>Euer Rhythmus</h2>
            </div>
            <BarChart3 size={18} />
          </div>
          <div className="bar-chart">
            {dayCounts.map((day) => (
              <div className="bar-col" key={day.label}>
                <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{day.count || ""}</span>
                <div className="bar" style={{ height: `${Math.max(5, (day.count / max) * 115)}px` }} />
                <span className="bar-label">{day.label}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card card-pad">
          <div className="section-head">
            <div>
              <div className="section-label">Gemeinsam getragen</div>
              <h2 style={{ marginTop: 5 }}>Nach Person</h2>
            </div>
            <Users size={18} />
          </div>
          <div className="settings-list">
            {byPerson.map((person) => (
              <div className="settings-item" key={person.id}>
                <div className="person-edit">
                  <span className="avatar" style={{ background: person.color }}>
                    {person.initial}
                  </span>
                  <div>
                    <strong>
                      {person.name}
                      {range === "woche" && leader?.id === person.id ? " 🏆" : ""}
                    </strong>
                    <div className="stat-note">{person.count} Abschlüsse</div>
                  </div>
                </div>
                <strong style={{ color: "hsl(var(--primary))" }}>{person.points} P.</strong>
              </div>
            ))}
            {byPerson.length === 0 && <div className="empty">Noch keine Daten für diesen Zeitraum.</div>}
          </div>
        </section>
      </div>
      <section className="card card-pad" style={{ marginTop: 18 }}>
        <div className="section-head">
          <div>
            <div className="section-label">Wo es passiert</div>
            <h2 style={{ marginTop: 5 }}>Nach Kategorie</h2>
          </div>
          <Tag size={18} />
        </div>
        <div className="grid grid-three">
          {byCategory.map((cat) => (
            <div key={cat.id} style={{ padding: 15, borderRadius: 15, background: "hsl(var(--background))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                <CategoryIcon name={cat.icon} />
                {cat.name}
              </div>
              <div className="stat-note" style={{ marginTop: 10 }}>
                {cat.count} Abschlüsse
              </div>
            </div>
          ))}
          {byCategory.length === 0 && <div className="empty">Noch keine Kategorien in diesem Zeitraum.</div>}
        </div>
      </section>
    </div>
  );
}
