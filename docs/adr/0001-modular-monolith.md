# ADR-0001 — Adotar monólito modular evolutivo

- **Status:** Aceito como baseline do Dia 2
- **Data:** 28 de julho de 2026
- **Decisores por função:** Arquitetura, Tech Lead, DevOps, Segurança
- **Relacionados:** Issue #3, `docs/architecture/README.md`, AC-D02-01, AC-D02-06

## Contexto

O repositório atual contém uma aplicação React/TanStack Start implantada automaticamente na Vercel, porém sem backend confiável comprovado. O domínio possui forte consistência entre bens, responsabilidades, transferências, inventário, avaliação/baixa, galpão e documentos. Os volumes, limites de integração e ownership operacional ainda não foram medidos. Separar serviços agora criaria contratos distribuídos e consistência eventual antes de existirem equipe, observabilidade e necessidade comprovadas.

Ao mesmo tempo, manter todas as regras em componentes/stores do frontend perpetuaria o acoplamento e os riscos identificados no Dia 1.

## Decisão

Adotar um **monólito modular evolutivo**:

1. uma base de código e, inicialmente, um deploy principal compatível com a Vercel;
2. módulos de domínio com fronteiras, owners, portas públicas e dados logicamente isolados;
3. aplicação servidor/BFF responsável por autenticação, autorização, casos de uso e transações;
4. PostgreSQL compartilhado fisicamente no início, organizado por schemas/repositórios de módulo;
5. processos longos executados por worker/fila gerenciada quando necessários;
6. integração entre módulos síncrona por serviços de aplicação tipados ou assíncrona por eventos/outbox;
7. UI dependente de contratos HTTP/tipos públicos, nunca das tabelas ou entidades internas;
8. evolução para serviço separado somente por ADR com evidência operacional.

A organização física do repositório pode migrar gradualmente para `apps/web`, `apps/api` e `apps/worker`; essa mudança não será feita antes de o CI do Dia 3 proteger build e rotas da Vercel.

## Alternativas consideradas

### A. Microserviços desde o início

**Rejeitada agora.** Aumenta deploys, rede, observabilidade, segurança, consistência e suporte sem dados de escala ou times independentes. Poderá ser reconsiderada por contexto quando houver critério mensurado.

### B. Backend-as-a-Service acessado diretamente pelo browser

**Rejeitada como arquitetura principal.** RLS pode complementar a defesa, mas regras críticas, workflows, integrações, auditoria e segredos não devem depender de lógica cliente nem de acesso direto indiscriminado.

### C. Frontend-only com localStorage/mocks

**Rejeitada.** Foi a origem dos achados críticos do Dia 1 e não atende autenticação, autorização, integridade, auditoria nem produção.

### D. Monólito sem fronteiras internas

**Rejeitada.** Simplifica o começo, mas gera dependência circular, alteração direta entre tabelas e impossibilita evolução segura.

## Consequências positivas

- transações locais para workflows críticos;
- menor custo operacional inicial;
- contratos e domínio testáveis;
- deploy incremental compatível com a plataforma atual;
- possibilidade de extrair worker/contexto sem reescrever regras;
- ownership e paridade rastreáveis por módulo.

## Consequências negativas

- disciplina arquitetural precisa ser automatizada/revisada;
- banco físico compartilhado pode facilitar acessos indevidos entre módulos;
- uma regressão pode afetar o deploy conjunto;
- escala independente exige futura extração;
- tarefas longas precisam de serviço assíncrono compatível com limites serverless.

## Regras de conformidade

- nenhum módulo importa código `internal` de outro;
- nenhuma query cruza schema de outro módulo fora de read model/porta aprovada;
- mutação crítica ocorre em caso de uso/comando específico;
- eventos externos passam por outbox;
- novo acoplamento deve ser registrado no mapa de domínio;
- CI deverá validar dependências assim que a estrutura de módulos existir.

## Critérios para reconsiderar

Criar ADR de extração quando houver ao menos um dos seguintes: escala independente, requisito de rede/segurança, runtime incompatível, SLA diferente, deploy frequente com impacto indevido, ownership de equipe independente ou carga que comprometa o restante da aplicação. A proposta deve incluir contrato, consistência, migração, observabilidade, custo e rollback.
