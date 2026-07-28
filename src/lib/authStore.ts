import { useState, useEffect } from "react";
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

export interface AdminUserRecord {
  login: string;
  senha: string;
  user: AuthUser;
}

export interface AuthenticateResult {
  user: AuthUser | null;
  reason?: "invalid_credentials" | "vinculo_expirado" | "somente_leitura";
  statusMessage?: string;
}

// Contas de teste administrativas do sistema
export const ADMIN_USERS: AdminUserRecord[] = [
  {
    login: "neemias.42159",
    senha: "Tini7426",
    user: {
      id: "adm-neemias",
      name: "Neemias",
      login: "neemias.42159",
      role: "admin",
      roleLabel: "Administrador / Contabilidade",
      cargo: "Gestor de Patrimônio e Contabilidade",
      secretaria: "Secretaria de Finanças e Patrimônio",
      setor: "Divisão de Gestão Patrimonial",
      codigoSetor: "PAT-001",
      status: "Liberado Externa",
      email: "neemias.42159@santanadeparnaiba.sp.gov.br",
    },
  },
  {
    login: "admin.sistema",
    senha: "admin123",
    user: {
      id: "adm-001",
      name: "Administrador Geral",
      login: "admin.sistema",
      role: "admin",
      roleLabel: "Administrador de Segurança",
      cargo: "Administrador de Sistemas",
      secretaria: "Secretaria de Tecnologia e Gestão",
      setor: "Divisão de TI e Segurança",
      codigoSetor: "TI-001",
      status: "Liberado Externa",
      email: "admin.patrimonio@santanadeparnaiba.sp.gov.br",
    },
  },
  {
    login: "chefia.patrimonio",
    senha: "chefia123",
    user: {
      id: "chefia-001",
      name: "Coordenadoria de Chefia",
      login: "chefia.patrimonio",
      role: "chefia",
      roleLabel: "Chefia Executiva",
      cargo: "Chefe do Setor Patrimonial",
      secretaria: "Gabinete do Prefeito",
      setor: "Coordenação Geral de Bens",
      codigoSetor: "CHEF-001",
      status: "Liberado Externa",
      email: "chefia.patrimonio@santanadeparnaiba.sp.gov.br",
    },
  },
  {
    login: "galpao.operador",
    senha: "galpao123",
    user: {
      id: "galpao-001",
      name: "Operador de Galpão",
      login: "galpao.operador",
      role: "galpao",
      roleLabel: "Almoxarifado / Galpão Central",
      cargo: "Fiel de Depósito",
      secretaria: "Secretaria de Serviços Municipais",
      setor: "Galpão Central de Armazenamento",
      codigoSetor: "GALP-001",
      status: "Liberado Externa",
      email: "galpao@santanadeparnaiba.sp.gov.br",
    },
  },
];

const SESSION_STORAGE_KEY = "smart-patrimonio-session:v2";
const DYNAMIC_USERS_KEY = "smart-patrimonio-dynamic-users:v1";
const CUSTOM_PASSWORDS_KEY = "smart-patrimonio-passwords:v1";
const TERMS_ACCEPTED_KEY = "smart-patrimonio-terms-accepted:v1";
const LISTENERS = new Set<() => void>();

function notifyListeners() {
  LISTENERS.forEach((cb) => cb());
}

/**
 * Obtém senhas redefinidas / personalizadas do localStorage
 */
export function getCustomPasswordMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CUSTOM_PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Define nova senha para um usuário por login
 */
