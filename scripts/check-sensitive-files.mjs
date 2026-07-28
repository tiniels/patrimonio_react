import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".output",
  ".tanstack",
  ".vinxi",
  ".vercel",
  ".wrangler",
  "coverage",
  "dist",
  "node_modules",
]);

const SKIPPED_FILES = new Set([
  "package-lock.json",
  "scripts/check-sensitive-files.mjs",
  "tests/security-policy.test.mjs",
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".example",
  ".html",
  ".ini",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".toml",
  ".ts",
  ".tsx",
  ".txt",
  ".yaml",
  ".yml",
]);

const CONTENT_RULES = [
  {
    code: "private_key_material",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/u,
  },
  {
    code: "aws_access_key",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/u,
  },
  {
    code: "github_token",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,255}\b/u,
  },
  {
    code: "slack_token",
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,255}\b/u,
  },
  {
    code: "jwt_literal",
    pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/u,
  },
  {
    code: "sensitive_literal_assignment",
    pattern:
      /\b(?:password|passwd|senha|secret|token|api[_-]?key|client[_-]?secret|service[_-]?role[_-]?key)\b\s*[:=]\s*["'`][^"'`\r\n]{6,}["'`]/iu,
  },
  {
    code: "public_secret_variable",
    pattern:
      /\b(?:VITE_|PUBLIC_|NEXT_PUBLIC_)[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|SERVICE_ROLE)[A-Z0-9_]*\b/u,
  },
];

function normalizePath(filePath) {
  return filePath.split(sep).join("/");
}

function sensitiveFilenameRule(name) {
  if (name === ".env" || (name.startsWith(".env.") && name !== ".env.example")) {
    return "tracked_environment_file";
  }

  if (/^(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)(?:\.pub)?$/u.test(name)) {
    return "ssh_key_file";
  }

  if (/\.(?:jks|keystore|p12|pfx|pem)$/iu.test(name)) {
    return "credential_container_file";
  }

  if (/\.(?:der|key)$/iu.test(name)) {
    return "private_key_file";
  }

  return null;
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split("\n").length;
}

export function findTextFindings(content, filePath = "<memory>") {
  const findings = [];

  for (const rule of CONTENT_RULES) {
    const match = rule.pattern.exec(content);
    if (match) {
      findings.push({
        path: filePath,
        rule: rule.code,
        line: lineNumberAt(content, match.index),
      });
    }
  }

  return findings;
}

async function collectFiles(directory, root, findings, files) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && SKIPPED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const absolutePath = join(directory, entry.name);
    const relativePath = normalizePath(relative(root, absolutePath));

    if (entry.isDirectory()) {
      await collectFiles(absolutePath, root, findings, files);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const filenameRule = sensitiveFilenameRule(entry.name);
    if (filenameRule) {
      findings.push({ path: relativePath, rule: filenameRule, line: null });
    }

    if (!SKIPPED_FILES.has(relativePath) && TEXT_EXTENSIONS.has(extname(entry.name))) {
      files.push({ absolutePath, relativePath });
    }
  }
}

export async function scanRepository(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const findings = [];
  const files = [];

  await collectFiles(root, root, findings, files);

  for (const file of files) {
    try {
      const content = await readFile(file.absolutePath, "utf8");
      findings.push(...findTextFindings(content, file.relativePath));
    } catch {
      findings.push({ path: file.relativePath, rule: "unreadable_text_file", line: null });
    }
  }

  return findings;
}

function formatFinding(finding) {
  const location = finding.line ? `${finding.path}:${finding.line}` : finding.path;
  return `- ${location} [${finding.rule}]`;
}

async function main() {
  try {
    const findings = await scanRepository(process.argv[2] ?? process.cwd());
    if (findings.length > 0) {
      console.error("Arquivos ou padrões sensíveis foram detectados (conteúdo omitido):");
      for (const finding of findings) {
        console.error(formatFinding(finding));
      }
      process.exitCode = 1;
      return;
    }

    console.log("Varredura preventiva concluída sem material sensível conhecido.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    console.error(`Falha na varredura preventiva: ${message}`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  await main();
}
