# Inventário AS-IS — Dia 1

**Data de corte:** 28 de julho de 2026  
**Repositório:** `tiniels/patrimonio_react`  
**Branch analisada:** `main` no commit `9cc9d3f47c827f08155fc2b333ab562c1decb08e`  
**Objetivo:** registrar evidências reproduzíveis sem reproduzir credenciais ou dados pessoais.

## Classificação de evidência

- **CONF-COD:** confirmado no código do repositório.
- **CONF-PUB:** confirmado em página pública.
- **INFERIDO:** hipótese baseada em rota, nomenclatura ou domínio; requer walkthrough autenticado.
- **PROPOSTO:** capacidade prevista para a arquitetura-alvo.

## Stack observada

| Item | Evidência | Estado |
| --- | --- | --- |
| React 19 + TypeScript | `package.json` | CONF-COD |
| TanStack Router/Start | `package.json`, `src/routeTree.gen.ts`, `src/server.ts` | CONF-COD |
| Vite/Lovable config | `vite.config.ts` | CONF-COD |
| Tailwind CSS e componentes próprios | dependências e classes das rotas | CONF-COD |
| Supabase JS instalado | `package.json` | CONF-COD; integração real não confirmada |
| TypeScript `strict` | `tsconfig.json` | CONF-COD |
| `tsc --noEmit` no pipeline | não existe script dedicado em `package.json` | Ausente no estado analisado |
| Testes automatizados e CI | nenhum script de teste observado; workflows ainda não inventariados por execução | Não comprovados |

## Achados críticos

| ID | Severidade | Evidência | Achado | Contenção do Dia 1 |
| --- | --- | --- | --- | --- |
| SEC-001 | Crítica | `src/lib/authStore.ts` | Credenciais administrativas estavam codificadas no frontend. | Remover registros e bloquear autenticação local. |
| SEC-002 | Crítica | `src/lib/respUsers.ts` | Base com dados pessoais e senhas estava incluída no bundle público. | Substituir por contrato vazio; usar dados sintéticos somente em testes. |
| SEC-003 | Crítica | `src/lib/respAuth.ts` | Havia um segundo mecanismo de comparação de senha e sessão em Web Storage. | Bloquear comparação, criação e leitura de sessão cliente. |
| SEC-004 | Crítica | `src/routes/login.tsx` | Login administrativo era validado no navegador e oferecia contas de teste preenchíveis. | Substituir por tela de contenção. |
| SEC-005 | Crítica | `src/routes/responsavel-login.tsx` | Login, exemplos de usuários e recuperação/OTP eram simulados no cliente. | Substituir por tela de contenção. |
| SEC-006 | Crítica | `src/routes/set-password.tsx` | Busca de identidade e redefinição de senha eram executadas e persistidas no navegador. | Desativar até existir fluxo server-side. |
| SEC-007 | Alta | `src/components/AuthGuard.tsx` | Proteção de rota dependia de estado do cliente; não comprova autorização no backend. | Sessão cliente passa a ser sempre não autenticada; correção definitiva está nos Dias 4–6. |
| SEC-008 | Alta | histórico Git e deploys anteriores | Remover arquivos do snapshot atual não elimina cópias históricas ou bundles já publicados. | Rotação/revogação e decisão de reescrita de histórico registradas como ações externas obrigatórias. |
| QUAL-001 | Alta | `package.json`, `tsconfig.json` | `strict` está habilitado, mas não há script dedicado de typecheck nem quality gate comprovado. | Planejado para o Dia 3. |
| ARCH-001 | Alta | rotas e stores | Várias telas usam arrays locais, alertas, placeholders e mutações somente em memória/navegador. | Inventariar; não declarar funcionalidade de produção. |

## Inventário de entradas e módulos no frontend

A árvore gerada contém as seguintes áreas. A presença de rota confirma apenas a existência de código de interface; não confirma regra de negócio, persistência, integração ou paridade com o legado.

### Público e identidade

- `/`
- `/login`
- `/responsavel-login`
- `/set-password`

### Administração e gestão

