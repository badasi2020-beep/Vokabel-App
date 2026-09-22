import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { useStore } from "../store/store";
import type { Task } from "../types";

export function CompleteTaskDialog({
  task,
  onClose
}: {
  task: Task | null;
  onClose: () => void;
}) {
  const { data, completeTask } = useStore();
  const [personId, setPersonId] = useState(data.activePersonId);
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (task) {
      setPersonId(data.activePersonId);
      setSeconds(0);
      setTimerRunning(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  if (!task) return null;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const handleComplete = () => {
    completeTask({
      taskId: task.id,
      personId,
      durationSeconds: seconds > 0 ? seconds : undefined
    });
    onClose();
  };

  return (
    <Modal open={!!task} onClose={onClose} title={`„${task.name}“ erledigt`}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium text-forest-light mb-2">Wer hat es gemacht?</p>
          <div className="flex gap-2 flex-wrap">
            {data.people.map((person) => (
              <button
                key={person.id}
                onClick={() => setPersonId(person.id)}
                className={`px-4 py-2 rounded-pill text-sm font-medium border ${
                  personId === person.id
                    ? "bg-forest text-cream-soft border-forest"
                    : "border-cream-deep text-forest"
                }`}
              >
                {person.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-forest-light mb-2">
            Timer (optional, nur zur Dokumentation)
          </p>
          <div className="flex items-center gap-3">
            <span className="font-serif text-2xl tabular-nums">
              {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </span>
            <button
              onClick={() => setTimerRunning((r) => !r)}
              className="px-3 py-1.5 rounded-pill bg-cream-deep text-forest text-sm font-medium"
            >
              {timerRunning ? "Pause" : seconds > 0 ? "Weiter" : "Start"}
            </button>
            {seconds > 0 && (
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setSeconds(0);
                }}
                className="text-sm text-forest-soft underline"
              >
                Zurücksetzen
              </button>
            )}
          </div>
        </div>

        {typeof task.points === "number" ? (
          <p className="text-sm text-forest-soft">Punkte für diese Erledigung: {task.points}</p>
        ) : (
          <p className="text-sm text-forest-soft">Keine Punkte hinterlegt – wird ohne Punkte eingetragen.</p>
        )}

        <button
          onClick={handleComplete}
          className="w-full py-3 rounded-pill bg-forest text-cream-soft font-medium"
        >
          Als erledigt eintragen
        </button>
      </div>
    </Modal>
  );
}
