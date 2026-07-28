# Matriz de Paridade v1

**Versão:** 0.1 — Dia 1  
**Data:** 28 de julho de 2026  
**Regra:** a existência de uma rota React não comprova paridade funcional. Cada linha só pode ser encerrada com evidência do legado autenticado, contrato, teste, reconciliação quando aplicável e aceite do dono do processo.

## Status permitidos

- `NÃO DESCOBERTO`: legado autenticado ainda não percorrido.
- `PROTÓTIPO`: há interface/código, mas persistência e regra não foram comprovadas.
- `CONTIDO`: fluxo inseguro foi bloqueado sem entrega funcional substituta.
- `EM IMPLEMENTAÇÃO`: contrato e código de produção estão em construção.
- `VALIDADO`: critérios, testes e aceite possuem evidência.

## Rastreabilidade inicial

| ID | Módulo | Evidência atual | Estado | Trilha prevista | Evidência mínima para validar |
| --- | --- | --- | --- | --- | --- |
| MOD-01 | Portal de entrada e seleção de perfil | Página pública e rota `/` | PROTÓTIPO | Dias 7–8 | walkthrough, acessibilidade, sessão válida e aceite |
| MOD-02 | Autenticação administrativa | `/login`, `authStore` | CONTIDO | Dia 4 | IdP/servidor, cookie seguro, revogação, abuso e auditoria |
| MOD-03 | Autenticação do responsável | `/responsavel-login`, `/set-password` | CONTIDO | Dia 6 | vínculo temporal, primeiro acesso, recuperação e auditoria |
| MOD-04 | Usuários, perfis, permissões e escopos | rotas de usuários; mutação local | PROTÓTIPO | Dia 5 | catálogo de permissões, policy backend e revisão de acessos |
| MOD-05 | Painel administrativo | `/adm` | PROTÓTIPO | Dia 23 | fórmulas, data de corte, escopo e reconciliação |
| MOD-06 | Explorador de patrimônios | `/adm/explorar` | PROTÓTIPO | Dias 9–11 | API paginada, filtros, autorização e exportação segura |
| MOD-07 | Base organizacional | `/adm/base` | PROTÓTIPO | Dia 14 | fonte oficial, vigência, histórico e integridade referencial |
| MOD-08 | Buscas/demonstrativos de responsáveis | `/adm/buscas` | PROTÓTIPO | Dias 14–15 | API, minimização de PII, filtros e reconciliação |
| MOD-09 | Chefia — bens não localizados | `/chefia` | PROTÓTIPO | Dia 21 | workflow persistente, evidência, prazo e histórico |
| MOD-10 | Etiquetas patrimoniais | `/adm/etiqueta` | PROTÓTIPO | Dia 12 | lote, unicidade, PDF/impressão e reimpressão auditada |
| MOD-11 | Monitoramento de inventário | `/adm/inventario/monitoramento` | PROTÓTIPO | Dia 21 | snapshot, fórmulas, data de corte e drill-down |
| MOD-12 | Inventário do responsável | rotas de inventário | PROTÓTIPO | Dias 19–20 | ciclo, conferência, idempotência, offline e conflito |
| MOD-13 | Conferência histórica | `/inventario/conferencia` | PROTÓTIPO | Dia 21 | ciclos imutáveis, comparação e evidências |
| MOD-14 | Transferência pelo solicitante | rotas de transferência | PROTÓTIPO | Dia 16 | elegibilidade, máquina de estado, idempotência e protocolo |
| MOD-15 | Aceite de transferências | `/responsavel/transferencias-pendentes` | PROTÓTIPO | Dia 16 | decisão transacional, conflito, motivo e comprovante |
| MOD-16 | Gestão administrativa de transferências | `/adm/inventario/transferencias` | PROTÓTIPO | Dia 16 | aprovação, segregação, auditoria e reconciliação |
| MOD-17 | Transferências de merenda | `/adm/inventario/merenda` | PROTÓTIPO | Dias 16–18 | regras específicas validadas e transação por item/lote |
| MOD-18 | Avaliação e baixa | `/responsavel/avaliacao` | PROTÓTIPO | Dia 17 | comissão, laudo, aprovações, contabilização e imutabilidade |
| MOD-19 | Troca de responsabilidade | rota correspondente | PROTÓTIPO | Dia 15 | vigência, aceite, transferência de escopo e auditoria |
| MOD-20 | Portarias e designações | rotas de portaria | PROTÓTIPO | Dia 15 | documento oficial, assinatura, vigência e versionamento |
| MOD-21 | Fichas de locais e termos | `/adm/locais/fichas` | PROTÓTIPO | Dia 15 | dados oficiais, geração, assinatura e arquivo |
| MOD-22 | Bens do setor | `/locais/bens-setor` | PROTÓTIPO | Dias 10–11 | API autorizada, paginação, detalhe e exportação |
| MOD-23 | Painel do setor | `/painel-setor` | PROTÓTIPO | Dias 7 e 23 | contexto, KPIs reconciliados e escopo |
| MOD-24 | Painel do responsável | `/responsavel` | PROTÓTIPO | Dias 6–7 | sessão real, tarefas, escopo e estados de erro |
| MOD-25 | Painel do galpão | `/adm/galpao/graficos` | PROTÓTIPO | Dias 18 e 23 | ledger, indicadores e reconciliação |
| MOD-26 | Retiradas do galpão | `/adm/galpao/retiradas` | PROTÓTIPO | Dia 18 | reserva, separação, entrega e comprovante transacionais |
| MOD-27 | Gerenciamento de retiradas/PDF | rota de gerenciamento | PROTÓTIPO | Dia 18 | autorização, documento, cancelamento e auditoria |
| MOD-28 | Notas, empenhos e recebimentos | `/adm/galpao/empenhos` | PROTÓTIPO | Dia 18 | documentos, precisão monetária, recebimento e ledger |
| MOD-29 | Captura e envio de fotos | `/adm/fotos/capturar` | PROTÓTIPO | Dia 26 | upload seguro, limites, metadados e autorização |
| MOD-30 | Canvas/composição de fotos | `/adm/fotos/canvas` | PROTÓTIPO | Dia 26 | requisitos homologados, exportação e retenção |
| MOD-31 | E-mails e comunicações | `/adm/painel-emails` | PROTÓTIPO | Dia 25 | outbox, templates, preferências, entrega e observabilidade |
| MOD-32 | Assistente de IA | `/adm/ia` | PROTÓTIPO | Dia 27 | somente leitura, fontes, escopo, avaliação e feature flag |
| MOD-33 | Tutorial e ajuda | `/responsavel/tutorial` | PROTÓTIPO | Dias 26 e 30 | conteúdo versionado, acessibilidade e validação de usuário |
| MOD-34 | Cadastro mestre de bens | rotas de bens; legado não confirmado | NÃO DESCOBERTO | Dias 10–11 | campos/regras oficiais, CRUD, concorrência e auditoria |
| MOD-35 | Categorias e contas contábeis | `/adm/bens/categorias` | NÃO DESCOBERTO | Dia 13 | catálogo oficial, hierarquia, vigência e uso em relatórios |
| MOD-36 | Histórico, auditoria e timeline | `/adm/auditoria` e componentes locais | PROTÓTIPO | Dias 11 e 27 | evento imutável, diff mascarado, busca e retenção |
| MOD-37 | Central de relatórios | `/adm/relatorios` | PROTÓTIPO | Dia 22 | catálogo oficial, jobs, PDF/XLSX/CSV e reconciliação |
| MOD-38 | Notificações, calendário e tarefas | `/adm/notificacoes` | PROTÓTIPO | Dia 25 | eventos, prazos, preferências e links autorizados |
| MOD-39 | Configurações do sistema | `/adm/configuracoes` | PROTÓTIPO | Dias 3 e 27 | configuração server-side, permissões, auditoria e flags |
| MOD-40 | Busca global e qualidade de dados | `/adm/buscar` | PROTÓTIPO | Dia 24 | índice por escopo, checks reproduzíveis e correção auditada |
| MOD-41 | Integrações e interoperabilidade | `/adm/integracoes` | NÃO DESCOBERTO | Dia 27 | inventário de sistemas, contratos, sandbox e reprocessamento |

## Exceções e bloqueios formais

| ID | Bloqueio | Impacto | Owner necessário | Situação |
| --- | --- | --- | --- | --- |
| BLK-001 | Walkthrough autenticado do legado não executado | impede confirmar campos, estados, permissões e relatórios | Produto + usuários-chave | Aberto |
| BLK-002 | Credenciais expostas precisam de rotação/revogação externa | impede encerrar o incidente e reabrir login | Segurança + administradores dos sistemas | Aberto |
| BLK-003 | Fonte oficial de identidade e dados não definida | impede Dias 4–6 e persistência real | Arquitetura + segurança + DBA | Aberto |
| BLK-004 | Catálogo e fórmulas de relatórios não homologados | impede reconciliação e paridade de saída | Contabilidade + negócio | Aberto |
| BLK-005 | UAT e signatários não definidos | impede status `VALIDADO` e go-live | Sponsor + Product Owner | Aberto |

## Regra de atualização

Cada PR deve atualizar as linhas afetadas com: requisito, fonte, rota/API, migração, teste, evidência de autorização, evidência de acessibilidade, reconciliação e aceite. Nenhuma linha muda para `VALIDADO` com base apenas em inspeção visual do frontend.
