import { createClient } from "@supabase/supabase-js";

// Der "publishable" Key ist bewusst für die Nutzung im Browser gedacht (nicht geheim) -
// abgesichert wird der Zugriff über Row Level Security in Supabase, nicht über Geheimhaltung.
// Der "secret" Key gehört NIE in Code, der im Browser landet.
const SUPABASE_URL = "https://invdguqzcdltnniifhif.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sgmguQ5_ttCkGwRKYhTJUw_5ukDyQxS";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Feste ID der einen gemeinsamen Zeile, in der der komplette App-Zustand liegt.
export const SHARED_STATE_ID = "hausblick";
export const SHARED_STATE_TABLE = "hausblick_state";
