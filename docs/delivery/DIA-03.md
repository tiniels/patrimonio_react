# Dia 3 — Fundação de entrega, ambientes e quality gates

**Branch:** `agent/dia-3-fundacao-ci`  
**Issue de entrega:** #5  
**Issue administrativa:** #7  
**PR:** #6  
**Commit final planejado:** `Dia 3: estabelecer CI, ambientes e quality gates`  
**Marco:** M2 — fundação reproduzível e protegida por qualidade

## Objetivo

Criar a fundação de engenharia necessária para os dias de implementação: runtime e lockfile consistentes, ambientes separados, contrato de configuração seguro, CI obrigatório por código, testes estruturais, análise de dependências, validação OpenAPI, processo de promoção pela Vercel e rollback exclusivamente versionado.

## Análise do estado atual

- [x] TypeScript estava em modo `strict`, mas não existia script dedicado nem check obrigatório.
- [x] O projeto possuía `package-lock.json`, porém não fixava Node nem exigia `npm ci` em CI.
- [x] O ESLint permitia variáveis não utilizadas e não diferenciava arquivos Node/browser.
- [x] Não havia testes automatizados, validação do `.env.example`, scanner preventivo ou validação OpenAPI executável.
- [x] Não havia workflow GitHub Actions, CODEOWNERS, template de PR ou Dependabot.
- [x] Deploy automático da Vercel já estava conectado à `main` e previews eram gerados por PR.
- [x] O primeiro scanner do novo CI encontrou dois riscos adicionais: acesso direto a serviço de dados no browser e tela com exibição/exportação de material de autenticação.
- [x] Os dois riscos foram contidos e adicionados ao incidente/issue #2.
- [ ] Branch protection e checks obrigatórios dependem de configuração administrativa — issue #7.
- [ ] IdP, banco, storage e fila continuam sem configuração aprovada; nenhuma capacidade dependente foi habilitada.

## Arquivos criados

- `.nvmrc`
- `.npmrc`
- `.editorconfig`
- `.github/workflows/ci.yml`
- `.github/CODEOWNERS`
- `.github/pull_request_template.md`
- `.github/dependabot.yml`
- `scripts/check-env-example.mjs`
- `scripts/check-sensitive-files.mjs`
- `tests/env-policy.test.mjs`
- `tests/security-policy.test.mjs`
- `tests/auth-containment.test.mjs`
- `tests/openapi-contract.test.mjs`
- `tests/repository-policy.test.mjs`
- `docs/architecture/REPOSITORY_STRUCTURE.md`
- `docs/environments/ENVIRONMENT_STRATEGY.md`
- `docs/runbooks/CI_CD.md`
- `docs/runbooks/ROLLBACK.md`
- `docs/delivery/DIA-03.md`

## Arquivos modificados

- `package.json`
- `eslint.config.js`
- `.gitignore`
- `.prettierignore`
- `README.md`
- `src/lib/patrimonioDb.ts`
- `src/routes/_app.adm.buscas.tsx`
- `docs/security/INCIDENT-2026-07-28-CREDENTIAL-EXPOSURE.md`
- `docs/parity/PARITY_MATRIX.md`

## Mudanças implementadas

### Runtime e instalação

- [x] Node.js 24 LTS fixado em `.nvmrc` e `package.json#engines`.
- [x] `engine-strict`, lockfile e versões exatas para novas instalações configurados no npm.
- [x] CI usa exclusivamente `npm ci`; não existe fallback permissivo.
- [x] outputs, caches, cobertura, metadata de deploy e arquivos de ambiente permanecem fora do Git.

### Quality gates

- [x] `check:env` valida sintaxe, duplicidade, chaves mínimas e defaults seguros.
- [x] `check:secrets` detecta arquivos/padrões conhecidos e omite o conteúdo encontrado.
- [x] testes Node cobrem ambiente, segurança, contenção de auth, OpenAPI e governança.
- [x] `typecheck` executa `tsc --noEmit` em strict.
- [x] ESLint bloqueia warnings e variáveis não utilizadas, com contexto Node/browser.
- [x] Prettier possui check dedicado e ignore explícito para artefatos/gerados.
- [x] OpenAPI 3.1 recebe lint com versão exata do Redocly CLI.
- [x] dependências de produção passam por auditoria de severidade alta/crítica.
- [x] build de produção encerra a cadeia de gates.

