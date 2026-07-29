# Dia 4 — Autenticação administrativa e gerenciamento seguro de sessão

**Branch:** `agent/dia-4-auth-admin-sessao`  
**Marco:** M3 — Identidade, parte 1/3  
**Foco do plano:** login administrativo, sessão, proteções de abuso e logout/revogação.

## Objetivo

Reabrir o fluxo administrativo sem voltar ao padrão inseguro do protótipo. A autenticação passa a ocorrer em endpoint server-side, com sessão por cookie `HttpOnly`, `Secure` e `SameSite=Lax`, rate limiting básico, logout e limpeza de chaves legadas do navegador.

O acesso permanece bloqueado por padrão enquanto `AUTH_LOCKDOWN_ENABLED=true` ou enquanto variáveis obrigatórias não estiverem configuradas no ambiente seguro da Vercel.

## Análise do estado atual

- [x] Dia 1 removeu credenciais e PII do bundle e bloqueou autenticação client-side.
- [x] Dia 2 definiu contrato e arquitetura-alvo para identidade server-side.
- [x] Dia 3 iniciou scripts de qualidade e validação.
- [x] `src/lib/authStore.ts` ainda retornava sempre sessão nula; foi convertido para consultar sessão server-side.
- [x] `/login` ainda era tela de contenção; foi substituída por formulário acessível que chama API server-side.
- [x] `AuthGuard` redirecionava antes de aguardar a verificação de sessão; foi ajustado para aguardar loading.
- [x] `AppShell` exibia usuário fixo; foi conectado à sessão real e ao logout.

## Arquivos criados

- `.github/workflows/ci.yml`
- `scripts/validate-env.mjs`
- `src/lib/auth/adminAuth.server.ts`
- `docs/delivery/DIA-04.md`

## Arquivos modificados

- `.env.example`
- `src/server.ts`
- `src/lib/authStore.ts`
- `src/components/AuthGuard.tsx`
- `src/components/AppShell.tsx`
- `src/routes/login.tsx`

## Endpoints implementados

| Método | Rota | Finalidade | Segurança |
| --- | --- | --- | --- |
| `GET` | `/api/v1/auth/status` | Expor estado não sensível da configuração de autenticação | `no-store`, sem PII |
| `POST` | `/api/v1/auth/admin/login` | Validar credenciais administrativas no servidor | PBKDF2, rate limit, resposta genérica |
| `GET` | `/api/v1/auth/session` | Retornar contexto mínimo da sessão | Cookie HttpOnly assinado |
| `DELETE` | `/api/v1/auth/session` | Encerrar sessão atual | Expira cookie e limpa storage/cache compatível |

## Variáveis de ambiente necessárias para desbloquear

