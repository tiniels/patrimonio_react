# Dia 2 — Arquitetura-alvo, domínio, contratos e migração

**Branch:** `agent/dia-2-arquitetura-contratos`  
**Issue:** #3  
**Commit final planejado na `main`:** `Dia 2: definir arquitetura, contratos e estratégia de migração`  
**Marco:** mapa de domínios, ERD lógico e OpenAPI v1 inicial

## Objetivo

Transformar o inventário do Dia 1 em uma arquitetura executável: módulos com owner/fronteira, workflows explícitos, modelo temporal, contratos com autorização/erros, migração reconciliável, NFRs e threat model — sem desbloquear autenticação ou inventar paridade do legado.

## Análise do estado atual

- [x] Frontend React/TanStack Start permanece implantado na Vercel.
- [x] Não há backend/persistência/autorização real comprovados.
- [x] Rotas cobrem grande parte do domínio, mas usam mocks/estado cliente em vários pontos.
- [x] Contenção do Dia 1 impede que o desenho de identidade inseguro seja reutilizado.
- [x] Matriz de paridade v0.1 e catálogo inicial de relatórios estão disponíveis.
- [ ] Walkthrough autenticado do legado — bloqueio `BLK-001`.
- [ ] IdP, banco, storage, fila e integrações aprovados — bloqueios `BLK-003`, `BLK-006`, `BLK-007`.
- [ ] Owners nominais e regras oficiais — bloqueios `BLK-004`, `BLK-008`.

## Arquivos criados

- `docs/architecture/README.md`
- `docs/architecture/DOMAIN_MAP.md`
- `docs/architecture/DATA_MODEL.md`
- `docs/architecture/STATE_MACHINES.md`
- `docs/architecture/NON_FUNCTIONAL_REQUIREMENTS.md`
- `docs/architecture/THREAT_MODEL.md`
- `docs/architecture/CONTRACT_REVIEW.md`
- `docs/migration/MIGRATION_STRATEGY.md`
- `docs/adr/0001-modular-monolith.md`
- `docs/adr/0002-postgresql-temporal-outbox.md`
- `docs/adr/0003-contract-first-openapi.md`
- `docs/adr/0004-server-side-identity-session.md`
- `packages/contracts/openapi/patrimonio-v1.yaml`
- `docs/delivery/DIA-02.md`

## Arquivo modificado

- `docs/parity/PARITY_MATRIX.md`

## Decisões implementadas como arquitetura

- [x] Monólito modular evolutivo, sem microserviços prematuros.
- [x] Aplicação servidor/BFF como limite de autenticação, autorização, regra e transação.
- [x] PostgreSQL temporal, schemas lógicos, precisão decimal e concorrência otimista.
- [x] Transactional outbox para eventos e integrações após commit.
- [x] IDs internos imutáveis; códigos legados preservados como atributos/mapping.
- [x] 14 bounded contexts com owners por função, agregados, invariantes e eventos.
- [x] Máquinas de estado para transferência, inventário, avaliação/baixa, responsabilidade, recebimento e retirada.
- [x] OpenAPI 3.1 com sessão server-side, CSRF, Problem Details, escopo, idempotência, ETag e 503.
- [x] Migração em staging e ondas, com quarentena, dry-runs, delta, reconciliação e rollback de dados.
- [x] NFRs mensuráveis para segurança, acessibilidade, desempenho, disponibilidade, DR, auditoria e operação.
- [x] Threat model STRIDE e abuso de negócio com controle, verificação e fallback.

## Entregáveis do plano

| Entregável | Resultado | Evidência |
| --- | --- | --- |
| ENT-02-01 — mapa de domínios | Concluído como baseline | `DOMAIN_MAP.md` |
| ENT-02-02 — ERD lógico | Concluído como baseline | `DATA_MODEL.md` |
| ENT-02-03 — OpenAPI v1 inicial | Concluído; validação automática pendente | `patrimonio-v1.yaml` |
| ENT-02-04 — ADRs principais | Concluído | ADR-0001 a ADR-0004 |
| ENT-02-05 — máquinas de estado | Concluído como proposta | `STATE_MACHINES.md` |
| ENT-02-06 — plano de migração | Concluído como estratégia | `MIGRATION_STRATEGY.md` |
| ENT-02-07 — NFRs/budgets | Concluído como baseline mensurável | `NON_FUNCTIONAL_REQUIREMENTS.md` |
| ENT-02-08 — threat model | Concluído; aceite nominal pendente | `THREAT_MODEL.md` |
| ENT-02-TST — testes/evidências | Revisão manual concluída; automação formalmente transferida ao Dia 3 | `CONTRACT_REVIEW.md` |
| ENT-02-DOC — docs/paridade | Concluído | este arquivo e matriz v0.2 |

