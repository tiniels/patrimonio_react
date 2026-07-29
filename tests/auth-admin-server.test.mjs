import assert from "node:assert/strict";
import test from "node:test";
import { handleAuthApiRequest } from "../src/lib/auth/adminAuth.server.ts";

const APP_ORIGIN = "https://patrimonio.test";
const VALID_PASSWORD = ["Synthetic", "Pass", "2026"].join("-");
const INVALID_PASSWORD = ["invalid", "credential"].join("-");
const PASSWORD_HASH = await createPasswordHash(VALID_PASSWORD);

const CONFIGURED_ENV = {
  AUTH_LOCKDOWN_ENABLED: "false",
  AUTH_PROVIDER: "local-admin",
  SESSION_SECRET: "synthetic-session-secret-with-at-least-32-characters",
  AUTH_SESSION_VERSION: "test-v1",
  AUTH_SESSION_MAX_AGE_SECONDS: "3600",
  AUTH_RATE_LIMIT_WINDOW_SECONDS: "60",
  AUTH_RATE_LIMIT_MAX_ATTEMPTS: "5",
  ADMIN_BOOTSTRAP_ID: "synthetic-admin-id",
  ADMIN_BOOTSTRAP_LOGIN: "admin.synthetic",
  ADMIN_BOOTSTRAP_PASSWORD_HASH: PASSWORD_HASH,
  ADMIN_BOOTSTRAP_DISPLAY_NAME: "Administrador Sintético",
  ADMIN_BOOTSTRAP_ROLE: "admin",
};

test("lockdown é o estado padrão quando o ambiente não está configurado", async () => {
  const response = await requestAuth("/api/v1/auth/status", { env: {} });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.lockdownEnabled, true);
  assert.equal(payload.configured, false);
});

test("login bloqueado não valida nem aceita credenciais", async () => {
  const response = await requestAuth("/api/v1/auth/admin/login", {
    method: "POST",
    env: {},
    body: { login: "admin.synthetic", password: VALID_PASSWORD },
    ip: "198.51.100.10",
  });
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.equal(payload.code, "auth_lockdown_enabled");
  assert.equal(response.headers.get("set-cookie"), null);
});

test("requisição de login com origem externa é rejeitada", async () => {
  const response = await requestAuth("/api/v1/auth/admin/login", {
    method: "POST",
    env: CONFIGURED_ENV,
    origin: "https://external.invalid",
    body: { login: "admin.synthetic", password: VALID_PASSWORD },
    ip: "198.51.100.11",
  });

  assert.equal(response.status, 403);
});

test("login, sessão HttpOnly e logout com CSRF funcionam de ponta a ponta", async () => {
  const loginResponse = await requestAuth("/api/v1/auth/admin/login", {
    method: "POST",
    env: CONFIGURED_ENV,
    body: { login: "admin.synthetic", password: VALID_PASSWORD },
    ip: "198.51.100.12",
  });
  const loginPayload = await loginResponse.json();
  const setCookie = loginResponse.headers.get("set-cookie") ?? "";

  assert.equal(loginResponse.status, 200);
  assert.equal(loginPayload.authenticated, true);
  assert.equal(loginPayload.user.login, "admin.synthetic");
  assert.equal(typeof loginPayload.csrfToken, "string");
  assert.match(setCookie, /^__Host-patrimonio_session=/u);
  assert.match(setCookie, /Path=\//u);
  assert.match(setCookie, /HttpOnly/u);
  assert.match(setCookie, /Secure/u);
  assert.match(setCookie, /SameSite=Lax/u);

  const cookie = setCookie.split(";", 1)[0];
  const sessionResponse = await requestAuth("/api/v1/auth/session", {
    env: CONFIGURED_ENV,
    cookie,
  });
  const sessionPayload = await sessionResponse.json();

  assert.equal(sessionResponse.status, 200);
  assert.equal(sessionPayload.authenticated, true);
  assert.equal(sessionPayload.user.role, "admin");
  assert.equal(sessionPayload.csrfToken, loginPayload.csrfToken);

  const rejectedLogout = await requestAuth("/api/v1/auth/session", {
    method: "DELETE",
    env: CONFIGURED_ENV,
    cookie,
  });
  assert.equal(rejectedLogout.status, 403);

  const logoutResponse = await requestAuth("/api/v1/auth/session", {
    method: "DELETE",
    env: CONFIGURED_ENV,
    cookie,
    csrfToken: sessionPayload.csrfToken,
  });
  const expiredCookie = logoutResponse.headers.get("set-cookie") ?? "";

  assert.equal(logoutResponse.status, 204);
  assert.match(expiredCookie, /^__Host-patrimonio_session=/u);
  assert.match(expiredCookie, /Max-Age=0/u);
});

test("tentativas inválidas são limitadas sem enumerar usuário", async () => {
  const rateLimitedEnv = {
    ...CONFIGURED_ENV,
    AUTH_RATE_LIMIT_MAX_ATTEMPTS: "2",
  };
  const options = {
    method: "POST",
    env: rateLimitedEnv,
    body: { login: "unknown.synthetic", password: INVALID_PASSWORD },
    ip: "198.51.100.13",
  };

  const first = await requestAuth("/api/v1/auth/admin/login", options);
  const second = await requestAuth("/api/v1/auth/admin/login", options);
  const third = await requestAuth("/api/v1/auth/admin/login", options);
  const firstPayload = await first.json();
  const secondPayload = await second.json();
  const thirdPayload = await third.json();

  assert.equal(first.status, 401);
  assert.equal(second.status, 401);
  assert.equal(firstPayload.message, secondPayload.message);
  assert.equal(third.status, 429);
  assert.equal(thirdPayload.code, "too_many_attempts");
  assert.match(third.headers.get("retry-after") ?? "", /^\d+$/u);
});

async function requestAuth(
  path,
  {
    method = "GET",
    env = {},
    body,
    cookie,
    csrfToken,
    origin = APP_ORIGIN,
    ip = "198.51.100.1",
  } = {},
) {
  const headers = new Headers({
    accept: "application/json",
    origin,
    "x-forwarded-for": ip,
  });

  if (body !== undefined) headers.set("content-type", "application/json");
  if (cookie) headers.set("cookie", cookie);
  if (csrfToken) headers.set("x-csrf-token", csrfToken);

  const response = await handleAuthApiRequest(
    new Request(`${APP_ORIGIN}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
  );

  assert.ok(response instanceof Response);
  return response;
}

async function createPasswordHash(password) {
  const salt = new TextEncoder().encode("synthetic-test-salt");
  const iterations = 120_000;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256),
  );

  return `pbkdf2_sha256$${iterations}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}
