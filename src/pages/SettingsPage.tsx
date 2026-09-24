import { useState, type FormEvent } from "react";
import { Pencil, Plus, Tag, Trash2, Users } from "lucide-react";
import { CategoryIcon } from "../components/CategoryIcon";
import { TaskModal } from "../components/TaskModal";
import { makeId } from "../store";
import type { Store, Task } from "../types";

const icons = ["Home", "CalendarDays", "Utensils", "Leaf", "Tag"];

export function SettingsPage({
  store,
  update,
  notify
}: {
  store: Store;
  update: (patch: Partial<Store>) => void;
  notify: (text: string) => void;
}) {
  const [newCat, setNewCat] = useState({ name: "", icon: "Tag" });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskModal, setTaskModal] = useState(false);
  const active = store.people.find((person) => person.id === store.activePersonId) || store.people[0];

  const updatePerson = (person: Store["people"][number], name: string) =>
    update({
      people: store.people.map((item) => (item.id === person.id ? { ...item, name, initial: name.charAt(0).toUpperCase() || person.initial } : item))
    });

  const updatePersonPrize = (person: Store["people"][number], prize: string) =>
    update({
      people: store.people.map((item) => (item.id === person.id ? { ...item, prize } : item))
    });

  const addCategory = (event: FormEvent) => {
    event.preventDefault();
    if (!newCat.name.trim()) return;
    update({ categories: [...store.categories, { id: makeId("category"), name: newCat.name.trim(), icon: newCat.icon }] });
    setNewCat({ name: "", icon: "Tag" });
    notify("Kategorie hinzugefügt.");
  };

  const deleteCategory = (id: string) => {
    if (store.tasks.some((task) => task.categoryId === id)) {
      notify("Diese Kategorie wird noch von Aufgaben verwendet.");
      return;
    }
    update({ categories: store.categories.filter((cat) => cat.id !== id) });
  };

  const deleteTask = (task: Task) => {
    update({ tasks: store.tasks.filter((item) => item.id !== task.id) });
    notify("Aufgabe entfernt.");
  };

  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">Euer gemeinsamer Raum</div>
          <h1>Einstellungen</h1>
          <p className="subtitle">Macht Hausblick zu eurem Ort – mit euren Namen, euren Bereichen und eurem Rhythmus.</p>
        </div>
      </div>

      <section className="card settings-section">
        <div className="section-head">
          <div>
            <div className="section-label">Wer hier lebt</div>
            <h2 style={{ marginTop: 5 }}>Eure Personen</h2>
          </div>
          <Users size={18} />
        </div>
        <div className="settings-list">
          {store.people.map((person) => {
            const others = store.people.filter((p) => p.id !== person.id);
            const othersLabel = others.length === 1 ? others[0].name : "die andere Person";
            return (
              <div className="settings-item" key={person.id} style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div className="person-edit">
                    <span className="avatar" style={{ background: person.color }}>
                      {person.initial}
                    </span>
                    <input
                      className="input"
                      value={person.name}
                      onChange={(event) => updatePerson(person, event.target.value)}
                      onBlur={() => notify("Name gespeichert.")}
                      data-testid={`input-person-${person.id}`}
                    />
                  </div>
                  <span className="tag">{person.id === active.id ? "aktiv" : "Person"}</span>
                </div>
                <div className="field" style={{ paddingLeft: 41 }}>
                  <label htmlFor={`prize-${person.id}`}>Preis für {person.name} (von {othersLabel} eingetragen)</label>
                  <input
                    id={`prize-${person.id}`}
                    className="input"
                    value={person.prize ?? ""}
                    onChange={(event) => updatePersonPrize(person, event.target.value)}
                    onBlur={() => notify("Preis gespeichert.")}
                    placeholder="z. B. Frühstück ans Bett"
                    data-testid={`input-prize-${person.id}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="stat-note" style={{ marginTop: 12 }}>
          Wird auf der Statistik-Seite unter „Diese Woche" gezeigt, sobald keine Wochenaufgabe mehr offen ist und die
          Person mit den meisten Punkten feststeht.
        </p>
      </section>

      <section className="card settings-section">
        <div className="section-head">
          <div>
            <div className="section-label">Ordnung, die zu euch passt</div>
            <h2 style={{ marginTop: 5 }}>Kategorien</h2>
          </div>
          <Tag size={18} />
        </div>
        <div className="settings-list">
          {store.categories.map((cat) => (
            <div className="settings-item" key={cat.id}>
              <div className="person-edit">
                <span className="icon-btn" style={{ background: "hsl(var(--secondary))", color: "hsl(var(--secondary-foreground))" }}>
                  <CategoryIcon name={cat.icon} />
                </span>
                <strong>{cat.name}</strong>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => deleteCategory(cat.id)} data-testid={`button-delete-category-${cat.id}`}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={addCategory} style={{ display: "flex", gap: 9, marginTop: 17, flexWrap: "wrap" }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 180 }}
            value={newCat.name}
            onChange={(event) => setNewCat({ ...newCat, name: event.target.value })}
            placeholder="Neue Kategorie"
            data-testid="input-new-category"
          />
          <div className="icon-choice">
            {icons.map((icon) => (
              <button
                type="button"
                className={`icon-btn ${newCat.icon === icon ? "active" : ""}`}
                key={icon}
                onClick={() => setNewCat({ ...newCat, icon })}
                data-testid={`button-category-icon-${icon}`}
              >
                <CategoryIcon name={icon} size={15} />
              </button>
            ))}
          </div>
          <button className="btn btn-soft" data-testid="button-add-category">
            <Plus size={15} />
            Hinzufügen
          </button>
        </form>
      </section>

      <section className="card settings-section">
        <div className="section-head">
          <div>
            <div className="section-label">Eure wiederkehrenden Dinge</div>
            <h2 style={{ marginTop: 5 }}>Aufgaben verwalten</h2>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTask(null);
              setTaskModal(true);
            }}
            data-testid="button-settings-new-task"
          >
            <Plus size={15} />
            Neue Aufgabe
          </button>
        </div>
        <div className="settings-list">
          {store.tasks.map((task) => (
            <div className="settings-item" key={task.id}>
              <div>
                <strong>{task.name}</strong>
                <div className="stat-note">
                  {store.categories.find((cat) => cat.id === task.categoryId)?.name} · {task.points === null ? "ohne Punkte" : `${task.points} Punkte`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 3 }}>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => {
                    setEditingTask(task);
                    setTaskModal(true);
                  }}
                  data-testid={`button-settings-edit-${task.id}`}
                >
                  <Pencil size={16} />
                </button>
                <button className="btn btn-ghost btn-icon" onClick={() => deleteTask(task)} data-testid={`button-settings-delete-${task.id}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {taskModal && (
        <TaskModal
          task={editingTask || undefined}
          categories={store.categories}
          onClose={() => setTaskModal(false)}
          onSave={(data) => {
            const now = new Date().toISOString();
            if (editingTask) {
              const next = { ...editingTask, ...data, updatedAt: now };
              update({
                tasks: store.tasks.map((task) => (task.id === editingTask.id ? next : task)),
                changes: [
                  {
                    id: makeId("change"),
                    taskId: editingTask.id,
                    taskName: next.name,
                    changedAt: now,
                    personId: active.id,
                    personName: active.name,
                    before: editingTask.name,
                    after: next.name
                  },
                  ...store.changes
                ]
              });
            } else {
              update({ tasks: [...store.tasks, { ...data, id: makeId("task"), createdAt: now, updatedAt: now }] });
            }
            setTaskModal(false);
            notify("Aufgabe gespeichert.");
          }}
        />
      )}
    </div>
  );
}
