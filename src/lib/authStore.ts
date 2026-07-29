import { useEffect, useSyncExternalStore } from "react";
import { RESP_USERS, type RespUser } from "./respUsers";

export type UserRole = "admin" | "contabilidade" | "chefia" | "galpao" | "responsavel";

export interface AuthUser {
  id: string;
  name: string;
  login: string;
  role: UserRole;
  roleLabel: string;
  cargo?: string;
  secretaria?: string;
  setor?: string;
  codigoSetor?: string;
  unidade?: string;
  prontuario?: string;
  email?: string;
  telefone?: string;
  status?: string;
  avatarUrl?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  lastLogin?: string;
}

/**
 * Compatibility shape only. No credential records are shipped to the browser.
 */
export interface AdminUserRecord {
  login: string;
  senha: string;
  user: AuthUser;
}

export type AuthenticateFailureReason =
  | "invalid_credentials"
  | "vinculo_expirado"
  | "somente_leitura"
  | "service_unavailable";

export interface AuthenticateResult {
  user: AuthUser | null;
  reason?: AuthenticateFailureReason;
  statusMessage?: string;
}

interface AuthSnapshot {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

interface SessionResponse {
  authenticated: boolean;
  user?: AuthUser | null;
  message?: string;
}

export const AUTH_SECURITY_LOCKDOWN = false as const;
export const AUTH_LOCKDOWN_MESSAGE =
  "A autenticação administrativa foi movida para o servidor. O navegador não armazena credenciais nem cria sessão confiável.";

/**
 * Deliberately empty. Administrative identities must come from the server-side
 * identity provider and must never be compiled into the JavaScript bundle.
 */
export const ADMIN_USERS: AdminUserRecord[] = [];

const AUTH_SESSION_ENDPOINT = "/api/v1/auth/session";
const LEGACY_SESSION_KEYS = [
  "smart-patrimonio-session:v2",
  "resp-session:v1",
  "smart-patrimonio-dynamic-users:v1",
  "smart-patrimonio-passwords:v1",
  "smart-patrimonio-terms-accepted:v1",
] as const;

const LISTENERS = new Set<() => void>();
let authSnapshot: AuthSnapshot = {
  user: null,
  loading: false,
  initialized: typeof window === "undefined",
  error: null,
};

function notifyListeners(): void {
  LISTENERS.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  LISTENERS.add(listener);
  return () => LISTENERS.delete(listener);
}

function getAuthSnapshot(): AuthSnapshot {
  return authSnapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return {
    user: null,
    loading: false,
    initialized: false,
    error: null,
  };
}

function setAuthSnapshot(nextSnapshot: AuthSnapshot): void {
  authSnapshot = nextSnapshot;
  notifyListeners();
}

function clearLegacyBrowserStorage(): void {
  if (typeof window === "undefined") return;

  for (const key of LEGACY_SESSION_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}

function clientCredentialStorageDisabled(operation: string): never {
  throw new Error(
    `${operation} indisponível: credenciais, usuários e sessões não podem ser persistidos no navegador.`,
  );
}

export async function refreshAuthSession(): Promise<AuthUser | null> {
  if (typeof window === "undefined") return null;

  setAuthSnapshot({ ...authSnapshot, loading: true, error: null });

  try {
    const response = await fetch(AUTH_SESSION_ENDPOINT, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        accept: "application/json",
      },
    });

    const payload = (await response.json().catch(() => null)) as SessionResponse | null;
    const user = response.ok && payload?.authenticated ? payload.user ?? null : null;

    setAuthSnapshot({
      user,
      loading: false,
      initialized: true,
      error: response.ok ? null : payload?.message ?? "Não foi possível verificar a sessão.",
    });

    return user;
  } catch (error) {
    setAuthSnapshot({
      user: null,
      loading: false,
      initialized: true,
      error: error instanceof Error ? error.message : "Falha ao verificar a sessão.",
    });
    return null;
  }
}

/**
 * Compatibility API. Password material is never read from browser storage.
 */
export function getCustomPasswordMap(): Record<string, string> {
  return {};
}

/**
 * Compatibility API kept while callers migrate to the server-side identity API.
 */
