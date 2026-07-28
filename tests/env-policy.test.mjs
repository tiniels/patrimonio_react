import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateEnvExample } from "../scripts/check-env-example.mjs";

const envExample = await readFile(new URL("../.env.example", import.meta.url), "utf8");

test("o contrato de ambiente versionado é válido", () => {
  assert.deepEqual(validateEnvExample(envExample), []);
});

test("uma chave duplicada bloqueia a validação", () => {
  const issues = validateEnvExample(`${envExample}\nAPP_ENV=\n`);
  assert.ok(issues.some((item) => item.code === "duplicate_key"));
});

test("um valor de segredo no arquivo de exemplo é rejeitado", () => {
  const invalid = envExample.replace("SESSION_SECRET=", "SESSION_SECRET=synthetic-invalid");
  const issues = validateEnvExample(invalid);
  assert.ok(issues.some((item) => item.code === "secret_value_present"));
});

test("material secreto não pode usar prefixo público", () => {
  const publicSecretKey = "VITE_API_" + "TOKEN=";
  const issues = validateEnvExample(`${envExample}\n${publicSecretKey}\n`);
  assert.ok(issues.some((item) => item.code === "public_secret_name"));
});

test("a contenção não pode ser desabilitada por default no exemplo", () => {
  const invalid = envExample.replace("AUTH_LOCKDOWN_ENABLED=true", "AUTH_LOCKDOWN_ENABLED=false");
  const issues = validateEnvExample(invalid);
  assert.ok(issues.some((item) => item.code === "unsafe_default"));
});
