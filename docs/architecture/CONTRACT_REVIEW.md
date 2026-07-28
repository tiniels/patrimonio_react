# Revisão reproduzível do contrato e da arquitetura — Dia 2

**Artefato sob revisão:** `packages/contracts/openapi/patrimonio-v1.yaml`  
**Versão:** 0.1.0  
**Método:** inspeção estrutural e rastreamento contra os critérios/testes do Dia 2  
**Limite:** validação automática do OpenAPI será adicionada ao CI no Dia 3; não existe implementação dos endpoints nesta entrega.

## 1. Checklist estrutural

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| OpenAPI 3.1 e JSON Schema dialect declarados | Atendido | cabeçalho do contrato |
| API versionada em `/api/v1` | Atendido | `servers` e ADR-0003 |
| Operações possuem `operationId` | Atendido no escopo inicial | todas as operações declaradas |
| Autenticação privada explícita | Atendido | `sessionCookie`; exceções públicas com `security: []` |
| CSRF em mutações por cookie | Atendido | combinação `sessionCookie` + `csrfHeader` |
| Erros estruturados e correlation ID | Atendido | `ProblemDetails` e responses comuns |
| Autorização/escopo documentados | Atendido como contrato | descrições, 403/404 e ADR-0003/0004 |
| Idempotência em comandos | Atendido | header obrigatório `Idempotency-Key` |
| Concorrência em recursos editáveis/workflows | Atendido | `ETag`, `If-Match`, 409 e 428 |
| Paginação e limites | Atendido | cursor, limit máximo 100 e ordenação estável |
| Workflow não modelado como PATCH de status | Atendido | endpoints `/submit`, `/accept`, `/reject`, `/effect`, `/cancel` |
| Precisão monetária | Atendido | `Money.amount` como decimal serializado |
| Cache seguro para sessão/PII | Atendido | headers `no-store`/private |
| Rate limit/dependência indisponível | Atendido | 429/503 e Retry-After |
| Propriedades desconhecidas em comandos | Atendido | `additionalProperties: false` |
| Dados reais/segredos no exemplo | Atendido | nenhum example com PII/credencial foi incluído |
| Validação por parser/linter OpenAPI | Exceção formal | CI inexistente no Dia 2; gate obrigatório do Dia 3 |

## 2. Roteiro TEST-D02

### TEST-D02-01 — caminho feliz da principal capacidade

Traçar a criação e transição de uma transferência:

1. `POST /transfers` exige sessão, CSRF e idempotência; retorna `201`, Location e ETag.
2. `POST /transfers/{id}/submit` exige ETag e comando explícito.
3. `POST /transfers/{id}/accept` usa nova versão e policy do destinatário.
4. `POST /transfers/{id}/effect` exige capacidade privilegiada e efetivação atômica.
5. Cada resposta devolve a representação e nova ETag.
6. A máquina correspondente em `STATE_MACHINES.md` define guardas, efeitos e terminais.

**Resultado da revisão:** contrato e máquina são coerentes no fluxo proposto. Implementação e regra oficial permanecem pendentes.

### TEST-D02-02 — usuário sem permissão/escopo diferente

- operações privadas declaram 401/403;
- leitura por ID declara 404 para inexistente ou não revelado ao escopo;
- descrições exigem capacidade/escopo server-side;
- threat model TM-005/TM-006 define teste vertical/horizontal.

**Resultado:** desenho cobre o cenário; execução depende do policy engine dos Dias 4–5.

### TEST-D02-03 — entrada inválida

- parâmetros possuem limites/formato;
- comandos usam `required`, enums, `additionalProperties: false` e limites;
- contrato declara 400 para sintaxe/parâmetro e 422 para regra/semântica;
- `ProblemDetails.fieldErrors` associa mensagem ao path.

**Resultado:** atendido no contrato.

### TEST-D02-04 — repetição de comando

- criação/comandos mutáveis exigem `Idempotency-Key`;
- ADR-0003 define mesma chave + corpo diferente como conflito;
- `STATE_MACHINES.md` define retorno do resultado anterior e não duplicação.

**Resultado:** atendido no desenho; persistência de idempotência será testada na implementação.

### TEST-D02-05 — concorrência/versão desatualizada

- edição e comandos de estado exigem `If-Match`;
- ausência retorna 428; versão divergente retorna 409;
- representação retorna `ETag`.

**Resultado:** atendido no contrato e modelo.

### TEST-D02-06 — dependência externa/timeout/recuperação

- 503 e Retry-After estão padronizados;
- NFRs definem timeout/circuit breaker/degradação;
- threat model TM-024/TM-025 define falha de dependência e outbox.

**Resultado:** atendido como arquitetura; simulação executável depende da aplicação/CI.

### TEST-D02-07 — viewport móvel/teclado

**Não aplicável à entrega:** o Dia 2 não altera telas. A tela de contenção do Dia 1 permanece a única mudança visual e seu roteiro está em `docs/delivery/DIA-01.md`.

### TEST-D02-08 — auditoria/log sem conteúdo sensível

- modelo inclui `AUDIT_EVENT` com diff redigido;
- NFR-AUD-01/02 e NFR-OBS-01 definem cobertura/correlação;
- Problem Details proíbe stack, SQL, segredo e existência fora de escopo;
- threat model TM-020/TM-021 define controles e inspeção.

**Resultado:** atendido no desenho; teste executável depende da implementação.

## 3. Casos de revisão por operação

| Operação | Sessão | CSRF | Idempotência | ETag/If-Match | Erros negativos | Observação |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /auth/session` | sim | n/a | n/a | n/a | 401/503 | no-store |
| `DELETE /auth/session` | sim | sim | resposta idempotente | n/a | 401/403/503 | revogação, não simples limpeza local |
| `GET /assets` | sim | n/a | n/a | n/a | 400/401/403/429/503 | cursor/limit |
| `POST /assets` | sim | sim | sim | n/a | 400/401/403/409/422/429/503 | comando allowlist |
| `PATCH /assets/{id}` | sim | sim | sim | sim | 400/401/403/404/409/422/428/503 | não altera workflows |
| `POST /transfers` | sim | sim | sim | n/a | 400/401/403/409/422/503 | cria draft |
| comandos de transferência | sim | sim | sim | sim | 401/403/404/409/422/428/503 | endpoints por transição |
| `POST /inventory-cycles` | sim | sim | sim | n/a | 400/401/403/409/422/503 | cria draft |
| observação de inventário | sim | sim | sim | snapshot/item validado | 400/401/403/404/409/422/503 | deviceOperationId adicional |
| `POST /report-jobs` | sim | sim | sim | n/a | 400/401/403/409/422/429/503 | assíncrono, URL curta |

## 4. Pendências obrigatórias para o Dia 3+

1. validar sintaxe e semântica OpenAPI por ferramenta pinada no CI;
2. gerar ou verificar tipos TypeScript sem diff não versionado;
3. adicionar testes de contrato de request/response;
4. vincular cada operação ao catálogo de permissões do Dia 5;
5. substituir enums/constraints propostas por regras homologadas;
6. implementar handlers com Problem Details, correlation ID e headers definidos;
7. testar 401/403/404 horizontal, CSRF, idempotência e ETag na API real.

## 5. Resultado

A revisão manual encontra cobertura arquitetural para `AC-D02-01` a `AC-D02-06` e `TEST-D02-01` a `TEST-D02-08`, respeitando as exceções explicitadas. `AC-D02-QUAL` não pode ser marcado integralmente até o CI do Dia 3 validar OpenAPI, tipos e segurança; o build da Vercel do PR continua sendo o gate mínimo desta entrega documental.
