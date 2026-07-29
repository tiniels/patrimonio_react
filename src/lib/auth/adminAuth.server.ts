const SESSION_COOKIE_NAME = "__Host-patrimonio_session";
const DEFAULT_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 5 * 60;
const DEFAULT_RATE_LIMIT_MAX_ATTEMPTS = 5;
const MAX_LOGIN_LENGTH = 160;
const MAX_PASSWORD_LENGTH = 512;
const MAX_REQUEST_BODY_BYTES = 8 * 1024;

const ADMIN_ROLES = ["admin", "contabilidade", "chefia", "galpao"] as const;

type AdminRole = (typeof ADMIN_ROLES)[number];
type RuntimeEnv = Record<string, unknown> | null | undefined;

interface AuthUser {
  id: string;
  name: string;
  login: string;
  role: AdminRole;
  roleLabel: string;
  cargo?: string;
  secretaria?: string;
  setor?: string;
  codigoSetor?: string;
  email?: string;
  lastLogin?: string;
}

interface SessionPayload {
  sub: string;
  login: string;
  name: string;
  role: AdminRole;
  roleLabel: string;
  cargo?: string;
  secretaria?: string;
  setor?: string;
  codigoSetor?: string;
  email?: string;
  iat: number;
  exp: number;
  sv: string;
  nonce: string;
  csrf: string;
}

interface AuthStatus {
  lockdownEnabled: boolean;
  configured: boolean;
  provider: string;
  cookieName: string;
  message: string;
}

interface AttemptBucket {
  count: number;
  resetAt: number;
}

const ATTEMPT_BUCKETS = new Map<string, AttemptBucket>();

export async function handleAuthApiRequest(
  request: Request,
  env: unknown,
): Promise<Response | null> {
  const url = new URL(request.url);

  if (!url.pathname.startsWith("/api/v1/auth/")) {
    return null;
  }

  const runtimeEnv = env as RuntimeEnv;
  const correlationId = getCorrelationId(request);

  if (url.pathname === "/api/v1/auth/status") {
    if (request.method !== "GET") {
      return methodNotAllowed(correlationId, ["GET"]);
    }
    return jsonResponse(getPublicStatus(runtimeEnv), { correlationId });
  }

  if (url.pathname === "/api/v1/auth/admin/login") {
    if (request.method !== "POST") {
      return methodNotAllowed(correlationId, ["POST"]);
    }
    return handleAdminLogin(request, runtimeEnv, correlationId);
  }

  if (url.pathname === "/api/v1/auth/session") {
    if (request.method === "GET") {
      return handleGetSession(request, runtimeEnv, correlationId);
    }
    if (request.method === "DELETE") {
      return handleLogout(request, runtimeEnv, correlationId);
    }
    return methodNotAllowed(correlationId, ["GET", "DELETE"]);
  }

  return problemResponse(404, "not_found", "Endpoint de autenticação não encontrado.", correlationId);
}

