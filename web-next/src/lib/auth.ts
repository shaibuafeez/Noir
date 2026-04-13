const STORAGE_KEY = "ghost_auth_session";

export interface AuthSession {
  sessionId: string;
  address: string;
  provider: string;
  name: string;
  picture: string;
  email: string;
}

export function saveAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage may be unavailable (SSR, private browsing)
  }
}

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Parse the auth payload from the `?auth=<base64url>` query parameter.
 * Returns null if not present or invalid.
 */
export function parseAuthFromUrl(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const payload = params.get("auth");
  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const session = JSON.parse(json) as AuthSession;
    if (session.sessionId && session.address) return session;
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the Google sign-in URL, accounting for dev vs prod port.
 */
export function getGoogleSignInUrl(): string {
  if (typeof window === "undefined") return "/auth/google";
  // In dev (Next.js on 3002), point at backend on 3000
  if (window.location.port === "3002") {
    return `${window.location.protocol}//${window.location.hostname}:3000/auth/google`;
  }
  // In prod (served from backend on 3000), use same host
  if (window.location.port === "3000") {
    return `${window.location.protocol}//${window.location.host}/auth/google`;
  }
  // In prod (Vercel frontend), point at Railway backend
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://noir-backend-production-d2b0.up.railway.app";
  return `${backendUrl}/auth/google`;
}
