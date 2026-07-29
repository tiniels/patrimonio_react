# Runbook de CI/CD

**Status:** Dia 3  
**Workflow:** `.github/workflows/ci.yml`  
**Deploy:** GitHub → integração Vercel; nenhum deploy manual de código

## 1. Objetivo

Impedir que um commit chegue à `main` sem instalação reproduzível, políticas de ambiente/segredo, testes, TypeScript strict, lint, formato, contrato OpenAPI, análise de dependências e build de produção.

## 2. Gatilhos

- pull request destinado à `main`;
- push na `main` para verificar exatamente o commit publicado;
- execução manual somente para repetir diagnóstico do mesmo código, sem promover release.

O workflow não usa `pull_request_target`, não escreve no repositório e possui apenas `contents: read`.

## 3. Cadeia de gates

| Ordem | Gate | Falha significa | Tratamento |
| --- | --- | --- | --- |
| 1 | checkout pinado por SHA | código não obtido de forma confiável | revisar action/SHA oficial |
| 2 | Node pela `.nvmrc` | runtime divergente | alinhar `.nvmrc`, engines e Vercel |
| 3 | `check:env` | `.env.example` inválido, duplicado ou inseguro | corrigir nomes/defaults; nunca inserir valor real |
| 4 | `check:secrets` | arquivo/padrão sensível conhecido | remover do snapshot, rotacionar se real e registrar incidente |
| 5 | `npm ci` | package e lockfile divergentes ou dependência incompatível | atualizar lockfile em mudança controlada; não usar install como fallback no CI |
| 6 | auditoria de produção | vulnerabilidade alta/crítica em dependência runtime | atualizar/remover/mitigar e documentar exceção expirada |
| 7 | testes | política/regra/regressão falhou | corrigir comportamento ou teste com evidência |
| 8 | `tsc --noEmit` | contrato TypeScript inconsistente | corrigir tipos; não ocultar com `any`/ignore sem justificativa |
| 9 | ESLint | erro, risco ou variável não utilizada | corrigir código/configuração |
| 10 | Prettier | arquivos de código/config divergentes | formatar por mudança versionada |
| 11 | Redocly OpenAPI | contrato inválido segundo OpenAPI | corrigir schema/path/security/ref |
| 12 | Vite build | artefato de produção não compila | corrigir dependência/import/config |
| 13 | Vercel Preview | integração/runtime de hospedagem falhou | analisar status/log do preview e corrigir no PR |

## 4. Reprodutibilidade

- Node 24 LTS fixado em `.nvmrc` e `package.json#engines`.
- dependências da aplicação instaladas exclusivamente pelo `package-lock.json` com `npm ci`.
- actions oficiais referenciadas por SHA imutável e anotadas com a versão humana.
- runner fixado em `ubuntu-24.04`.
- Redocly CLI fixado em `2.40.0`; é baixado apenas para o gate de contrato.
- telemetria/aviso de atualização do Redocly desativados no CI.
- nenhum teste depende de relógio, rede, conta ou PII real nesta fase.

### Exceção temporária do Redocly

O CLI não está no lockfile do projeto porque o Dia 3 não executa `npm install` fora de automação e não deve editar manualmente a árvore transitiva. A versão é exata, não `latest`. Na primeira atualização controlada do lockfile, mover `@redocly/cli` para `devDependencies` e remover esta exceção.

## 5. Branch protection obrigatória

Configuração administrativa recomendada para `main`:

- exigir pull request;
- exigir aprovação de CODEOWNER;
- descartar aprovação após novos commits;
- exigir resolução de conversas;
- exigir branches atualizadas antes do merge quando não gerar fila excessiva;
- exigir checks `Quality gate` e `Vercel`;
- restringir bypass a break-glass auditado;
- proibir force push e exclusão;
- preferir histórico linear/squash;
- exigir commits assinados se a política institucional suportar;
- ativar secret scanning e push protection.

O conector disponível não expõe configuração de branch protection; essa ação administrativa deve permanecer em issue aberta até evidência de conclusão. Sem ela, o workflow existe, mas não há garantia técnica de que um administrador não faça bypass.

## 6. Processo de PR

1. branch deriva da `main` mais recente;
2. issue e dia do plano são vinculados;
3. arquivos/diff e fora de escopo são explícitos;
4. CI e Preview executam para o mesmo SHA;
5. falhas são corrigidas na branch e os gates repetem;
6. review verifica segurança, paridade, dados, acessibilidade e rollback conforme o tipo de mudança;
7. merge por squash usa `Dia X: descrição` durante o plano;
8. status do commit da `main` é confirmado após o deploy Vercel;
9. smoke/regressão do dia é registrado.

## 7. Diagnóstico sem ambiente local

A fonte de verdade é o log do check associado ao SHA:

- identificar primeiro gate que falhou;
- usar somente a mensagem necessária e redigir qualquer dado sensível;
- comparar package/lock/config e arquivos apontados;
- corrigir por novo commit na mesma branch;
- não substituir `npm ci` por instalação permissiva;
- não desativar regra/teste para “ficar verde” sem exceção formal;
- para Vercel, correlacionar SHA, build e rota de validação;
- para dependência externa indisponível, manter feature desabilitada e erro seguro.

## 8. Dependências

Dependabot abre PRs semanais separados para npm e GitHub Actions. Cada atualização:

- preserva lockfile;
- passa por todos os gates;
- revisa changelog/migração e licença quando relevante;
- não agrupa major updates automaticamente;
- verifica regressão na Vercel;
- atualiza threat model/ADR se mudar runtime, auth, banco ou build.

Vulnerabilidade explorável não aguarda a janela semanal; recebe correção/mitigação priorizada e incidente quando aplicável.

## 9. Segredos e logs

- nenhum workflow recebe segredo nesta fase;
- `persist-credentials: false` evita credencial Git residual no checkout;
- permissões padrão são read-only;
- logs dos scanners omitem o valor encontrado;
- falha real de segredo exige remoção do snapshot e rotação; apagar o log não resolve exposição;
- previews de forks não devem receber secrets;
- futuras actions externas exigem SHA, revisão de código/permissões e owner.

## 10. Artefatos e retenção

O build da Vercel é o artefato de validação atual. Quando CI passar a publicar artefatos próprios:

- nome incluirá SHA;
- SBOM/proveniência serão gerados;
- retenção será mínima e definida;
- artefato não conterá `.env`, source map público sensível ou PII;
- download exigirá autorização apropriada.

## 11. Rollback

Código é revertido por commit/PR na `main`, acionando novo deploy automático. Não usar redeploy manual como fonte de verdade. Migrações de banco seguem expand/contract e o runbook `ROLLBACK.md`.

## 12. Métricas iniciais

Registrar por PR/release:

- duração e taxa de sucesso do CI;
- gate mais frequente de falha;
- tempo do build Vercel;
- vulnerabilidades abertas por severidade/idade;
- dependências desatualizadas críticas;
- taxa de rollback/hotfix;
- cobertura das regras críticas, não apenas percentual global.

## 13. Checklist de manutenção

Mensalmente ou após incidente:

- revisar SHAs/versões das actions;
- revisar Node LTS e suporte Vercel antes de mudar;
- testar scanner com fixtures sintéticas;
- revisar regras do `.env.example`;
- revisar CODEOWNERS e bypasses;
- revisar dependências beta/prerelease;
- confirmar checks obrigatórios da `main`;
- verificar que Vercel associa produção exclusivamente à `main` aprovada.
