import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contract = await readFile(
  new URL("../packages/contracts/openapi/patrimonio-v1.yaml", import.meta.url),
  "utf8",
);

test("o contrato declara OpenAPI 3.1 e a versão da API", () => {
  assert.match(contract, /^openapi:\s*3\.1\.0/mu);
  assert.match(contract, /url:\s*\/api\/v1/u);
});

test("sessão e CSRF são controles explícitos", () => {
  assert.match(contract, /sessionCookie:/u);
  assert.match(contract, /name:\s*__Host-patrimonio_session/u);
  assert.match(contract, /csrfHeader:/u);
  assert.match(contract, /name:\s*X-CSRF-Token/u);
});

test("comandos críticos exigem idempotência e concorrência", () => {
  assert.match(contract, /name:\s*Idempotency-Key/u);
  assert.match(contract, /name:\s*If-Match/u);
  assert.match(contract, /"428":/u);
  assert.match(contract, /"409":/u);
});

test("o contrato cobre os recursos iniciais do Dia 2", () => {
  for (const path of [
    "/assets:",
    "/assets/{assetId}:",
    "/transfers:",
    "/transfers/{transferId}/effect:",
    "/inventory-cycles:",
    "/report-jobs:",
  ]) {
    assert.ok(contract.includes(path), `Caminho obrigatório ausente: ${path}`);
  }
});

test("erros usam Problem Details e correlation ID", () => {
  assert.match(contract, /ProblemDetails:/u);
  assert.match(contract, /application\/problem\+json/u);
  assert.match(contract, /correlationId:/u);
  assert.match(contract, /X-Correlation-ID/u);
});
