import { useStore } from "../store/store";

export function PersonSwitcher() {
  const { data, setActivePerson } = useStore();
  return (
    <div className="flex gap-2">
      {data.people.map((person) => {
        const active = person.id === data.activePersonId;
        return (
          <button
            key={person.id}
            onClick={() => setActivePerson(person.id)}
            className={`h-9 w-9 rounded-full flex items-center justify-center font-serif font-semibold text-sm transition ${
              active ? "text-cream-soft" : "text-forest bg-cream-deep"
            }`}
            style={active ? { backgroundColor: person.color } : undefined}
            aria-pressed={active}
            aria-label={`Zu ${person.name} wechseln`}
          >
            {person.name.trim().charAt(0).toUpperCase() || "?"}
          </button>
        );
      })}
    </div>
  );
}
