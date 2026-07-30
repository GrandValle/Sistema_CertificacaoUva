// Tipagem para as abas da tela
export type TabType = "estoque" | "tesouras" | "oculos" | "limpeza";

// 🔥 NOVO: Para a sub-aba de inspeção (exportação)
export type TabTypeExport = TabType | "limpeza";

// Tipagem do Catálogo de Produtos
export interface ProdutoCatalogo {
    nome: string;
    unidade: string;
    quantidade: string;
}

// Tipagem da Tabela de Controle de Estoque (PHU-029)
export interface EstoqueLog {
    id: number;
    date: string;
    product: string;
    entry: string;
    entryUnit: string;
    exit: string;
    exitUnit: string;
    sector: string;
    whoTook: string | null;
    balance: string;
    responsible: string | null;
}

// Tipagem da Cautela de Tesouras (PHU-043)
export interface RegistroTesoura {
    id: string;
    funcionario: string;
    tipo: 'EFETIVO' | 'CONTRATADO' | 'DESLIGADO' | 'DESLIGADA';
    numeroTesoura: string;
    visivel?: boolean;
    dias: Record<string, { e: boolean; d: boolean; f?: boolean }>;
    statusTesoura: 'EM_USO' | 'DEVOLVIDA';
}

// Tipagem da Devolução de Óculos (PHU-044)
export interface RegistroOculos {
    id: string;
    data: string;
    colaboradorId: string;
    intacto: "SIM" | "NÃO" | null;
    assinatura: string | null;
    observacao: string;
    status: "ATIVO" | "INATIVO";
    criadoEm?: string;
    atualizadoEm?: string;
    dias?: Record<string, boolean | string | null>;
}
// =======================================================
// CONTROLE DE ENTRADA DE MATERIAIS DE LIMPEZA (PHU-036)
// =======================================================

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

// Produtos disponíveis para inspeção de limpeza
export const PRODUTOS_LIMPEZA: string[] = [
    "Primmax Sol Plus",
    "Álcool em gel",
    "Dermol plus",
    "Primmax Sanclor"
];

// =======================================================
// CONSTANTES PADRONIZADAS
// =======================================================

export const UNIDADES_MEDIDA = [
    "Kg",
    "g",
    "L",
    "ml",
    "Unidade"
];

export const DIAS_SEMANA = [
    "SEG",
    "TER",
    "QUA",
    "QUI",
    "SEX",
    "SAB"
];

export const LEGENDA_ESTOQUE = [
    "Entrada: Quantidade de material recebida e integrada ao inventário.",
    "Saída: Quantidade de material retirada para uso nos setores.",
    "Saldo: Quantidade total disponível no estoque após a movimentação registrada."
];

export const LEGENDA_OCULOS = [
    "SIM: Óculos em perfeitas condições de uso.",
    "NÃO: Óculos com avarias, necessidade de reparo ou manutenção.",
    "F: Falta (Colaborador ausente ou afastado no dia da verificação)."
];

export const LEGENDA_TESOURAS = [
    "E: Entrega da tesoura ao funcionário.",
    "D: Devolução da tesoura ao estoque.",
    "E/D: Entrega e devolução realizadas no mesmo dia.",
    "F: Falta (Colaborador ausente ou afastado no dia da verificação)."
];

// 🔥 NOVA LEGENDA PARA LIMPEZA
export const LEGENDA_LIMPEZA = [
    "SIM: Produto de limpeza recebido em total conformidade com a especificação técnica.",
    "NÃO: Divergência de princípio ativo, ausência de rotulagem ou embalagem danificada.",
];