import { useMemo, useState } from "react";
import { useStore } from "../store/store";
import { TaskRow } from "../components/TaskRow";
import { CompleteTaskDialog } from "../components/CompleteTaskDialog";
import { TaskEditDialog } from "../components/TaskEditDialog";
import { QuickLogDialog } from "../components/QuickLogDialog";
import { isDue, startOfWeek } from "../lib/recurrence";
import type { Task } from "../types";

const weekdayFormatter = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "numeric", month: "long" });

export function Home() {
  const { data, setWeeklyMoment } = useStore();
  const [completing, setCompleting] = useState<Task | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [momentDraft, setMomentDraft] = useState(data.weeklyMoment ?? "");
  const [editingMoment, setEditingMoment] = useState(false);

  const activePerson = data.people.find((p) => p.id === data.activePersonId);

  const dueTasks = useMemo(
    () => data.tasks.filter((t) => !t.archived && t.recurrence && isDue(t, data.history)),
    [data.tasks, data.history]
  );

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const doneThisWeek = useMemo(
    () => data.history.filter((h) => new Date(h.completedAt) >= weekStart),
    [data.history, weekStart]
  );
  const pointsThisWeek = doneThisWeek.reduce((sum, h) => sum + (h.points ?? 0), 0);

  return (
    <div className="pt-2 space-y-6">
      <div>
        <p className="text-sm text-forest-soft">{weekdayFormatter.format(new Date())}</p>
        <h1 className="font-serif text-2xl text-forest mt-1">
          Hallo{activePerson ? `, ${activePerson.name}` : ""}.
        </h1>
      </div>

      <div className="bg-cream-soft rounded-card shadow-card p-4 flex items-center justify-between">
        <div>
          <p className="font-serif text-lg text-forest">
            {dueTasks.length} offene regelmäßige {dueTasks.length === 1 ? "Aufgabe" : "Aufgaben"}
          </p>
          <p className="text-sm text-forest-soft mt-1">
            {doneThisWeek.length} diese Woche erledigt
            {pointsThisWeek !== 0 ? ` · ${pointsThisWeek > 0 ? "+" : ""}${pointsThisWeek} Punkte` : ""}
          </p>
        </div>
      </div>

      <button
        onClick={() => setQuickLogOpen(true)}
        className="w-full py-3.5 rounded-pill bg-forest text-cream-soft font-medium shadow-card"
      >
        + Aktivität eintragen
      </button>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-forest-soft uppercase tracking-wide">
          Fällige Aufgaben
        </h2>
        {dueTasks.length === 0 && (
          <p className="text-sm text-forest-soft">Gerade nichts Fälliges – gut gemacht.</p>
        )}
        <div className="space-y-2">
          {dueTasks.map((task) => (
            <TaskRow key={task.id} task={task} onComplete={setCompleting} onInfo={setEditing} />
          ))}
        </div>
      </section>

      <section className="bg-cream-soft rounded-card shadow-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-serif text-lg text-forest">Euer Wochenmoment</h2>
          {!editingMoment && (
            <button
              onClick={() => setEditingMoment(true)}
              className="text-sm text-forest-soft underline"
            >
              Bearbeiten
            </button>
          )}
        </div>
        {editingMoment ? (
          <div className="space-y-2">
            <textarea
              value={momentDraft}
              onChange={(e) => setMomentDraft(e.target.value)}
              rows={3}
              placeholder="Was war diese Woche ein schöner gemeinsamer Moment?"
              className="w-full rounded-xl border border-cream-deep px-3 py-2 bg-white"
            />
            <button
              onClick={() => {
                setWeeklyMoment(momentDraft);
                setEditingMoment(false);
              }}
              className="px-4 py-2 rounded-pill bg-forest text-cream-soft text-sm font-medium"
            >
              Speichern
            </button>
          </div>
        ) : (
          <p className="text-forest-light">
            {data.weeklyMoment?.trim() || "Noch kein Wochenmoment eingetragen."}
          </p>
        )}
      </section>

      <CompleteTaskDialog task={completing} onClose={() => setCompleting(null)} />
      <TaskEditDialog task={editing} onClose={() => setEditing(null)} />
      <QuickLogDialog
        open={quickLogOpen}
        onClose={() => setQuickLogOpen(false)}
        onPick={(task) => {
          setQuickLogOpen(false);
          setCompleting(task);
        }}
      />
    </div>
  );
}
