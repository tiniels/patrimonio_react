export type RespNavItem = {
  label: string;
  to: string;
  icon: string;
  description: string;
};

export const RESP_NAV: RespNavItem[] = [
  {
    label: "Inventário Atualizado",
    to: "/responsavel/inventario",
    icon: "ClipboardList",
    description: "Pesquise por Chapa, Descrição e Localização.",
  },
  {
    label: "Avaliação de Bens",
    to: "/responsavel/avaliacao",
    icon: "FileCheck2",
    description: "Baixa de bens e envio via SISGEP (assinatura do secretário).",
  },
  {
    label: "Troca de Responsabilidade",
    to: "/responsavel/troca-responsabilidade",
    icon: "UserCog",
    description: "Solicite deixar de ser responsável e indique substituto.",
  },
  {
    label: "Portaria",
    to: "/responsavel/portaria",
    icon: "ScrollText",
    description: "Acesso à portaria vigente do seu setor.",
  },
  {
    label: "Transferência de Bens",
    to: "/responsavel/transferencia",
    icon: "ArrowLeftRight",
    description: "Transfira bens e envie o documento oficial.",
  },
  {
    label: "Transferências Pendentes",
    to: "/responsavel/transferencias-pendentes",
    icon: "Inbox",
    description: "Autorize transferências para o seu setor.",
  },
  {
    label: "Tutorial do Inventário",
    to: "/responsavel/tutorial",
    icon: "GraduationCap",
    description: "Como realizar o inventário passo a passo.",
  },
];