| Variável | Obrigatória quando `AUTH_LOCKDOWN_ENABLED=false` | Observação |
| --- | --- | --- |
| `AUTH_PROVIDER` | Sim | Usar `local-admin` até OIDC institucional ser homologado. |
| `SESSION_SECRET` | Sim | Mínimo 32 caracteres, apenas no ambiente seguro. |
| `AUTH_SESSION_VERSION` | Recomendado | Incrementar para revogação global de sessões. |
| `AUTH_SESSION_MAX_AGE_SECONDS` | Recomendado | Padrão de 8 horas. |
| `ADMIN_BOOTSTRAP_LOGIN` | Sim para `local-admin` | Login inicial temporário, não expor no frontend. |
| `ADMIN_BOOTSTRAP_PASSWORD_HASH` | Sim para `local-admin` | Formato `pbkdf2_sha256$iteracoes$saltBase64Url$hashBase64Url`. |
| `ADMIN_BOOTSTRAP_ROLE` | Opcional | Aceita `admin`, `contabilidade`, `chefia` ou `galpao`. |
| `AUTH_RATE_LIMIT_WINDOW_SECONDS` | Opcional | Padrão de 300 segundos. |
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` | Opcional | Padrão de 5 tentativas. |

## Mudanças implementadas

- [x] Nenhuma senha, conta de demonstração ou PII foi adicionada ao frontend.
- [x] Autenticação administrativa usa endpoint server-side e hash PBKDF2-SHA256 configurado por variável de ambiente.
- [x] Sessão usa cookie `__Host-patrimonio_session` com `HttpOnly`, `Secure`, `SameSite=Lax` e assinatura HMAC-SHA256.
- [x] Sessão contém apenas contexto mínimo necessário para UI e autorização inicial.
- [x] `AUTH_SESSION_VERSION` permite revogação global ao trocar a versão configurada.
- [x] Logout expira o cookie e remove chaves legadas do browser.
- [x] Rate limit em memória por IP e fingerprint do login reduz força bruta sem revelar existência de conta.
- [x] UI de login possui estados de loading, erro, indisponibilidade, sucesso, Caps Lock e navegação por teclado.
- [x] CI inicial executa `npm ci`, validação de ambiente, TypeScript, ESLint, Prettier, build e Gitleaks.
- [x] `.env.example` documenta variáveis sem valores sensíveis.

## Critérios de aceite do Dia 4

| Critério | Resultado | Evidência/Exceção |
| --- | --- | --- |
| Credenciais não ficam no bundle | Atendido | Login consome API e `.env.example` não contém valores reais. |
| Autenticação ocorre no servidor | Atendido para provedor `local-admin` temporário | `src/lib/auth/adminAuth.server.ts` e interceptação em `src/server.ts`. |
| Cookie é HttpOnly/Secure/SameSite | Atendido | `buildSessionCookie`. |
| Logout/revogação atual | Atendido parcialmente | Logout expira cookie; revogação global via `AUTH_SESSION_VERSION`. Revogação individual persistente depende do Dia 5/DB. |
| Proteção contra abuso | Atendido parcialmente | Rate limit em memória; store distribuído depende de infraestrutura futura. |
| Recuperação/primeiro acesso | Não implementado no Dia 4 | Planejado para Dia 6; mantido fora do escopo para não reintroduzir senha no cliente. |
| CI/quality gates | Implementado | `.github/workflows/ci.yml`; execução remota depende do GitHub Actions após push. |
| Teste em produção | Pendente | Requer merge/deploy Vercel e variáveis configuradas. |

## Roteiro de validação na Vercel

1. Abrir `https://patrimonio-react.vercel.app/login`.
2. Confirmar que não há contas de teste, senhas ou dados pessoais renderizados.
3. Com `AUTH_LOCKDOWN_ENABLED=true`, confirmar banner de indisponibilidade e botão de login desabilitado.
4. Configurar variáveis seguras na Vercel, inclusive `AUTH_LOCKDOWN_ENABLED=false`, `AUTH_PROVIDER=local-admin`, `SESSION_SECRET` e `ADMIN_BOOTSTRAP_PASSWORD_HASH`.
5. Reabrir `/login`, informar credenciais configuradas e verificar redirecionamento para `/adm`.
6. Abrir DevTools e confirmar que o cookie `__Host-patrimonio_session` está presente como `HttpOnly`, `Secure` e `SameSite=Lax`.
7. Acessar `/adm` em nova aba e confirmar persistência da sessão sem `localStorage`/`sessionStorage` de autenticação.
8. Clicar em `Sair` e confirmar redirecionamento para `/login` com sessão encerrada.
9. Tentar acessar `/adm` após logout e confirmar redirecionamento para login.
10. Executar tentativas inválidas repetidas e confirmar resposta `429` após o limite configurado.

## Bloqueios e próximos passos

- [ ] Configurar variáveis reais somente em Vercel/GitHub Secrets.
- [ ] Executar CI remoto e corrigir qualquer falha de typecheck/lint/build.
- [ ] Implementar RBAC/ABAC e guards de API no Dia 5.
- [ ] Implementar portal do responsável, primeiro acesso e recuperação segura no Dia 6.
- [ ] Substituir `local-admin` por OIDC institucional quando houver owner, sandbox e callbacks aprovados.
