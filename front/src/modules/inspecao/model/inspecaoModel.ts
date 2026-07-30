"use client";

export interface PreOpItem {
    id: number;
    category: string;
    item: string;
    checks: Record<string, "C" | "NC" | null>;
    observacaoGeral?: string;
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

export interface ForeignObjectLog {
    id: number;
    date: string;
    time: string;
    location: string;
    status: "C" | "NC" | null;
    foundObject: string;
    correctiveAction: string;
    responsible: string | null;
}

export interface SegurancaTransporteItem {
    id: number;
    item: string;
    conforme: boolean | null; // true = Conforme, false = Não Conforme
    observacao: string;
    acaoCorretiva: string;
}

export interface CleaningLog {
    id: number;
    date: string;
    product: string;
    produtoCorreto: "Sim" | "Não" | null;
    composicaoOk: "Sim" | "Não" | null;
    embalagemOk: "Sim" | "Não" | null;
    padraoExigido: "Sim" | "Não" | null;
    cumprePedido: "Sim" | "Não" | null;
    responsavel: string | null;
}

// 🟢 Atualizado para cobrir as 4 telas operacionais
export type TabType = "pre_inspecao" | "transporte" | "objetos_estranhos";

export const FOREIGN_OBJECT_LOCATIONS = [
    "Recepção da fruta",
    "Área de embalagem"
];

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

export const ITENS_SEGURANCA_TRANSPORTE: string[] = [
    "Baú limpo (sem poeira, terra ou resíduos)",
    "Ausência de odores estranhos",
    "Livre de vestígios de fezes ou presença de animais",
    "Piso íntegro e higienizado e sem compartimento oculto",
    "Paredes e teto sem avarias e frestas",
    "Pallets limpos e em bom estado",
    "Porta com vedação adequada",
    "Ausência de ferrugem interna",
    "Produto protegido contra contaminação cruzada",
    "Ausência de materiais estranhos no interior do baú",
    "Os contentores encontram-se higienizados",
];

export const criarSegurancaTransportePadrao = (): SegurancaTransporteItem[] =>
    ITENS_SEGURANCA_TRANSPORTE.map((item, index) => ({
        id: Date.now() + index,
        item,
        conforme: null,
        observacao: "",
        acaoCorretiva: "",
    }));

export const WEEK_DAYS = [
    { short: "Seg", full: "Segunda" },
    { short: "Ter", full: "Terça" },
    { short: "Qua", full: "Quarta" },
    { short: "Qui", full: "Quinta" },
    { short: "Sex", full: "Sexta" },
    { short: "Sab", full: "Sábado" },
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

export const LEGENDA_OBJETOS_ESTRANHOS = [
    "• C: Inspeção conforme, sem objeto estranho identificado no processo.",
    "• NC: Não conforme, objeto estranho identificado durante a inspeção.",
    "• OBSERVAÇÃO: Em caso de NC, registrar o objeto encontrado e ação corretiva."
];

// 🟢 METADADOS DE CONTROLE DE REVISÃO DO MÓDULO
export const COMPLIANCE_INSPECAO = {
    revisedBy: "Clebitânia Carvalho",
    revisionDate: "02/01/2026"
};