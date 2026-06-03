// Tipagem para as abas da tela
export type TabType = "estoque" | "tesouras" | "oculos";

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
    id: number;
    funcionario: string;
    numeroTesoura: string;
    dias: {
        [key: string]: { e: boolean; d: boolean };
    };
}

export interface RegistroOculos {
    id: number;
    data: string;
    colaborador: string;
    intacto: "SIM" | "NÃO" | null;
    assinatura: string | null;
    observacao: string;
}

// Constantes padronizadas (Ficam no model para serem reutilizadas sem sujar o front-end)
export const UNIDADES_MEDIDA = ["Kg", "g", "L", "ml", "Unidade"];

export const DIAS_SEMANA = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

export const LEGENDA_ESTOQUE = [
    "Entrada: Quantidade de material recebida e integrada ao inventário.",
    "Saída: Quantidade de material retirada para uso nos setores.",
    "Saldo: Quantidade total disponível no estoque após a movimentação registrada."
];

export const LEGENDA_OCULOS = [
    "SIM: EPI devolvido em perfeitas condições de uso.",
    "NÃO: EPI danificado, riscado ou perdido (sujeito a reposição/desconto)."
];

export const LEGENDA_TESOURAS = [
    "E: Entrega da tesoura ao funcionário.",
    "D: Devolução da tesoura ao estoque.",
    "E/D: Entrega e devolução realizadas no mesmo dia."
];