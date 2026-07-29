# Matriz de Paridade v1

**Versão:** 0.4 — Dia 4  
**Data:** 29 de julho de 2026  
**Regra:** a existência de uma rota React, contrato ou quality gate não comprova paridade funcional. Cada linha só pode ser encerrada com evidência do legado autenticado, contrato homologado, implementação, teste, reconciliação quando aplicável e aceite do dono do processo.

## Status permitidos

- `NÃO DESCOBERTO`: legado autenticado ainda não percorrido.
- `PROTÓTIPO`: há interface/código, mas persistência e regra não foram comprovadas.
- `CONTIDO`: fluxo inseguro foi bloqueado sem entrega funcional substituta.
- `CONTRATO PROPOSTO`: arquitetura/contrato existe, mas regra do legado ou implementação não foi validada.
- `EM IMPLEMENTAÇÃO`: contrato homologado e código de produção estão em construção.
- `VALIDADO`: critérios, testes e aceite possuem evidência.

## Rastreabilidade inicial

| ID | Módulo | Evidência atual | Estado | Trilha prevista | Evidência mínima para validar |
| --- | --- | --- | --- | --- | --- |
| MOD-01 | Portal de entrada e seleção de perfil | Página pública e rota `/` em contenção | CONTIDO | Dias 7–8 | walkthrough, acessibilidade, sessão válida e aceite |
| MOD-02 | Autenticação administrativa | `/login`; `/api/v1/auth/status`, `/admin/login` e `/session`; `authStore`; `adminAuth.server`; testes sintéticos | EM IMPLEMENTAÇÃO | Dia 4 | configuração Vercel/IdP aprovada, cookie e sessão em produção, rate limit distribuído, revogação persistente, abuso e aceite |
| MOD-03 | Autenticação do responsável | `/responsavel-login`, `/set-password`; ADR-0004 | CONTIDO | Dia 6 | vínculo temporal, primeiro acesso, recuperação e auditoria |
| MOD-04 | Usuários, perfis, permissões e escopos | rotas de usuários; BC-01/BC-02 e `/me` proposto | PROTÓTIPO | Dia 5 | catálogo de permissões, policy backend e revisão de acessos |
| MOD-05 | Painel administrativo | `/adm`; BC-12 proposto | PROTÓTIPO | Dia 23 | fórmulas, data de corte, escopo e reconciliação |
| MOD-06 | Explorador de patrimônios | `/adm/explorar`; acesso direto ao serviço remoto removido; `/assets` proposto | CONTIDO | Dias 9–11 | API implementada/paginada, filtros, autorização e exportação segura |
| MOD-07 | Base organizacional | `/adm/base`; BC-02/ERD temporal propostos | PROTÓTIPO | Dia 14 | fonte oficial, vigência, histórico e integridade referencial |
| MOD-08 | Buscas/demonstrativos de responsáveis | `/adm/buscas` substituída por contenção; BC-05 proposto | CONTIDO | Dias 14–15 | API, minimização de PII, filtros e reconciliação |
| MOD-09 | Chefia — bens não localizados | `/chefia`; divergence case proposto | PROTÓTIPO | Dia 21 | workflow persistente, evidência, prazo e histórico |
| MOD-10 | Etiquetas patrimoniais | `/adm/etiqueta`; Document context proposto | PROTÓTIPO | Dia 12 | lote, unicidade, PDF/impressão e reimpressão auditada |
| MOD-11 | Monitoramento de inventário | `/adm/inventario/monitoramento`; BC-07 proposto | PROTÓTIPO | Dia 21 | snapshot, fórmulas, data de corte e drill-down |
| MOD-12 | Inventário do responsável | rotas de inventário; máquina de estado e observação proposta | PROTÓTIPO | Dias 19–20 | ciclo, conferência, idempotência, offline e conflito implementados |
| MOD-13 | Conferência histórica | `/inventario/conferencia`; snapshot/ciclo temporal proposto | PROTÓTIPO | Dia 21 | ciclos imutáveis, comparação e evidências |
| MOD-14 | Transferência pelo solicitante | rotas de transferência; OpenAPI/máquina de estado propostos | PROTÓTIPO | Dia 16 | elegibilidade, transação, idempotência e protocolo implementados |
| MOD-15 | Aceite de transferências | `/responsavel/transferencias-pendentes`; comando `/accept` proposto | PROTÓTIPO | Dia 16 | decisão transacional, conflito, motivo e comprovante |
| MOD-16 | Gestão administrativa de transferências | `/adm/inventario/transferencias`; comando `/effect` proposto | PROTÓTIPO | Dia 16 | aprovação, segregação, auditoria e reconciliação |
| MOD-17 | Transferências de merenda | `/adm/inventario/merenda` | PROTÓTIPO | Dias 16–18 | regras específicas validadas e transação por item/lote |
| MOD-18 | Avaliação e baixa | `/responsavel/avaliacao`; BC-08/máquina proposta | PROTÓTIPO | Dia 17 | comissão, laudo, aprovações, contabilização e imutabilidade |
| MOD-19 | Troca de responsabilidade | rota correspondente; BC-05/máquina proposta | PROTÓTIPO | Dia 15 | vigência, aceite, transferência de escopo e auditoria |
| MOD-20 | Portarias e designações | rotas de portaria; BC-10 proposto | PROTÓTIPO | Dia 15 | documento oficial, assinatura, vigência e versionamento |
| MOD-21 | Fichas de locais e termos | `/adm/locais/fichas`; BC-10 proposto | PROTÓTIPO | Dia 15 | dados oficiais, geração, assinatura e arquivo |
| MOD-22 | Bens do setor | `/locais/bens-setor`; acesso cliente direto contido; `/assets` proposto | CONTIDO | Dias 10–11 | API implementada/autorizada, paginação, detalhe e exportação |
| MOD-23 | Painel do setor | `/painel-setor`; BC-12 proposto | PROTÓTIPO | Dias 7 e 23 | contexto, KPIs reconciliados e escopo |
| MOD-24 | Painel do responsável | `/responsavel`; contexto `/me` proposto | PROTÓTIPO | Dias 6–7 | sessão real, tarefas, escopo e estados de erro |
| MOD-25 | Painel do galpão | `/adm/galpao/graficos`; BC-09/BC-12 propostos | PROTÓTIPO | Dias 18 e 23 | ledger, indicadores e reconciliação |
| MOD-26 | Retiradas do galpão | `/adm/galpao/retiradas`; máquina de retirada proposta | PROTÓTIPO | Dia 18 | reserva, separação, entrega e comprovante transacionais |
| MOD-27 | Gerenciamento de retiradas/PDF | rota de gerenciamento; BC-09/BC-10 propostos | PROTÓTIPO | Dia 18 | autorização, documento, cancelamento e auditoria |
| MOD-28 | Notas, empenhos e recebimentos | `/adm/galpao/empenhos`; ERD/máquina de recebimento propostos | PROTÓTIPO | Dia 18 | documentos, precisão monetária, recebimento e ledger |
| MOD-29 | Captura e envio de fotos | `/adm/fotos/capturar`; threat model de upload | PROTÓTIPO | Dia 26 | upload seguro, limites, metadados e autorização |
| MOD-30 | Canvas/composição de fotos | `/adm/fotos/canvas` | PROTÓTIPO | Dia 26 | requisitos homologados, exportação e retenção |
| MOD-31 | E-mails e comunicações | `/adm/painel-emails`; BC-11/outbox propostos | PROTÓTIPO | Dia 25 | outbox, templates, preferências, entrega e observabilidade |
| MOD-32 | Assistente de IA | `/adm/ia`; ameaça TM-033 | PROTÓTIPO | Dia 27 | somente leitura, fontes, escopo, avaliação e feature flag |
| MOD-33 | Tutorial e ajuda | `/responsavel/tutorial` | PROTÓTIPO | Dias 26 e 30 | conteúdo versionado, acessibilidade e validação de usuário |
| MOD-34 | Cadastro mestre de bens | rotas de bens; BC-04, ERD e OpenAPI propostos | NÃO DESCOBERTO | Dias 10–11 | campos/regras oficiais, CRUD, concorrência e auditoria implementados |
| MOD-35 | Categorias e contas contábeis | `/adm/bens/categorias`; BC-03/ERD temporal propostos | NÃO DESCOBERTO | Dia 13 | catálogo oficial, hierarquia, vigência e uso em relatórios |
| MOD-36 | Histórico, auditoria e timeline | `/adm/auditoria`; BC-13/threat model propostos | PROTÓTIPO | Dias 11 e 27 | evento imutável, diff mascarado, busca e retenção |
| MOD-37 | Central de relatórios | `/adm/relatorios`; BC-12 e contrato de report jobs propostos | PROTÓTIPO | Dia 22 | catálogo oficial, jobs, PDF/XLSX/CSV e reconciliação |
| MOD-38 | Notificações, calendário e tarefas | `/adm/notificacoes`; BC-11 proposto | PROTÓTIPO | Dia 25 | eventos, prazos, preferências e links autorizados |
| MOD-39 | Configurações do sistema | `/adm/configuracoes`; `.env.example`, validação e estratégia de ambientes | PROTÓTIPO | Dias 3 e 27 | configuração server-side, permissões, auditoria e flags implementadas |
| MOD-40 | Busca global e qualidade de dados | `/adm/buscar`; política de PII/qualidade proposta | PROTÓTIPO | Dia 24 | índice por escopo, checks reproduzíveis e correção auditada |
| MOD-41 | Integrações e interoperabilidade | `/adm/integracoes`; BC-14/outbox/anti-corruption layer propostos | NÃO DESCOBERTO | Dia 27 | inventário de sistemas, contratos, sandbox e reprocessamento |