## Critérios de aceite

| Critério | Resultado | Evidência/exceção |
| --- | --- | --- |
| AC-D02-01 — cada módulo tem dono e fronteira clara | Atendido por função | 14 contextos; owners nominais pendentes em `BLK-008` |
| AC-D02-02 — mutação crítica não é edição de campo | Atendido | máquinas e endpoints de comando explícitos |
| AC-D02-03 — contratos incluem erros e autorização | Atendido | sessão/CSRF, 401/403/404/409/422/428/429/503 e Problem Details |
| AC-D02-04 — migração possui staging/reconciliação | Atendido como estratégia | execução real bloqueada por fonte/banco/volumes |
| AC-D02-05 — NFRs mensuráveis | Atendido como baseline | IDs, objetivos, medição e owners por função |
| AC-D02-06 — reduz acoplamento sem microserviços prematuros | Atendido | ADR-0001 e regras de dependência |
| AC-D02-QUAL — CI verde/sem segredo/regressão | Exceção formal parcial | Vercel deve validar build; CI/typecheck/OpenAPI entram no Dia 3 |
| AC-D02-PAR — matriz atualizada | Atendido | `PARITY_MATRIX.md` v0.2 |

## Testes mínimos

A execução e os resultados detalhados de `TEST-D02-01` a `TEST-D02-08` estão em `docs/architecture/CONTRACT_REVIEW.md`.

Resumo:

- [x] fluxo de transferência rastreado entre contrato, máquina e efeitos;
- [x] cenários 401/403/404 horizontal documentados;
- [x] 400/422 e erros por campo definidos;
- [x] repetição/idempotência definida;
- [x] concorrência ETag/If-Match definida;
- [x] dependência indisponível/503, timeout, outbox e recuperação definidos;
- [x] viewport/teclado marcado como não aplicável por não haver UI nova;
- [x] auditoria/log redigidos no modelo/NFR/threat model;
- [ ] parser/linter OpenAPI e implementação — exceção formal para o Dia 3+.

## Riscos do Dia 2

| Risco | Tratamento |
| --- | --- |
| RISCO-D02-01 — escopo incompleto | contratos propostos, feature flags, bloqueios e regra de não validar sem walkthrough |
| RISCO-D02-02 — excesso de desenho sem validação | operações iniciais limitadas, teste reproduzível e implementação incremental |
| RISCO-D02-03 — integrações subestimadas | BC-14, anti-corruption layer, outbox, sandbox/owner como bloqueio explícito |

## Roteiro de validação na Vercel

Como o Dia 2 altera somente documentação/contratos não importados pelo runtime:

1. confirmar que o preview/deploy do commit termina com status `Vercel: success`;
2. abrir `/`, `/login`, `/responsavel-login` e `/set-password` e confirmar que a contenção do Dia 1 permanece;
3. tentar `/adm` e `/responsavel` e confirmar ausência de sessão/conteúdo protegido;
4. confirmar que nenhuma rota `/api/v1` foi exposta acidentalmente como funcional antes da implementação;
5. registrar SHA do deploy e resultado no PR/issue;
6. no Dia 3, executar em CI lint OpenAPI, typecheck, testes e build.

## Fechamento do Dia

- [x] FECHA-D02-01 — critérios atendidos ou com exceção formal.
- [ ] FECHA-D02-02 — PR revisado/integrado; concluir após preview Vercel.
- [ ] FECHA-D02-03 — preview/homologação contém a versão; confirmar no PR.
- [ ] FECHA-D02-04 — métricas/logs relevantes observados; limitado ao status de build por não haver runtime novo.
- [x] FECHA-D02-05 — documentação, paridade, riscos e backlog atualizados.
- [x] FECHA-D02-06 — Dia 3 possui DoR técnico; bloqueios externos estão escalados nas issues.

## DoR do Dia 3

A fundação de CI pode avançar sem dados reais ou backend. O Dia 3 deve validar o contrato OpenAPI, TypeScript strict, lint/format, build, secret scan e regras mínimas de repositório, preservando o deploy automático da Vercel.
