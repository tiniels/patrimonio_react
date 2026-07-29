# Runbook de exceção break-glass

## Objetivo

Definir a única forma aceita de contornar temporariamente uma proteção administrativa do repositório em uma emergência real, sem transformar a exceção em fluxo normal de entrega.

O processo não autoriza inclusão de segredo, credencial, dado pessoal real, alteração não auditada de dados ou desativação permanente dos controles da `main`.

## Situações elegíveis

O break-glass pode ser considerado somente quando uma das situações abaixo estiver comprovada:

- incidente de produção de severidade crítica com indisponibilidade ou risco material em andamento;
- comprometimento confirmado de automação, credencial ou dependência que exija contenção imediata;
- falha do próprio mecanismo de proteção impedindo uma correção urgente e já revisada;
- obrigação legal ou de segurança com prazo incompatível com o fluxo normal.

Pressão de prazo, conveniência, fila de revisão, falha de teste legítima ou ausência de aprovação não são justificativas válidas.

## Autorizações mínimas

Antes de qualquer bypass, devem existir:

1. identificador de incidente ou mudança;
2. descrição do impacto, risco e escopo exato;
3. aprovação de duas funções distintas: administrador do repositório e responsável por segurança ou produto;
4. janela de exceção com início e término definidos, limitada ao menor período possível;
5. responsável nominal por restaurar os controles e produzir a evidência posterior.

Quando a urgência impedir a aprovação prévia de duas funções, o administrador poderá executar apenas a contenção mínima e deverá obter revisão retrospectiva em até um dia útil.

## Procedimento

1. Registrar o incidente em canal privado apropriado; não publicar segredo ou PII em issue pública.
2. Criar uma branch `break-glass/<id-do-incidente>` a partir do último commit aprovado da `main`.
3. Manter um pull request, ainda que com revisão acelerada, sempre que o GitHub estiver operacional.
4. Limitar a alteração aos arquivos e controles indispensáveis para conter o incidente.
5. Executar, no mínimo, varredura de material sensível, TypeScript strict, testes afetados e build.
6. Exigir o check da Vercel para o mesmo SHA quando a mudança alcançar o runtime web.
7. Usar squash ou um único commit claramente identificado com o incidente.
8. Restaurar imediatamente proteção de branch, checks e exigências de revisão ao encerrar a janela.
9. Revogar qualquer token temporário ou permissão elevada usada no procedimento.
10. Registrar SHA, horários, aprovadores, resultado, controles restaurados e impacto residual.

## Controles que não podem ser dispensados

Mesmo em break-glass:

- nenhuma credencial ou chave pode ser commitada;
- force push e reescrita da `main` permanecem proibidos;
- exclusão da `main` permanece proibida;
- logs não podem registrar senha, token ou PII desnecessária;
- a mudança precisa permanecer rastreável a um ator e a um incidente;
- rollback ou forward-fix deve estar definido antes da promoção.

## Encerramento e revisão

Em até um dia útil após a emergência:

- confirmar que todas as proteções foram restauradas;
- revisar o histórico de auditoria do GitHub e da Vercel;
- validar que nenhum acesso temporário permanece ativo;
- realizar smoke test e reconciliação aplicável;
- registrar causa raiz, duração do bypass e ações preventivas;
- atualizar este runbook quando a exceção revelar lacuna de processo.

## Evidência mínima

A evidência de encerramento deve conter somente metadados seguros:

- ID do incidente ou mudança;
- SHA integrado;
- PR relacionado;
- nomes ou funções dos aprovadores;
- horário de abertura e fechamento da janela;
- checks executados e resultado;
- confirmação de restauração das regras;
- referência ao post-mortem privado.
