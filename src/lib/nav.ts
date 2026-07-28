export type NavItem = {
  label: string;
  to: string;
  description?: string;
};

export type NavGroup = {
  label: string;
  icon: string; // lucide name
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Painel",
    icon: "LayoutDashboard",
    items: [
      { label: "Painel Administrativo", to: "/adm", description: "Visão geral e métricas" },
      { label: "Painel do Setor", to: "/painel-setor", description: "Dashboard do responsável" },
      { label: "Painel de E-mails", to: "/adm/painel-emails", description: "Documentos e envios" },
    ],
  },
  {
    label: "Inventário",
    icon: "ClipboardList",
    items: [
      { label: "Base (Setores)", to: "/adm/base" },
      { label: "Buscas / Demonstrativos", to: "/adm/buscas" },
      { label: "Chefia — Não localizados", to: "/chefia" },
      { label: "Etiquetas", to: "/adm/etiqueta" },
      { label: "Monitoramento por Setor", to: "/adm/inventario/monitoramento" },
      { label: "Merenda / Transferências", to: "/adm/inventario/merenda" },
      { label: "Gestão de Transferências", to: "/adm/inventario/transferencias" },
      { label: "Meu Inventário", to: "/inventario/lista" },
      { label: "Conferência Histórica", to: "/inventario/conferencia" },
      { label: "Registrar Transferência", to: "/inventario/transferir" },
    ],
  },
  {
    label: "Galpão",
    icon: "Warehouse",
    items: [
      { label: "Gráficos", to: "/adm/galpao/graficos" },
      { label: "Retiradas", to: "/adm/galpao/retiradas" },
      { label: "Gerenciar / PDF", to: "/adm/galpao/retiradas/gerenciar" },
      { label: "Notas / Empenhos", to: "/adm/galpao/empenhos" },
    ],
  },
  {
    label: "Locais",
    icon: "MapPin",
    items: [
      { label: "Portaria", to: "/adm/locais/portaria" },
      { label: "Fichas", to: "/adm/locais/fichas" },
      { label: "Cadastro de Usuários", to: "/adm/locais/cadastro-usuarios" },
      { label: "Bens do Setor", to: "/locais/bens-setor" },
      { label: "Contabilidade / Usuários", to: "/adm/contabilidade/usuarios" },
    ],
  },
  {
    label: "Fotos",
    icon: "Camera",
    items: [
      { label: "Canvas / Combinar", to: "/adm/fotos/canvas" },
      { label: "Capturar & Enviar", to: "/adm/fotos/capturar" },
    ],
  },
  {
    label: "IA",
    icon: "Sparkles",
    items: [{ label: "Assistente IA", to: "/adm/ia" }],
  },
];
