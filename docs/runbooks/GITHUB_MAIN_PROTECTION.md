# Proteção administrativa da branch `main`

## Objetivo

Transformar os controles versionados do repositório em bloqueios administrativos reais, impedindo integração na `main` sem revisão, checks e rastreabilidade.

Este runbook documenta a configuração desejada e a evidência necessária. A existência do arquivo não comprova que as regras estão ativas; a issue `#7` permanece aberta até o teste negativo final.

## Regra recomendada

Criar um ruleset ou branch protection rule para o padrão exato:

```text
main
```

Aplicar a regra a administradores e demais papéis com permissão de escrita. Qualquer bypass deve ser restrito ao procedimento de `docs/runbooks/BREAK_GLASS.md`.

## Pull requests

Ativar:

- exigir pull request antes do merge;
- exigir pelo menos uma aprovação;
- exigir aprovação de CODEOWNER quando houver arquivo coberto;
- invalidar aprovações quando novos commits forem enviados;
- exigir aprovação do commit mais recente por pessoa diferente do autor quando disponível;
- exigir resolução de todas as conversas;
- impedir que o autor aprove a própria alteração como única aprovação;
- permitir somente squash merge durante o plano de 30 dias.

## Checks obrigatórios

Exigir, para o mesmo SHA do PR:

```text
Quality gate
Vercel
```

Regras:

- exigir branch atualizada antes do merge quando houver mudança concorrente na `main`;
- não aceitar check antigo de SHA anterior;
- não permitir neutralização manual de check falho;
- não aceitar merge enquanto um check estiver ausente, pendente, cancelado ou falho.

## Integridade da branch

Ativar:

- bloquear force push;
- bloquear exclusão da `main`;
- exigir histórico linear quando compatível com squash;
- impedir criação direta de commit na `main` fora do processo break-glass;
- restringir bypass aos menores grupos possíveis;
- registrar qualquer elevação temporária de permissão.

## Segurança do repositório

Ativar nas configurações de segurança:

- secret scanning;
- push protection para segredos;
- Dependabot alerts;
- Dependabot security updates quando compatível;
- revisão de alertas sem publicar o valor detectado;
- política de reporte privado de vulnerabilidade quando disponível.

O scanner versionado em `scripts/check-sensitive-files.mjs` continua obrigatório, mas não substitui o scanner nativo e a push protection do GitHub.

## Teste negativo obrigatório

A configuração só pode ser considerada concluída após executar um PR sintético e descartável:

1. criar branch de teste a partir da `main`;
2. abrir PR sem aprovação;
3. confirmar que o merge está bloqueado;
4. produzir um commit que faça o `Quality gate` falhar de forma segura;
5. confirmar que o merge continua bloqueado;
6. resolver a falha e aguardar `Quality gate` e `Vercel` no novo SHA;
7. deixar uma conversa não resolvida e confirmar bloqueio;
8. resolver a conversa e obter aprovação de CODEOWNER;
9. confirmar que somente então o PR fica elegível;
10. fechar o PR de teste sem integrar código descartável.

Também deve ser verificado que uma tentativa administrativa de force push ou exclusão da `main` é negada ou exige bypass explicitamente auditado.

## Evidência segura

Registrar na issue `#7`, sem segredo ou captura sensível:

- data e responsável pela configuração;
- tipo de regra usado;
- nomes exatos dos checks obrigatórios;
- resultado do PR de teste;
- confirmação de aprovação CODEOWNER;
- confirmação de resolução obrigatória de conversas;
- confirmação de bloqueio de force push e exclusão;
- confirmação de secret scanning e push protection;
- referência ao processo break-glass;
- ID de auditoria ou mudança administrativa, quando disponível.

## Alteração e rollback da regra

Uma alteração na proteção da `main` exige:

- issue ou mudança identificada;
- justificativa e risco;
- aprovação de administrador e segurança;
- janela limitada;
- restauração e teste negativo após a alteração;
- registro no log de auditoria.

Em emergência, seguir exclusivamente `docs/runbooks/BREAK_GLASS.md`.