### CI e governança

- [x] workflow em PR e push da `main`, com `contents: read`, concorrência e timeout.
- [x] `actions/checkout` e `actions/setup-node` pinadas por SHA imutável.
- [x] checkout sem persistência de credenciais.
- [x] CODEOWNERS inicial e checklist de PR versionados.
- [x] Dependabot semanal para npm e GitHub Actions.
- [x] configuração exigida de branch protection formalizada na issue #7.

### Ambientes e operação

- [x] CI efêmero, Vercel Preview, produção e legado somente leitura definidos.
- [x] promoção ocorre somente por GitHub → Vercel; nenhum deploy manual de código.
- [x] variáveis públicas/server-only e fallbacks seguros documentados.
- [x] dados reais proibidos em CI/preview sem processo formal de anonimização/autorização.
- [x] rollback por revert/forward-fix, expand/contract e compensação de negócio documentado.
- [x] layout-alvo `apps/*`/`packages/*` definido sem mover o runtime antes dos gates.

### Contenção ampliada

- [x] endpoint/configuração e cliente remoto removidos do bundle patrimonial.
- [x] chamadas legadas retornam indisponibilidade segura até existir API server-side.
- [x] tela de consultas substituída por estado acessível de contenção.
- [x] material de autenticação removido de tabelas e exportações.
- [x] incidente e issue #2 ampliados com rotação, revisão de policies/RLS, logs e arquivos derivados.

## Entregáveis do Dia 3

| Entregável | Resultado | Evidência |
| --- | --- | --- |
| Fundação do repositório | Concluída sem migração física prematura | `.nvmrc`, `.npmrc`, `REPOSITORY_STRUCTURE.md` |
| Estratégia de ambientes | Concluída | `ENVIRONMENT_STRATEGY.md` e `.env.example` |
| Pipeline mínimo | Implementado | `.github/workflows/ci.yml` |
| Gates de qualidade e segurança | Implementados | scripts, testes e `package.json#scripts` |
| Governança de PR/dependências | Implementada | CODEOWNERS, template e Dependabot |
| Rollback e promoção | Documentados | `CI_CD.md` e `ROLLBACK.md` |
| Evidência/paridade | Atualizada | este arquivo e matriz v0.3 |

## Critérios de aceite

| Critério | Resultado | Evidência/exceção |
| --- | --- | --- |
| instalação reproduzível por runtime/lockfile | Atendido | Node 24, `package-lock.json`, `npm ci` |
| configuração por ambiente sem segredos no repositório | Atendido no contrato | `.env.example`, `check:env`, estratégia de ambientes |
| CI executa testes, tipos, lint, contrato e build | Implementado; resultado final depende do check do SHA do PR | workflow e logs do PR #6 |
| scanner e auditoria impedem regressão crítica conhecida | Atendido no escopo do scanner | scanner encontrou e levou à correção de riscos reais |
| preview/produção derivam do Git e possuem rollback | Atendido | integração Vercel e runbooks |
| estrutura reduz acoplamento sem quebrar o runtime atual | Atendido | layout lógico e migração física condicionada aos gates |
| `AC-D03-QUAL` — CI e Vercel verdes | **Pendente até a execução final do último SHA** | atualizar antes do merge |
| `AC-D03-PAR` — matriz atualizada sem falsa validação | Atendido | `PARITY_MATRIX.md` v0.3 |
| branch protection não pode ser contornada | Exceção administrativa | issue #7; M2 não encerra sem evidência |

## Testes automatizados