export function setCustomPassword(login: string, newPassword: string): void {
  try {
    const map = getCustomPasswordMap();
    map[login.trim().toLowerCase()] = newPassword.trim();
    localStorage.setItem(CUSTOM_PASSWORDS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Erro ao salvar nova senha:", e);
  }
}

/**
 * Obtém usuários dinâmicos cadastrados em tempo de execução
 */
export function getDynamicUsers(): RespUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DYNAMIC_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Adiciona ou atualiza um usuário cadastrado
 */
export function addDynamicUser(user: RespUser): void {
  try {
    const current = getDynamicUsers();
    const filtered = current.filter((u) => u.login.toLowerCase() !== user.login.toLowerCase());
    filtered.unshift(user);
    localStorage.setItem(DYNAMIC_USERS_KEY, JSON.stringify(filtered));
    notifyListeners();
  } catch (e) {
    console.error("Erro ao adicionar usuário dinâmico:", e);
  }
}

/**
 * Obtém a lista consolidada de todos os responsáveis (base estática + cadastrados em tempo de execução)
 */
export function getAllRespUsers(): RespUser[] {
  const dynamic = getDynamicUsers();
  const dynamicLogins = new Set(dynamic.map((d) => d.login.toLowerCase()));
  const staticFiltered = RESP_USERS.filter((s) => !dynamicLogins.has(s.login.toLowerCase()));
  return [...dynamic, ...staticFiltered];
}

/**
 * Autentica credenciais administrativas ou de responsável com verificação de status do vínculo
 */
export function authenticateUserDetailed(loginInput: string, senhaInput: string): AuthenticateResult {
  const loginNorm = loginInput.trim().toLowerCase();
  const senhaNorm = senhaInput.trim();

  if (!loginNorm || !senhaNorm) {
    return { user: null, reason: "invalid_credentials" };
  }

  const customPasswords = getCustomPasswordMap();

  // 1. Procurar em usuários administrativos
  const adminMatch = ADMIN_USERS.find((a) => {
    const validPass = customPasswords[a.login.toLowerCase()] ?? a.senha;
    return a.login.toLowerCase() === loginNorm && validPass === senhaNorm;
  });

  if (adminMatch) {
    return {
      user: {
        ...adminMatch.user,
        lastLogin: new Date().toISOString(),
      },
    };
  }

  // 2. Procurar em responsáveis de setor
  const allResp = getAllRespUsers();
  const respMatch = allResp.find((r) => {
    const validPass = customPasswords[r.login.toLowerCase()] ?? r.senha;
    return r.login.toLowerCase() === loginNorm && validPass === senhaNorm;
  });

  if (respMatch) {
    const statusNorm = (respMatch.status ?? "").trim().toUpperCase();

    // Verificação de Bloqueio por vínculo expirado (RN-MOD-03-02 / RF-MOD-03-07)
    if (statusNorm === "FINALIZADO" || statusNorm === "BLOQUEADO" || statusNorm === "SOMENTE ETIQUETAS") {
      return {
        user: null,
        reason: "vinculo_expirado",
        statusMessage: `Seu vínculo com o setor está marcado como '${respMatch.status}'. Acesso suspenso ou transferido.`,
      };
    }

    const authUser = convertRespToAuthUser(respMatch);
    
    // Verificar se já aceitou os termos LGPD
    const termsMap = getTermsAcceptedMap();
    if (termsMap[authUser.login.toLowerCase()]) {
      authUser.termsAccepted = true;
      authUser.termsAcceptedAt = termsMap[authUser.login.toLowerCase()];
    }

    return { user: authUser };
  }

  return { user: null, reason: "invalid_credentials" };
}

/**
 * Wrapper simplificado retrocompatível
 */
export function authenticateUser(loginInput: string, senhaInput: string): AuthUser | null {
  const result = authenticateUserDetailed(loginInput, senhaInput);
  return result.user;
}

export function convertRespToAuthUser(resp: RespUser): AuthUser {
  return {
    id: `resp-${resp.unidadeCodigo}`,
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
    lastLogin: new Date().toISOString(),
  };
}

/**
 * Gerenciamento de Aceite dos Termos de Fiel Depositário / LGPD
 */
export function getTermsAcceptedMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TERMS_ACCEPTED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordTermsAcceptance(login: string): void {
  try {
    const map = getTermsAcceptedMap();
    map[login.trim().toLowerCase()] = new Date().toISOString();
    localStorage.setItem(TERMS_ACCEPTED_KEY, JSON.stringify(map));

    // Atualizar usuário na sessão ativa se corresponder
    const cur = getStoredUser();
    if (cur && cur.login.toLowerCase() === login.trim().toLowerCase()) {
      cur.termsAccepted = true;
      cur.termsAcceptedAt = map[login.trim().toLowerCase()];
      signInUser(cur);
    }
  } catch (e) {
    console.error("Erro ao registrar aceite de termos:", e);
  }
}

/**
 * Salva a sessão ativa
 */
export function signInUser(user: AuthUser, rememberMe = true): void {
  try {
    const data = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, data);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, data);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    localStorage.setItem("resp-session:v1", data);
  } catch (e) {
    console.error("Erro ao salvar sessão de autenticação:", e);
  }
  notifyListeners();
}

/**
 * Encerra a sessão ativa
 */
export function signOutUser(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem("resp-session:v1");
  } catch (e) {
    console.error("Erro ao remover sessão de autenticação:", e);
  }
  notifyListeners();
}

/**
 * Obtém o usuário atualmente autenticado
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const local = localStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem("resp-session:v1");
    if (local) return JSON.parse(local) as AuthUser;

    const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (session) return JSON.parse(session) as AuthUser;
  } catch (e) {
    console.error("Erro ao ler sessão armazenada:", e);
  }
  return null;
}

/**
 * Alias retrocompatível para obtenção da sessão ativa do responsável
 */
export function getRespAuthSession(): AuthUser | null {
  return getStoredUser();
}

/**
 * Hook React reativo para consumir o estado de autenticação
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setUser(getStoredUser());
    };
    LISTENERS.add(handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      LISTENERS.delete(handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    role: user?.role ?? null,
    isAdmin: user?.role === "admin" || user?.role === "contabilidade",
    isResponsavel: user?.role === "responsavel",
    isChefia: user?.role === "chefia",
    isGalpao: user?.role === "galpao",
    signIn: (user: AuthUser, remember = true) => {
      setLoading(true);
      signInUser(user, remember);
      setLoading(false);
    },
    signOut: () => {
      setLoading(true);
      signOutUser();
      setLoading(false);
    },
  };
}
