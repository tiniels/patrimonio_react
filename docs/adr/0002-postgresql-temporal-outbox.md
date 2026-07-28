# ADR-0002 — PostgreSQL temporal, transações e transactional outbox

- **Status:** Aceito como baseline do Dia 2; fornecedor gerenciado pendente
- **Data:** 28 de julho de 2026
- **Decisores por função:** Arquitetura, DBA, Segurança, Tech Lead
- **Relacionados:** `docs/architecture/DATA_MODEL.md`, `docs/migration/MIGRATION_STRATEGY.md`, AC-D02-02, AC-D02-04

## Contexto

O domínio exige integridade referencial, precisão monetária, concorrência otimista, vigência, consultas relacionais, relatórios, ledger, migração/reconciliação e efeitos atômicos entre estado, auditoria e eventos. O ambiente de banco de produção ainda não foi escolhido/configurado. A aplicação atual não comprova persistência real.

## Decisão

Usar PostgreSQL gerenciado como banco transacional principal, com as seguintes regras:

1. schemas/repositórios lógicos por bounded context;
2. UUID interno imutável e códigos legados preservados como atributos/mapeamentos;
3. `timestamptz` UTC e intervalos de vigência `[valid_from, valid_to)`;
4. `numeric` para dinheiro/quantidade que exija precisão;
5. constraints, foreign keys e exclusão por intervalo quando a regra estiver homologada;
6. `version bigint`/ETag para concorrência otimista;
7. transações atômicas para invariantes e efeitos de workflow;
8. tabelas append-only para ledger/auditoria conforme o caso;
9. transactional outbox gravada no mesmo commit do estado de negócio;
10. staging e reconciliação em schemas separados;
11. backup/PITR, restore testado e menor privilégio por runtime/job;
12. nenhuma conexão privilegiada ou service-role exposta ao browser.

## Transactional outbox

Uma mutação que precisa notificar outro módulo/sistema grava:

- estado do agregado;
- evento de domínio versionado;
- auditoria necessária;
- registro da outbox;

na mesma transação. Um publisher lê registros não publicados, envia com ID estável e marca a publicação. Consumidores deduplicam por `eventId` e versão. A falha entre commit e publicação não perde o evento; repetição não duplica efeito.

## Temporalidade

Entidades de organização, classificação, acesso e responsabilidade usam vigência explícita. Histórico oficial não é reconstruído a partir de um único campo atual. Relatórios registram data de corte e versão de definição.

A correção retroativa, quando permitida, cria versão/evento de correção e exige análise de impacto em relatórios/processos; não reescreve silenciosamente fatos já utilizados.

## Alternativas consideradas

### A. Banco documental/NoSQL como fonte principal

**Rejeitada.** Não oferece vantagem comprovada para um domínio altamente relacional e aumenta o custo de consistência, joins, reconciliação e constraints.

### B. Estado em localStorage ou arquivos JSON

**Rejeitada.** Não atende concorrência, segurança, auditoria, transação, backup ou múltiplos usuários.

### C. Supabase/PostgREST diretamente do browser como única camada

**Rejeitada como padrão de escrita crítica.** PostgreSQL/Supabase pode ser o fornecedor gerenciado, mas workflows e integrações devem passar por aplicação servidor e policies. RLS é defesa adicional, não substituto universal das invariantes.

### D. Event sourcing completo

**Rejeitada agora.** Ledger/outbox/auditoria append-only são usados onde geram valor, mas reconstruir todos os agregados por eventos aumentaria complexidade sem necessidade comprovada.

### E. Publicar evento após commit sem outbox

**Rejeitada.** Cria janela de perda ou duplicidade entre banco e broker.

## Consequências positivas

- consistência forte para mutações críticas;
- modelo temporal/reconciliação com SQL;
- precisão e constraints no banco;
- migrações e consultas auditáveis;
- outbox reduz perda de eventos;
- fornecedor pode ser trocado entre ofertas compatíveis com PostgreSQL.

## Consequências negativas

- exige disciplina de migrações e tuning;
- schemas compartilhados precisam de controle de permissão;
- outbox requer publisher, métricas, retenção e deduplicação;
- auditoria/ledger podem crescer e exigir particionamento;
- funções serverless precisam de pooling/conexão compatível.

## Regras operacionais

- migrations são forward-compatible durante deploy e possuem rollback/forward-fix documentado;
- DDL não destrutiva precede alteração de aplicação; remoção ocorre em release posterior;
- consultas de lista são paginadas e avaliadas com volume realista;
- acesso break-glass ao banco é temporário, registrado e revisado;
- correção de dados usa script versionado, prévia, transação e relatório;
- outbox possui alerta por idade, retries limitados e tratamento de poison message;
- nenhum dado real é seed de desenvolvimento.

## Decisões pendentes

- fornecedor/region/network do PostgreSQL;
- estratégia de pooling para runtime Vercel;
- extensão para ranges/UUID/observabilidade permitida;
- volumes e particionamento de auditoria/outbox;
- RPO/RTO finais e retenção de backups;
- política de criptografia por campo para PII restrita.

Enquanto essas decisões não forem aprovadas, o modelo permanece lógico e nenhuma conexão/credencial de produção será adicionada.
