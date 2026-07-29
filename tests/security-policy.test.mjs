import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { findTextFindings, scanRepository } from "../scripts/check-sensitive-files.mjs";

test("atribuição literal a campo sensível é detectada sem expor o valor", () => {
  const findings = findTextFindings('const password = "synthetic-only-value";', "fixture.ts");
  assert.ok(findings.some((item) => item.rule === "sensitive_literal_assignment"));
  assert.ok(findings.every((item) => !JSON.stringify(item).includes("synthetic-only-value")));
});

test("material de chave privada é detectado", () => {
  const findings = findTextFindings(
    "-----BEGIN PRIVATE KEY-----\nsynthetic\n-----END PRIVATE KEY-----",
    "fixture.pem",
  );
  assert.ok(findings.some((item) => item.rule === "private_key_material"));
});

test("mensagens de contenção sem credencial não geram falso positivo", () => {
  const findings = findTextFindings(
    'throw new Error("Redefinição de senha indisponível no navegador.");',
    "fixture.ts",
  );
  assert.deepEqual(findings, []);
});

test("arquivo .env rastreável é bloqueado pelo scanner", async () => {
  const directory = await mkdtemp(join(tmpdir(), "patrimonio-sensitive-policy-"));

  try {
    await writeFile(join(directory, ".env"), "SYNTHETIC=\n", "utf8");
    const findings = await scanRepository(directory);
    assert.ok(findings.some((item) => item.rule === "tracked_environment_file"));
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
