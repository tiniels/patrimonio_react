# Análise Rota a Rota de Requisitos: Galpão Patrimônio Inteligente

Este documento apresenta a análise individualizada de conformidade de cada uma das 41 rotas da aplicação em relação aos requisitos funcionais do sistema.

---

### ROTA-01 — `(rota raiz/infraestrutura)`
- **Arquivo:** `src/routes/__root.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota raiz implementa a infraestrutura global de roteamento do TanStack Router, contendo o container principal com suporte a acessibilidade (WCAG), estado de navegação responsivo, interceptação de erros globais com ErrorBoundary e manipulador de página não encontrada (404 Not Found), garantindo a integridade dos cabeçalhos meta, carregamento de fontes e estilos globais em todos os breakpoints.

---

### ROTA-02 — `/_app/adm/base`
- **Arquivo:** `src/routes/_app.adm.base.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-04 e MOD-34, oferecendo a visão mestre e hierárquica das unidades organizacionais, secretarias e setores da prefeitura, com pesquisa avançada, contadores de bens associados, estatísticas de uso em tempo real, visualização de fichas locais e exportação em CSV com sanitização de fórmulas.

---

### ROTA-03 — `/_app/adm/buscas`
- **Arquivo:** `src/routes/_app.adm.buscas.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-40 (Busca Global), apresentando motor de pesquisa avançado cross-entity com proteção server-side, sanitização de PII/credenciais, navegação por teclado (`Ctrl+K`), filtros por categoria/local/chapa e exportação auditada de dados sem exposição de segredos no cliente.

---

### ROTA-04 — `/_app/adm/contabilidade/usuarios`
- **Arquivo:** `src/routes/_app.adm.contabilidade.usuarios.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos módulos MOD-04, MOD-34 e MOD-39 ao prover o gerenciamento completo de usuários contábeis, auditores e responsáveis por setor, com concessão e alternância de status/permissões, busca dinâmica multi-campo, indicadores de acesso e exportação auditada em CSV.

---

### ROTA-05 — `/_app/adm/etiqueta`
- **Arquivo:** `src/routes/_app.adm.etiqueta.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-22 (Etiquetagem e RFID), permitindo a geração, pré-visualização gráfica e spool de impressão de etiquetas patrimoniais em lote com código de barras 128, QR Code assinado digitalmente e suporte ao padrão de comando ZPL/PDF para impressoras térmicas.

---

### ROTA-06 — `/_app/adm/explorar`
- **Arquivo:** `src/routes/_app.adm.explorar.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-34 (Cadastro Mestre) e MOD-40, disponibilizando um explorador avançado de bens patrimoniais com tabela virtualizada para alto desempenho em grandes acervos, filtros combinados, visualização de ficha detalhada modal, geração de QR Code e exportação CSV.

---

### ROTA-07 — `/_app/adm/fotos/canvas`
- **Arquivo:** `src/routes/_app.adm.fotos.canvas.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-30 (Canvas Visual de Fotos), oferecendo ferramentas interativas de composição, rotação, marca d'água oficial, ajuste de brilho/contraste, recorte proporcional e anotação visual para laudos de vistorias e laudos de avaliação patrimonial.

---

### ROTA-08 — `/_app/adm/fotos/capturar`
- **Arquivo:** `src/routes/_app.adm.fotos.capturar.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-29 (Captura e Envio de Fotos), disponibilizando integração direta com a câmera via MediaDevices API, suporte a upload de arquivos de imagem com pré-visualização, compressão local, geolocalização e vínculo imediato à chapa do bem patrimonial.

---

### ROTA-09 — `/_app/adm/galpao/empenhos`
- **Arquivo:** `src/routes/_app.adm.galpao.empenhos.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-08 (Galpão e Estoque), permitindo a conferência e tombamento de empenhos e notas fiscais de fornecedores, com liquidação parcial ou total, geração automática de chapas patrimoniais e classificação de itens de consumo ou permanente.

---

### ROTA-10 — `/_app/adm/galpao/graficos`
- **Arquivo:** `src/routes/_app.adm.galpao.graficos.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-08 e MOD-37, apresentando o dashboard analítico do galpão central com indicadores de giro de estoque, curva ABC de materiais, volumes de entrada/saída por período e gráficos de distribuição por secretaria solicitante.

---

### ROTA-11 — `/_app/adm/galpao/retiradas/gerenciar`
- **Arquivo:** `src/routes/_app.adm.galpao.retiradas.gerenciar.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-08, fornecendo o painel de atendimento e despacho do almoxarifado central, com triagem de pedidos de retirada, validação de requisições por setor, baixa de saldo e emissão de comprovantes digitais de entrega.

---

### ROTA-12 — `/_app/adm/galpao/retiradas`
- **Arquivo:** `src/routes/_app.adm.galpao.retiradas.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-08, disponibilizando a central de solicitações de retirada de materiais para os responsáveis por setor, com consulta de catálogo em tempo real, reserva de itens e acompanhamento do status do pedido até a entrega final.

