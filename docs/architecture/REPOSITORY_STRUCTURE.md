# Estrutura do repositório e fronteiras de entrega

**Status:** baseline do Dia 3  
**Decisão:** preservar o runtime web na raiz até que CI e preview validem uma migração física; adotar desde já fronteiras lógicas e o layout-alvo do monólito modular.

## 1. Estado atual mapeado

| Caminho | Responsabilidade atual | Owner por função | Regra |
| --- | --- | --- | --- |
| `src/` | aplicação web TanStack Start, rotas e componentes | Frontend/Plataforma | não contém segredo, senha ou autorização confiável no cliente |
| `src/lib/` | compatibilidade e utilitários do protótipo | Tech Lead | novos domínios não devem crescer como stores globais de browser |
| `packages/contracts/` | contratos compartilháveis, começando por OpenAPI | Arquitetura/API | versionado e validado antes da implementação |
| `scripts/` | quality gates executáveis com Node built-in | DevOps/Tech Lead | sem acesso a segredo e sem alterar dados |
| `tests/` | testes de políticas, contratos e regressões estruturais | QA/Tech Lead | somente dados sintéticos |
| `docs/` | arquitetura, ADRs, descoberta, migração, segurança e entrega | Owners por domínio | decisão desconhecida permanece marcada como bloqueio/hipótese |
| `.github/` | CI, ownership, revisão e atualização de dependências | DevOps/Admin GitHub | permissões mínimas e actions pinadas por SHA |

## 2. Layout-alvo

```text
apps/
  web/       # React/TanStack Start e BFF compatível com Vercel
  api/       # extração opcional do runtime HTTP quando houver necessidade comprovada
  worker/    # jobs longos, outbox, relatórios e integrações
packages/
  contracts/ # OpenAPI, eventos, schemas públicos e clientes gerados
  domain/    # tipos, regras e portas sem dependência de framework
  ui/        # design system e padrões acessíveis
  observability/
tooling/
  eslint/
  typescript/
  testing/
  migrations/
docs/
```

O layout não implica microserviços. `apps/api` e `apps/worker` podem permanecer módulos/deploys do mesmo sistema enquanto não houver ADR de extração.

## 3. Por que o runtime não foi movido no Dia 3

Mover `src`, `vite.config.ts`, o adapter TanStack e a raiz de build antes de existir CI criaria risco de indisponibilidade e exigiria alterar a configuração conectada da Vercel. O Dia 3 primeiro estabelece:

- instalação congelada por lockfile;
- typecheck, lint, formato, testes e build em CI;
- preview Vercel por PR;
- rollback por commit Git;
- owners e checklist de revisão.

A migração física será um PR próprio após esses gates estarem obrigatórios. Até lá, a raiz é tratada como `apps/web` lógico.

## 4. Critérios para a migração física

1. CI e Vercel verdes na `main` por pelo menos um ciclo de mudança.
2. Root Directory e comandos de build documentados sem ajuste manual de código.
3. `package-lock.json` regenerado por automação controlada e revisado.
4. imports/aliases, route generation e server entry testados no preview.
5. nenhum caminho de deploy ou variável secreta codificado.
6. rollback por revert validado.
7. CODEOWNERS atualizado por área.
8. ADR ou atualização deste documento com impacto e resultado.

## 5. Regras de dependência

- `apps/web` depende de `packages/contracts`, `packages/ui` e portas públicas; não importa persistência.
- `packages/domain` não depende de React, Vite, Vercel, banco ou SDK externo.
- `packages/contracts` não importa entidades internas nem dados reais.
- adaptadores de banco/IdP/storage ficam no limite servidor.
- um bounded context não importa pasta `internal` de outro.
- jobs recebem comandos/eventos tipados e idempotentes.
- código gerado fica identificado, reproduzível e fora de edição manual.
- dependência circular ou exceção exige ADR e prazo de remoção.

## 6. Convenções

| Item | Convenção |
| --- | --- |
| Node | versão em `.nvmrc` e `package.json#engines` |
| Dependências | `package-lock.json`; instalação de CI somente com `npm ci` |
| Branch | `agent/dia-X-descricao` para este plano; feature/fix convencionais depois |
| Commit final | `Dia X: descrição objetiva` por squash |
| TypeScript | `strict`, sem `any`/supressão sem justificativa |
| Configuração | `.env.example` sem valores sensíveis; runtime server-only |
| Testes | sintéticos, determinísticos e sem PII |
| Contratos | OpenAPI/eventos versionados e validados no CI |
| Actions | referência por SHA imutável e comentário da versão |

## 7. Workspaces

Workspaces npm ainda não são ativados porque não há pacotes executáveis independentes nem lockfile gerado para o layout-alvo. Ativá-los apenas para criar diretórios vazios aumentaria complexidade e poderia quebrar `npm ci`.

A ativação ocorrerá junto da primeira extração real (`packages/domain` ou `packages/ui`) e deverá:

- manter um único lockfile na raiz;
- declarar cada pacote `private` quando não publicável;
- definir exports explícitos;
- bloquear importações internas;
- preservar build da Vercel;
- passar pelo mesmo CI e preview.

Essa é uma exceção de implementação, não uma autorização para voltar ao acoplamento do protótipo.

## 8. Ownership pendente

O CODEOWNERS inicial aponta para `@tiniels` porque os owners nominais por domínio ainda não foram definidos. Antes de habilitar módulos de produção, substituir ownership genérico por responsáveis de Frontend, Plataforma, Segurança, DBA, Patrimônio, Contabilidade, Inventário e Galpão, mantendo ao menos um revisor de segurança para identidade/integrações.
