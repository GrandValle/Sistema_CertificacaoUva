"use client";

export type SystemCategory =
    | "Higienizacao"
    | "Inspecao"
    | "Estoque"
    | "Seguranca"
    | "Manutencao"
    | "Qualidade";

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
    ];

export const systems: SystemDefinition[] = [
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
        title: "Estoque e Materiais",
        description: "Controle de insumos, materiais de limpeza e utensilios.",
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
        primaryCode: "POP-13",
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
        accentClass: "from-slate-600 to-zinc-800",
        primaryCode: "PHU-44",
    },
    {
        id: "controle-acesso",
        title: "Controle de Acesso",
        description: "Registro de entrada e saída de visitantes em setores internos.",
        href: "/controle-acesso",
        icon: "shield",
        primaryCode: "",
        category: "Seguranca",
        accentClass: "from-yellow-600 to-yellow-600",
    }
];

export function getSystemById(id: string) {
    return systems.find((system) => system.id === id);
}