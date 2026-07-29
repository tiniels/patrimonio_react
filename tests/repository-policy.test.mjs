import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

const [
  packageJsonText,
  packageLockText,
  nodeVersion,
  npmConfig,
  workflow,
  codeowners,
  dependabot,
  pullRequestTemplate,
] = await Promise.all([
  read("package.json"),
  read("package-lock.json"),
  read(".nvmrc"),
  read(".npmrc"),
  read(".github/workflows/ci.yml"),
  read(".github/CODEOWNERS"),
  read(".github/dependabot.yml"),
  read(".github/pull_request_template.md"),
]);

const packageJson = JSON.parse(packageJsonText);
const packageLock = JSON.parse(packageLockText);

test("Node e instalação congelada são consistentes", () => {
  assert.equal(nodeVersion.trim(), "24");
  assert.equal(packageJson.engines.node, "24.x");
  assert.match(npmConfig, /^engine-strict=true$/mu);
  assert.match(npmConfig, /^package-lock=true$/mu);
  assert.equal(packageLock.lockfileVersion, 3);
  assert.deepEqual(packageLock.packages[""].dependencies, packageJson.dependencies);
  assert.deepEqual(packageLock.packages[""].devDependencies, packageJson.devDependencies);
});

test("scripts obrigatórios existem e não usam versões flutuantes", () => {
  for (const script of [
    "build",
    "test",
    "typecheck",
    "lint",
    "format:check",
    "check:env",
    "check:secrets",
    "check:openapi",
    "audit:production",
    "verify",
  ]) {
    assert.equal(typeof packageJson.scripts[script], "string", `Script ausente: ${script}`);
  }

  const dependencyVersions = [
    ...Object.values(packageJson.dependencies),
    ...Object.values(packageJson.devDependencies),
  ];
  assert.ok(dependencyVersions.every((version) => version !== "latest" && version !== "*"));
  assert.match(packageJson.scripts["check:openapi"], /@redocly\/cli@2\.40\.0/u);
});

test("actions estão pinadas por SHA e com permissões mínimas", () => {
  assert.doesNotMatch(workflow, /pull_request_target/u);
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/u);
  assert.match(workflow, /run:\s*npm ci/u);

  const actionReferences = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+).*$/gmu)].map(
    (match) => match[1],
  );
  assert.ok(actionReferences.length >= 2);
  for (const reference of actionReferences) {
    assert.match(reference, /@[a-f0-9]{40}$/u, `Action não pinada por SHA: ${reference}`);
  }
});

test("governança mínima está presente", () => {
  assert.match(codeowners, /@tiniels/u);
  assert.match(dependabot, /package-ecosystem:\s*npm/u);
  assert.match(dependabot, /package-ecosystem:\s*github-actions/u);
  assert.match(pullRequestTemplate, /Nenhum segredo, credencial, token ou dado pessoal real/u);
  assert.match(pullRequestTemplate, /Validação Vercel/u);
});
