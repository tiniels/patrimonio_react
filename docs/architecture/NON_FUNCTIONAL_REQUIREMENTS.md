# Requisitos não funcionais e budgets

**Status:** baseline mensurável proposta — Dia 2  
**Regra:** valores abaixo são gates iniciais. Owners podem aprovar ajuste documentado por ADR, nunca remover medição ou aceitar regressão silenciosa.

## 1. Matriz de NFRs

| ID | Categoria | Requisito/budget | Medição/evidência | Owner por função |
| --- | --- | --- | --- | --- |
| NFR-SEC-01 | Segredos | zero segredo/credencial/PII restrita no repositório, bundle, log e erro | secret scan, inspeção de bundle, testes de redação | Segurança |
| NFR-SEC-02 | Sessão | cookie `HttpOnly`, `Secure`, `SameSite`; revogação efetiva em até 60 s | teste de integração e tentativa após logout/revogação | Segurança/Plataforma |
| NFR-SEC-03 | Autorização | 100% das APIs privadas com policy server-side e testes positivo/negativo/horizontal | suíte de contrato/API | Segurança + módulo |
| NFR-SEC-04 | Abuso | login/recuperação com rate limit, backoff e resposta não enumerável | testes automatizados e métricas 401/429 | Segurança |
| NFR-SEC-05 | Dependências | nenhum achado crítico/alto explorável sem exceção formal e prazo | SCA/SBOM/triagem | Tech lead |
| NFR-PRIV-01 | Minimização | endpoint/evento retorna somente campos necessários à finalidade | revisão de contrato e teste por perfil | DPO + módulo |
| NFR-PRIV-02 | Retenção | toda classe de dado possui owner, retenção e descarte/legal hold definidos antes do go-live | catálogo e job auditável | DPO/Arquivo |
| NFR-A11Y-01 | Acessibilidade | WCAG 2.2 AA nas jornadas e componentes entregues | axe, teclado, zoom 200%, leitor de tela amostral | UX/Frontend |
| NFR-A11Y-02 | Teclado | 100% das ações acessíveis por teclado, foco visível e ordem lógica | teste E2E/manual reproduzível | Frontend/QA |
| NFR-A11Y-03 | Feedback | erros associados ao campo/ação; status assíncronos anunciados | teste de componente/E2E | Frontend/QA |
| NFR-PERF-01 | Web vitals | LCP ≤ 2,5 s, INP ≤ 200 ms e CLS ≤ 0,1 no p75 móvel de produção | RUM por rota-chave | Frontend/DevOps |
| NFR-PERF-02 | API leitura | p95 ≤ 500 ms e p99 ≤ 1.500 ms para consultas interativas, excluindo jobs | telemetry por endpoint | Backend/DevOps |
| NFR-PERF-03 | API escrita | p95 ≤ 800 ms e p99 ≤ 2.000 ms para comandos síncronos | telemetry por comando | Backend/DevOps |
| NFR-PERF-04 | Listagem | primeira página ≤ 1 s p95 para 100 itens; paginação cursor sem full scan | teste de carga e plano de consulta | Backend/DBA |
| NFR-PERF-05 | Bundle | JS inicial comprimido por jornada pública ≤ 250 KiB; área autenticada ≤ 400 KiB, salvo exceção medida | relatório de build | Frontend |
| NFR-REP-01 | Exportações | acima de 5.000 linhas ou 10 s estimados, processar assíncrono | teste de volume e job | Relatórios |
| NFR-REP-02 | Relatório | 95% dos jobs prioritários concluídos em ≤ 2 min; 99% em ≤ 10 min no volume homologado | métricas de fila/job | Relatórios/DevOps |
| NFR-AVAIL-01 | Disponibilidade | alvo mensal de 99,9% para leitura e comandos críticos, excluindo janela aprovada | monitor sintético + SLI | DevOps/Produto |
| NFR-AVAIL-02 | Erro | taxa 5xx < 0,5% em janelas de 5 min; alerta quando exceder | métricas HTTP | DevOps |
| NFR-AVAIL-03 | Degradação | falha de e-mail, relatório ou integração não indisponibiliza consulta/cadastro principal | teste de dependência indisponível | Arquitetura/QA |
| NFR-DR-01 | RPO | RPO ≤ 15 min para dados transacionais | política e teste de restore/PITR | DBA/DevOps |
| NFR-DR-02 | RTO | RTO ≤ 4 h para serviço crítico | exercício de recuperação | DevOps/Negócio |
| NFR-DR-03 | Backup | restore testado ao menos trimestralmente e antes do go-live | ata/relatório de restore | DBA/Segurança |
| NFR-DATA-01 | Consistência | invariantes críticas e efeitos contábeis/patrimoniais em transação atômica | testes de integração/falha | Backend/DBA |
| NFR-DATA-02 | Idempotência | repetição de comando/job/evento não duplica efeito | testes de repetição e concorrência | Backend/QA |
| NFR-DATA-03 | Reconciliação | migração: 100% das chaves obrigatórias, zero órfão crítico e diferenças financeiras dentro de tolerância aprovada | relatório assinado | DBA/Negócio |
| NFR-AUD-01 | Auditoria | 100% das mutações privilegiadas e eventos críticos auditados | cobertura por catálogo de ação | Auditoria/Segurança |
| NFR-AUD-02 | Correlação | 100% das respostas possuem correlation ID; propagação por job/integração | teste/telemetria | DevOps |
| NFR-OBS-01 | Logs | log estruturado com nível, serviço, ambiente, correlation ID e erro seguro | schema/check automatizado | DevOps |
| NFR-OBS-02 | Telemetria | métricas RED para API e fila; traces amostrados nas jornadas críticas | dashboards/alertas | DevOps |
| NFR-OPS-01 | Deploy | deploy reproduzível por commit, sem alteração manual de código em produção | CI/CD e SHA publicado | DevOps |
| NFR-OPS-02 | Reversão | rollback/feature flag para mudanças de alto risco; migração backward-compatible por janela definida | runbook/teste | DevOps/DBA |
| NFR-QUAL-01 | Tipos/build | TypeScript strict, lint, format check, testes e build obrigatórios | CI protegido | Tech lead |
| NFR-QUAL-02 | Cobertura | regras/invariantes críticas com 100% dos ramos de decisão cobertos por casos; cobertura global é métrica, não objetivo isolado | relatório de testes | QA/Tech lead |
| NFR-COMP-01 | Navegadores | duas versões estáveis mais recentes de Chrome/Edge/Firefox; Safari móvel atual quando jornada de campo existir | matriz de compatibilidade | QA/Produto |
| NFR-RESP-01 | Responsividade | jornadas principais sem scroll horizontal em 320 px, 768 px, 1024 px e desktop; tabelas usam padrão responsivo explícito | visual/E2E | Frontend/UX |

