import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, BookOpen, Home, ListChecks, Settings, Users } from "lucide-react";
import type { Store } from "../types";

const links = [
  { href: "/", label: "Diese Woche", icon: Home },
  { href: "/aufgaben", label: "Aufgaben", icon: ListChecks },
  { href: "/historie", label: "Historie", icon: BookOpen },
  { href: "/statistik", label: "Statistik", icon: BarChart3 },
  { href: "/einstellungen", label: "Einstellungen", icon: Settings }
];

// Die Bottom-Nav zeigt bewusst nur die 4 Hauptbereiche (Woche/Aufgaben/Historie/Statistik).
// Einstellungen sind seltener nötig und deshalb über das Zahnrad in der Topbar erreichbar -
// auf dem Handy sonst gar nicht erreichbar, da die Sidebar dort ausgeblendet ist.
export function Layout({ children, store, onPerson }: { children: ReactNode; store: Store; onPerson: (id: string) => void }) {
  const [location] = useLocation();
  const currentLabel = links.find((link) => link.href === location)?.label;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand" data-testid="link-brand">
          <span className="brand-mark">
            <Users size={19} />
          </span>
          <span className="brand-name">Gemeinsam</span>
        </Link>
        <nav className="nav">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${location === href ? "active" : ""}`}
              data-testid={`link-nav-${label.toLowerCase().replace(" ", "-")}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          Ein Ort für alles,
          <br />
          was ihr zusammen tragt.
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span className="topbar-kicker">{location === "/" ? "Euer Zuhause im Blick" : currentLabel || "Gemeinsam"}</span>
          <div className="topbar-actions">
            <div className="person-switcher" aria-label="Aktive Person">
              {store.people.map((person) => (
                <button
                  key={person.id}
                  className={`avatar ${store.activePersonId === person.id ? "selected" : ""}`}
                  style={{ background: person.color }}
                  onClick={() => onPerson(person.id)}
                  data-testid={`button-person-${person.id}`}
                  title={`${person.name} aktiv`}
                >
                  {person.initial}
                </button>
              ))}
            </div>
            <Link href="/einstellungen" className="btn btn-ghost btn-icon" data-testid="link-settings-topbar" title="Einstellungen">
              <Settings size={18} />
            </Link>
          </div>
        </header>
        {children}
        <nav className="mobile-nav">
          {links.slice(0, 4).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={location === href ? "active" : ""} data-testid={`link-mobile-${label}`}>
              <Icon />
              <span>{label === "Diese Woche" ? "Woche" : label}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
