import { useMemo, useState } from "react";
import { useStore } from "../store/store";
import { TaskRow } from "../components/TaskRow";
import { NewTaskDialog } from "../components/NewTaskDialog";
import { CompleteTaskDialog } from "../components/CompleteTaskDialog";
import { TaskEditDialog } from "../components/TaskEditDialog";
import type { Task } from "../types";

export function Tasks() {
  const { data } = useStore();
  const [newOpen, setNewOpen] = useState(false);
  const [completing, setCompleting] = useState<Task | null>(null);
  const [editing, setEditing] = useState<Task | null>(null);

  const activeTasks = useMemo(() => data.tasks.filter((t) => !t.archived), [data.tasks]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Task[]>();
    for (const task of activeTasks) {
      const key = task.categoryId ?? "none";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    }
    return groups;
  }, [activeTasks]);

  const categoryOrder = [...data.categories.map((c) => c.id), "none"];

  return (
    <div className="pt-2 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-forest">Aufgaben</h1>
        <button
          onClick={() => setNewOpen(true)}
          className="px-4 py-2 rounded-pill bg-forest text-cream-soft text-sm font-medium"
        >
          + Neue Aufgabe
        </button>
      </div>

      {activeTasks.length === 0 && (
        <p className="text-forest-soft text-sm">Noch keine Aufgaben angelegt.</p>
      )}

      {categoryOrder.map((catId) => {
        const tasks = grouped.get(catId);
        if (!tasks || tasks.length === 0) return null;
        const category = data.categories.find((c) => c.id === catId);
        return (
          <section key={catId} className="space-y-2">
            <h2 className="text-sm font-semibold text-forest-soft uppercase tracking-wide">
              {category ? `${category.icon} ${category.name}` : "Ohne Kategorie"}
            </h2>
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={setCompleting}
                  onInfo={setEditing}
                />
              ))}
            </div>
          </section>
        );
      })}

      <NewTaskDialog open={newOpen} onClose={() => setNewOpen(false)} />
      <CompleteTaskDialog task={completing} onClose={() => setCompleting(null)} />
      <TaskEditDialog task={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