- `/adm`
- `/adm/auditoria`
- `/adm/base`
- `/adm/buscar`
- `/adm/buscas`
- `/adm/configuracoes`
- `/adm/etiqueta`
- `/adm/explorar`
- `/adm/ia`
- `/adm/integracoes`
- `/adm/notificacoes`
- `/adm/painel-emails`
- `/adm/relatorios`
- `/adm/bens/cadastro`
- `/adm/bens/categorias`
- `/adm/contabilidade/usuarios`
- `/adm/locais/cadastro-usuarios`
- `/adm/locais/fichas`
- `/adm/locais/portaria`

### Inventário, locais e chefia

- `/chefia`
- `/painel-setor`
- `/inventario/conferencia`
- `/inventario/lista`
- `/inventario/transferir`
- `/locais/bens-setor`
- `/adm/inventario/merenda`
- `/adm/inventario/monitoramento`
- `/adm/inventario/transferencias`

### Portal do responsável

- `/responsavel`
- `/responsavel/avaliacao`
- `/responsavel/inventario`
- `/responsavel/portaria`
- `/responsavel/transferencia`
- `/responsavel/transferencias-pendentes`
- `/responsavel/troca-responsabilidade`
- `/responsavel/tutorial`

### Galpão, documentos e fotos

- `/adm/galpao/empenhos`
- `/adm/galpao/graficos`
- `/adm/galpao/retiradas`
- `/adm/galpao/retiradas/gerenciar`
- `/adm/fotos/capturar`
- `/adm/fotos/canvas`

## Estado funcional observado

| Capacidade | Estado observado | Evidência necessária para confirmar produção |
| --- | --- | --- |
| Autenticação | Dois mecanismos simulados no cliente; bloqueados na contenção | provedor/servidor, cookie seguro, revogação, rate limiting, testes de abuso |
| Autorização | Guard de interface por papel | policies no backend, escopo organizacional e testes horizontais/verticais |
| Usuários/responsáveis | Fixtures e mutação local | fonte oficial, vigência, convite/primeiro acesso e auditoria |
| Cadastro patrimonial | Telas/rotas existentes | contrato, banco, validações, concorrência e reconciliação |
| Transferências | Telas/rotas existentes | máquina de estados oficial, transação, idempotência, aprovações e documento |
| Inventário | Telas/rotas existentes | ciclo, snapshot, sincronização, conflitos, fechamento e evidência |
| Galpão | Telas/rotas existentes | ledger, documentos fiscais, recebimento, reserva e retirada transacionais |
| Relatórios | Rotas e exportações locais pontuais | catálogo oficial, fórmulas, data de corte e reconciliação |
| Integrações/IA | Rotas existentes | sandbox, contratos, autorização, observabilidade e feature flags |

## Dependências e perguntas abertas

1. Perfis reais, permissões e escopos por secretaria/setor/local.
2. Dicionário e regras do cadastro mestre de bens.
3. Máquinas de estado oficiais de transferência, inventário, avaliação, baixa e galpão.
4. Catálogo de relatórios oficiais, fórmulas, filtros e assinantes.
5. Sistemas de identidade, contabilidade, protocolo, assinatura, e-mail e armazenamento.
6. Volumes atuais e de pico, SLAs, retenção e janela de cutover.
7. Operações manuais ou intervenções diretas em banco no legado.
8. Requisitos LGPD, transparência e arquivo público aplicáveis.

## Gate M1 — situação

| Condição | Situação |
| --- | --- |
| Catálogo AS-IS versionado | Concluído neste documento para o código disponível. |
| Matriz de paridade v1 | Versionada em `docs/parity/PARITY_MATRIX.md`. |
| Inventário de relatórios | Versionado em `docs/discovery/REPORT_CATALOG.md`. |
| Contenção do snapshot atual | Implementada na branch do Dia 1. |
| Rotação/revogação das credenciais expostas | **Bloqueio externo — não pode ser comprovado pelo repositório.** |
| Walkthrough autenticado do legado | **Bloqueio externo — ainda não executado.** |
| Aprovação formal do M1 | **Pendente de owner de segurança/produto.** |

Nenhuma afirmação de paridade total ou prontidão de produção é válida enquanto os bloqueios acima permanecerem abertos.
