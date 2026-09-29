import { useEffect, useRef, useState } from "react";
import type { Store } from "./types";
import { supabase, SHARED_STATE_ID, SHARED_STATE_TABLE } from "./lib/supabaseClient";

// Füllt Felder auf, die in älteren gespeicherten Daten (vor diesem Feature) noch fehlen.
function normalize(value: Store): Store {
  return {
    ...value,
    people: value.people.map((person) => ({ ...person, prize: person.prize ?? "", prizeWeekStart: person.prizeWeekStart ?? null })),
    planningWeekday: value.planningWeekday ?? 0,
    tasks: value.tasks.map((task) => ({
      ...task,
      taskKind: task.taskKind ?? "sonstiges",
      assignedPersonId: task.assignedPersonId ?? null,
      tempAssignedPersonId: task.tempAssignedPersonId ?? null
    })),
    completions: value.completions.map((completion) => ({
      ...completion,
      taskKindSnapshot: completion.taskKindSnapshot ?? "sonstiges"
    }))
  };
}

const STORAGE_KEY = "gemeinsam-v1";

// Sentinel-Profil "Gemeinschaft": zeigt alle Aufgaben, erlaubt Übernahme-Markierung.
export const COMMUNITY_ID = "gemeinschaft";

// Mara und Jonas sind die Beispielpersonen aus dem ursprünglichen Replit-Stand;
// in den Einstellungen jederzeit umbenennbar. Lila/Grün wie auf dem Logo -
// jede Person bekommt so ihre eigene, die Oberfläche dezent einfärbende Akzentfarbe.
const seed: Store = {
  people: [
    { id: "p1", name: "Mara", initial: "M", color: "#9A64B9", prize: "", prizeWeekStart: null },
    { id: "p2", name: "Jonas", initial: "J", color: "#679442", prize: "", prizeWeekStart: null }
  ],
  categories: [
    { id: "c1", name: "Küche", icon: "Utensils" },
    { id: "c2", name: "Haushalt", icon: "Home" },
    { id: "c3", name: "Organisation", icon: "CalendarDays" },
    { id: "c4", name: "Draußen", icon: "Leaf" }
  ],
  tasks: [
    { id: "t1", name: "Spülmaschine ausräumen", categoryId: "c1", room: "Küche", points: 2, repeatDays: 1, timerEnabled: false, taskKind: "alltag", assignedPersonId: null, tempAssignedPersonId: null, createdAt: "2025-01-02", updatedAt: "2025-01-02" },
    { id: "t2", name: "Wäsche aufhängen", categoryId: "c2", room: "Bad", points: 3, repeatDays: 3, timerEnabled: true, taskKind: "putzplan", assignedPersonId: "p2", tempAssignedPersonId: null, createdAt: "2025-01-03", updatedAt: "2025-01-03" },
    { id: "t3", name: "Einkauf planen", categoryId: "c3", points: 2, repeatDays: 7, timerEnabled: false, taskKind: "sonstiges", assignedPersonId: null, tempAssignedPersonId: null, createdAt: "2025-01-04", updatedAt: "2025-01-04" },
    { id: "t4", name: "Pflanzen versorgen", categoryId: "c4", room: "Balkon", points: null, repeatDays: 7, timerEnabled: false, taskKind: "putzplan", assignedPersonId: "p1", tempAssignedPersonId: null, createdAt: "2025-01-05", updatedAt: "2025-01-05" }
  ],
  completions: [],
  activities: [],
  changes: [],
  activePersonId: "p1",
  planningWeekday: 0
};

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function loadLocalStore(): Store {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? normalize({ ...seed, ...JSON.parse(value) }) : seed;
  } catch {
    return seed;
  }
}

function saveLocalStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // z.B. privater Modus / Speicher voll - Anzeige funktioniert trotzdem weiter.
  }
}

// localStorage dient als sofortiger, offline-fähiger Zwischenspeicher; Supabase ist die
// gemeinsame Quelle der Wahrheit, damit beide Personen auf allen Geräten denselben Stand sehen.
export function useStore() {
  const [store, setStore] = useState<Store>(loadLocalStore);
  const [cloudReady, setCloudReady] = useState(false);
  const skipNextUpload = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from(SHARED_STATE_TABLE).select("data").eq("id", SHARED_STATE_ID).maybeSingle();
      if (cancelled) return;
      if (!error && data?.data) {
        skipNextUpload.current = true;
        setStore(normalize({ ...seed, ...(data.data as Store) }));
      } else if (error) {
        console.error("Konnte Cloud-Daten nicht laden, nutze lokalen Stand:", error.message);
      }
      setCloudReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("hausblick-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: SHARED_STATE_TABLE, filter: `id=eq.${SHARED_STATE_ID}` },
        (payload) => {
          const incoming = (payload.new as { data?: Store } | undefined)?.data;
          if (incoming) {
            skipNextUpload.current = true;
            setStore(normalize({ ...seed, ...incoming }));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    saveLocalStore(store);
    if (!cloudReady) return;
    if (skipNextUpload.current) {
      skipNextUpload.current = false;
      return;
    }
    supabase
      .from(SHARED_STATE_TABLE)
      .upsert({ id: SHARED_STATE_ID, data: store, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.error("Cloud-Sync fehlgeschlagen:", error.message);
      });
  }, [store, cloudReady]);

  const update = (patch: Partial<Store>) => setStore((old) => ({ ...old, ...patch }));
  return { store, update };
}
