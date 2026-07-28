# Política de Segurança

## Estado atual

O sistema permanece em **contenção de autenticação**. Nenhuma credencial deve ser aceita pelo frontend até que o fluxo de identidade seja validado no servidor, com sessão segura, autorização por escopo, auditoria e proteção contra abuso.

## Regras obrigatórias

- Nunca versionar senhas, tokens, chaves, dados pessoais reais ou arquivos `.env` preenchidos.
- Nunca usar `localStorage`, `sessionStorage` ou variáveis `VITE_*` para segredos, senhas ou sessão confiável.
- Autenticação e autorização devem ocorrer no servidor; ocultar controles no frontend não constitui autorização.
- Cookies de sessão devem ser `HttpOnly`, `Secure`, `SameSite` e possuir expiração/revogação definidas.
- Logs, telemetria, erros e auditoria não podem registrar senha, token, segredo ou PII desnecessária.
- Dados de desenvolvimento e teste devem ser sintéticos.
- Toda dependência e toda imagem de build devem passar por análise de vulnerabilidades e secret scanning antes do merge.

## Incidente de 28 de julho de 2026

A revisão do Dia 1 identificou credenciais e dados pessoais reais no código-fonte público, além de autenticação e redefinição de senha executadas no navegador. O estado atual da branch de contenção remove esses dados do **snapshot corrente** e bloqueia os fluxos inseguros.

A remoção do snapshot corrente não elimina exposição anterior. As ações externas abaixo continuam obrigatórias:

1. revogar e rotacionar todas as credenciais que já estiveram no repositório ou bundle publicado;
2. revisar sessões, acessos e logs relacionados;
3. invalidar caches e artefatos de deploy que contenham o bundle antigo;
4. decidir, com aprovação do responsável pelo repositório, se o histórico Git será reescrito;
5. configurar secret scanning e push protection;
6. notificar segurança/privacidade conforme o processo institucional aplicável.

O acompanhamento técnico está documentado em `docs/security/INCIDENT-2026-07-28-CREDENTIAL-EXPOSURE.md`.

## Reporte de vulnerabilidade

Não publique credenciais, PII ou detalhes exploráveis em issues públicas. Use o canal institucional de segurança definido pelo proprietário do sistema. Até que esse canal seja formalizado no repositório, registre apenas um aviso sem dados sensíveis e solicite contato privado.

## Critério para reabrir autenticação

O bloqueio só pode ser removido quando houver evidência de:

- autenticação real no servidor ou provedor de identidade aprovado;
- sessão não acessível por JavaScript e revogação funcional;
- proteção contra enumeração, força bruta e reutilização de token;
- recuperação/primeiro acesso por canal verificado e token de uso único;
- autorização horizontal e vertical testada no backend;
- auditoria sem dados sensíveis;
- revisão de segurança e validação em produção.