## Evidências arquiteturais do Dia 2

| Evidência | IDs cobertos | Estado da evidência | Limite |
| --- | --- | --- | --- |
| `docs/architecture/README.md` | todos os módulos | baseline proposta | não é implantação nem aprovação nominal |
| `docs/architecture/DOMAIN_MAP.md` | MOD-02 a MOD-41 conforme contextos | owners por função e fronteiras definidos | pessoas/owners nominais pendentes |
| `docs/architecture/DATA_MODEL.md` | MOD-02–04, 07–20, 22, 25–31, 34–41 | ERD temporal inicial | campos/constraints dependem do legado/fonte oficial |
| `docs/architecture/STATE_MACHINES.md` | MOD-12–20, 26–28 | comandos, guardas e efeitos propostos | transições do legado ainda não homologadas |
| `packages/contracts/openapi/patrimonio-v1.yaml` | MOD-02, 04, 06, 12, 14–16, 22, 34, 37 | OpenAPI 3.1 inicial | implementação depende dos dias de domínio |
| `docs/migration/MIGRATION_STRATEGY.md` | todos os módulos com dados | staging, ondas, reconciliação e rollback | fontes/volumes/janela reais indisponíveis |
| `docs/architecture/NON_FUNCTIONAL_REQUIREMENTS.md` | transversal | budgets mensuráveis propostos | SLOs finais requerem owner e teste de carga |
| `docs/architecture/THREAT_MODEL.md` | transversal | ameaças, controles e verificação priorizados | aceite nominal de segurança pendente |
| `docs/adr/0001-0004` | arquitetura, dados, contratos, identidade | decisões e alternativas registradas | fornecedor/configuração ainda pendentes |

