import type { RespUser } from "./respUsers";

const LEGACY_RESP_SESSION_KEY = "resp-session:v1";

/**
 * Client-side credential matching is disabled. Authentication must be performed
 * by the server-side identity implementation.
 */
export function findUser(_login: string, _senha: string): RespUser | null {
  return null;
}

/**
 * Browser-created sessions are not trusted and cannot be persisted.
 */
export function signIn(_user: RespUser): never {
  throw new Error("Criação de sessão no navegador desativada por contenção de segurança.");
}

export function signOut(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(LEGACY_RESP_SESSION_KEY);
    window.sessionStorage.removeItem(LEGACY_RESP_SESSION_KEY);
  } catch {
    // Storage can be unavailable in hardened/private browsing contexts.
  }
}

/**
 * Web Storage is never an authentication source of truth.
 */
export function getSession(): RespUser | null {
  return null;
}
