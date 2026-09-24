import { useEffect, useMemo, useState } from "react";
import { Archive, ArrowLeft, ChevronRight, Filter, Plus } from "lucide-react";
import { CategoryIcon } from "../components/CategoryIcon";
import { TaskCard } from "../components/TaskCard";
import { TaskModal } from "../components/TaskModal";
import { AssignTaskDialog } from "../components/AssignTaskDialog";
import { CompletePersonDialog } from "../components/CompletePersonDialog";
import { isDue } from "../lib/utils";
import { buildCompletion } from "../lib/completion";
import { COMMUNITY_ID, makeId } from "../store";
import type { Store, Task } from "../types";

type TaskFilter = "alle" | "offen" | "erledigt";

export function TasksPage({
  store,
  update,
  notify
}: {
  store: Store;
  update: (patch: Partial<Store>) => void;
  notify: (text: string) => void;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [modal, setModal] = useState<Task | "new" | null>(null);
  const [assigning, setAssigning] = useState<Task | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskFilter>("alle");
  const isCommunity = store.activePersonId === COMMUNITY_ID;
  const active = store.people.find((person) => person.id === store.activePersonId);
  const [running, setRunning] = useState<{ id: string; started: number } | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!running) return undefined;
    const interval = window.setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const categoryStats = useMemo(
    () =>
      store.categories.map((category) => {
        const tasks = store.tasks.filter((task) => task.categoryId === category.id);
        const open = tasks.filter((task) => isDue(task, store.completions)).length;
        return { category, total: tasks.length, open };
      }),
    [store.categories, store.tasks, store.completions]
  );

  const selectedCategory = store.categories.find((cat) => cat.id === selectedCategoryId) || null;

  const visible = store.tasks.filter((task) => {
    if (selectedCategoryId && task.categoryId !== selectedCategoryId) return false;
    const matchesSearch = task.name.toLowerCase().includes(search.toLowerCase());
    const due = isDue(task, store.completions);
    return matchesSearch && (filter === "alle" || (filter === "offen" && due) || (filter === "erledigt" && !due));
  });

  const openCategoryDetail = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSearch("");
    setFilter("alle");
  };

  const save = (data: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const changePersonId = active?.id ?? COMMUNITY_ID;
    const changePersonName = active?.name ?? "Gemeinschaft";
    if (modal && modal !== "new") {
      const next = { ...modal, ...data, updatedAt: now };
      update({
        tasks: store.tasks.map((task) => (task.id === modal.id ? next : task)),
        changes: [
          { id: makeId("change"), taskId: modal.id, taskName: next.name, changedAt: now, personId: changePersonId, personName: changePersonName, before: modal.name, after: next.name },
          ...store.changes
        ]
      });
      notify("Aufgabe aktualisiert.");
    } else {
      update({ tasks: [...store.tasks, { ...data, id: makeId("task"), createdAt: now, updatedAt: now }] });
      notify("Aufgabe angelegt.");
    }
    setModal(null);
  };

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
    notify(completion.takeoverFromPersonId ? `${task.name} übernommen.` : "Erledigt.");
  };

  const assign = (personId: string | null, temporary: boolean) => {
    if (!assigning) return;
    const patch = temporary ? { tempAssignedPersonId: personId } : { assignedPersonId: personId, tempAssignedPersonId: null };
    update({ tasks: store.tasks.map((task) => (task.id === assigning.id ? { ...task, ...patch } : task)) });
    setAssigning(null);
    notify(personId ? "Zuweisung gespeichert." : "Zuweisung entfernt.");
  };

  if (!selectedCategory) {
    return (
      <div className="content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">Euer Alltag, sortiert</div>
            <h1>Aufgaben</h1>
            <p className="subtitle">Wählt einen Bereich, um die dazugehörigen Aufgaben zu sehen.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModal("new")} data-testid="button-new-task">
            <Plus size={16} />
            Neue Aufgabe
          </button>
        </div>
        <section className="card card-pad">
          <div className="task-list">
            {categoryStats.map(({ category, total, open }) => (
              <button
                key={category.id}
                className="task-row category-row"
                onClick={() => openCategoryDetail(category.id)}
                data-testid={`button-category-${category.id}`}
              >
                <span className="icon-btn" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))" }}>
                  <CategoryIcon name={category.icon} />
                </span>
                <div className="task-main">
                  <div className="task-name">{category.name}</div>
                  <div className="task-detail">
                    {total} {total === 1 ? "Aufgabe" : "Aufgaben"}
                    {open > 0 ? ` · ${open} offen` : ""}
                  </div>
                </div>
                <ChevronRight size={18} color="hsl(var(--muted-foreground))" />
              </button>
            ))}
            {categoryStats.length === 0 && (
              <div className="empty">
                <strong>Noch keine Kategorien.</strong>
                <p style={{ marginTop: 6 }}>Lege welche in den Einstellungen an.</p>
              </div>
            )}
          </div>
        </section>
        {modal && (
          <TaskModal task={modal === "new" ? undefined : modal} categories={store.categories} onClose={() => setModal(null)} onSave={save} />
        )}
      </div>
    );
  }

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <button className="btn btn-ghost" onClick={() => setSelectedCategoryId(null)} data-testid="button-back-to-categories" style={{ paddingLeft: 0, marginBottom: 8 }}>
            <ArrowLeft size={15} />
            Alle Kategorien
          </button>
          <div className="eyebrow">Kategorie</div>
          <h1>{selectedCategory.name}</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("new")} data-testid="button-new-task-in-category">
          <Plus size={16} />
          Neue Aufgabe
        </button>
      </div>
      <div className="toolbar">
        <input
          className="input search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Aufgaben durchsuchen"
          data-testid="input-search-tasks"
        />
        <Filter size={16} color="hsl(var(--muted-foreground))" />
        {(["alle", "offen", "erledigt"] as TaskFilter[]).map((value) => (
          <button
            key={value}
            className={`filter-pill ${filter === value ? "active" : ""}`}
            onClick={() => setFilter(value)}
            data-testid={`button-filter-${value}`}
          >
            {value === "alle" ? "Alle" : value === "offen" ? "Offen" : "Erledigt"}
          </button>
        ))}
      </div>
      <section className="card card-pad">
        <div className="section-head">
          <h2>{filter === "erledigt" ? "Erledigte Aufgaben" : filter === "offen" ? "Was ansteht" : selectedCategory.name}</h2>
          <span className="tag">{visible.length} Einträge</span>
        </div>
        <div className="task-list">
          {visible.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              category={store.categories.find((cat) => cat.id === task.categoryId)}
              people={store.people}
              showKind
              due={isDue(task, store.completions)}
              onComplete={(item) => active && complete(item, active.id)}
              onRequestComplete={isCommunity ? (item) => setCompletingTask(item) : undefined}
              onEdit={(item) => setModal(item)}
              onAssign={(item) => setAssigning(item)}
              running={running?.id === task.id ? running.started : null}
              onStart={(item) => {
                if (running?.id === item.id && running && active) complete(item, active.id, Math.round((Date.now() - running.started) / 1000));
                else setRunning({ id: item.id, started: Date.now() });
              }}
            />
          ))}
          {visible.length === 0 && (
            <div className="empty">
              <div className="empty-icon">
                <Archive size={21} />
              </div>
              <strong>Nichts gefunden.</strong>
              <p style={{ marginTop: 6 }}>Versucht einen anderen Filter oder legt eine neue Aufgabe an.</p>
            </div>
          )}
        </div>
      </section>
      {modal && (
        <TaskModal
          task={modal === "new" ? undefined : modal}
          categories={store.categories}
          defaultCategoryId={selectedCategory.id}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
      {assigning && <AssignTaskDialog task={assigning} people={store.people} onClose={() => setAssigning(null)} onAssign={assign} />}
      {completingTask && (
        <CompletePersonDialog
          task={completingTask}
          people={store.people}
          onClose={() => setCompletingTask(null)}
          onChoose={(personId) => complete(completingTask, personId)}
        />
      )}
    </div>
  );
}
