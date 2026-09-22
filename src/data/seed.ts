import type { AppData } from "../types";
import { createId } from "../lib/id";

const now = new Date().toISOString();

const haushalt = createId();
const kueche = createId();
const luna = createId();
const erledigungen = createId();

const personA = createId();
const personB = createId();

export function buildSeedData(): AppData {
  return {
    people: [
      { id: personA, name: "Person 1", color: "#2F3E33" },
      { id: personB, name: "Person 2", color: "#B5673A" }
    ],
    categories: [
      { id: haushalt, name: "Haushalt", icon: "🏠" },
      { id: kueche, name: "Küche", icon: "🍳" },
      { id: luna, name: "Luna", icon: "🐾" },
      { id: erledigungen, name: "Erledigungen", icon: "📋" }
    ],
    tasks: [
      {
        id: createId(),
        name: "Bad putzen",
        categoryId: haushalt,
        description: "",
        points: 5,
        recurrence: { unit: "day", interval: 7 },
        createdAt: now
      },
      {
        id: createId(),
        name: "Küche reinigen",
        categoryId: haushalt,
        description: "",
        points: 4,
        recurrence: { unit: "day", interval: 3 },
        createdAt: now
      },
      {
        id: createId(),
        name: "Fenster putzen",
        categoryId: haushalt,
        description: "",
        points: 6,
        recurrence: { unit: "month", interval: 3 },
        createdAt: now
      },
      {
        id: createId(),
        name: "Spülmaschine einräumen",
        categoryId: kueche,
        points: 1,
        recurrence: null,
        createdAt: now
      },
      {
        id: createId(),
        name: "Spülmaschine ausräumen",
        categoryId: kueche,
        points: 1,
        recurrence: null,
        createdAt: now
      },
      {
        id: createId(),
        name: "Kochen",
        categoryId: kueche,
        points: 3,
        recurrence: null,
        createdAt: now
      },
      {
        id: createId(),
        name: "Tisch decken",
        categoryId: kueche,
        points: 1,
        recurrence: null,
        createdAt: now
      },
      {
        id: createId(),
        name: "Tisch abräumen",
        categoryId: kueche,
        points: 1,
        recurrence: null,
        createdAt: now
      },
      {
        id: createId(),
        name: "Betreuung",
        categoryId: luna,
        points: undefined,
        recurrence: null,
        createdAt: now
      },
      {
        id: createId(),
        name: "Wickeln",
        categoryId: luna,
        points: undefined,
        recurrence: null,
        createdAt: now
      },
      {
        id: createId(),
        name: "Anziehen",
        categoryId: luna,
        points: undefined,
        recurrence: null,
        createdAt: now
      },
      {
        id: createId(),
        name: "Einkaufen",
        categoryId: erledigungen,
        points: 3,
        recurrence: null,
        createdAt: now
      }
    ],
    history: [],
    activePersonId: personA
  };
}
