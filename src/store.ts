import { useEffect, useState } from "react";
import type { Store } from "./types";

const STORAGE_KEY = "gemeinsam-v1";

// Mara und Jonas sind die Beispielpersonen aus dem ursprünglichen Replit-Stand;
// in den Einstellungen jederzeit umbenennbar. Lila/Grün wie auf dem Logo -
// jede Person bekommt so ihre eigene, die Oberfläche dezent einfärbende Akzentfarbe.
const seed: Store = {
  people: [
    { id: "p1", name: "Mara", initial: "M", color: "#9A64B9", prize: "" },
    { id: "p2", name: "Jonas", initial: "J", color: "#679442", prize: "" }
  ],
  categories: [
    { id: "c1", name: "Küche", icon: "Utensils" },
    { id: "c2", name: "Haushalt", icon: "Home" },
    { id: "c3", name: "Organisation", icon: "CalendarDays" },
    { id: "c4", name: "Draußen", icon: "Leaf" }
  ],
  tasks: [
    { id: "t1", name: "Spülmaschine ausräumen", categoryId: "c1", room: "Küche", points: 2, repeatDays: 1, timerEnabled: false, createdAt: "2025-01-02", updatedAt: "2025-01-02" },
    { id: "t2", name: "Wäsche aufhängen", categoryId: "c2", room: "Bad", points: 3, repeatDays: 3, timerEnabled: true, createdAt: "2025-01-03", updatedAt: "2025-01-03" },
    { id: "t3", name: "Einkauf planen", categoryId: "c3", points: 2, repeatDays: 7, timerEnabled: false, createdAt: "2025-01-04", updatedAt: "2025-01-04" },
    { id: "t4", name: "Pflanzen versorgen", categoryId: "c4", room: "Balkon", points: null, repeatDays: 7, timerEnabled: false, createdAt: "2025-01-05", updatedAt: "2025-01-05" }
  ],
  completions: [],
  activities: [],
  changes: [],
  activePersonId: "p1"
};

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadStore(): Store {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? { ...seed, ...JSON.parse(value) } : seed;
  } catch {
    return seed;
  }
}

export function useStore() {
  const [store, setStore] = useState<Store>(loadStore);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // z.B. privater Modus / Speicher voll - Anzeige funktioniert trotzdem weiter.
    }
  }, [store]);

  const update = (patch: Partial<Store>) => setStore((old) => ({ ...old, ...patch }));
  return { store, update };
}
