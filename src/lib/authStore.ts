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

  // Legacy display aliases kept only while existing screens are migrated to the
  // server-authorized identity contract. They never carry browser credentials.
  responsavel?: string;
  responsavelNome?: string;
  unidadeNome?: string;
}

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
  csrfToken: string | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

interface SessionResponse {
  authenticated: boolean;
  user?: AuthUser | null;
  csrfToken?: string | null;
  message?: string;
}

export const AUTH_SECURITY_LOCKDOWN = true as const;
export const AUTH_LOCKDOWN_MESSAGE =
  "Credenciais nunca são validadas no navegador. O acesso depende exclusivamente da API server-side e permanece bloqueado enquanto a configuração segura não estiver aprovada.";

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
const SERVER_SNAPSHOT: AuthSnapshot = {
  user: null,
  csrfToken: null,
  loading: false,
  initialized: false,
  error: null,
};
let authSnapshot: AuthSnapshot = {
  user: null,
  csrfToken: null,
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
  return SERVER_SNAPSHOT;
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
    const csrfToken = user ? payload?.csrfToken ?? null : null;

    setAuthSnapshot({
      user,
      csrfToken,
      loading: false,
      initialized: true,
      error: response.ok ? null : payload?.message ?? "Não foi possível verificar a sessão.",
    });

    return user;
  } catch (error) {
    setAuthSnapshot({
      user: null,
      csrfToken: null,
      loading: false,
      initialized: true,
      error: error instanceof Error ? error.message : "Falha ao verificar a sessão.",
    });
    return null;
  }
}

export function getCustomPasswordMap(): Record<string, string> {
  return {};
}

export function setCustomPassword(_login: string, _newPassword: string): void {
  clientCredentialStorageDisabled("Redefinição de senha");
}

export function getDynamicUsers(): RespUser[] {
  return [];
}

export function addDynamicUser(_user: RespUser): void {
  clientCredentialStorageDisabled("Cadastro de usuário");
}

export function getAllRespUsers(): RespUser[] {
  return [...RESP_USERS];
}

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

export function authenticateUser(_loginInput: string, _senhaInput: string): AuthUser | null {
  return null;
}

export function convertRespToAuthUser(resp: RespUser): AuthUser {
  const responsibleName = resp.responsavelNome || resp.responsavel;
  const unitName = resp.unidadeNome || resp.setor;

  return {
    id: `resp-${resp.unidadeCodigo ?? resp.login}`,
    name: responsibleName,
    login: resp.login,
    role: "responsavel",
    roleLabel: "Responsável de Setor",
    cargo: resp.cargoResponsavel ?? "Responsável Patrimonial",
    secretaria: resp.secretariaNome || resp.secretaria,
    setor: unitName,
    codigoSetor: resp.unidadeCodigo,
    unidade: unitName,
    prontuario: resp.prontuarioResponsavel || resp.prontuario,
    email: resp.email,
    telefone: resp.telefone,
    status: resp.status,
    responsavel: responsibleName,
    responsavelNome: responsibleName,
    unidadeNome: unitName,
  };
}

export function getTermsAcceptedMap(): Record<string, string> {
  return {};
}

export function recordTermsAcceptance(_login: string): void {
  clientCredentialStorageDisabled("Aceite de termos");
}

export function signInUser(_user: AuthUser, _rememberMe = true): void {
  clientCredentialStorageDisabled("Criação de sessão");
}

export async function signOutUser(): Promise<void> {
  clearLegacyBrowserStorage();

  if (typeof window === "undefined") {
    setAuthSnapshot({
      user: null,
      csrfToken: null,
      loading: false,
      initialized: true,
      error: null,
    });
    return;
  }

  let csrfToken = authSnapshot.csrfToken;
  if (authSnapshot.user && !csrfToken) {
    await refreshAuthSession();
    csrfToken = authSnapshot.csrfToken;
  }

  try {
    const response = await fetch(AUTH_SESSION_ENDPOINT, {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        accept: "application/json",
        ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
      },
    });

    if (!response.ok) {
      throw new Error("Não foi possível encerrar a sessão no servidor.");
    }

    setAuthSnapshot({
      user: null,
      csrfToken: null,
      loading: false,
      initialized: true,
      error: null,
    });
  } catch (error) {
    setAuthSnapshot({
      ...authSnapshot,
      loading: false,
      initialized: true,
      error: error instanceof Error ? error.message : "Falha ao encerrar a sessão.",
    });
    throw error;
  }
}

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
