# Patrimônio Inteligente

Sistema de gestão patrimonial em modernização incremental, orientada pelo `PLANO_30_DIAS_GESTAO_PATRIMONIO.md`.

- **Produção/Vercel:** `https://patrimonio-react.vercel.app/`
- **Repositório:** `tiniels/patrimonio_react`
- **Arquitetura:** monólito modular evolutivo, contrato-first e server-authorized
- **Estado atual:** contenção preventiva de identidade e dados protegidos

## Estado de segurança

O protótipo anterior processava credenciais, sessões e dados protegidos no navegador. Esses fluxos foram bloqueados e o snapshot atual está sendo submetido a quality gates antes da reabertura de qualquer acesso.

Enquanto o incidente permanecer aberto:

- autenticação, primeiro acesso e recuperação continuam indisponíveis;
- o browser não conecta diretamente ao banco patrimonial;
- telas que exibiam ou exportavam material de autenticação permanecem removidas;
- nenhuma credencial, chave ou dado pessoal real pode ser incluído em código, teste, issue, log ou documentação;
- serviços externos só podem ser habilitados após configuração server-side, autorização por escopo e validação de segurança.

Consulte `SECURITY.md` e `docs/security/INCIDENT-2026-07-28-CREDENTIAL-EXPOSURE.md`.

## Entrega e ambientes

Todo código é promovido por GitHub:

1. branch e pull request;
2. quality gate no GitHub Actions;
3. preview automático na Vercel;
4. revisão do diff, riscos, paridade e roteiro do dia;
5. squash merge na `main`;
6. deploy automático da Vercel e validação do SHA publicado.

Não há deploy manual de código. A fonte de verdade é o commit aprovado na `main`.

A estratégia completa está em:

- `docs/environments/ENVIRONMENT_STRATEGY.md`;
- `docs/runbooks/CI_CD.md`;
- `docs/runbooks/ROLLBACK.md`.

## Quality gate

O workflow `.github/workflows/ci.yml` executa, em ordem:

- validação do contrato `.env.example`;
- varredura preventiva de arquivos e padrões sensíveis;
- instalação congelada por `npm ci` e `package-lock.json`;
- auditoria das dependências de produção;
- testes automatizados;
- TypeScript strict;
- ESLint sem warnings;
- verificação de formato;
- validação do OpenAPI 3.1;
- build de produção.

O runtime está fixado em Node.js 24 LTS por `.nvmrc` e `package.json#engines`.

## Configuração

`.env.example` documenta somente nomes de variáveis e defaults seguros. Valores reais são configurados no ambiente criptografado do provedor e nunca no frontend ou no repositório.

Capacidades sem configuração obrigatória devem falhar de forma segura e permanecer desabilitadas. Nesta fase, `AUTH_LOCKDOWN_ENABLED` deve continuar ativo.

## Arquitetura e contratos

- visão C4 e implantação: `docs/architecture/README.md`;
- bounded contexts e invariantes: `docs/architecture/DOMAIN_MAP.md`;
- modelo lógico temporal: `docs/architecture/DATA_MODEL.md`;
- máquinas de estado: `docs/architecture/STATE_MACHINES.md`;
- NFRs e budgets: `docs/architecture/NON_FUNCTIONAL_REQUIREMENTS.md`;
- threat model: `docs/architecture/THREAT_MODEL.md`;
- estrutura do repositório: `docs/architecture/REPOSITORY_STRUCTURE.md`;
- OpenAPI: `packages/contracts/openapi/patrimonio-v1.yaml`;
- ADRs: `docs/adr/`;
- migração e reconciliação: `docs/migration/MIGRATION_STRATEGY.md`.

## Paridade e evidências

A existência de uma tela, rota ou contrato não comprova paridade funcional. O estado oficial por módulo está em `docs/parity/PARITY_MATRIX.md`.

Paridade total exige walkthrough autenticado do legado, contratos homologados, implementação, testes negativos, reconciliação de relatórios e UAT assinado pelo owner do processo.

As entregas diárias e os roteiros de validação ficam em `docs/delivery/`.

## Contribuição

Todo pull request deve:

- vincular o dia/issue e listar arquivos e fora de escopo;
- usar dados exclusivamente sintéticos;
- preservar autenticação e autorização no servidor;
- tratar loading, empty, error, conflito e dependência indisponível;
- atender WCAG 2.2 AA nas alterações visuais;
- atualizar contratos, riscos, migração e matriz de paridade quando aplicável;
- passar no CI e no preview da Vercel;
- definir rollback/fallback seguro;
- usar mensagem de squash no formato `Dia X: descrição objetiva` durante o plano.

O checklist versionado está em `.github/pull_request_template.md`.
