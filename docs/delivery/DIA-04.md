# Dia 4 — Autenticação administrativa e gerenciamento seguro de sessão

**Branch:** `agent/dia-4-auth-admin-sessao`  
**Base:** `main` após o Dia 3 (`aadb7283b4da0dbd1ebbe44dde39f37f28cb50d2`)  
**Marco:** M3 — Identidade, parte 1/3  
**Foco:** login administrativo, sessão server-side, proteção contra abuso, logout e fallback seguro.

## Objetivo

Implantar a fundação da autenticação administrativa sem restaurar credenciais, contas de demonstração ou sessão confiável no navegador. A aplicação passa a possuir endpoints server-side e uma interface de login conectada à API, mas permanece bloqueada por padrão até que o ambiente seguro da Vercel esteja completo e validado.

```text
AUTH_LOCKDOWN_ENABLED=true
```

## Reorganização após o Dia 3

- [x] Estado anterior do Dia 4 preservado em `archive/dia-4-pre-rebase`.
- [x] Branch do Dia 4 reiniciada sobre a `main` consolidada do Dia 3.
- [x] `package.json` do Dia 3 preservado; apenas o escopo dos gates foi ampliado para os novos arquivos.
- [x] `.github/workflows/ci.yml` do Dia 3 preservado sem substituição ou workflow concorrente.
- [x] `scripts/check-env-example.mjs` preservado e ampliado; o validador paralelo do rascunho anterior não foi recriado.
- [x] CODEOWNERS, Dependabot, scanner, OpenAPI e runbooks do Dia 3 permanecem intactos.

## Arquivos criados

- `src/lib/auth/adminAuth.server.ts`
- `tests/auth-admin-server.test.mjs`
- `docs/runbooks/BREAK_GLASS.md`
- `docs/runbooks/VERCEL_AUTH_CONFIGURATION.md`
- `docs/delivery/DIA-04.md`

## Arquivos modificados

- `.env.example`
- `scripts/check-env-example.mjs`
- `src/server.ts`
- `src/lib/authStore.ts`
- `src/components/AuthGuard.tsx`
- `src/components/AppShell.tsx`
- `src/routes/login.tsx`
- `tests/auth-containment.test.mjs`
- `package.json`
- `docs/parity/PARITY_MATRIX.md`

## Endpoints implementados

| Método | Rota | Finalidade | Controles |
| --- | --- | --- | --- |
| `GET` | `/api/v1/auth/status` | Estado público e minimizado do serviço | `no-store`, sem configuração sensível |
| `POST` | `/api/v1/auth/admin/login` | Validar a identidade administrativa no servidor | origem same-origin, PBKDF2, rate limit, mensagem genérica |
| `GET` | `/api/v1/auth/session` | Obter contexto mínimo da sessão ativa | cookie assinado, expiração e versão de sessão |
| `DELETE` | `/api/v1/auth/session` | Encerrar a sessão atual | same-origin, token CSRF e expiração do cookie |

## Segurança implementada

- [x] Nenhuma senha, hash, conta ou PII real foi adicionada ao frontend ou aos testes.
- [x] Credenciais são processadas somente no servidor.
- [x] O bootstrap temporário aceita apenas hash `PBKDF2-SHA256` com salt e iterações controladas.
- [x] Cookie `__Host-patrimonio_session` usa `Path=/`, `HttpOnly`, `Secure` e `SameSite=Lax`.
- [x] Sessão é assinada por HMAC-SHA256, expira e pode ser invalidada globalmente por `AUTH_SESSION_VERSION`.
- [x] Logout exige token CSRF associado à sessão.
- [x] Mutações de identidade rejeitam origem externa e `Sec-Fetch-Site: cross-site`.
- [x] Tentativas inválidas compartilham mensagem genérica para não enumerar usuários.
- [x] Rate limiting inicial usa IP e fingerprint não reversível do login.
- [x] Auditoria técnica registra tipo, motivo, correlation ID e horário, sem senha, cookie ou login informado.
- [x] Respostas usam `Cache-Control: no-store` e `X-Content-Type-Options: nosniff`.
- [x] Redirecionamento pós-login aceita somente caminho local seguro.
- [x] Sessão de autenticação nunca é criada em `localStorage` ou `sessionStorage`.

## Estados de interface

A rota `/login` trata explicitamente:

- verificação inicial do serviço;
- lockdown ativo;
- provedor incompleto;
- campos e botão desabilitados durante indisponibilidade;
- validação local de obrigatoriedade;
- loading de autenticação;
- credencial inválida;
- rate limiting;
- falha de rede;
- sucesso e redirecionamento;
- Caps Lock;
- confirmação de logout.

`AuthGuard` aguarda a verificação server-side antes de redirecionar e impede que a interface protegida seja renderizada durante o estado de autenticação desconhecido.

## Testes automatizados

Os testes do Dia 4 usam somente dados sintéticos e validam:

