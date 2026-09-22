import { Component, type ComponentType, type ErrorInfo, type ReactNode } from "react";

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Ändert sich das, wird ein aufgefangener Fehler zurückgesetzt (z.B. beim Navigieren). */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Etwas ist schiefgelaufen</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "hsl(var(--muted-foreground))" }}>
          Dieser Teil der App hatte einen Fehler. Der Rest läuft weiter.
        </p>
        {import.meta.env.DEV ? (
          <pre style={{ marginTop: 16, overflowX: "auto", borderRadius: 8, background: "hsl(var(--muted))", padding: 12, textAlign: "left", fontSize: 12 }}>
            {error.message || String(error)}
          </pre>
        ) : null}
        <button type="button" className="btn btn-primary" style={{ marginTop: 16 }} onClick={resetError}>
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", toError(error), info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (this.state.error !== null && prevProps.resetKey !== this.props.resetKey) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
