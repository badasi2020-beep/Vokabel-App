import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppData, Category, HistoryEntry, Person, Recurrence, Task } from "../types";
import { buildSeedData } from "../data/seed";
import { createId } from "../lib/id";

const STORAGE_KEY = "gemeinsam:data:v1";

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch {
    // Ignorieren, Seed-Daten werden verwendet.
  }
  return buildSeedData();
}

interface StoreValue {
  data: AppData;
  setActivePerson: (personId: string) => void;
  addTask: (input: { name: string; categoryId?: string | null }) => Task;
  updateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (input: {
    taskId: string;
    personId: string;
    durationSeconds?: number;
    completedAt?: string;
  }) => void;
  addCategory: (name: string, icon?: string) => Category;
  renameCategory: (categoryId: string, name: string) => void;
  deleteCategory: (categoryId: string) => void;
  renamePerson: (personId: string, name: string) => void;
  setWeeklyMoment: (text: string) => void;
  resetAllData: () => void;
  exportData: () => AppData;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const setActivePerson = useCallback((personId: string) => {
    setData((prev) => ({ ...prev, activePersonId: personId }));
  }, []);

  const addTask = useCallback((input: { name: string; categoryId?: string | null }) => {
    const task: Task = {
      id: createId(),
      name: input.name.trim(),
      categoryId: input.categoryId ?? null,
      description: "",
      points: undefined,
      recurrence: null,
      createdAt: new Date().toISOString()
    };
    setData((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
    return task;
  }, []);

  const updateTask = useCallback((taskId: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId)
    }));
  }, []);

  const completeTask = useCallback(
    (input: { taskId: string; personId: string; durationSeconds?: number; completedAt?: string }) => {
      setData((prev) => {
        const task = prev.tasks.find((t) => t.id === input.taskId);
        if (!task) return prev;
        const entry: HistoryEntry = {
          id: createId(),
          taskId: task.id,
          taskName: task.name,
          categoryId: task.categoryId,
          points: typeof task.points === "number" ? task.points : null,
          personId: input.personId,
          completedAt: input.completedAt ?? new Date().toISOString(),
          durationSeconds: input.durationSeconds
        };
        return { ...prev, history: [entry, ...prev.history] };
      });
    },
    []
  );

  const addCategory = useCallback((name: string, icon: string = "🏷️") => {
    const category: Category = { id: createId(), name: name.trim(), icon };
    setData((prev) => ({ ...prev, categories: [...prev.categories, category] }));
    return category;
  }, []);

  const renameCategory = useCallback((categoryId: string, name: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === categoryId ? { ...c, name: name.trim() } : c))
    }));
  }, []);

  const deleteCategory = useCallback((categoryId: string) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== categoryId),
      tasks: prev.tasks.map((t) => (t.categoryId === categoryId ? { ...t, categoryId: null } : t))
    }));
  }, []);

  const renamePerson = useCallback((personId: string, name: string) => {
    setData((prev) => ({
      ...prev,
      people: prev.people.map((p) => (p.id === personId ? { ...p, name: name.trim() } : p))
    }));
  }, []);

  const setWeeklyMoment = useCallback((text: string) => {
    setData((prev) => ({ ...prev, weeklyMoment: text }));
  }, []);

  const resetAllData = useCallback(() => {
    const fresh = buildSeedData();
    setData(fresh);
  }, []);

  const exportData = useCallback(() => data, [data]);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      setActivePerson,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
      addCategory,
      renameCategory,
      deleteCategory,
      renamePerson,
      setWeeklyMoment,
      resetAllData,
      exportData
    }),
    [
      data,
      setActivePerson,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
      addCategory,
      renameCategory,
      deleteCategory,
      renamePerson,
      setWeeklyMoment,
      resetAllData,
      exportData
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore muss innerhalb von StoreProvider verwendet werden");
  return ctx;
}

export type { Person, Category, Task, HistoryEntry, Recurrence };
