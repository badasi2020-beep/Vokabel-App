import { useCallback, useEffect, useRef, useState } from "react";

const COOLDOWN_MS = 60_000;

// Alltagsaufgaben bleiben nach dem Abhaken bewusst anklickbar (siehe isDue) - damit ein
// versehentlicher Doppel-Klick nicht sofort doppelt zählt, sperrt die Karte sich selbst kurz
// und bietet in der Zeit ein "Rückgängig" an, bevor sie sich automatisch wieder öffnet.
export function useCompletionCooldown() {
  const [cooldowns, setCooldowns] = useState<Record<string, string>>({});
  const timers = useRef<Record<string, number>>({});

  useEffect(
    () => () => {
      Object.values(timers.current).forEach((id) => window.clearTimeout(id));
    },
    []
  );

  const start = useCallback((taskId: string, completionId: string) => {
    window.clearTimeout(timers.current[taskId]);
    setCooldowns((prev) => ({ ...prev, [taskId]: completionId }));
    timers.current[taskId] = window.setTimeout(() => {
      setCooldowns((prev) => {
        const { [taskId]: _removed, ...rest } = prev;
        return rest;
      });
    }, COOLDOWN_MS);
  }, []);

  const clear = useCallback((taskId: string) => {
    window.clearTimeout(timers.current[taskId]);
    setCooldowns((prev) => {
      const { [taskId]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  return { cooldowns, start, clear };
}