## 2. SLIs e SLOs

### 2.1 Jornadas críticas iniciais

1. autenticar e carregar contexto autorizado;
2. consultar/listar bem por escopo;
3. criar/editar bem autorizado;
4. submeter/aceitar/efetivar transferência;
5. registrar conferência de inventário;
6. concluir recebimento/retirada;
7. solicitar/baixar relatório oficial;
8. encerrar sessão/revogar acesso.

### 2.2 Definições

- **Disponibilidade de jornada:** proporção de tentativas válidas que completam sem erro de plataforma dentro do timeout.
- **Latência:** tempo servidor e tempo percebido separados; dependência externa registrada como span.
- **Correção:** comando retorna sucesso somente se todas as invariantes e efeitos obrigatórios forem persistidos.
- **Freshness:** dashboards/relatórios exibem data de corte e atraso do read model.

### 2.3 Janelas e alertas propostos

| SLI | Objetivo | Alerta rápido | Alerta lento |
| --- | --- | --- | --- |
| disponibilidade API crítica | 99,9%/mês | burn rate > 14,4× por 5 min | > 2× por 6 h |
| latência leitura p95 | ≤ 500 ms | > 1.000 ms por 10 min | > 650 ms por 2 h |
| taxa 5xx | < 0,5% | > 2% por 5 min | > 0,8% por 1 h |
| fila sem atraso | 99% dentro do SLA da classe | oldest age > 2× SLA | > 1,2× SLA por 1 h |
| outbox não publicada | p95 < 60 s | item > 5 min | p95 > 120 s por 30 min |

Os thresholds devem ser recalibrados após teste de carga e primeira semana de uso real, sem reduzir o objetivo silenciosamente.

## 3. Budgets por classe de operação

| Classe | Timeout cliente | Timeout servidor | Retry |
| --- | --- | --- | --- |
| leitura interativa | 10 s | 5 s | no máximo 1 retry com jitter para falha transitória segura |
| comando mutável | 15 s | 10 s | cliente não repete sem idempotency key |
| integração síncrona | 10 s | 8 s | circuit breaker; preferir assíncrono |
| upload | conforme tamanho homologado | streaming/limite explícito | multipart ou reinício seguro |
| job | SLA por tipo | lease/heartbeat | backoff exponencial e limite de tentativas |

## 4. Requisitos de segurança verificáveis

- CSP sem `unsafe-eval`; `unsafe-inline` somente com nonce/hash e exceção documentada.
- HSTS, `X-Content-Type-Options`, política de referrer e permissions policy.
- CSRF obrigatório para mutações autenticadas por cookie.
- CORS deny-by-default; origens explícitas quando houver API separada.
- `Cache-Control: no-store` em sessão, recuperação e respostas sensíveis.
- IDs opacos; autorização antes de distinguir inexistente de fora de escopo.
- validação de MIME/conteúdo, limite de tamanho, quarentena e scan em upload.
- CSV/XLSX neutraliza células iniciadas por `=`, `+`, `-` ou `@` quando conteúdo é controlado por usuário.
- query/command parametrizado; nenhuma montagem livre de SQL por UI/IA.
- webhook assinado, timestamp/janela e proteção contra replay.
- rotação de secrets sem rebuild do frontend.

## 5. Acessibilidade — checklist de aceite

- landmarks e heading hierarchy coerentes;
- nome, papel e estado dos controles expostos;
- foco inicial/retorno correto em dialog;
- nenhum fluxo depende somente de cor, hover, arrastar ou ponteiro preciso;
- alvo mínimo e espaçamento adequados;
- mensagens de erro e ajuda vinculadas por atributos acessíveis;
- status de loading/sucesso/erro anunciado sem roubar foco;
- `prefers-reduced-motion` respeitado;
- conteúdo legível em zoom 200% e reflow 400% quando aplicável;
- tabelas com headers/escopo e alternativa responsiva;
- documentos oficiais gerados recebem avaliação de acessibilidade própria.

## 6. Critérios de exceção

Uma exceção contém: ID do NFR, valor medido, valor-alvo, impacto, owner, data de expiração, mitigação, rollback e aprovação técnica/funcional. Exceção de segurança crítica não pode reabrir funcionalidade contida sem aprovação explícita de segurança.

## 7. Evidência por release

- relatório de CI e SHA;
- resultados de testes de autorização, concorrência e idempotência;
- Web Vitals/medição sintética das rotas alteradas;
- scan de segredos/dependências;
- checklist de teclado/viewport para UI alterada;
- logs/traces redigidos de uma jornada;
- reconciliação quando houver migração/relatório;
- atualização de riscos e matriz de paridade.
