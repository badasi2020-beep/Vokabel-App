import { useState } from "react";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useStore } from "../store/store";

export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, renamePerson, addCategory, renameCategory, deleteCategory, resetAllData, exportData } =
    useStore();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const json = JSON.stringify(exportData(), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gemeinsam-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Einstellungen">
        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-forest-soft uppercase tracking-wide">Personen</h3>
            {data.people.map((person) => (
              <input
                key={person.id}
                value={person.name}
                onChange={(e) => renamePerson(person.id, e.target.value)}
                className="w-full rounded-xl border border-cream-deep px-3 py-2 bg-white"
              />
            ))}
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-forest-soft uppercase tracking-wide">Kategorien</h3>
            {data.categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2">
                <input
                  value={category.name}
                  onChange={(e) => renameCategory(category.id, e.target.value)}
                  className="flex-1 rounded-xl border border-cream-deep px-3 py-2 bg-white"
                />
                <button
                  onClick={() => deleteCategory(category.id)}
                  aria-label={`${category.name} löschen`}
                  className="h-9 w-9 rounded-full text-clay flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Neue Kategorie …"
                className="flex-1 rounded-xl border border-cream-deep px-3 py-2 bg-white"
              />
              <button
                onClick={() => {
                  if (!newCategoryName.trim()) return;
                  addCategory(newCategoryName);
                  setNewCategoryName("");
                }}
                className="px-3 py-2 rounded-pill bg-cream-deep text-forest text-sm font-medium"
              >
                Hinzufügen
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-forest-soft uppercase tracking-wide">Aufgaben</h3>
            <p className="text-sm text-forest-light">
              Aufgaben legst und bearbeitest du direkt im Bereich „Aufgaben“ über „+ Neue Aufgabe“ bzw.
              das Info-Symbol.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-forest-soft uppercase tracking-wide">Daten</h3>
            <button
              onClick={handleExport}
              className="w-full py-2.5 rounded-pill bg-cream-deep text-forest font-medium"
            >
              Daten exportieren (JSON)
            </button>
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full py-2.5 rounded-pill border border-clay text-clay font-medium"
            >
              Alle Daten zurücksetzen
            </button>
          </section>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        title="Wirklich alles zurücksetzen?"
        message="Alle Personen, Kategorien, Aufgaben und die gesamte Historie werden gelöscht und durch die Beispieldaten ersetzt. Das kann nicht rückgängig gemacht werden."
        confirmLabel="Zurücksetzen"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAllData();
          setConfirmReset(false);
        }}
      />
    </>
  );
}