async function handleAdminLogin(
  request: Request,
  env: RuntimeEnv,
  correlationId: string,
): Promise<Response> {
  if (!isTrustedMutationRequest(request)) {
    auditAuthEvent("admin_login_blocked", correlationId, "cross_origin_request");
    return problemResponse(
      403,
      "request_origin_not_allowed",
      "A origem da solicitação não é permitida.",
      correlationId,
    );
  }

  const status = getPublicStatus(env);

  if (status.lockdownEnabled) {
    auditAuthEvent("admin_login_blocked", correlationId, "lockdown_enabled");
    return problemResponse(503, "auth_lockdown_enabled", status.message, correlationId);
  }

  if (!status.configured) {
    auditAuthEvent("admin_login_blocked", correlationId, "provider_not_configured");
    return problemResponse(503, "auth_provider_not_configured", status.message, correlationId);
  }

  const body = await readJsonBody(request, correlationId);
  if (!body.ok) return body.response;

  const login = getSafeString(body.data.login).trim().toLowerCase();
  const password = getSafeString(body.data.password);

  if (!login || !password || login.length > MAX_LOGIN_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    auditAuthEvent("admin_login_failed", correlationId, "invalid_payload");
    return problemResponse(
      400,
      "validation_failed",
      "Informe usuário e senha em formato válido.",
      correlationId,
    );
  }

  const rateLimit = checkRateLimit(request, login, env);
  if (!rateLimit.allowed) {
    auditAuthEvent("admin_login_rate_limited", correlationId, "too_many_attempts");
    return problemResponse(
      429,
      "too_many_attempts",
      "Muitas tentativas de acesso. Aguarde antes de tentar novamente.",
      correlationId,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  const user = await verifyLocalAdmin(env, login, password);
  if (!user) {
    recordFailedAttempt(request, login, env);
    auditAuthEvent("admin_login_failed", correlationId, "invalid_credentials");
    return problemResponse(
      401,
      "invalid_credentials",
      "Usuário ou senha inválidos.",
      correlationId,
    );
  }

  clearFailedAttempts(request, login);
  const session = await createSession(user, env);
  auditAuthEvent("admin_login_succeeded", correlationId, "session_created");

  return jsonResponse(
    {
      authenticated: true,
      user,
      csrfToken: session.csrfToken,
    },
    {
      status: 200,
      correlationId,
      headers: {
        "Set-Cookie": session.cookie,
      },
    },
  );
}

async function handleGetSession(
  request: Request,
  env: RuntimeEnv,
  correlationId: string,
): Promise<Response> {
  const sessionCookie = parseCookies(request.headers.get("cookie") ?? "")[SESSION_COOKIE_NAME];

  if (!sessionCookie) {
    return jsonResponse(
      { authenticated: false, user: null, csrfToken: null },
      { status: 200, correlationId },
    );
  }

  const payload = await verifySessionToken(sessionCookie, env);
  if (!payload) {
    return jsonResponse(
      { authenticated: false, user: null, csrfToken: null },
      {
        status: 200,
        correlationId,
        headers: {
          "Set-Cookie": buildExpiredSessionCookie(),
        },
      },
    );
  }

  return jsonResponse(
    {
      authenticated: true,
      user: sessionPayloadToUser(payload),
      csrfToken: payload.csrf,
    },
    { status: 200, correlationId },
  );
}

async function handleLogout(
  request: Request,
  env: RuntimeEnv,
  correlationId: string,
): Promise<Response> {
  if (!isTrustedMutationRequest(request)) {
    auditAuthEvent("admin_logout_blocked", correlationId, "cross_origin_request");
    return problemResponse(
      403,
      "request_origin_not_allowed",
      "A origem da solicitação não é permitida.",
      correlationId,
    );
  }

  const sessionCookie = parseCookies(request.headers.get("cookie") ?? "")[SESSION_COOKIE_NAME];
  if (!sessionCookie) {
    return emptyResponse(204, correlationId, {
      "Set-Cookie": buildExpiredSessionCookie(),
    });
  }

  const payload = await verifySessionToken(sessionCookie, env);
  if (!payload) {
    return emptyResponse(204, correlationId, {
      "Set-Cookie": buildExpiredSessionCookie(),
    });
  }

  const csrfToken = request.headers.get("x-csrf-token") ?? "";
  if (!csrfToken || !constantTimeEqual(utf8(csrfToken), utf8(payload.csrf))) {
    auditAuthEvent("admin_logout_blocked", correlationId, "csrf_validation_failed");
    return problemResponse(
      403,
      "csrf_validation_failed",
      "Não foi possível validar a solicitação de encerramento.",
      correlationId,
    );
  }

  auditAuthEvent("admin_logout", correlationId, "session_cookie_expired");
  return emptyResponse(204, correlationId, {
    "Set-Cookie": buildExpiredSessionCookie(),
    "Clear-Site-Data": '"cache", "storage"',
  });
}

function getPublicStatus(env: RuntimeEnv): AuthStatus {
  const lockdownEnabled = getBooleanEnv(env, "AUTH_LOCKDOWN_ENABLED", true);
  const provider = getEnvValue(env, "AUTH_PROVIDER") || "not-configured";
  const sessionSecret = getEnvValue(env, "SESSION_SECRET");
  const login = getEnvValue(env, "ADMIN_BOOTSTRAP_LOGIN");
  const passwordHash = getEnvValue(env, "ADMIN_BOOTSTRAP_PASSWORD_HASH");
  const configured =
    !lockdownEnabled &&
    provider === "local-admin" &&
    sessionSecret.length >= 32 &&
    login.length > 0 &&
    isSupportedPasswordHash(passwordHash) &&
    isWebCryptoAvailable();

  return {
    lockdownEnabled,
    configured,
    provider: configured ? "server-side" : "unavailable",
    cookieName: SESSION_COOKIE_NAME,
    message: getStatusMessage(lockdownEnabled, configured),
  };
}

function getStatusMessage(lockdownEnabled: boolean, configured: boolean): string {
  if (lockdownEnabled) {
    return "O acesso administrativo permanece bloqueado até a conclusão da configuração segura.";
  }
  if (configured) {
    return "Autenticação administrativa server-side disponível.";
  }
  return "O provedor de autenticação administrativa ainda não está configurado.";
}

async function verifyLocalAdmin(
  env: RuntimeEnv,
  login: string,
  password: string,
): Promise<AuthUser | null> {
  const configuredLogin = getEnvValue(env, "ADMIN_BOOTSTRAP_LOGIN").trim().toLowerCase();
  const passwordHash = getEnvValue(env, "ADMIN_BOOTSTRAP_PASSWORD_HASH");

  if (!configuredLogin || login !== configuredLogin) {
    await burnPasswordVerificationTime(passwordHash, password);
    return null;
  }

  const passwordMatches = await verifyPbkdf2Password(password, passwordHash);
  if (!passwordMatches) return null;

  const role = parseAdminRole(getEnvValue(env, "ADMIN_BOOTSTRAP_ROLE"));
  const name = getEnvValue(env, "ADMIN_BOOTSTRAP_DISPLAY_NAME") || "Administrador do Patrimônio";

  return {
    id: getEnvValue(env, "ADMIN_BOOTSTRAP_ID") || `admin-${stableTextHash(configuredLogin)}`,
    name,
    login: configuredLogin,
    role,
    roleLabel: getEnvValue(env, "ADMIN_BOOTSTRAP_ROLE_LABEL") || roleToLabel(role),
    cargo: getOptionalEnvValue(env, "ADMIN_BOOTSTRAP_CARGO"),
    secretaria: getOptionalEnvValue(env, "ADMIN_BOOTSTRAP_SECRETARIA"),
    setor: getOptionalEnvValue(env, "ADMIN_BOOTSTRAP_SETOR"),
    codigoSetor: getOptionalEnvValue(env, "ADMIN_BOOTSTRAP_CODIGO_SETOR"),
    email: getOptionalEnvValue(env, "ADMIN_BOOTSTRAP_EMAIL"),
    lastLogin: new Date().toISOString(),
  };
}

async function createSession(
  user: AuthUser,
  env: RuntimeEnv,
): Promise<{ cookie: string; csrfToken: string }> {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = getNumberEnv(
    env,
    "AUTH_SESSION_MAX_AGE_SECONDS",
    DEFAULT_SESSION_MAX_AGE_SECONDS,
  );
  const csrfToken = randomToken(24);
  const payload: SessionPayload = {
    sub: user.id,
    login: user.login,
    name: user.name,
    role: user.role,
    roleLabel: user.roleLabel,
    cargo: user.cargo,
    secretaria: user.secretaria,
    setor: user.setor,
    codigoSetor: user.codigoSetor,
    email: user.email,
    iat: now,
    exp: now + maxAge,
    sv: getSessionVersion(env),
    nonce: randomToken(18),
    csrf: csrfToken,
  };

  const token = await signSessionPayload(payload, env);
  return {
    cookie: buildSessionCookie(token, maxAge),
    csrfToken,
  };
}

async function signSessionPayload(payload: SessionPayload, env: RuntimeEnv): Promise<string> {
  const encodedPayload = base64UrlEncode(utf8(JSON.stringify(payload)));
  const signature = await hmacSha256(encodedPayload, getEnvValue(env, "SESSION_SECRET"));
  return `${encodedPayload}.${base64UrlEncode(signature)}`;
}

async function verifySessionToken(
  token: string,
  env: RuntimeEnv,
): Promise<SessionPayload | null> {
  try {
    const [encodedPayload, encodedSignature] = token.split(".");
    if (!encodedPayload || !encodedSignature) return null;

    const expectedSignature = await hmacSha256(
      encodedPayload,
      getEnvValue(env, "SESSION_SECRET"),
    );
    const receivedSignature = decodeBase64Url(encodedSignature);
    if (!constantTimeEqual(expectedSignature, receivedSignature)) return null;

    const decodedPayload = new TextDecoder().decode(decodeBase64Url(encodedPayload));
    const payload = JSON.parse(decodedPayload) as SessionPayload;
    const now = Math.floor(Date.now() / 1000);

    if (
      !payload.sub ||
      !payload.login ||
      !payload.csrf ||
      payload.exp <= now ||
      payload.sv !== getSessionVersion(env)
    ) {
      return null;
    }
    if (!ADMIN_ROLES.includes(payload.role)) return null;
    return payload;
  } catch {
    return null;
  }
}

function sessionPayloadToUser(payload: SessionPayload): AuthUser {
  return {
    id: payload.sub,
    name: payload.name,
    login: payload.login,
    role: payload.role,
    roleLabel: payload.roleLabel,
    cargo: payload.cargo,
    secretaria: payload.secretaria,
    setor: payload.setor,
    codigoSetor: payload.codigoSetor,
    email: payload.email,
  };
}

async function verifyPbkdf2Password(password: string, encodedHash: string): Promise<boolean> {
  try {
    if (!isSupportedPasswordHash(encodedHash) || !isWebCryptoAvailable()) return false;

    const [, rawIterations, rawSalt, rawHash] = encodedHash.split("$");
    const iterations = Number(rawIterations);
    if (!Number.isInteger(iterations) || iterations < 120_000 || iterations > 1_200_000) {
      return false;
    }

    const salt = decodeBase64Url(rawSalt);
    const expectedHash = decodeBase64Url(rawHash);
    const actualHash = await derivePbkdf2Sha256(
      password,
      salt,
      iterations,
      expectedHash.byteLength * 8,
    );
    return constantTimeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}

async function burnPasswordVerificationTime(
  encodedHash: string,
  password: string,
): Promise<void> {
  if (isSupportedPasswordHash(encodedHash)) {
    await verifyPbkdf2Password(password, encodedHash);
  }
}

async function derivePbkdf2Sha256(
  password: string,
  salt: Uint8Array,
  iterations: number,
  lengthBits: number,
): Promise<Uint8Array> {
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    utf8(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    keyMaterial,
    lengthBits,
  );
  return new Uint8Array(derivedBits);
}

async function hmacSha256(data: string, secret: string): Promise<Uint8Array> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    utf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await globalThis.crypto.subtle.sign("HMAC", key, utf8(data)));
}

function checkRateLimit(
  request: Request,
  login: string,
  env: RuntimeEnv,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const key = getAttemptKey(request, login);
  const now = Date.now();
  const current = ATTEMPT_BUCKETS.get(key);
  const maxAttempts = getNumberEnv(
    env,
    "AUTH_RATE_LIMIT_MAX_ATTEMPTS",
    DEFAULT_RATE_LIMIT_MAX_ATTEMPTS,
  );

  if (!current || current.resetAt <= now) {
    if (current) ATTEMPT_BUCKETS.delete(key);
    return { allowed: true };
  }

  if (current.count >= maxAttempts) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  return { allowed: true };
}

function recordFailedAttempt(request: Request, login: string, env: RuntimeEnv): void {
  const key = getAttemptKey(request, login);
  const now = Date.now();
  const windowMs =
    getNumberEnv(
      env,
      "AUTH_RATE_LIMIT_WINDOW_SECONDS",
      DEFAULT_RATE_LIMIT_WINDOW_SECONDS,
    ) * 1000;
  const current = ATTEMPT_BUCKETS.get(key);

  if (!current || current.resetAt <= now) {
    ATTEMPT_BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  ATTEMPT_BUCKETS.set(key, {
    count: current.count + 1,
    resetAt: current.resetAt,
  });
}

function clearFailedAttempts(request: Request, login: string): void {
  ATTEMPT_BUCKETS.delete(getAttemptKey(request, login));
}

function getAttemptKey(request: Request, login: string): string {
  return `${getClientAddress(request)}:${stableTextHash(login)}`;
}

function getClientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("x-vercel-forwarded-for") || forwarded || "unknown";
}

function isTrustedMutationRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") return false;

  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function readJsonBody(
  request: Request,
  correlationId: string,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; response: Response }> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      response: problemResponse(
        415,
        "unsupported_media_type",
        "Envie a requisição como JSON.",
        correlationId,
      ),
    };
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BODY_BYTES) {
    return {
      ok: false,
      response: problemResponse(
        413,
        "request_too_large",
        "A solicitação excede o limite permitido.",
        correlationId,
      ),
    };
  }

  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("invalid_json_object");
    }
    return { ok: true, data: body as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      response: problemResponse(
        400,
        "invalid_json",
        "JSON inválido ou malformado.",
        correlationId,
      ),
    };
  }
}

