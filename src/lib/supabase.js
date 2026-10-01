import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Les variables Supabase sont manquantes dans le fichier .env");
}

const SESSION_FAILURE_KEY = "kora.auth.sessionFailure";

let refreshPromise = null;
let localSignOutPromise = null;

export function isAuthError(error) {
  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  const status = Number(error?.status || 0);

  return (
    status === 401 ||
    code === "pgrst301" ||
    code === "invalid_jwt" ||
    code === "jwt_expired" ||
    code === "invalid_claim" ||
    message.includes("jwt expired") ||
    message.includes("invalid jwt") ||
    message.includes("invalid claim") ||
    message.includes("not authenticated") ||
    message.includes("session is missing") ||
    message.includes("refresh token")
  );
}

export function markSessionFailure(reason = "invalid") {
  try {
    sessionStorage.setItem(
      SESSION_FAILURE_KEY,
      JSON.stringify({ reason, at: Date.now() })
    );
  } catch {
    // Storage indisponible.
  }
}

export function consumeSessionFailure() {
  try {
    const raw = sessionStorage.getItem(SESSION_FAILURE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SESSION_FAILURE_KEY);
    return JSON.parse(raw)?.reason || "invalid";
  } catch {
    return null;
  }
}

async function invalidateLocalSession(reason = "invalid") {
  markSessionFailure(reason);

  if (!localSignOutPromise) {
    localSignOutPromise = supabase.auth
      .signOut({ scope: "local" })
      .catch(() => null)
      .finally(() => {
        localSignOutPromise = null;
      });
  }

  await localSignOutPromise;
}

async function refreshSessionSingleFlight() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data?.session) {
        await invalidateLocalSession("expired");
        return null;
      }

      return data.session;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function fetchWithAuthRecovery(input, init) {
  const url = typeof input === "string" ? input : input?.url || "";
  const isAuthEndpoint = url.includes("/auth/v1/");
  const request = input instanceof Request ? input.clone() : new Request(input, init);

  let response = await fetch(request.clone());

  if (isAuthEndpoint || response.status !== 401) {
    return response;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.refresh_token) {
    return response;
  }

  const refreshedSession = await refreshSessionSingleFlight();

  if (!refreshedSession) {
    return response;
  }

  response = await fetch(request.clone());

  if (response.status === 401) {
    await invalidateLocalSession("invalid");
  }

  return response;
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      fetch: fetchWithAuthRecovery,
    },
  }
);