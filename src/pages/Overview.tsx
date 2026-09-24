import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ChevronRight, Plus, X } from "lucide-react";
import { TaskCard } from "../components/TaskCard";
import { CompletePersonDialog } from "../components/CompletePersonDialog";
import { isDue, visibleForPerson } from "../lib/utils";
import { buildCompletion } from "../lib/completion";
import { COMMUNITY_ID, makeId } from "../store";
import type { Store, Task } from "../types";

export function Overview({
  store,
  update,
  notify
}: {
  store: Store;
  update: (patch: Partial<Store>) => void;
  notify: (text: string) => void;
}) {
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState({ name: "", points: "1" });
  const [running, setRunning] = useState<{ id: string; started: number } | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const isCommunity = store.activePersonId === COMMUNITY_ID;
  const active = store.people.find((person) => person.id === store.activePersonId);

  const nonAlltag = store.tasks.filter((task) => task.taskKind !== "alltag");
  const visibleTasks = isCommunity ? nonAlltag : nonAlltag.filter((task) => visibleForPerson(task, active!.id));
  const dueTasks = visibleTasks.filter((task) => isDue(task, store.completions));

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekCompletions = store.completions.filter((item) => new Date(item.completedAt) >= weekStart);
  const weekPoints =
    weekCompletions.reduce((sum, item) => sum + (item.pointsSnapshot || 0), 0) +
    store.activities.filter((item) => new Date(item.createdAt) >= weekStart).reduce((sum, item) => sum + item.points, 0);

  const complete = (task: Task, personId: string, seconds?: number) => {
    const person = store.people.find((item) => item.id === personId);
    if (!person) return;
    const category = store.categories.find((item) => item.id === task.categoryId);
    const { completion, clearTempAssignment } = buildCompletion(task, person, category, seconds);
    const tasks = clearTempAssignment
      ? store.tasks.map((item) => (item.id === task.id ? { ...item, tempAssignedPersonId: null } : item))
      : store.tasks;
    update({ completions: [completion, ...store.completions], tasks });
    setRunning(null);
    setCompletingTask(null);
    notify(completion.takeoverFromPersonId ? `${task.name} übernommen. Danke, ${person.name}.` : `${task.name} ist erledigt. Danke, ${person.name}.`);
  };

  const submitActivity = (event: FormEvent) => {
    event.preventDefault();
    if (!activity.name.trim() || !active) return;
    update({
      activities: [
        {
          id: makeId("activity"),
          name: activity.name,
          points: Number(activity.points) || 1,
          personId: active.id,
          categoryId: "c3",
          createdAt: new Date().toISOString()
        },
        ...store.activities
      ]
    });
    setActivity({ name: "", points: "1" });
    setActivityOpen(false);
    notify("Aktivität gespeichert.");
  };

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">{new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1>{isCommunity ? "Eure Woche." : `Hallo, ${active?.name}.`}</h1>
        </div>
        {!isCommunity && (
          <button className="btn btn-primary" onClick={() => setActivityOpen(true)} data-testid="button-log-activity">
            <Plus size={16} />
            Aktivität eintragen
          </button>
        )}
      </div>

      <section className="card summary-strip" style={{ marginBottom: 18 }}>
        <div className="summary-figures">
          <span className="summary-figure">
            <strong>{dueTasks.length}</strong>
            <span>offene Aufgaben</span>
          </span>
          <span className="summary-figure">
            <strong>{weekCompletions.length}</strong>
            <span>diese Woche erledigt</span>
          </span>
          <span className="summary-figure">
            <strong>{weekPoints}</strong>
            <span>Punkte diese Woche</span>
          </span>
        </div>
      </section>

      <section className="card card-pad">
        <div className="section-head">
          <h2>{isCommunity ? "Alle Aufgaben" : "Was ansteht"}</h2>
          <Link href="/aufgaben" className="btn btn-ghost" data-testid="link-all-tasks">
            Alle Aufgaben <ChevronRight size={15} />
          </Link>
        </div>
        <div className="task-list">
          {dueTasks.length ? (
            dueTasks
              .slice(0, 6)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  category={store.categories.find((cat) => cat.id === task.categoryId)}
                  people={isCommunity ? store.people : undefined}
                  onComplete={(item) => active && complete(item, active.id)}
                  onRequestComplete={isCommunity ? (item) => setCompletingTask(item) : undefined}
                  running={running?.id === task.id ? running.started : null}
                  onStart={(item) => {
                    if (running?.id === item.id && active) {
                      complete(item, active.id, Math.round((Date.now() - running.started) / 1000));
                    } else {
                      setRunning({ id: item.id, started: Date.now() });
                    }
                  }}
                />
              ))
          ) : (
            <div className="empty">
              <strong>Gerade nichts Fälliges.</strong>
            </div>
          )}
        </div>
      </section>

      {completingTask && (
        <CompletePersonDialog
          task={completingTask}
          people={store.people}
          onClose={() => setCompletingTask(null)}
          onChoose={(personId) => complete(completingTask, personId)}
        />
      )}

      {activityOpen && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submitActivity}>
            <div className="modal-head">
              <div>
                <div className="eyebrow">Schnell notiert</div>
                <h2 style={{ marginTop: 6 }}>Aktivität eintragen</h2>
              </div>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setActivityOpen(false)} data-testid="button-close-activity">
                <X size={18} />
              </button>
            </div>
            <div className="form-grid">
              <div className="field full">
                <label htmlFor="activity-name">Was habt ihr gemacht?</label>
                <input
                  id="activity-name"
                  className="input"
                  value={activity.name}
                  onChange={(event) => setActivity({ ...activity, name: event.target.value })}
                  placeholder="Zum Beispiel: Paket zur Post gebracht"
                  data-testid="input-activity-name"
                />
              </div>
              <div className="field">
                <label htmlFor="activity-points">Punkte</label>
                <input
                  id="activity-points"
                  type="number"
                  min="1"
                  className="input"
                  value={activity.points}
                  onChange={(event) => setActivity({ ...activity, points: event.target.value })}
                  data-testid="input-activity-points"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setActivityOpen(false)} data-testid="button-cancel-activity">
                Abbrechen
              </button>
              <button className="btn btn-primary" data-testid="button-save-activity">
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
