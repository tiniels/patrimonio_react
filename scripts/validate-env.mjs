import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const envExamplePath = resolve(root, ".env.example");
const envExample = readFileSync(envExamplePath, "utf8");

const REQUIRED_EXAMPLE_KEYS = [
  "APP_ENV",
  "APP_BASE_URL",
  "AUTH_PROVIDER",
  "AUTH_LOCKDOWN_ENABLED",
  "SESSION_SECRET",
  "AUTH_SESSION_VERSION",
  "AUTH_SESSION_MAX_AGE_SECONDS",
  "ADMIN_BOOTSTRAP_LOGIN",
  "ADMIN_BOOTSTRAP_PASSWORD_HASH",
  "AUTH_RATE_LIMIT_WINDOW_SECONDS",
  "AUTH_RATE_LIMIT_MAX_ATTEMPTS",
];

const SECRET_KEY_PATTERN = /(SECRET|TOKEN|PASSWORD|PRIVATE|SERVICE_ROLE|DATABASE_URL|DSN|KEY)$/i;
const ENV_LINE_PATTERN = /^([A-Z0-9_]+)=(.*)$/gm;
const errors = [];
const warnings = [];

const exampleValues = new Map();
let match;
while ((match = ENV_LINE_PATTERN.exec(envExample)) !== null) {
  const [, key, rawValue] = match;
  exampleValues.set(key, rawValue.trim());
}

for (const key of REQUIRED_EXAMPLE_KEYS) {
  if (!exampleValues.has(key)) {
    errors.push(`.env.example não contém a chave obrigatória ${key}.`);
  }
}

for (const [key, value] of exampleValues.entries()) {
  if (SECRET_KEY_PATTERN.test(key) && value && key !== "AUTH_LOCKDOWN_ENABLED") {
    errors.push(`.env.example contém valor preenchido para variável sensível ${key}.`);
  }
}

const lockdownEnabled = readBoolean("AUTH_LOCKDOWN_ENABLED", true);
const provider = readEnv("AUTH_PROVIDER");

if (!lockdownEnabled) {
  requireRuntime("SESSION_SECRET", "autenticação desbloqueada exige segredo de sessão no ambiente seguro");
  requireMinLength("SESSION_SECRET", 32, "SESSION_SECRET deve possuir pelo menos 32 caracteres");
  requireRuntime("AUTH_PROVIDER", "autenticação desbloqueada exige provedor explícito");

  if (provider === "local-admin") {
    requireRuntime("ADMIN_BOOTSTRAP_LOGIN", "provedor local-admin exige login administrativo bootstrap");
    requireRuntime("ADMIN_BOOTSTRAP_PASSWORD_HASH", "provedor local-admin exige hash de senha bootstrap");
    requirePbkdf2Hash("ADMIN_BOOTSTRAP_PASSWORD_HASH");
  } else {
    errors.push("AUTH_PROVIDER deve ser local-admin até a homologação OIDC institucional.");
  }
} else {
  warnings.push("AUTH_LOCKDOWN_ENABLED=true: autenticação permanece bloqueada até configurar o provedor server-side.");
}

const publicSecretKeys = Object.keys(process.env).filter(
  (key) => key.startsWith("VITE_") && /(SECRET|TOKEN|PASSWORD|PRIVATE|SERVICE_ROLE|DATABASE|DSN|KEY)/i.test(key),
);

for (const key of publicSecretKeys) {
  errors.push(`Variável pública ${key} parece conter material sensível. Segredos não podem usar prefixo VITE_.`);
}

if (warnings.length) {
  console.warn("Avisos de ambiente:");
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (errors.length) {
  console.error("Falhas de validação de ambiente:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Validação de ambiente concluída sem falhas críticas.");

function readEnv(key) {
  return (process.env[key] ?? "").trim();
}

function readBoolean(key, defaultValue) {
  const value = readEnv(key).toLowerCase();
  if (["1", "true", "yes", "on"].includes(value)) return true;
  if (["0", "false", "no", "off"].includes(value)) return false;
  return defaultValue;
}

function requireRuntime(key, reason) {
  if (!readEnv(key)) {
    errors.push(`${key}: ${reason}.`);
  }
}

function requireMinLength(key, length, reason) {
  if (readEnv(key).length < length) {
    errors.push(`${key}: ${reason}.`);
  }
}

function requirePbkdf2Hash(key) {
  const value = readEnv(key);
  const parts = value.split("$");
  const iterations = Number(parts[1]);

  if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256" || !Number.isInteger(iterations)) {
    errors.push(`${key}: use o formato pbkdf2_sha256$iteracoes$saltBase64Url$hashBase64Url.`);
    return;
  }

  if (iterations < 120_000) {
    errors.push(`${key}: configure pelo menos 120000 iterações PBKDF2-SHA256.`);
  }
}
