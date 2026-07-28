# Dia 1 — Descoberta, evidências e contenção crítica

**Branch:** `agent/dia-1-contencao-seguranca`  
**Commit final planejado na `main`:** `Dia 1: conter exposição de credenciais e versionar evidências`  
**Marco:** M1 — Evidência e segurança

## Objetivo

Registrar o estado AS-IS, iniciar a matriz de paridade e impedir que o snapshot corrente continue expondo credenciais/PII ou aceite autenticação simulada no navegador.

## Análise do estado atual

- [x] Repositório, commit-base, stack e rotas principais identificados.
- [x] Credenciais administrativas codificadas no frontend identificadas sem reprodução dos valores.
- [x] Base de responsáveis com PII/senhas identificada sem reprodução dos valores.
- [x] Dois mecanismos de sessão/autenticação no cliente identificados (`authStore` e `respAuth`).
- [x] Login, sessão, recuperação e redefinição no cliente identificados.
- [x] Guard de interface identificado como insuficiente para autorização real.
- [x] Ausência de quality gate/typecheck dedicado registrada.
- [ ] Walkthrough do legado autenticado — bloqueio externo.
- [ ] Inventário de integrações e relatórios do legado autenticado — bloqueio externo.

## Arquivos criados

- `.env.example`
- `SECURITY.md`
- `src/components/AuthLockdownPage.tsx`
- `docs/discovery/AS_IS_INVENTORY.md`
- `docs/discovery/REPORT_CATALOG.md`
- `docs/parity/PARITY_MATRIX.md`
- `docs/security/INCIDENT-2026-07-28-CREDENTIAL-EXPOSURE.md`
- `docs/delivery/DIA-01.md`

## Arquivos modificados

- `.gitignore`
- `src/lib/authStore.ts`
- `src/lib/respAuth.ts`
- `src/lib/respUsers.ts`
- `src/routes/index.tsx`
- `src/routes/login.tsx`
- `src/routes/responsavel-login.tsx`
- `src/routes/set-password.tsx`

## Mudanças implementadas

- [x] Remoção de usuários, senhas e PII reais do snapshot corrente do bundle.
- [x] Desativação dos dois mecanismos de autenticação/sessão do navegador.
- [x] Limpeza das chaves legadas de sessão/credencial no logout.
- [x] Substituição do portal e das três telas públicas de identidade por contenção acessível.
- [x] Proibição explícita de `.env` e metadados locais de deploy no Git.
- [x] Política de segurança e contrato de variáveis sem valores.
- [x] Inventário AS-IS, catálogo de relatórios e matriz de paridade v1.
- [x] Registro formal do incidente, risco residual e ações externas.

## Critérios de aceite do Dia 1

| Critério | Resultado | Evidência/Exceção |
| --- | --- | --- |
| Segredos e PII removidos do snapshot atual identificado | Atendido para os arquivos críticos confirmados | diff do PR e inspeção dos arquivos alterados |
| Autenticação simulada não aceita credenciais | Atendido | `authStore.ts`, `respAuth.ts` e rotas públicas bloqueadas |
| AS-IS versionado | Atendido | `docs/discovery/AS_IS_INVENTORY.md` |
| Matriz de paridade v1 | Atendido | `docs/parity/PARITY_MATRIX.md` |
| Inventário inicial de relatórios | Atendido | `docs/discovery/REPORT_CATALOG.md` |
| Credenciais expostas rotacionadas/revogadas | Não comprovado | EXCEÇÃO/BLOQUEIO `BLK-002`; ação externa obrigatória |
| Histórico Git e artefatos antigos tratados | Não comprovado | decisão/execução pendentes no incidente |
| Walkthrough autenticado e evidências do legado | Não atendido | EXCEÇÃO/BLOQUEIO `BLK-001` |
| Aprovação formal do M1 | Pendente | requer owner de segurança/produto |

## Testes e revisão estática

- [x] Imports e exports públicos de autenticação preservados para reduzir regressão de build.
- [x] Rotas geradas mantêm os mesmos caminhos.
- [x] Nenhuma nova credencial, chave ou PII foi adicionada.
- [x] Tela de contenção possui heading, status anunciado, nomes acessíveis e foco visível.
- [x] Viewport usa largura fluida e breakpoints existentes.
- [x] Portal raiz não oferece caminho alternativo nem sessão cliente.
- [ ] Typecheck/build automatizado — pipeline ainda não existe; será criado no Dia 3.
- [ ] Teste de produção — executar após squash/merge e deploy automático.

## Roteiro de validação na Vercel

1. Abrir a raiz e verificar a tela de contenção sem erro 5xx.
2. Abrir `/login`; confirmar a tela de contenção e ausência de campos de credencial.
3. Abrir `/responsavel-login`; confirmar que nenhum usuário, e-mail, telefone, prontuário ou senha é exibido.
4. Abrir `/set-password`; confirmar que não existe busca de identidade nem formulário de nova senha.
5. Tentar abrir `/adm`, `/responsavel` e `/chefia`; confirmar redirecionamento e ausência de conteúdo protegido.
6. Navegar somente por teclado e verificar foco visível nos links disponíveis.
7. Verificar HTML/scripts publicados procurando apenas nomes de chaves/contratos, nunca valores de credencial ou registros pessoais.
8. Conferir status/logs do deploy e registrar o SHA publicado.

## Bloqueios para o Dia 2

O plano permite avançar somente com critérios atendidos ou exceção formal. Os bloqueios `BLK-001` e `BLK-002` estão formalmente registrados, mas sua aceitação depende de responsáveis externos. Arquitetura e documentação podem avançar sem reabrir autenticação; nenhuma funcionalidade com dados reais deve ser habilitada.
