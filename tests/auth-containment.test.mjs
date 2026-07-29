import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readProjectFile(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

const [
  authStore,
  respAuth,
  respUsers,
  homeRoute,
  adminLogin,
  responsibleLogin,
  setPassword,
  adminAuthServer,
] = await Promise.all([
  readProjectFile("src/lib/authStore.ts"),
  readProjectFile("src/lib/respAuth.ts"),
  readProjectFile("src/lib/respUsers.ts"),
  readProjectFile("src/routes/index.tsx"),
  readProjectFile("src/routes/login.tsx"),
  readProjectFile("src/routes/responsavel-login.tsx"),
  readProjectFile("src/routes/set-password.tsx"),
  readProjectFile("src/lib/auth/adminAuth.server.ts"),
]);

test("a base de responsáveis permanece vazia no bundle", () => {
  assert.match(respUsers, /export const RESP_USERS:\s*RespUser\[\]\s*=\s*\[\];/u);
  assert.doesNotMatch(respUsers, /\bsenha\s*:/iu);
});

test("contas administrativas não são compiladas no frontend", () => {
  assert.match(authStore, /export const ADMIN_USERS:\s*AdminUserRecord\[\]\s*=\s*\[\];/u);
  assert.match(authStore, /export const AUTH_SECURITY_LOCKDOWN\s*=\s*true/u);
  assert.doesNotMatch(adminLogin, /ADMIN_USERS|authenticateUser\(/u);
});

test("nenhum dos stores cria sessão em Web Storage", () => {
  assert.doesNotMatch(authStore, /(?:localStorage|sessionStorage)\.setItem/u);
  assert.doesNotMatch(respAuth, /(?:localStorage|sessionStorage)\.setItem/u);
});

test("entradas ainda não migradas continuam renderizando contenção", () => {
  for (const source of [homeRoute, responsibleLogin, setPassword]) {
    assert.match(source, /AuthLockdownPage/u);
  }
});

test("login administrativo usa exclusivamente a API server-side", () => {
  assert.match(adminLogin, /\/api\/v1\/auth\/status/u);
  assert.match(adminLogin, /\/api\/v1\/auth\/admin\/login/u);
  assert.match(adminAuthServer, /__Host-patrimonio_session/u);
  assert.match(adminAuthServer, /HttpOnly; Secure; SameSite=Lax/u);
});

test("autenticação cliente continua retornando falha segura", () => {
  assert.match(authStore, /reason:\s*"service_unavailable"/u);
  assert.match(respAuth, /export function findUser\([\s\S]*?return null;/u);
});
