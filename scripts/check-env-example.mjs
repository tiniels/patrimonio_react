import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const PUBLIC_PREFIXES = ["VITE_", "PUBLIC_", "NEXT_PUBLIC_"];
const SECRET_NAME_PATTERN =
  /(?:SECRET|PASSWORD|PASSCODE|TOKEN|PRIVATE_KEY|SERVICE_ROLE|DATABASE_URL|CLIENT_SECRET|DSN)$/;

const REQUIRED_KEYS = new Set([
  "APP_ENV",
  "APP_BASE_URL",
  "AUTH_PROVIDER",
  "AUTH_ISSUER_URL",
  "AUTH_CLIENT_ID",
  "AUTH_CLIENT_SECRET",
  "AUTH_CALLBACK_URL",
  "SESSION_SECRET",
  "AUTH_SESSION_VERSION",
  "AUTH_SESSION_MAX_AGE_SECONDS",
  "ADMIN_BOOTSTRAP_ID",
  "ADMIN_BOOTSTRAP_LOGIN",
  "ADMIN_BOOTSTRAP_PASSWORD_HASH",
  "ADMIN_BOOTSTRAP_DISPLAY_NAME",
  "ADMIN_BOOTSTRAP_ROLE",
  "ADMIN_BOOTSTRAP_ROLE_LABEL",
  "ADMIN_BOOTSTRAP_CARGO",
  "ADMIN_BOOTSTRAP_SECRETARIA",
  "ADMIN_BOOTSTRAP_SETOR",
  "ADMIN_BOOTSTRAP_CODIGO_SETOR",
  "ADMIN_BOOTSTRAP_EMAIL",
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SENTRY_DSN",
  "OTEL_EXPORTER_OTLP_ENDPOINT",
  "AUTH_LOCKDOWN_ENABLED",
  "AUTH_RATE_LIMIT_WINDOW_SECONDS",
  "AUTH_RATE_LIMIT_MAX_ATTEMPTS",
]);

const SAFE_DEFAULTS = new Map([["AUTH_LOCKDOWN_ENABLED", "true"]]);

function issue(code, message, line = null, key = null) {
  return { code, message, line, key };
}

export function validateEnvExample(content) {
  const issues = [];
  const seen = new Map();
  const lines = content.split(/\r?\n/u);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (line === "" || line.startsWith("#")) {
      return;
    }

    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/u.exec(line);
    if (!match) {
      issues.push(
        issue(
          "invalid_declaration",
          "Use KEY=VALUE com nome em maiúsculas; comentários devem ocupar a própria linha.",
          lineNumber,
        ),
      );
      return;
    }

    const [, key, rawValue] = match;
    const value = rawValue.trim();

    if (seen.has(key)) {
      issues.push(
        issue(
          "duplicate_key",
          `A variável ${key} já foi declarada na linha ${seen.get(key)}.`,
          lineNumber,
          key,
        ),
      );
      return;
    }

    seen.set(key, lineNumber);

    const hasPublicPrefix = PUBLIC_PREFIXES.some((prefix) => key.startsWith(prefix));
    const looksSecret = SECRET_NAME_PATTERN.test(key);

    if (hasPublicPrefix && looksSecret) {
      issues.push(
        issue(
          "public_secret_name",
          `A variável ${key} combina prefixo público com material potencialmente secreto.`,
          lineNumber,
          key,
        ),
      );
    }

    if (looksSecret && value !== "") {
      issues.push(
        issue(
          "secret_value_present",
          `A variável sensível ${key} deve permanecer sem valor no arquivo de exemplo.`,
          lineNumber,
          key,
        ),
      );
      return;
    }

    if (value === "") {
      return;
    }

    const allowedDefault = SAFE_DEFAULTS.get(key);
    if (allowedDefault === undefined || value !== allowedDefault) {
      issues.push(
        issue(
          "unsafe_default",
          `A variável ${key} não pode conter um valor de exemplo ou default não aprovado.`,
          lineNumber,
          key,
        ),
      );
    }
  });

  for (const key of REQUIRED_KEYS) {
    if (!seen.has(key)) {
      issues.push(
        issue(
          "missing_required_key",
          `A variável obrigatória ${key} não está documentada em .env.example.`,
          null,
          key,
        ),
      );
    }
  }

  return issues;
}

export async function checkEnvExample(filePath = ".env.example") {
  const content = await readFile(filePath, "utf8");
  return validateEnvExample(content);
}

function formatIssue(item) {
  const location = item.line ? `linha ${item.line}` : "arquivo";
  return `- [${item.code}] ${location}: ${item.message}`;
}

async function main() {
  const filePath = process.argv[2] ?? ".env.example";

  try {
    const issues = await checkEnvExample(filePath);
    if (issues.length > 0) {
      console.error(`Falha na política de ambiente (${filePath}):`);
      for (const item of issues) {
        console.error(formatIssue(item));
      }
      process.exitCode = 1;
      return;
    }

    console.log(`Política de ambiente validada: ${filePath}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    console.error(`Não foi possível validar ${filePath}: ${message}`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  await main();
}