function jsonResponse(
  data: unknown,
  options: {
    status?: number;
    correlationId?: string;
    headers?: Record<string, string>;
  } = {},
): Response {
  const headers = buildResponseHeaders(options.correlationId, options.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), {
    status: options.status ?? 200,
    headers,
  });
}

function emptyResponse(
  status: number,
  correlationId: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(null, {
    status,
    headers: buildResponseHeaders(correlationId, extraHeaders),
  });
}

function buildResponseHeaders(
  correlationId?: string,
  extraHeaders: Record<string, string> = {},
): Headers {
  const headers = new Headers({
    "cache-control": "no-store",
    pragma: "no-cache",
    "x-content-type-options": "nosniff",
    ...extraHeaders,
  });
  if (correlationId) headers.set("x-correlation-id", correlationId);
  return headers;
}

function problemResponse(
  status: number,
  code: string,
  message: string,
  correlationId: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return jsonResponse(
    {
      ok: false,
      code,
      message,
      correlationId,
    },
    {
      status,
      correlationId,
      headers: extraHeaders,
    },
  );
}

function methodNotAllowed(correlationId: string, methods: string[]): Response {
  return problemResponse(405, "method_not_allowed", "Método não permitido.", correlationId, {
    allow: methods.join(", "),
  });
}

