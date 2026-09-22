import { useState, type ReactNode } from "react";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import { ErrorBoundary } from "./components/error-boundary";
import { Layout } from "./components/Layout";
import { Overview } from "./pages/Overview";
import { TasksPage } from "./pages/TasksPage";
import { HistoryPage } from "./pages/HistoryPage";
import { StatsPage } from "./pages/StatsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFound } from "./pages/NotFound";
import { useStore } from "./store";

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  const { store, update } = useStore();
  const [notice, setNotice] = useState("");

  const notify = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2400);
  };

  return (
    <Layout store={store} onPerson={(id) => { update({ activePersonId: id }); notify("Aktive Person gewechselt."); }}>
      <Switch>
        <Route path="/">
          <Overview store={store} update={update} notify={notify} />
        </Route>
        <Route path="/aufgaben">
          <TasksPage store={store} update={update} notify={notify} />
        </Route>
        <Route path="/historie">
          <HistoryPage store={store} />
        </Route>
        <Route path="/statistik">
          <StatsPage store={store} />
        </Route>
        <Route path="/einstellungen">
          <SettingsPage store={store} update={update} notify={notify} />
        </Route>
        <Route component={NotFound} />
      </Switch>
      {notice && (
        <div className="toast-note" role="status" data-testid="status-toast">
          {notice}
        </div>
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <RoutedErrorBoundary>
        <Router />
      </RoutedErrorBoundary>
    </WouterRouter>
  );
}
