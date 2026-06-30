"use client";

export interface PreOpItem {
    id: number;
    category: string;
    item: string;
    checks: Record<string, "C" | "NC" | null>;
}

export interface TransportLog {
    id: number;
    date: string;
    bauLimpo: "C" | "NC" | null;
    semOdor: "C" | "NC" | null;
    livreAnimais: "C" | "NC" | null;
    contentorLimpo: "C" | "NC" | null;
    monitor: string | null;
}

export interface ActionPlan {
    id: number;
    date: string;
    item: string;
    naoConformidade: string;
    causaRaiz: string;
    acaoCorretiva: string;
    responsavel: string | null;
}

// 🟢 Atualizado para cobrir as 4 telas operacionais
export type TabType = "pre_inspecao" | "transporte" | "embalagem" | "limpeza";

const rawData: Record<string, string[]> = {
    "Instalações": [
        "A torneira está funcionando?",
        "O Registro para acionar a torneira funciona?",
        "Acionamento das lixeiras funciona?",
        "Cortinas de ar/plásticas limpas?",
        "As portas estão fechadas e limpas?",
        "A iluminação está funcionando adequadamente?",
        "As paredes e o teto estão limpos?",
        "Ar Condicionado/Ventilação funcionando?",
        "As tubulações estão em bom estado?",
        "Vidros e Janelas limpos e íntegros?"
    ],
    "Suprimentos": [
        "Saboneteiras abastecidas e funcionando?",
        "Toalheiro abastecido?",
        "Tem álcool em gel nos recipientes?"
    ],
    "Higiene": [
        "O piso está totalmente limpo?",
        "Os equipamentos estão limpos?",
        "Drenos e Ralos estão limpos?",
        "As mesas de seleção e embalagem estão limpas?",
        "Higiene dos colaboradores (Uniformes/EPIs)?",
        "O lixo está sendo removido adequadamente?"
    ],
    "Pragas": [
        "Armadilhas de controle de pragas em bom estado?"
    ],
    "Segurança": [
        "As lâmpadas estão protegidas?"
    ],
    "Área Externa": [
        "Entorno do Packing House limpo?"
    ],
    "Logística": [
        "Os paletes estão limpos e conservados?"
    ],
    "Frio": [
        "As colmeias de frio estão em bom estado?"
    ]
};

let globalId = 1;
export const PRE_OP_ITEMS_DATA = Object.entries(rawData).flatMap(([category, items]) =>
    items.map(item => ({
        id: globalId++,
        category,
        item
    }))
);

export const WEEK_DAYS = [
    { short: "Seg", full: "Segunda" },
    { short: "Ter", full: "Terça" },
    { short: "Qua", full: "Quarta" },
    { short: "Qui", full: "Quinta" },
    { short: "Sex", full: "Sexta" },
    { short: "Sab", full: "Sábado" },
];

export const PRODUTOS_LIMPEZA = [
    "Primmax Sol Plus",
    "Álcool em gel",
    "Dermol plus",
    "Sanclor",
    "Primmax Sanclor"
];

// 🟢 LEGENDAS E OBSERVAÇÕES CENTRALIZADAS POR TELA
export const LEGENDA_PRE_INSPECAO = [
    "• SIM: Item operacional inspecionado e considerado CONFORME.",
    "• NÃO: Item operacional inspecionado considerado NÃO CONFORME.",
    "• OBSERVAÇÃO: Qualquer não conformidade exige a abertura e preenchimento do Plano de Ação Corretiva abaixo."
];

export const LEGENDA_TRANSPORTE = [
    "• SIM: Veículo de transporte inspecionado e considerado higienicamente apto para carregamento.",
    "• NÃO: Irregularidade encontrada na estrutura do baú, odor incompatível ou presença de vetores.",
    "• OBSERVAÇÃO: Recomenda-se a limpeza e correção imediata do compartimento antes de iniciar o fluxo."
];

export const LEGENDA_EMBALAGEM = [
    "• SIM: Material íntegro, livre de sujidades e pragas, com integridade de lote e validade preservados.",
    "• NÃO: Presença de avarias físicas, violação de lote ou inconformidades visuais na embalagem.",
    "• OBSERVAÇÃO: Itens reprovados devem ser imediatamente segregados e devolvidos ao setor de suprimentos."
];

export const LEGENDA_LIMPEZA = [
    "• SIM: Produto químico de limpeza recebido em total conformidade com a especificação técnica e FISPQ.",
    "• NÃO: Divergência de princípio ativo, ausência de rotulagem regulamentar ou embalagem danificada."
];

// 🟢 METADADOS DE CONTROLE DE REVISÃO DO MÓDULO
export const COMPLIANCE_INSPECAO = {
    revisedBy: "Clebitânia Carvalho",
    revisionDate: "02/01/2026"
};