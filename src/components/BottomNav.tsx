export type Tab = "woche" | "aufgaben" | "historie" | "statistik";

const items: { id: Tab; label: string; icon: string }[] = [
  { id: "woche", label: "Woche", icon: "📅" },
  { id: "aufgaben", label: "Aufgaben", icon: "✅" },
  { id: "historie", label: "Historie", icon: "🕘" },
  { id: "statistik", label: "Statistik", icon: "📊" }
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-cream-soft border-t border-cream-deep safe-bottom z-40">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {items.map((item) => {
          const isActive = item.id === active;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                isActive ? "text-forest" : "text-forest-soft"
              }`}
              aria-current={isActive}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
