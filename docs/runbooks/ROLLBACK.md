# Runbook de rollback e recuperação de release

**Status:** baseline do Dia 3  
**Princípio:** o estado oficial é derivado do Git e dos dados; rollback de interface não é suficiente quando uma mudança já escreveu no banco ou integrou sistemas externos.

## 1. Classes de mudança

| Classe | Exemplos | Estratégia preferencial |
| --- | --- | --- |
| somente frontend/documentação | componente, rota, texto, CSS, contrato ainda não implementado | revert/forward-fix por Git e deploy automático Vercel |
| configuração | feature flag, issuer, limite, endpoint | restaurar valor aprovado no provedor + registrar mudança; nunca inserir no código |
| backend compatível | handler/regra sem schema destrutivo | revert do commit ou desligar flag, preservando compatibilidade |
| banco expand/contract | coluna/tabela/índice aditivo | desligar leitura/escrita nova, reverter app; remover schema só em release posterior |
| migração de dados | transformação/carga | rollback por `migration_run_id`, restore ou forward-fix conforme runbook da onda |
| workflow com efeito externo | transferência, baixa, e-mail, protocolo, estoque | compensação de negócio aprovada; não apagar evento/auditoria |
| incidente de segurança | segredo, auth bypass, PII | contenção imediata, revogação/rotação, rollback/flag e resposta a incidente |

## 2. Sinais para rollback

- Vercel build/deploy falhou para o SHA da `main`;
- erro 5xx ou latência excede budget após release;
- jornada crítica/regressão funcional falha;
- autorização horizontal/vertical ou sessão insegura;
- dados/relatórios divergentes;
- fila/outbox acumula além do limite;
- dependência externa causa cascata;
- acessibilidade crítica impede uso;
- segredo/PII aparece em bundle, log ou resposta.

Segurança/integridade têm prioridade sobre disponibilidade da funcionalidade; manter a capacidade bloqueada é um estado aceitável.

## 3. Rollback de código sem banco

1. identificar o primeiro SHA seguro e o SHA defeituoso;
2. registrar impacto, owner, início e correlation IDs sem conteúdo sensível;
3. criar revert ou forward-fix por branch/PR no GitHub;
4. executar os mesmos checks CI e preview quando o tempo permitir; incidente crítico pode usar processo break-glass auditado;
5. mesclar na `main`, acionando deploy automático Vercel;
6. confirmar status `Vercel: success` para o novo SHA;
7. executar smoke/regressão da jornada afetada e da contenção de auth;
8. observar métricas/logs e encerrar somente com evidência.

Não usar botão de redeploy como correção permanente, pois ele não cria novo estado versionado e pode republicar o mesmo defeito.

## 4. Feature flags

Mudanças de alto risco entram desligadas. A flag:

- é avaliada no servidor para capacidades sensíveis;
- possui owner, ambientes, data de expiração e fallback;
- não substitui autorização;
- não altera máquina de estado de forma incompatível;
- é registrada na auditoria quando muda comportamento oficial;
- pode desativar emissão externa preservando leitura/diagnóstico.

`AUTH_LOCKDOWN_ENABLED` permanece `true` até o gate de identidade.

## 5. Banco — expand/contract

### Expand

- adicionar estrutura nullable/compatível;
- criar índice de modo seguro para volume;
- publicar código que escreve antigo e/ou novo conforme estratégia;
- backfill idempotente e observável;
- reconciliar.

### Migrate

- migrar em lotes/checkpoints;
- manter versionamento e idempotência;
- não enviar notificações/efeitos externos durante backfill salvo intenção explícita;
- registrar diferenças/quarentena.

### Contract

- somente após todos os leitores/escritores migrarem e janela de rollback expirar;
- remover em release separado;
- backup/PITR e restore testados;
- aprovação DBA/owner.

DDL destrutiva junto da primeira leitura nova é proibida.

## 6. Falha durante migração/cutover

Seguir `docs/migration/MIGRATION_STRATEGY.md`:

- antes de abrir escrita nova, descartar carga pelo run e restaurar origem/target conforme plano;
- após escrita no novo sistema, avaliar exportação reversa, forward-fix ou operação controlada; simples retorno ao legado pode perder transações;
- congelar efeitos externos enquanto o estado é reconciliado;
- emitir relatório de contagem, integridade, valores e casos abertos;
- decisão go/no-go/rollback requer owners definidos no runbook do cutover.

## 7. Workflows e integrações

Uma mutação já efetivada não é “desfeita” apagando linha ou evento. Criar comando compensatório quando legalmente permitido, com:

- referência ao processo original;
- ator/approval e motivo;
- invariantes atuais;
- efeitos contábeis/patrimoniais;
- documento e auditoria;
- evento idempotente para sistemas externos;
- reconciliação posterior.

Falha de publicação usa outbox/retry; não repetir a transação de domínio sem idempotência.

## 8. Incidente de segurança

1. colocar a capacidade em contenção/flag segura;
2. revogar sessões/tokens/credenciais afetados;
3. impedir novo acesso ou exfiltração;
4. preservar evidências e revisar logs com acesso restrito;
5. remover material do snapshot corrente;
6. decidir tratamento de histórico/caches/artefatos;
7. avaliar privacidade/LGPD;
8. publicar correção por Git e validar bundle/respostas;
9. reabrir somente com aprovação de segurança.

O runbook específico do incidente atual está em `docs/security/INCIDENT-2026-07-28-CREDENTIAL-EXPOSURE.md`.

## 9. Validação pós-rollback

- SHA seguro publicado e rastreável;
- CI e Vercel com resultado registrado;
- rota/jornada afetada recuperada;
- autenticação, autorização e escopo não degradados;
- contagens/valores/ledger reconciliados quando aplicável;
- fila/outbox sem backlog anormal;
- logs sem repetição do erro e sem dados sensíveis;
- usuários/owners comunicados pelo canal aprovado;
- issue de causa raiz e prevenção criada.

## 10. Post-mortem

Para incidente relevante, registrar:

- linha do tempo absoluta;
- impacto e escopo de dados/usuários;
- detecção, contenção, recuperação e evidências;
- causa técnica e sistêmica sem culpabilização;
- por que os gates não detectaram antes;
- ações com owner/prazo/prioridade;
- atualização de teste, monitor, runbook, threat model ou ADR;
- decisão sobre risco residual.

Nunca anexar segredo, PII ou log bruto desnecessário ao documento público.