## Evidências transversais do Dia 3

| Evidência | Cobertura | Estado | Limite/bloqueio |
| --- | --- | --- | --- |
| `.github/workflows/ci.yml` | instalação, segurança, testes, tipos, lint, formato, OpenAPI e build | implementado no Dia 3 | checks ainda precisam ser obrigatórios na `main` — issue #7 |
| `.nvmrc`, `.npmrc`, `package-lock.json` | runtime e instalação reproduzível | Node 24 LTS e `npm ci` definidos | mudança de dependência exige atualização controlada do lockfile |
| `scripts/check-env-example.mjs` | configuração e defaults seguros | testado com fixtures sintéticas | validação runtime server-side entra com cada módulo |
| `scripts/check-sensitive-files.mjs` | arquivos/padrões sensíveis | encontrou e bloqueou riscos adicionais | complementa, não substitui secret scanning/push protection |
| `tests/*.test.mjs` | contenção, ambiente, OpenAPI e política do repositório | testes automatizados adicionados | regras de negócio entram com as implementações |
| `docs/environments/ENVIRONMENT_STRATEGY.md` | preview, produção, dados e variáveis | baseline executável | IdP/banco/storage/fila ainda não configurados |
| `docs/architecture/REPOSITORY_STRUCTURE.md` | fronteiras e layout-alvo | root preservada como `apps/web` lógico | migração física só após CI/prova da Vercel |
| `docs/runbooks/CI_CD.md` | promoção, diagnóstico e governança | versionado | branch protection requer ação administrativa |
| `docs/runbooks/ROLLBACK.md` | reversão de código, dados e workflows | versionado | migrações reais terão runbook específico por onda |
| `README.md` | entrada operacional e de segurança | substituído | não comprova funcionalidade de domínio |
| contenção de `patrimonioDb` e `/adm/buscas` | MOD-06, MOD-08, MOD-22 | acesso direto e credenciais removidos | reabertura depende de API/policies e incidente #2 |

