import { RESP_USERS, type RespUser } from "./respUsers";

const KEY = "resp-session:v1";

export function findUser(login: string, senha: string): RespUser | null {
  const l = login.trim().toLowerCase();
  const s = senha.trim();
  return (
    RESP_USERS.find(
      (u) => u.login.toLowerCase() === l && u.senha === s,
    ) ?? null
  );
}

export function signIn(user: RespUser) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    /* ignore */
  }
}

export function signOut() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function getSession(): RespUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RespUser) : null;
  } catch {
    return null;
  }
}
