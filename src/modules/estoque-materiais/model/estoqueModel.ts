// Tipagem para as abas da tela
export type TabType = "estoque" | "tesouras" | "oculos" | "embalagem";

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
    numeroTesoura: string;
    tipo: "EFETIVO" | "CONTRATADO" | "DESLIGADO" | "DESLIGADA";
    dias: {
        [key: string]: {
            e: boolean;
            d: boolean;
        };
    };
}

// Tipagem da Devolução de Óculos (PHU-044)
export interface RegistroOculos {
    id: string;
    data: string;
    colaboradorId: string; // UUID do colaborador
    intacto: "SIM" | "NÃO" | null;
    assinatura: string | null;
    observacao: string;
    status: "ATIVO" | "INATIVO";
    criadoEm?: string;
    atualizadoEm?: string;
}

// =======================================================
// CONTROLE DE ENTRADA DE EMBALAGEM (PHU-032)
// =======================================================

export interface EmbalagemEntry {
    id: string;

    // Dados da carga
    data: string;
    horaChegada: string;
    responsavel: string | null;
    tipoTransporte: string;
    tipoMaterial: string;

    // Condições de acondicionamento da carga (AGORA COM 3 ESTADOS)
    limpeza: "BOM" | "ACEITÁVEL" | "REPROVADO" | "";
    conservacao: "BOM" | "ACEITÁVEL" | "REPROVADO" | "";
    estadoTransporte: "BOM" | "ACEITÁVEL" | "REPROVADO" | "";
    odoresTransporte: "BOM" | "ACEITÁVEL" | "REPROVADO" | "";
    problemaAcondicionamento: "BOM" | "ACEITÁVEL" | "REPROVADO" | "";
    estadoMaterial: "BOM" | "ACEITÁVEL" | "REPROVADO" | "";

    // Verificações rápidas
    materialDanificado: boolean | null;
    materialLimpo: boolean | null;
    comOdores: boolean | null;

    // Campo de observações
    observacoes: string;

    // Ações corretivas
    acoesCorretivas: string;
}

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
    "SIM: EPI devolvido em perfeitas condições de uso.",
    "NÃO: EPI danificado, riscado ou perdido (sujeito a reposição/desconto)."
];

export const LEGENDA_TESOURAS = [
    "E: Entrega da tesoura ao funcionário.",
    "D: Devolução da tesoura ao estoque.",
    "E/D: Entrega e devolução realizadas no mesmo dia."
];

export const CAMPOS_CONDICOES = [
    { label: "Limpeza do Veículo", field: "limpeza" },
    { label: "Conservação do Material", field: "conservacao" },
    { label: "Estado do Transporte", field: "estadoTransporte" },
    { label: "Odores no Transporte", field: "odoresTransporte" },
    { label: "Problema de Acondicionamento", field: "problemaAcondicionamento" },
    { label: "Estado do Material", field: "estadoMaterial" },
] as const;

export const VERIFICACOES_RAPIDAS_BASE = [
    { id: "materialDanificado", label: "Material Danificado?", invertColor: true },
    { id: "materialLimpo", label: "Material Limpo?", invertColor: false },
    { id: "comOdores", label: "Com Odores?", invertColor: true }
] as const;