function buildSessionCookie(token: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

function buildExpiredSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, part) => {
    const [rawName, ...valueParts] = part.trim().split("=");
    if (!rawName) return cookies;
    cookies[rawName] = valueParts.join("=");
    return cookies;
  }, {});
}

function getEnvValue(env: RuntimeEnv, key: string): string {
  if (env && typeof env === "object") {
    const value = env[key];
    if (typeof value === "string") return value.trim();
  }

  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return runtime.process?.env?.[key]?.trim() ?? "";
}

function getOptionalEnvValue(env: RuntimeEnv, key: string): string | undefined {
  const value = getEnvValue(env, key);
  return value || undefined;
}

function getBooleanEnv(env: RuntimeEnv, key: string, defaultValue: boolean): boolean {
  const value = getEnvValue(env, key).toLowerCase();
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  return defaultValue;
}

function getNumberEnv(env: RuntimeEnv, key: string, defaultValue: number): number {
  const rawValue = Number(getEnvValue(env, key));
  return Number.isFinite(rawValue) && rawValue > 0 ? Math.floor(rawValue) : defaultValue;
}

function getSessionVersion(env: RuntimeEnv): string {
  return getEnvValue(env, "AUTH_SESSION_VERSION") || "v1";
}

function parseAdminRole(value: string): AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole) ? (value as AdminRole) : "admin";
}

