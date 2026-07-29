# Configuração segura da autenticação administrativa na Vercel

## Estado seguro inicial

O sistema deve permanecer com autenticação administrativa bloqueada até que todos os valores server-side estejam configurados, revisados e validados no ambiente correto.

```text
AUTH_LOCKDOWN_ENABLED=true
```

A ausência da variável também resulta em bloqueio por padrão. Nenhum valor real deve ser incluído em código, pull request, issue, log, screenshot ou documentação.

## Escopos de ambiente

As variáveis devem ser configuradas separadamente na Vercel:

- **Preview:** somente credencial sintética e isolada, nunca uma identidade de produção;
- **Production:** valores aprovados para produção, armazenados no cofre da Vercel;
- **Development:** fora do escopo desta entrega; não usar dados reais.

Uma variável secreta não deve ser exposta com prefixo `VITE_`, `PUBLIC_` ou `NEXT_PUBLIC_`.

## Variáveis obrigatórias para o bootstrap temporário

Configurar sem registrar os valores em texto aberto:

```text
AUTH_PROVIDER=local-admin
SESSION_SECRET=<segredo aleatório com pelo menos 32 caracteres>
AUTH_SESSION_VERSION=<versão revogável da sessão>
AUTH_SESSION_MAX_AGE_SECONDS=<duração aprovada>
ADMIN_BOOTSTRAP_LOGIN=<identidade administrativa temporária>
ADMIN_BOOTSTRAP_PASSWORD_HASH=<hash PBKDF2-SHA256>
ADMIN_BOOTSTRAP_DISPLAY_NAME=<nome de exibição>
ADMIN_BOOTSTRAP_ROLE=<admin|contabilidade|chefia|galpao>
AUTH_RATE_LIMIT_WINDOW_SECONDS=<janela aprovada>
AUTH_RATE_LIMIT_MAX_ATTEMPTS=<limite aprovado>
```

Campos organizacionais opcionais podem ser configurados somente quando necessários e aprovados:

```text
ADMIN_BOOTSTRAP_ID
ADMIN_BOOTSTRAP_ROLE_LABEL
ADMIN_BOOTSTRAP_CARGO
ADMIN_BOOTSTRAP_SECRETARIA
ADMIN_BOOTSTRAP_SETOR
ADMIN_BOOTSTRAP_CODIGO_SETOR
ADMIN_BOOTSTRAP_EMAIL
```

## Hash de senha

A senha em texto aberto nunca deve ser armazenada na Vercel como variável separada. O valor esperado usa o formato:

```text
pbkdf2_sha256$iteracoes$saltBase64Url$hashBase64Url
```

O hash deve ser produzido por operador autorizado em ferramenta aprovada, com salt aleatório e pelo menos 120.000 iterações. A senha original deve ser transmitida por canal institucional seguro e descartada do processo de configuração.

## Ordem de ativação

1. Configurar todas as variáveis obrigatórias mantendo `AUTH_LOCKDOWN_ENABLED=true`.
2. Gerar novo deployment pela integração GitHub → Vercel; não fazer deploy manual de código.
3. Consultar `/api/v1/auth/status` e confirmar `lockdownEnabled=true`.
4. Revisar o deployment, logs redigidos e ausência de valores sensíveis no bundle.
5. Alterar apenas `AUTH_LOCKDOWN_ENABLED` para `false` no ambiente aprovado.
6. Gerar novo deployment automático ou redeploy de configuração conforme o procedimento operacional aprovado.
7. Executar a validação completa de login, sessão, cookie, logout, limitação de tentativas e rotas protegidas.
8. Em qualquer falha, restaurar imediatamente `AUTH_LOCKDOWN_ENABLED=true`.

## Validação obrigatória

Após a ativação controlada:

- login inválido retorna mensagem genérica, sem confirmar existência do usuário;
- repetição de falhas retorna `429` após o limite configurado;
- login válido cria cookie `__Host-patrimonio_session` com `HttpOnly`, `Secure`, `Path=/` e `SameSite=Lax`;
- `/api/v1/auth/session` retorna somente contexto mínimo e token CSRF em memória;
- logout sem token CSRF válido é rejeitado;
- logout válido expira o cookie;
- acesso a `/adm` sem sessão redireciona para `/login`;
- acesso com papel incompatível exibe negação e não carrega dados protegidos;
- não existe sessão de autenticação em `localStorage` ou `sessionStorage`;
- logs de autenticação não contêm senha, hash, cookie ou login informado.

## Revogação e rollback

- definir `AUTH_LOCKDOWN_ENABLED=true` para bloquear imediatamente novos logins;
- incrementar `AUTH_SESSION_VERSION` para invalidar globalmente cookies existentes;
- rotacionar `SESSION_SECRET` em caso de suspeita de comprometimento;
- revogar a identidade bootstrap assim que OIDC institucional estiver disponível;
- registrar somente IDs de mudança, horários e resultados, nunca os valores rotacionados.

## Limitação conhecida

O rate limiting do Dia 4 usa memória do processo e não é compartilhado entre todas as instâncias serverless. Ele é uma contenção inicial, não substitui um store distribuído ou proteção no edge. A evolução permanece obrigatória antes de considerar a autenticação plenamente pronta para produção em escala.