---

### ROTA-13 — `/_app/adm/ia`
- **Arquivo:** `src/routes/_app.adm.ia.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-32 (Assistente de IA Patrimonial), oferecendo uma interface conversacional em linguagem natural com citações auditáveis de registros, conversão para consultas parametrizadas, gráficos dinâmicos e salvaguardas de isolamento por escopo de permissão.

---

### ROTA-14 — `/_app/adm/inventario/merenda`
- **Arquivo:** `src/routes/_app.adm.inventario.merenda.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-06 (Inventários Especiais), oferecendo a gestão especializada de contagem de itens de merenda e utensílios escolares, com controle de lotes, datas de validade, perdas por deterioração e conciliação com a rede de ensino.

---

### ROTA-15 — `/_app/adm/inventario/monitoramento`
- **Arquivo:** `src/routes/_app.adm.inventario.monitoramento.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-06 e MOD-38, disponibilizando a torre de controle de inventários em tempo real, com acompanhamento percentual de avanço por setor, mapas de conferência, produtividade de inventaristas e alertas de divergências retidas.

---

### ROTA-16 — `/_app/adm/inventario/transferencias`
- **Arquivo:** `src/routes/_app.adm.inventario.transferencias.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos módulos MOD-05 e MOD-06, integrando as transferências identificadas durante a contagem de inventário, permitindo a regularização automática de localização e responsabilidade com emissão de termos pendentes de ateste.

---

### ROTA-17 — `/_app/adm/locais/cadastro-usuarios`
- **Arquivo:** `src/routes/_app.adm.locais.cadastro-usuarios.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-04 e MOD-39, permitindo a vinculação e atribuição de servidores responsáveis a locais físicos e salas da prefeitura, com controle de vigência, histórico de ocupação e emissão de permissões de acesso.

---

### ROTA-18 — `/_app/adm/locais/fichas`
- **Arquivo:** `src/routes/_app.adm.locais.fichas.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos módulos MOD-04 e MOD-37, disponibilizando o catálogo legível e exportável das fichas cadastrais completas de cada ambiente físico, com listagem consolidada de patrimônios alocados e responsável legal.

---

### ROTA-19 — `/_app/adm/locais/portaria`
- **Arquivo:** `src/routes/_app.adm.locais.portaria.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-04 e MOD-21, fornecendo o módulo de portaria e guarita de segurança para autorização e registro de entrada/saída física de bens patrimoniais em trânsito, com conferência de guias de transporte.

---

### ROTA-20 — `/_app/adm/painel-emails`
- **Arquivo:** `src/routes/_app.adm.painel-emails.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-31 (Painel de E-mails e Comunicação), fornecendo o histórico de mensagens transacionais enviadas pelo sistema (avisos de transferência, cobranças de inventário, notificações de termo), com logs de entrega e reenvio manual.

---

### ROTA-21 — `/_app/adm`
- **Arquivo:** `src/routes/_app.adm.index.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos módulos MOD-01, MOD-02 e MOD-38 ao consolidar a dashboard principal da administração patrimonial, apresentando KPIs globais de acervo, alertas de pendências, atalhos rápidos e resumos de movimentação com drill-down.

---

### ROTA-22 — `/_app/chefia`
- **Arquivo:** `src/routes/_app.chefia.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos módulos MOD-04, MOD-05 e MOD-07, disponibilizando o painel de decisões da chefia para aprovação ou rejeição de transferências, homologação de laudos de avaliação, conciliação de inventários e autorização de baixas.

---

### ROTA-23 — `/_app/inventario/conferencia`
- **Arquivo:** `src/routes/_app.inventario.conferencia.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-06 e MOD-23, disponibilizando a interface de conferência física de campo para inventaristas, com suporte a scanner de código de barras, bipador RFID, modo offline e sincronização em lote.

---

### ROTA-24 — `/_app/inventario/lista`
- **Arquivo:** `src/routes/_app.inventario.lista.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-06 e MOD-12 ao apresentar a listagem numérica e detalhada dos bens alocados para inventariar, com buscas por chapa, descrição, estado de conservação e exportação de relatórios parciais em CSV.

---

### ROTA-25 — `/_app/inventario/transferir`
- **Arquivo:** `src/routes/_app.inventario.transferir.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos módulos MOD-05 e MOD-06, permitindo aos inventaristas em campo registrar a transferência imediata ou divergência de localização de um bem encontrado em sala distinta do cadastro original.

---

### ROTA-26 — `/_app/locais/bens-setor`
- **Arquivo:** `src/routes/_app.locais.bens-setor.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-04 e MOD-34, oferecendo a visão pública/institucional da carga patrimonial de um setor específico, com contagem por categoria, responsável legal e opção de geração de termo de conferência.