function roleToLabel(role: AdminRole): string {
  const labels: Record<AdminRole, string> = {
    admin: "Administrador",
    contabilidade: "Contabilidade",
    chefia: "Chefia",
    galpao: "Galpão Central",
  };
  return labels[role];
}

function isSupportedPasswordHash(value: string): boolean {
  const parts = value.split("$");
  return parts.length === 4 && parts[0] === "pbkdf2_sha256" && parts.every(Boolean);
}

function isWebCryptoAvailable(): boolean {
  return Boolean(globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues);
}

function getSafeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < left.byteLength; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function randomToken(bytesLength: number): string {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("secure_random_unavailable");
  }
  const bytes = new Uint8Array(bytesLength);
  globalThis.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function stableTextHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function getCorrelationId(request: Request): string {
  const provided = request.headers.get("x-correlation-id")?.trim();
  if (provided && /^[A-Za-z0-9._:-]{1,100}$/u.test(provided)) {
    return provided;
  }

  try {
    return `req_${randomToken(12)}`;
  } catch {
    return `req_${Date.now().toString(36)}`;
  }
}

function auditAuthEvent(type: string, correlationId: string, reason: string): void {
  console.info(
    JSON.stringify({
      type,
      reason,
      correlationId,
      at: new Date().toISOString(),
      source: "auth-admin",
    }),
  );
}
