# Catálogo de Relatórios v1 — Dia 1

**Data:** 28 de julho de 2026  
**Estado:** inventário inicial; nenhum relatório abaixo é considerado oficial até confirmação do legado autenticado, fórmula documentada e reconciliação com amostra assinada.

## Campos obrigatórios para homologação

Cada relatório deve registrar: ID, nome oficial, owner, finalidade, perfis/escopos, fonte, fórmula, filtros, ordenação, timezone, data de corte, regras de arredondamento, colunas, mascaramento de PII, formato, volume, SLA, retenção, versão e amostra reconciliada.

## Inventário inicial

| ID | Saída/capacidade | Evidência atual | Oficialidade | Owner a confirmar | Dia alvo |
| --- | --- | --- | --- | --- | --- |
| REL-001 | Snapshot executivo patrimonial | painel `/adm` | Não confirmada | Gestão patrimonial | 23 |
| REL-002 | Bens por status e situação | painel/explorador | Não confirmada | Patrimônio + contabilidade | 22–23 |
| REL-003 | Bens por conta contábil/classificação | painel/categorias | Não confirmada | Contabilidade | 13 e 22 |
| REL-004 | Bens por secretaria, setor e local | base/explorador | Não confirmada | Patrimônio | 14 e 22 |
| REL-005 | Listagem customizada do acervo | `/adm/explorar` | Não confirmada | Patrimônio + auditoria | 9 e 22 |
| REL-006 | Ficha individual do bem | rotas de bens | Não confirmada | Patrimônio | 11 |
| REL-007 | Estrutura organizacional vigente | `/adm/base` | Não confirmada | Administração | 14 |
| REL-008 | Unidades inativas com bens | domínio inferido | Não confirmada | Administração + patrimônio | 14 |
| REL-009 | Matriz usuário × papel × escopo | rotas de usuários | Não confirmada | Segurança | 5 |
| REL-010 | Responsáveis por unidade e situação | `/adm/buscas` | Não confirmada | Contabilidade | 15 e 22 |
| REL-011 | Vínculos expirados/duplicados | rotas de usuários | Não confirmada | Segurança + contabilidade | 5 e 15 |
| REL-012 | Pendências de bens não localizados | `/chefia` | Não confirmada | Chefias | 21 |
| REL-013 | Ações por responsável e prazo | `/chefia` | Não confirmada | Chefias | 21 |
| REL-014 | Lotes de etiquetas gerados | `/adm/etiqueta` | Não confirmada | Patrimônio | 12 |
| REL-015 | Reimpressões de etiquetas por motivo | domínio inferido | Não confirmada | Patrimônio + auditoria | 12 |
| REL-016 | Progresso de inventário por setor | monitoramento | Não confirmada | Coordenação de inventário | 21 |
| REL-017 | Bens pendentes/divergentes no ciclo | inventário | Não confirmada | Coordenação de inventário | 19–21 |
| REL-018 | Resumo/comprovante de envio do responsável | inventário do responsável | Não confirmada | Responsável + patrimônio | 19–20 |
| REL-019 | Comparativo entre ciclos | conferência histórica | Não confirmada | Auditoria + patrimônio | 21 |
| REL-020 | Recorrência de divergências | conferência histórica | Não confirmada | Auditoria | 21–23 |
| REL-021 | Transferências solicitadas/enviadas | rotas de transferência | Não confirmada | Patrimônio | 16 e 22 |
| REL-022 | Transferências pendentes por idade/SLA | aceite/gestão | Não confirmada | Patrimônio + responsáveis | 16 e 25 |
| REL-023 | Transferências concluídas, rejeitadas e canceladas | gestão de transferências | Não confirmada | Patrimônio + auditoria | 16 e 22 |
| REL-024 | Avaliações e baixas por estado/motivo | `/responsavel/avaliacao` | Não confirmada | Comissão + contabilidade | 17 e 22 |
| REL-025 | Termos de troca de responsabilidade | rota correspondente | Não confirmada | Patrimônio + chefias | 15 |
| REL-026 | Portarias/designações vigentes | rotas de portaria | Não confirmada | Administração | 15 e 22 |
| REL-027 | Estoque e movimentações do galpão | rotas do galpão | Não confirmada | Galpão + contabilidade | 18 e 22 |
| REL-028 | Recebimentos por empenho/nota | `/adm/galpao/empenhos` | Não confirmada | Galpão + contabilidade | 18 |
| REL-029 | Retiradas, reservas e comprovantes | rotas de retiradas | Não confirmada | Galpão | 18 e 22 |
| REL-030 | Eventos de autenticação e bloqueios | requisito de identidade | Proposto | Segurança | 4 |
| REL-031 | Auditoria de mutações privilegiadas | `/adm/auditoria` | Proposto/Protótipo | Auditoria + segurança | 27 |
| REL-032 | Entregas e falhas de notificações | painel de e-mails/notificações | Proposto/Protótipo | Operação | 25 |
| REL-033 | Qualidade de dados e saneamento | busca/configurações | Proposto/Protótipo | Data owner | 24 |

## Critérios de reconciliação

1. Executar o mesmo filtro e a mesma data de corte no legado e no novo sistema.
2. Comparar contagem, soma, agrupamentos, itens extremos e amostras aleatórias.
3. Registrar diferenças por regra, migração, arredondamento ou defeito.
4. Repetir após correção usando conjunto de dados imutável.
5. Obter assinatura do owner do relatório.
6. Versionar fórmula e layout; mudança posterior exige nova reconciliação.

## Bloqueios

- Menus e relatórios do legado autenticado ainda não foram percorridos.
- Fórmulas, campos oficiais, assinantes, periodicidade e formatos não foram fornecidos.
- Não existe amostra oficial anonimizada para reconciliação.

Esses bloqueios impedem declarar qualquer exportação local do protótipo como relatório oficial.