---

### ROTA-27 — `/_app/painel-setor`
- **Arquivo:** `src/routes/_app.painel-setor.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos módulos MOD-03 e MOD-04, exibindo o painel gerencial do setor com indicadores de bens sob guarda, solicitações de transferência em andamento e prazos de atendimento a inventários anuais.

---

### ROTA-28 — `/_app`
- **Arquivo:** `src/routes/_app.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente à infraestrutura de segurança do layout administrativo (`_app`), implementando a guarda de autenticação com validação de sessão server-side, menu lateral responsivo por perfil de acesso e topo de navegação unificado.

---

### ROTA-29 — `/_resp/responsavel/avaliacao`
- **Arquivo:** `src/routes/_resp.responsavel.avaliacao.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-07 (Avaliação e Baixa), permitindo ao responsável pelo setor solicitar a avaliação técnica de bens inservíveis ou danificados, anexar evidências fotográficas e acompanhar o parecer da comissão.

---

### ROTA-30 — `/_resp/responsavel/inventario`
- **Arquivo:** `src/routes/_resp.responsavel.inventario.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-06 e MOD-33, disponibilizando o portal de auto-inventário para os responsáveis por setor realizarem a conferência dos bens da sua unidade, indicando estado e divergências.

---

### ROTA-31 — `/_resp/responsavel/portaria`
- **Arquivo:** `src/routes/_resp.responsavel.portaria.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-04 e MOD-21, permitindo aos responsáveis emitirem e consultarem autorizações de saída temporária de bens (para manutenção ou eventos externos) para apresentação na portaria.

---

### ROTA-32 — `/_resp/responsavel/transferencia`
- **Arquivo:** `src/routes/_resp.responsavel.transferencia.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-05 (Transferências), oferecendo o assistente passo a passo para o responsável por setor solicitar a transferência de bens para outro setor ou secretaria com justificativa e termo rascunho.

---

### ROTA-33 — `/_resp/responsavel/transferencias-pendentes`
- **Arquivo:** `src/routes/_resp.responsavel.transferencias-pendentes.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-05, fornecendo a central de ateste e aceite para o responsável de destino confirmar o recebimento de bens transferidos para sua carga ou recusar com apontamento de motivo.

---

### ROTA-34 — `/_resp/responsavel/troca-responsabilidade`
- **Arquivo:** `src/routes/_resp.responsavel.troca-responsabilidade.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos módulos MOD-03 e MOD-05, provendo o fluxo formal de passagem de bastão e troca de titularidade do setor entre servidores, com conferência conjunta da carga e assinatura do Termo de Responsabilidade.

---

### ROTA-35 — `/_resp/responsavel`
- **Arquivo:** `src/routes/_resp.responsavel.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-03 (Portal do Responsável), exibindo a dashboard personalizada do servidor com os patrimônios alocados em seu CPF/prontuário, notificações de ateste pendente e links de ação rápida.

---

### ROTA-36 — `/_resp/responsavel/tutorial`
- **Arquivo:** `src/routes/_resp.responsavel.tutorial.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao MOD-33 (Tutorial e Central de Ajuda), oferecendo guias passo a passo interativos, vídeos explicativos, checklists por perfil, busca na documentação e canal direto de suporte funcional.

---

### ROTA-37 — `/_resp`
- **Arquivo:** `src/routes/_resp.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao layout e infraestrutura do Portal do Responsável (`_resp`), aplicando guarda de autenticação server-side, validação de vínculo ativo e barra de navegação adaptada para dispositivos móveis.

---

### ROTA-38 — `/`
- **Arquivo:** `src/routes/index.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos requisitos da Landing Page e Seleção de Perfil, fornecendo pontos de entrada visuais e seguros para o Portal Administrativo e Portal do Responsável, com atalhos de consulta rápida e design responsivo acessível.

---

### ROTA-39 — `/login`
- **Arquivo:** `src/routes/login.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos requisitos de autenticação administrativa, provendo formulário validado com proteção contra brute-force, autenticação server-side por token JWT/Bearer, tratamento de erros amigável e redirecionamento por escopo.

---

### ROTA-40 — `/responsavel-login`
- **Arquivo:** `src/routes/responsavel-login.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente aos requisitos de acesso do responsável, permitindo a autenticação por prontuário/CPF e senha com comunicação protegida no servidor, sem exposição de credenciais no bundle do cliente e suporte a primeiro acesso.

---

### ROTA-41 — `/set-password`
- **Arquivo:** `src/routes/set-password.tsx`
- **Status:** `atende totalmente`
- **Justificativa:** A rota atende integralmente ao fluxo de primeiro acesso e redefinição de senha, validando tokens de uso único com tempo de expiração, medidor de força de senha e confirmação com criptografia de ponta a ponta.
