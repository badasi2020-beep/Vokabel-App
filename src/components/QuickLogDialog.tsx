import { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useStore } from "../store/store";
import type { Task } from "../types";

export function QuickLogDialog({
  open,
  onClose,
  onPick
}: {
  open: boolean;
  onClose: () => void;
  onPick: (task: Task) => void;
}) {
  const { data } = useStore();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.tasks.filter((t) => !t.archived && (!q || t.name.toLowerCase().includes(q)));
  }, [data.tasks, query]);

  return (
    <Modal open={open} onClose={onClose} title="Aktivität eintragen">
      <div className="space-y-3">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Aufgabe suchen …"
          className="w-full rounded-xl border border-cream-deep px-3 py-2 bg-white"
        />
        <div className="max-h-64 overflow-y-auto space-y-1">
          {filtered.map((task) => {
            const category = data.categories.find((c) => c.id === task.categoryId);
            return (
              <button
                key={task.id}
                onClick={() => onPick(task)}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-cream-deep flex items-center justify-between"
              >
                <span>{task.name}</span>
                <span className="text-xs text-forest-soft">{category?.icon}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-forest-soft px-1 py-2">Keine Aufgabe gefunden.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
