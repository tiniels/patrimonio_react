# INC-2026-07-28 — Exposição de credenciais, configuração e PII no frontend

**Severidade inicial:** Crítica  
**Status:** Contenção técnica ampliada; ações externas permanecem pendentes  
**Detectado em:** 28 de julho de 2026  
**Atualizado em:** 28 de julho de 2026 — Dia 3  
**Escopo:** repositório público, bundles publicados, serviço de dados referenciado e possíveis cópias/caches do histórico

> Este documento não reproduz credenciais, chaves, endpoints identificáveis, nomes, e-mails, telefones, prontuários ou outros dados pessoais encontrados.

## Resumo executivo

O protótipo incluía credenciais administrativas em código TypeScript, uma base de responsáveis com dados pessoais e senhas, dois mecanismos de autenticação/sessão executados no navegador, sessão confiada a Web Storage e redefinição de senha local.

O primeiro quality gate do Dia 3 encontrou ainda uma configuração de acesso a serviço de dados compilada no frontend e uma tela administrativa capaz de visualizar/exportar material de autenticação. Como o repositório e a aplicação são públicos, todos os valores e acessos relacionados devem ser tratados como expostos até que rotação, revisão de políticas e análise de logs comprovem o contrário.

## Evidências técnicas

| ID | Arquivo/área | Evidência sem conteúdo sensível |
| --- | --- | --- |
| EVD-001 | `src/lib/authStore.ts` | registros administrativos, comparação de senha e sessão no cliente |
| EVD-002 | `src/lib/respAuth.ts` | mecanismo alternativo de comparação de senha e sessão em Web Storage |
| EVD-003 | `src/lib/respUsers.ts` | registros pessoais e campo de senha compilados no frontend |
| EVD-004 | `src/routes/login.tsx` | seleção/preenchimento de contas e login simulado |
| EVD-005 | `src/routes/responsavel-login.tsx` | exemplos de responsáveis, preenchimento de senha e recuperação simulada |
| EVD-006 | `src/routes/set-password.tsx` | enumeração de identidade e persistência de nova senha no navegador |
| EVD-007 | `src/components/AuthGuard.tsx` | autorização de interface baseada em sessão cliente |
| EVD-008 | `src/lib/patrimonioDb.ts` | endpoint/configuração de serviço e consulta direta a dados protegidos pelo navegador |
| EVD-009 | `src/routes/_app.adm.buscas.tsx` | exibição e exportação de material de autenticação em tela administrativa |
| EVD-010 | histórico/deploy | commits e artefatos anteriores podem conservar valores removidos do snapshot atual |

## Impactos potenciais

- acesso não autorizado com credenciais reutilizadas;
- enumeração de usuários e exposição de dados pessoais;
- falsificação de sessão e acesso a telas protegidas no protótipo;
- consulta direta ou extração em massa caso as políticas do serviço de dados estejam permissivas;
- inclusão de material de autenticação em CSV, impressões, logs ou arquivos compartilhados;
- uso de dados expostos em phishing ou engenharia social;
- persistência de segredos/configuração em clones, caches, logs, artefatos e histórico Git;
- obrigação de avaliação pelo processo institucional de privacidade e incidentes.

## Contenção aplicada

### Dia 1

- [x] Remover registros reais de responsáveis do snapshot atual.
- [x] Remover credenciais administrativas do snapshot atual.
- [x] Desativar os dois mecanismos de autenticação e criação de sessão no navegador.
- [x] Desativar primeiro acesso e redefinição de senha no navegador.
- [x] Remover contas de demonstração das páginas públicas.
- [x] Colocar o portal raiz em contenção preventiva.
- [x] Limpar chaves legadas de Web Storage no logout.
- [x] Bloquear versionamento de `.env` e metadados locais da Vercel.
- [x] Adicionar política de segurança e documentação de variáveis sem valores.
- [x] Integrar e publicar o snapshot de contenção na `main`.

### Dia 3

- [x] Adicionar scanner preventivo sem impressão do conteúdo encontrado.
- [x] Remover endpoint/configuração e cliente remoto do bundle atual.
- [x] Substituir consulta direta por indisponibilidade segura até existir API server-side.
- [x] Remover a capacidade de exibir ou exportar material de autenticação.
- [ ] Integrar o PR do Dia 3 e confirmar o novo bundle na produção.

## Ações externas obrigatórias

| ID | Ação | Owner sugerido | Evidência de conclusão | Status |
| --- | --- | --- | --- | --- |
| EXT-001 | Rotacionar/revogar todas as credenciais e chaves expostas | Segurança + donos dos sistemas | IDs de rotação e data/hora, sem registrar os valores | Pendente |
| EXT-002 | Revogar sessões e tokens derivados | Segurança/IdP | relatório de revogação | Pendente |
| EXT-003 | Revisar logs de autenticação e acesso | Segurança/SOC | janela analisada e resultado | Pendente |
| EXT-004 | Invalidar caches e artefatos antigos na hospedagem/CDN | DevOps/Vercel owner | deployment seguro ativo e artefatos antigos indisponíveis | Pendente |
| EXT-005 | Habilitar secret scanning e push protection | Admin do GitHub | configuração/captura redigida | Pendente |
| EXT-006 | Avaliar notificação e tratamento LGPD | Encarregado/DPO + jurídico | registro de decisão | Pendente |
| EXT-007 | Decidir sobre reescrita do histórico Git | Owner do repositório + segurança | decisão formal e plano de comunicação | Pendente |
| EXT-008 | Revisar RLS/policies, permissões, tabelas e exposição do serviço de dados referenciado | Segurança + DBA/owner do serviço | relatório de policies, testes anônimos e ações corretivas | Pendente |
| EXT-009 | Revisar logs e volume de leitura/exportação do serviço de dados | Segurança + DBA/SOC | período analisado, anomalias e decisão | Pendente |
| EXT-010 | Identificar e remover arquivos exportados que possam conter material de autenticação | Segurança + donos do processo | inventário e descarte controlado | Pendente |

## Reescrita de histórico

A reescrita pode reduzir a exposição casual no Git, mas é destrutiva para clones, branches e referências existentes e não revoga segredos já copiados. Ela **não deve substituir rotação/revogação**. A ação exige aprovação explícita do owner, janela de mudança, backup, coordenação com todos os colaboradores e verificação posterior.

## Critérios de encerramento do incidente

- [ ] snapshot atual e produção não contêm os valores/configurações expostos;
- [ ] todas as credenciais e chaves afetadas foram rotacionadas/revogadas;
- [ ] sessões/tokens derivados foram invalidados;
- [ ] policies e acessos do serviço de dados foram revisados e testados;
- [ ] logs de autenticação, dados e exportações foram analisados;
- [ ] arquivos derivados com material de autenticação foram tratados;
- [ ] decisão de privacidade/LGPD foi registrada;
- [ ] secret scanning/push protection estão ativos;
- [ ] fluxos substitutos de identidade e dados foram revisados e testados;
- [ ] decisão sobre histórico Git foi executada ou formalmente aceita;
- [ ] owner de segurança aprovou o encerramento.

## Risco residual durante a contenção

As áreas protegidas e a consulta patrimonial permanecem indisponíveis por design. Isso reduz o risco de exploração dos mecanismos antigos, mas não entrega autenticação ou acesso a dados funcionais e não resolve cópias históricas. Identidade e dados somente podem ser reabertos após implementação server-side, políticas de escopo, rotação/revisão dos acessos afetados e validação negativa em produção.
