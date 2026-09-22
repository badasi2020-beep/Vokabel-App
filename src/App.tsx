import { useState } from "react";
import { BottomNav, type Tab } from "./components/BottomNav";
import { PersonSwitcher } from "./components/PersonSwitcher";
import { Home } from "./pages/Home";
import { Tasks } from "./pages/Tasks";
import { History } from "./pages/History";
import { Stats } from "./pages/Stats";
import { Settings } from "./pages/Settings";

export default function App() {
  const [tab, setTab] = useState<Tab>("woche");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur px-5 pt-5 pb-3 flex items-center justify-between">
        <span className="font-serif text-lg text-forest tracking-wide">Gemeinsam</span>
        <div className="flex items-center gap-3">
          <PersonSwitcher />
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Einstellungen öffnen"
            className="h-9 w-9 rounded-full bg-cream-deep text-forest flex items-center justify-center"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pb-28 max-w-md w-full mx-auto">
        {tab === "woche" && <Home />}
        {tab === "aufgaben" && <Tasks />}
        {tab === "historie" && <History />}
        {tab === "statistik" && <Stats />}
      </main>

      <BottomNav active={tab} onChange={setTab} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
