import { Link } from "wouter";
import { Archive } from "lucide-react";

export function NotFound() {
  return (
    <div className="content">
      <div className="card empty">
        <div className="empty-icon">
          <Archive size={21} />
        </div>
        <h2>Diese Seite gibt es nicht.</h2>
        <p style={{ marginTop: 8 }}>Vielleicht ist sie gerade umgezogen.</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 20 }} data-testid="link-not-found-home">
          Zur Übersicht
        </Link>
      </div>
    </div>
  );
}
