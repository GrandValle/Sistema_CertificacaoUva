"use client";

export type SystemCategory =
    | "Higienizacao"
    | "Inspecao"
    | "Estoque"
    | "Seguranca"
    | "Manutencao"
    | "Qualidade"
    | "Administrativo";

export type SystemDefinition = {
    id: string;
    href: string;
    title: string;
    description: string;
    category: SystemCategory;
    icon: string; // Agora é string para evitar erro de serialização
    accentClass: string;
    primaryCode: string; // O código que aparece no topo do card (ex: PHU-01)
};

export const systemCategories: Array<{
    id: "all" | SystemCategory;
    name: string;
}> = [
        { id: "all", name: "Todos" },
        { id: "Higienizacao", name: "Higienização" },
        { id: "Inspecao", name: "Inspeção" },
        { id: "Estoque", name: "Estoque" },
        { id: "Seguranca", name: "Segurança" },
        { id: "Manutencao", name: "Manutenção" },
        { id: "Qualidade", name: "Qualidade" },
        { id: "Administrativo", name: "Administrativo" },
    ];

export const systems: SystemDefinition[] = [

    {
        id: "relatorios",
        href: "/relatorios",
        title: "Histórico de Registros",
        description: "Central de acesso ao acervo de relatórios e histórico.",
        category: "Administrativo",
        icon: "file-text",
        accentClass: "from-slate-700 to-slate-900",
        primaryCode: "PHU-00",
    },

    {
        id: "higienizacao-geral",
        href: "/higienizacao-geral",
        title: "Higienização Geral- Packing Uva",
        description: "Controle diário de limpeza por área, equipamento e setor.",
        category: "Higienizacao",
        icon: "droplet",
        accentClass: "from-emerald-500 to-teal-600",
        primaryCode: "PHU-01",
    },
    {
        id: "inspecao",
        href: "/inspecao",
        title: "Inspeção Operacional",
        description: "Gestão de pré-inspeção, recebimento e verificações de processo.",
        category: "Inspecao",
        icon: "clipboard",
        accentClass: "from-amber-500 to-orange-600",
        primaryCode: "PHU-28",
    },
    {
        id: "estoque-materiais",
        href: "/estoque-materiais",
        title: "Gestão de Materiais e Equipamentos",
        description: "Controle de estoque, produtos e materiais de uso interno.",
        category: "Estoque",
        icon: "boxes",
        accentClass: "from-violet-500 to-purple-600",
        primaryCode: "PHU-29",
    },
    {
        id: "controle-qualidade",
        href: "/controle-qualidade",
        title: "Controle Qualidade",
        description: "Monitoramento químico, pragas e registros de inocuidade.",
        category: "Qualidade",
        icon: "flask",
        accentClass: "from-cyan-500 to-blue-600",
        primaryCode: "PHU-13",
    },
    {
        id: "conduta-higiene",
        href: "/conduta-higiene",
        title: "Conduta e Higiene",
        description: "Monitoramento de saúde, lavagem de mãos e boas práticas.",
        category: "Seguranca",
        icon: "shield",
        accentClass: "from-rose-500 to-pink-600",
        primaryCode: "PHU-37",
    },
    {
        id: "manutencao-calibracao",
        href: "/manutencao-calibracao",
        title: "Manutenção e Calibração",
        description: "Calibração de balanças e cronograma de reparos preventivos.",
        category: "Manutencao",
        icon: "wrench",
        accentClass: "from-gray-500 to-gray-700",
        primaryCode: "PHU-44",
    },
    {
        id: "controle-acesso",
        title: "Controle de Acesso",
        description: "Registro de entrada e saída de visitantes em setores internos.",
        href: "/controle-acesso",
        icon: "shield-check",
        primaryCode: "",
        category: "Seguranca",
        accentClass: "from-yellow-600 to-yellow-600",
    },
    {
        id: "questionario-visitantes",
        title: "Questionário de Visitantes",
        description: "Triagem de saúde e assinatura digital de visitantes.",
        href: "/questionario-visitantes",
        icon: "stethoscope",
        primaryCode: "PHU-038",
        category: "Seguranca",
        accentClass: "from-green-600 to-green-600"
    },

];

export function getSystemById(id: string) {
    return systems.find((system) => system.id === id);
}