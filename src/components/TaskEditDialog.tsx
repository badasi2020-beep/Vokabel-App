import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { ConfirmDialog } from "./ConfirmDialog";
import { useStore } from "../store/store";
import type { Recurrence, RecurrenceUnit, Task } from "../types";
import { lastCompletedAt, recurrenceLabel } from "../lib/recurrence";

const recurrencePresets: { label: string; value: Recurrence | null }[] = [
  { label: "Einmalig / Ad-hoc", value: null },
  { label: "Täglich", value: { unit: "day", interval: 1 } },
  { label: "Alle 2 Tage", value: { unit: "day", interval: 2 } },
  { label: "Wöchentlich", value: { unit: "week", interval: 1 } },
  { label: "Alle 2 Wochen", value: { unit: "week", interval: 2 } },
  { label: "Monatlich", value: { unit: "month", interval: 1 } },
  { label: "Alle 3 Monate", value: { unit: "month", interval: 3 } },
  { label: "Jährlich", value: { unit: "year", interval: 1 } }
];

function presetKey(r: Recurrence | null | undefined): string {
  if (!r) return "none";
  return `${r.unit}:${r.interval}`;
}

export function TaskEditDialog({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { data, updateTask, deleteTask } = useStore();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [pointsInput, setPointsInput] = useState("");
  const [recurrenceKey, setRecurrenceKey] = useState("none");
  const [customInterval, setCustomInterval] = useState(1);
  const [customUnit, setCustomUnit] = useState<RecurrenceUnit>("day");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!task) return;
    setName(task.name);
    setCategoryId(task.categoryId);
    setDescription(task.description ?? "");
    setPointsInput(typeof task.points === "number" ? String(task.points) : "");
    const isPreset = recurrencePresets.some((p) => presetKey(p.value) === presetKey(task.recurrence));
    if (task.recurrence && !isPreset) {
      setRecurrenceKey("custom");
      setCustomInterval(task.recurrence.interval);
      setCustomUnit(task.recurrence.unit);
    } else {
      setRecurrenceKey(presetKey(task.recurrence));
    }
  }, [task]);

  if (!task) return null;

  const lastDone = lastCompletedAt(task.id, data.history);

  const handleSave = () => {
    let recurrence: Recurrence | null = null;
    if (recurrenceKey === "custom") {
      recurrence = { unit: customUnit, interval: Math.max(1, customInterval) };
    } else {
      const preset = recurrencePresets.find((p) => presetKey(p.value) === recurrenceKey);
      recurrence = preset ? preset.value : null;
    }
    const trimmedPoints = pointsInput.trim();
    updateTask(task.id, {
      name: name.trim() || task.name,
      categoryId,
      description,
      points: trimmedPoints === "" ? undefined : Number(trimmedPoints),
      recurrence
    });
    onClose();
  };

  return (
    <>
      <Modal open={!!task} onClose={onClose} title="Aufgabe bearbeiten">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-forest-light">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-deep px-3 py-2 bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-forest-light">Kategorie</label>
            <select
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="mt-1 w-full rounded-xl border border-cream-deep px-3 py-2 bg-white"
            >
              <option value="">Ohne Kategorie</option>
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-forest-light">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-cream-deep px-3 py-2 bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-forest-light">
              Punkte (leer lassen = keine Punkte)
            </label>
            <input
              type="number"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              placeholder="z.B. 5 oder -2"
              className="mt-1 w-full rounded-xl border border-cream-deep px-3 py-2 bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-forest-light">Wiederholung</label>
            <select
              value={recurrenceKey}
              onChange={(e) => setRecurrenceKey(e.target.value)}
              className="mt-1 w-full rounded-xl border border-cream-deep px-3 py-2 bg-white"
            >
              {recurrencePresets.map((p) => (
                <option key={presetKey(p.value)} value={presetKey(p.value)}>
                  {p.label}
                </option>
              ))}
              <option value="custom">Eigenes Intervall …</option>
            </select>
            {recurrenceKey === "custom" && (
              <div className="mt-2 flex gap-2 items-center">
                <span className="text-sm">Alle</span>
                <input
                  type="number"
                  min={1}
                  value={customInterval}
                  onChange={(e) => setCustomInterval(Number(e.target.value))}
                  className="w-16 rounded-xl border border-cream-deep px-2 py-1 bg-white"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as RecurrenceUnit)}
                  className="rounded-xl border border-cream-deep px-2 py-1 bg-white"
                >
                  <option value="day">Tage</option>
                  <option value="week">Wochen</option>
                  <option value="month">Monate</option>
                  <option value="year">Jahre</option>
                </select>
              </div>
            )}
            <p className="text-xs text-forest-soft mt-1">
              Aktuell: {recurrenceLabel(task.recurrence)}
            </p>
          </div>

          <p className="text-sm text-forest-soft">
            Zuletzt erledigt:{" "}
            {lastDone ? lastDone.toLocaleString("de-DE") : "noch nie"}
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 rounded-pill border border-clay text-clay font-medium"
            >
              Löschen
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 rounded-pill bg-forest text-cream-soft font-medium"
            >
              Speichern
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Aufgabe löschen?"
        message={`„${task.name}“ wird entfernt. Bereits eingetragene Historie bleibt erhalten.`}
        confirmLabel="Löschen"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteTask(task.id);
          setConfirmDelete(false);
          onClose();
        }}
      />
    </>
  );
}