## Evidências de identidade do Dia 4

| Evidência | Cobertura | Estado | Limite/bloqueio |
| --- | --- | --- | --- |
| `src/lib/auth/adminAuth.server.ts` | MOD-02 | API, sessão assinada, cookie, CSRF e rate limit em implementação | provedor temporário, rate limit não distribuído e sem revogação persistente individual |
| `src/routes/login.tsx`, `authStore` e `AuthGuard` | MOD-02 | UI conectada à sessão server-side e bloqueada por default | ativação exige configuração segura da Vercel |
| `tests/auth-admin-server.test.mjs` | MOD-02 | massa sintética cobre login, cookie, sessão, logout, CSRF e abuso | não substitui teste no runtime real configurado |
| `docs/runbooks/VERCEL_AUTH_CONFIGURATION.md` | MOD-02 e MOD-39 | ordem de configuração, ativação e rollback documentada | valores e execução pertencem ao administrador da Vercel |
| `docs/runbooks/BREAK_GLASS.md` | governança transversal | processo de exceção auditável documentado | bypass administrativo depende das regras reais da `main` |

## Exceções e bloqueios formais

| ID | Bloqueio | Impacto | Owner necessário | Situação |
| --- | --- | --- | --- | --- |
| BLK-001 | Walkthrough autenticado do legado não executado | impede confirmar campos, estados, permissões e relatórios | Produto + usuários-chave | Aberto |
| BLK-002 | Credenciais/chaves expostas precisam de rotação, revisão de policies e logs | impede encerrar o incidente e reabrir identidade/dados | Segurança + administradores/DBA | Aberto — issue #2 |
| BLK-003 | Fonte oficial de identidade e dados não definida | impede substituir o bootstrap temporário, concluir autorização e avançar o portal do responsável | Arquitetura + segurança + DBA | Aberto |
| BLK-004 | Catálogo e fórmulas de relatórios não homologados | impede reconciliação e paridade de saída | Contabilidade + negócio | Aberto |
| BLK-005 | UAT e signatários não definidos | impede status `VALIDADO` e go-live | Sponsor + Product Owner | Aberto |
| BLK-006 | PostgreSQL, storage, fila e limites operacionais não aprovados | impede persistência, arquivos e jobs reais | Infra + DBA + segurança | Aberto |
| BLK-007 | Integrações obrigatórias sem owner/sandbox/contrato | impede validar efeitos externos e migração | Arquitetura de integração + owners externos | Aberto |
| BLK-008 | Owners definidos apenas por função | impede aceite formal dos módulos/ADRs | Sponsor + gestores das áreas | Aberto |
| BLK-009 | Branch protection e checks obrigatórios ainda não comprovados | permite bypass administrativo do CI | Admin GitHub | Aberto — issue #7 |
| BLK-010 | Layout físico `apps/*` ainda não migrado | mantém estrutura raiz do protótipo | Tech Lead/DevOps | Exceção temporária; root tratada como `apps/web` lógico |
| BLK-011 | Variáveis reais e teste controlado da autenticação não executados na Vercel | mantém o login bloqueado e impede evidência do cookie no runtime real | Admin Vercel + segurança | Aberto; fallback `AUTH_LOCKDOWN_ENABLED=true` |

## Regra de atualização

Cada PR deve atualizar as linhas afetadas com: requisito, fonte, rota/API, migração, teste, evidência de autorização, evidência de acessibilidade, reconciliação e aceite. Nenhuma linha muda para `VALIDADO` com base apenas em inspeção visual, documento arquitetural, quality gate ou existência de endpoint no contrato.