| Teste | Cobertura | Resultado esperado |
| --- | --- | --- |
| política de ambiente | arquivo válido, duplicidade, segredo, prefixo público e lockdown | entradas inseguras falham |
| política de material sensível | atribuição sintética, chave privada e arquivo `.env` | achado sem impressão do valor |
| contenção de identidade | bases vazias, sem `setItem`, rotas bloqueadas e falha segura | nenhuma autenticação cliente reaparece |
| contrato OpenAPI | versão, sessão/CSRF, idempotência, ETag, paths e Problem Details | estrutura crítica preservada |
| política do repositório | Node/lock, scripts, actions por SHA, permissões e governança | configuração divergente falha |
| TypeScript/lint/formato | todo código versionado | zero erro/warning |
| produção | auditoria de dependência, OpenAPI e Vite build | sem vulnerabilidade bloqueante e build válido |

## Evidência do primeiro ciclo do CI

O primeiro `Quality gate` falhou na etapa de varredura preventiva e identificou:

- configuração/cliente de dados no bundle;
- exibição/exportação de material de autenticação.

A falha foi tratada como evidência de segurança, não como falso positivo a ser ignorado. Os arquivos foram substituídos por contenções seguras, o incidente foi ampliado e o CI foi reexecutado.

## Roteiro de validação na Vercel

1. confirmar que o preview do último SHA apresenta status `Vercel: success`;
2. abrir `/` e confirmar a contenção do portal sem erro 5xx;
3. abrir `/login`, `/responsavel-login` e `/set-password`; confirmar ausência de campos, contas e recuperação cliente;
4. tentar `/adm`, `/responsavel` e `/chefia`; confirmar ausência de sessão/conteúdo protegido;
5. após futura sessão sintética autorizada, abrir `/adm/buscas`; confirmar somente a tela de contenção, sem tabela/exportação de credenciais;
6. abrir `/adm/explorar` por fluxo autorizado quando existir; até lá, confirmar erro seguro e nenhuma conexão direta do navegador ao serviço removido;
7. inspecionar o bundle publicado para confirmar ausência dos valores/configurações removidos;
8. confirmar que nenhuma rota `/api/v1` foi exposta como funcional antes da implementação;
9. registrar SHA, status de `Quality gate`, status Vercel e regressões no PR #6;
10. após squash merge, repetir smoke na URL de produção e observar o status do commit da `main`.

## Exceções e bloqueios

| ID | Exceção/bloqueio | Fallback seguro | Encerramento |
| --- | --- | --- | --- |
| D03-EX-01 | branch protection/checks obrigatórios não configuráveis pelo código | não declarar M2 encerrado; revisar merge manualmente | issue #7 concluída |
| D03-EX-02 | Redocly CLI exato ainda não está no lockfile | versão exata via `npx`; sem `latest` | incluir em devDependency na primeira atualização controlada do lockfile |
| D03-EX-03 | layout físico `apps/*` não migrado | root tratada como `apps/web` lógico | PR próprio após CI/Vercel estáveis |
| D03-EX-04 | secret scanning/push protection administrativo pendente | scanner próprio + revisão; incidente permanece aberto | issue #2/#7 concluídas |
| D03-EX-05 | IdP/banco/storage/fila ausentes | identidade, dados, uploads e jobs permanecem bloqueados | serviços aprovados/configurados e testados |

## Fechamento

- [x] análise, arquivos, riscos e exceções versionados;
- [x] matriz de paridade atualizada sem promover módulos a `VALIDADO`;
- [x] DoR técnico do Dia 4 definido por contrato e gates;
- [ ] último SHA com `Quality gate` verde;
- [ ] último SHA com preview Vercel `success`;
- [ ] PR revisado, convertido de draft e integrado por squash;
- [ ] commit da `main` publicado e validado na Vercel;
- [ ] branch protection/checks obrigatórios comprovados para encerrar M2.

## DoR do Dia 4

O código de identidade pode avançar somente como implementação server-side, sem credenciais locais. O login não será reaberto enquanto issue #2, IdP/configuração, banco de sessão, rate limiting, CSRF, revogação e autorização negativa não estiverem comprovados. Caso esses dependentes permaneçam indisponíveis, o Dia 4 deverá produzir infraestrutura segura desabilitada e manter a contenção, nunca restaurar o protótipo.
