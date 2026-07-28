# ADR-0003 — Contratos HTTP contract-first com OpenAPI 3.1

- **Status:** Aceito como baseline do Dia 2
- **Data:** 28 de julho de 2026
- **Decisores por função:** Arquitetura, Frontend, Backend, QA, Segurança
- **Relacionados:** `packages/contracts/openapi/patrimonio-v1.yaml`, AC-D02-03

## Contexto

O frontend atual mistura regras, mocks e estruturas locais. Para evoluir UI e backend em paralelo, testar autorização/erros e impedir contratos implícitos, é necessário um artefato versionado que descreva endpoints, schemas, autenticação, paginação, concorrência e falhas.

O comportamento exato de parte do legado ainda não foi confirmado. Contratos precisam distinguir baseline proposta de regra homologada sem bloquear a fundação técnica.

## Decisão

OpenAPI 3.1 será a fonte versionada dos contratos HTTP `/api/v1`.

### Regras

1. cada operação possui `operationId`, finalidade, permissão/escopo e respostas de erro;
2. schemas rejeitam propriedades desconhecidas em comandos sensíveis quando possível;
3. autenticação usa cookie de sessão server-side; mutações exigem CSRF;
4. recursos com edição concorrente usam `ETag`/`If-Match`;
5. comandos repetíveis usam `Idempotency-Key`;
6. erros usam Problem Details estendido com código estável, correlation ID e erros de campo;
7. listagens usam paginação cursor, ordenação estável e limites explícitos;
8. filtros e enums são versionados; valores desconhecidos não são descartados silenciosamente em integração;
9. `404` pode ser usado para recurso inexistente ou fora de escopo para evitar enumeração;
10. endpoints de workflow são comandos explícitos (`/submit`, `/accept`, `/effect`), não alteração genérica de `status`;
11. cliente TypeScript e mocks de contrato serão gerados/validados no CI após a fundação do Dia 3;
12. toda mudança incompatível exige nova versão de API ou estratégia de depreciação documentada.

## Versionamento

- versão maior no caminho (`/api/v1`);
- mudança compatível adiciona campo opcional/endpoint/enum somente quando clientes toleram desconhecido;
- remoção/renomeação, alteração de semântica, obrigatoriedade ou tipo é incompatível;
- depreciação possui data, telemetria de uso e alternativa;
- eventos assíncronos possuem versão independente no envelope;
- `info.version` identifica a versão do documento, não substitui a versão do caminho.

## Catálogo de erros

O campo `code` é estável e consumível pela UI; `detail` é seguro para usuário e não expõe stack, SQL, existência fora de escopo ou segredo.

Classes iniciais:

- autenticação: `authentication_required`, `invalid_credentials`, `session_expired`, `session_revoked`;
- autorização: `action_not_allowed`, `scope_denied`, `separation_of_duties_violation`;
- validação: `validation_failed`, `business_rule_violation`;
- concorrência: `precondition_required`, `stale_version`;
- idempotência: `idempotency_key_reused`, `duplicate_command`;
- workflow: `invalid_state_transition`, `resource_locked`, `asset_not_eligible`;
- dependência: `dependency_unavailable`, `job_unavailable`;
- limite: `rate_limited`, `payload_too_large`;
- genérico: `resource_not_found`, `conflict`, `internal_error`.

## Alternativas consideradas

### A. Tipos TypeScript compartilhados sem OpenAPI

**Rejeitada como contrato único.** Não descreve HTTP, status, headers, segurança ou consumidores não TypeScript e pode acoplar UI às entidades internas.

### B. Implementação-first e documentação gerada depois

**Rejeitada.** Contratos e erros tornam-se consequência acidental do framework; dificulta revisão de segurança e paralelismo.

### C. GraphQL como API principal

**Não adotada agora.** Pode ser útil para leitura analítica, mas aumenta desenho de autorização por campo, cache e complexidade; REST command-oriented atende melhor os workflows iniciais. Reavaliação exige ADR.

### D. RPC genérico/endpoint único

**Rejeitada.** Reduz clareza, observabilidade, políticas e evolução por recurso.

## Consequências positivas

- revisão de segurança antes do código;
- cliente e mocks geráveis;
- testes de contrato e documentação automatizáveis;
- erros/loading/conflict definidos para UI;
- autorização e idempotência visíveis no contrato;
- menor acoplamento entre web e persistência.

## Consequências negativas

- exige disciplina para manter implementação e especificação sincronizadas;
- enums/regras ainda desconhecidos precisarão de revisões;
- geração de cliente adiciona etapa ao CI;
- OpenAPI não substitui testes de invariantes ou autorização.

## Conformidade

Um endpoint não é considerado entregue sem:

- operação no OpenAPI;
- validação de request/response;
- autenticação/autorização server-side;
- estados 400/401/403/404/409/422/429/503 pertinentes;
- correlação/auditoria;
- teste de contrato, escopo negativo e idempotência/concorrência quando aplicável;
- atualização da matriz de paridade.