export function setCustomPassword(_login: string, _newPassword: string): void {
  clientCredentialStorageDisabled("Redefinição de senha");
}

/**
 * Compatibility API. Dynamic identity data is no longer stored in localStorage.
 */
export function getDynamicUsers(): RespUser[] {
  return [];
}

/**
 * Compatibility API kept while callers migrate to the server-side identity API.
 */
export function addDynamicUser(_user: RespUser): void {
  clientCredentialStorageDisabled("Cadastro de usuário");
}

/**
 * The client bundle contains no real identities. Synthetic fixtures may be
 * injected only by isolated tests and must never be used as authentication data.
 */
export function getAllRespUsers(): RespUser[] {
  return [...RESP_USERS];
}

/**
 * Client-side authentication is intentionally blocked. Login must use the
 * server-side API, which returns an HttpOnly cookie.
 */
export function authenticateUserDetailed(
  _loginInput: string,
  _senhaInput: string,
): AuthenticateResult {
  return {
    user: null,
    reason: "service_unavailable",
    statusMessage: AUTH_LOCKDOWN_MESSAGE,
  };
}

/**
 * Backward-compatible wrapper. Always returns null because browser-side
 * authentication is not trusted.
 */
export function authenticateUser(_loginInput: string, _senhaInput: string): AuthUser | null {
  return null;
}

export function convertRespToAuthUser(resp: RespUser): AuthUser {
  return {
    id: `resp-${resp.unidadeCodigo ?? resp.login}`,
    name: resp.responsavelNome || resp.responsavel,
    login: resp.login,
    role: "responsavel",
    roleLabel: "Responsável de Setor",
    cargo: resp.cargoResponsavel ?? "Responsável Patrimonial",
    secretaria: resp.secretariaNome || resp.secretaria,
    setor: resp.unidadeNome || resp.setor,
    codigoSetor: resp.unidadeCodigo,
    unidade: resp.unidadeNome || resp.setor,
    prontuario: resp.prontuarioResponsavel || resp.prontuario,
    email: resp.email,
    telefone: resp.telefone,
    status: resp.status,
  };
}

/**
 * Compatibility API. Legal acceptance must be recorded server-side with an
 * immutable audit event.
 */
export function getTermsAcceptedMap(): Record<string, string> {
  return {};
}

export function recordTermsAcceptance(_login: string): void {
  clientCredentialStorageDisabled("Aceite de termos");
}

/**
 * A browser-created session is not trusted. This function remains only to avoid
 * breaking imports while callers migrate to the server-side identity API.
 */
export function signInUser(_user: AuthUser, _rememberMe = true): void {
  clientCredentialStorageDisabled("Criação de sessão");
}

/**
 * Remove every legacy browser key and revoke the current server cookie.
 */
export async function signOutUser(): Promise<void> {
  clearLegacyBrowserStorage();

  if (typeof window !== "undefined") {
    await fetch(AUTH_SESSION_ENDPOINT, {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        accept: "application/json",
        "x-csrf-intent": "logout",
      },
    }).catch(() => undefined);
  }

  setAuthSnapshot({ user: null, loading: false, initialized: true, error: null });
}

/**
 * Browser storage is never a source of authentication truth.
 */
export function getStoredUser(): AuthUser | null {
  return authSnapshot.user;
}

export function getRespAuthSession(): AuthUser | null {
  return authSnapshot.user?.role === "responsavel" ? authSnapshot.user : null;
}

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, getAuthSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!snapshot.initialized && !snapshot.loading) {
      void refreshAuthSession();
    }
  }, [snapshot.initialized, snapshot.loading]);

  const user = snapshot.user;

  return {
    user,
    isAuthenticated: Boolean(user),
    loading: snapshot.loading || !snapshot.initialized,
    error: snapshot.error,
    role: user?.role ?? null,
    isAdmin: user?.role === "admin" || user?.role === "contabilidade",
    isResponsavel: user?.role === "responsavel",
    isChefia: user?.role === "chefia",
    isGalpao: user?.role === "galpao",
    refresh: refreshAuthSession,
    signIn: (_nextUser: AuthUser, _remember = true) => {
      clientCredentialStorageDisabled("Criação de sessão");
    },
    signOut: signOutUser,
  };
}
