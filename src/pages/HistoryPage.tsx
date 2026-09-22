import { useState } from "react";
import { BookOpen } from "lucide-react";
import { dateTime } from "../lib/utils";
import type { Store } from "../types";

export function HistoryPage({ store }: { store: Store }) {
  const [tab, setTab] = useState<"abschlüsse" | "änderungen">("abschlüsse");
  const entries = [...store.completions].sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Was schon geschafft ist</div>
          <h1>Historie</h1>
          <p className="subtitle">Ein ruhiger Rückblick auf eure Beiträge und die Entwicklung eures Zuhauses.</p>
        </div>
      </div>
      <div className="toolbar">
        <button className={`filter-pill ${tab === "abschlüsse" ? "active" : ""}`} onClick={() => setTab("abschlüsse")} data-testid="button-history-completions">
          Abschlüsse
        </button>
        <button className={`filter-pill ${tab === "änderungen" ? "active" : ""}`} onClick={() => setTab("änderungen")} data-testid="button-history-changes">
          Aufgabenänderungen
        </button>
      </div>
      <section className="card card-pad">
        {tab === "abschlüsse" ? (
          entries.length ? (
            <div className="timeline">
              {entries.map((entry) => (
                <div className="timeline-item" key={entry.id} data-testid={`history-completion-${entry.id}`}>
                  <div className="timeline-title">{entry.taskNameSnapshot}</div>
                  <div className="timeline-meta">
                    {entry.personNameSnapshot} · {entry.categoryNameSnapshot} · {dateTime(entry.completedAt)}
                    {entry.pointsSnapshot ? ` · +${entry.pointsSnapshot} Punkte` : ""}
                    {entry.durationSeconds ? ` · ${Math.floor(entry.durationSeconds / 60)}:${String(entry.durationSeconds % 60).padStart(2, "0")} Min.` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="empty-icon">
                <BookOpen size={21} />
              </div>
              <strong>Noch keine Abschlüsse.</strong>
              <p style={{ marginTop: 6 }}>Erledigte Aufgaben bleiben hier dauerhaft sichtbar.</p>
            </div>
          )
        ) : store.changes.length ? (
          <div className="timeline">
            {store.changes.map((change) => (
              <div className="timeline-item" key={change.id} data-testid={`history-change-${change.id}`}>
                <div className="timeline-title">{change.taskName}</div>
                <div className="timeline-meta">
                  {change.personName} · {dateTime(change.changedAt)}
                </div>
                <div className="tag" style={{ marginTop: 8 }}>
                  {change.before} → {change.after}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <strong>Noch keine Änderungen.</strong>
            <p style={{ marginTop: 6 }}>Wenn ihr Aufgaben anpasst, erscheint die Spur hier.</p>
          </div>
        )}
      </section>
    </div>
  );
}