1. lockdown como estado padrão sem configuração;
2. login bloqueado sem criação de cookie;
3. rejeição de origem externa;
4. autenticação sintética server-side;
5. atributos obrigatórios do cookie;
6. leitura da sessão e contexto mínimo;
7. rejeição de logout sem CSRF;
8. logout válido e expiração do cookie;
9. bloqueio após tentativas inválidas;
10. ausência de conta e sessão confiável no bundle/navegador.

## Contrato de ambiente

Novas chaves documentadas, sempre sem valores reais:

- `AUTH_SESSION_VERSION`
- `AUTH_SESSION_MAX_AGE_SECONDS`
- `ADMIN_BOOTSTRAP_ID`
- `ADMIN_BOOTSTRAP_LOGIN`
- `ADMIN_BOOTSTRAP_PASSWORD_HASH`
- `ADMIN_BOOTSTRAP_DISPLAY_NAME`
- `ADMIN_BOOTSTRAP_ROLE`
- `ADMIN_BOOTSTRAP_ROLE_LABEL`
- `ADMIN_BOOTSTRAP_CARGO`
- `ADMIN_BOOTSTRAP_SECRETARIA`
- `ADMIN_BOOTSTRAP_SETOR`
- `ADMIN_BOOTSTRAP_CODIGO_SETOR`
- `ADMIN_BOOTSTRAP_EMAIL`

A ativação operacional está descrita em `docs/runbooks/VERCEL_AUTH_CONFIGURATION.md`.

## Proteção administrativa da `main`

O código e os documentos para o processo estão versionados, mas as seguintes configurações pertencem ao plano de controle do GitHub e não podem ser comprovadas pelo diff:

- exigir pull request;
- exigir aprovação de CODEOWNER;
- invalidar aprovação após novo commit;
- exigir resolução de conversas;
- exigir `Quality gate` e `Vercel` para o mesmo SHA;
- proibir force push e exclusão da `main`;
- restringir bypass;
- habilitar secret scanning e push protection.

O acompanhamento permanece na issue `#7`. O processo de exceção está formalizado em `docs/runbooks/BREAK_GLASS.md`. A issue só deve ser encerrada após teste negativo demonstrar que um PR com check ausente ou falho não pode ser integrado.

## Critérios de aceite

| Critério | Resultado esperado |
| --- | --- |
| Credencial ausente do bundle | scanner e testes aprovados |
| Login client-side proibido | stores continuam retornando falha segura |
| API de identidade server-side | endpoints e testes sintéticos aprovados |
| Cookie seguro | atributos verificados em teste e preview configurado |
| Sessão e logout | consulta, CSRF e expiração aprovados |
| Proteção contra abuso | mensagem genérica e `429` em teste |
| Rotas protegidas | loading inicial e redirecionamento sem sessão |
| Lockdown seguro | ativo no preview e produção até configuração aprovada |
| CI e Vercel | ambos aprovados para o mesmo SHA do PR |
| Configuração real da Vercel | ação administrativa externa, sem valores no GitHub |

## Limitações e bloqueios

- O rate limiting é local ao processo serverless e ainda não é distribuído entre instâncias.
- Revogação individual persistente exige banco/store de sessão; no Dia 4 há expiração atual e revogação global por versão/segredo.
- `local-admin` é bootstrap temporário e deve ser substituído por OIDC institucional.
- O login real não pode ser testado na Vercel enquanto os valores secretos não forem configurados por administrador autorizado.
- A rotação e resposta ao incidente histórico continuam acompanhadas na issue `#2`.
- Secret scanning, push protection e regras da `main` exigem configuração administrativa no GitHub.

## Roteiro de validação na Vercel

### Fase segura, sem valores reais

1. Abrir `/api/v1/auth/status` e confirmar `lockdownEnabled: true` e `configured: false`.
2. Abrir `/login` e confirmar aviso de indisponibilidade, campos desabilitados e ausência de contas de teste.
3. Enviar `POST /api/v1/auth/admin/login` com massa sintética e confirmar `503`, sem `Set-Cookie`.
4. Abrir `/adm` sem sessão e confirmar redirecionamento para `/login` sem conteúdo protegido.
5. Inspecionar o bundle e Web Storage, confirmando ausência de identidade, senha e sessão confiável.

### Fase controlada, após configuração administrativa

1. Configurar todos os valores no cofre da Vercel mantendo o lockdown ativo.
2. Validar o novo deployment e somente então alterar `AUTH_LOCKDOWN_ENABLED=false`.
3. Testar login válido e inválido.
4. Confirmar cookie `__Host-patrimonio_session` com todos os atributos.
5. Confirmar `/api/v1/auth/session` e acesso a `/adm`.
6. Confirmar logout com expiração do cookie e negação posterior da rota.
7. Confirmar resposta `429` após o limite configurado.
8. Restaurar imediatamente o lockdown em qualquer divergência.

## Commit de squash planejado

```text
Dia 4: autenticação administrativa e sessão segura
```
