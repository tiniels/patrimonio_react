# INC-2026-07-28 — Exposição de credenciais e PII no frontend

**Severidade inicial:** Crítica  
**Status:** Contenção técnica do snapshot atual em andamento  
**Detectado em:** 28 de julho de 2026  
**Escopo:** repositório público, bundles publicados e possíveis cópias/caches do histórico

> Este documento não reproduz credenciais, nomes, e-mails, telefones, prontuários ou outros dados pessoais encontrados.

## Resumo executivo

O protótipo incluía credenciais administrativas em código TypeScript, uma base de responsáveis com dados pessoais e senhas, autenticação executada no navegador, sessão confiada a Web Storage e redefinição de senha local. Como o repositório e a aplicação são públicos, os valores devem ser tratados como comprometidos, independentemente de evidência de uso indevido.

## Evidências técnicas

| ID | Arquivo/área | Evidência sem conteúdo sensível |
| --- | --- | --- |
| EVD-001 | `src/lib/authStore.ts` | registros administrativos com campo de senha e comparação no cliente |
| EVD-002 | `src/lib/respUsers.ts` | registros pessoais e campo de senha compilados no frontend |
| EVD-003 | `src/routes/login.tsx` | seleção/preenchimento de contas e login simulado |
| EVD-004 | `src/routes/responsavel-login.tsx` | exemplos de responsáveis, preenchimento de senha e recuperação simulada |
| EVD-005 | `src/routes/set-password.tsx` | enumeração de identidade e persistência de nova senha no navegador |
| EVD-006 | `src/components/AuthGuard.tsx` | autorização de interface baseada em sessão cliente |
| EVD-007 | histórico/deploy | commits e artefatos anteriores podem conservar os valores removidos do snapshot atual |

## Impactos potenciais

- acesso não autorizado com credenciais reutilizadas;
- enumeração de usuários e exposição de dados pessoais;
- falsificação de sessão e acesso a telas protegidas no protótipo;
- uso de dados expostos em phishing ou engenharia social;
- persistência de segredos em clones, caches, logs, artefatos e histórico Git;
- obrigação de avaliação pelo processo institucional de privacidade e incidentes.

## Contenção aplicada na branch do Dia 1

- [x] Remover registros reais de responsáveis do snapshot atual.
- [x] Remover credenciais administrativas do snapshot atual.
- [x] Desativar autenticação e criação de sessão no navegador.
- [x] Desativar primeiro acesso e redefinição de senha no navegador.
- [x] Remover contas de demonstração das páginas públicas.
- [x] Limpar chaves legadas de Web Storage no logout.
- [x] Bloquear versionamento de `.env` e metadados locais da Vercel.
- [x] Adicionar política de segurança e documentação de variáveis sem valores.
- [ ] Integrar a branch, publicar novo bundle e confirmar invalidação do artefato anterior.

## Ações externas obrigatórias

| ID | Ação | Owner sugerido | Evidência de conclusão | Status |
| --- | --- | --- | --- | --- |
| EXT-001 | Rotacionar/revogar todas as credenciais expostas | Segurança + donos dos sistemas | IDs de rotação e data/hora, sem registrar os valores | Pendente |
| EXT-002 | Revogar sessões e tokens derivados | Segurança/IdP | relatório de revogação | Pendente |
| EXT-003 | Revisar logs de autenticação e acesso | Segurança/SOC | janela analisada e resultado | Pendente |
| EXT-004 | Invalidar caches e artefatos antigos na hospedagem/CDN | DevOps/Vercel owner | deployment seguro ativo e artefatos antigos indisponíveis | Pendente |
| EXT-005 | Habilitar secret scanning e push protection | Admin do GitHub | configuração/captura redigida | Pendente |
| EXT-006 | Avaliar notificação e tratamento LGPD | Encarregado/DPO + jurídico | registro de decisão | Pendente |
| EXT-007 | Decidir sobre reescrita do histórico Git | Owner do repositório + segurança | decisão formal e plano de comunicação | Pendente |

## Reescrita de histórico

A reescrita pode reduzir a exposição casual no Git, mas é destrutiva para clones, branches e referências existentes e não revoga segredos já copiados. Ela **não deve substituir rotação/revogação**. A ação exige aprovação explícita do owner, janela de mudança, backup, coordenação com todos os colaboradores e verificação posterior.

## Critérios de encerramento do incidente

- [ ] snapshot atual e produção não contêm os valores expostos;
- [ ] todos os segredos afetados foram rotacionados/revogados;
- [ ] sessões/tokens derivados foram invalidados;
- [ ] logs foram analisados e achados tratados;
- [ ] decisão de privacidade/LGPD foi registrada;
- [ ] secret scanning/push protection estão ativos;
- [ ] fluxo substituto de autenticação foi revisado e testado;
- [ ] decisão sobre histórico Git foi executada ou formalmente aceita;
- [ ] owner de segurança aprovou o encerramento.

## Risco residual durante a contenção

As áreas protegidas permanecem indisponíveis por design. Isso reduz o risco de exploração do mecanismo antigo, mas não entrega autenticação funcional e não resolve cópias históricas. O acesso só deve ser reaberto nos Dias 4–6, após implementação e validação server-side.
