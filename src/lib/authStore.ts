import { useSyncExternalStore } from "react";
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

/**
 * Compatibility shape only. No credential records are shipped to the browser.
 */
export interface AdminUserRecord {
  login: string;
  senha: string;
  user: AuthUser;
}

export type AuthenticateFailureReason =
  "invalid_credentials" | "vinculo_expirado" | "somente_leitura" | "service_unavailable";

export interface AuthenticateResult {
  user: AuthUser | null;
  reason?: AuthenticateFailureReason;
  statusMessage?: string;
}

export const AUTH_SECURITY_LOCKDOWN = true as const;
export const AUTH_LOCKDOWN_MESSAGE =
  "A autenticação foi temporariamente desativada porque o protótipo anterior processava credenciais no navegador. O acesso será reaberto somente após a ativação da autenticação no servidor.";

/**
 * Deliberately empty. Administrative identities must come from the server-side
 * identity provider and must never be compiled into the JavaScript bundle.
 */
export const ADMIN_USERS: AdminUserRecord[] = [];

const LEGACY_SESSION_KEYS = [
  "smart-patrimonio-session:v2",
  "resp-session:v1",
  "smart-patrimonio-dynamic-users:v1",
  "smart-patrimonio-passwords:v1",
  "smart-patrimonio-terms-accepted:v1",
] as const;

const LISTENERS = new Set<() => void>();

function notifyListeners(): void {
  LISTENERS.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  LISTENERS.add(listener);
  return () => LISTENERS.delete(listener);
}

function getNullSnapshot(): AuthUser | null {
  return null;
}

function clientCredentialStorageDisabled(operation: string): never {
  throw new Error(
    `${operation} indisponível: credenciais, usuários e sessões não podem ser persistidos no navegador.`,
  );
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
 * Client-side authentication is intentionally blocked during containment.
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
 * Backward-compatible wrapper. Always returns null until server authentication
 * is enabled.
 */
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
 * breaking imports while the Day 4 identity implementation is introduced.
 */
export function signInUser(_user: AuthUser, _rememberMe = true): void {
  clientCredentialStorageDisabled("Criação de sessão");
}

/**
 * Remove every legacy browser key so a previously forged/stale session cannot
 * survive the security containment release.
 */
export function signOutUser(): void {
  if (typeof window !== "undefined") {
    for (const key of LEGACY_SESSION_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  }
  notifyListeners();
}

/**
 * Browser storage is never a source of authentication truth.
 */
export function getStoredUser(): AuthUser | null {
  return null;
}

export function getRespAuthSession(): AuthUser | null {
  return null;
}

export function useAuth() {
  const user = useSyncExternalStore(subscribe, getNullSnapshot, getNullSnapshot);

  return {
    user,
    isAuthenticated: false,
    loading: false,
    role: null as UserRole | null,
    isAdmin: false,
    isResponsavel: false,
    isChefia: false,
    isGalpao: false,
    signIn: (_nextUser: AuthUser, _remember = true) => {
      clientCredentialStorageDisabled("Criação de sessão");
    },
    signOut: signOutUser,
  };
}
