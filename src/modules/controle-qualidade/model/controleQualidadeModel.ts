export type CQTabType = "vidros" | "pragas" | "inusuais" | "rejeitos";

export interface VidrosLog {
    id: number;
    item: string;
    conforme: "C" | "NC" | null; // <-- MUDOU AQUI
    acaoRecomendada: string;
    tempoCorrecao: string;
}

export interface PragaGridCell {
    [key: string]: string;
}

export interface PragasLog {
    id: number;
    data: string;
    monitor: string | null;
    grid: PragaGridCell;
    acaoCorretiva: string;
}

export interface InusuaisLog {
    id: number;
    data: string;
    descricao: string;
    acaoCorretiva: string;
    respCorrecao: string | null;
    respPacking: string | null;
    status: 'pendente' | 'andamento' | 'concluido';
}

export interface RegistroRejeito {
    id: number;
    quantidade: string;
    produto: string;
    dataRetencao: string;
    responsavelRetencao: string | null;
    dataSaida: string;
    localDestino: string;
    responsavelRejeitados: string | null;
}

export const VIDROS_ITEMS = [
    "Vidros Trincados", "Vidros Quebrados", "Vidros Ausentes", "Vidros Sujos",
    "Lâmpadas c/Proteção", "Presença de plástico rígido", "Outros"
];

export const PRAGAS_SETORES = [
    "Embalagem", "Depósito Embalagem", "Depósito de Etiquetas",
    "Recepção visitantes", "Sala de treinamento", "Recebimento da fruta",
    "Refugo", "Estocagem da fruta", "Área Externa"
];

export const PRAGAS_COLUNAS = [
    "Baratas", "Camundongos", "Moscas", "Formigas", "Aranhas", "Traças",
    "Mariposas", "Besouros", "Roedores", "Pássaros", "Morcegos",
    "Lagartixas", "Sapos/Rãs", "Cobra", "Outros", "Nº Armadilha"
];

export const LEGENDA_INUSUAIS = [
    "Exemplos de ocorrências para registro:",
    " • Objetos estranhos no processo / Derramamento de produtos químicos",
    " • Material de embalagem rejeitado / Vidro quebrado ou trincado",
    " • Falta de energia / Falta de água / Esteira quebrada",
    " • Portas quebradas ou fechadura com problema",
    " • Vazamento de amônia na câmara fria"
];

export const LEGENDA_PRAGAS = [
    "SIM: Ausência de pragas.",
    "NÃO: Presença de pragas (descrever em Ação Corretiva)."
];

export const LEGENDA_REJEITOS = [
    "Retido: Produto aguardando análise técnica ou destinação em área isolada.",
    "Rejeitado: Produto identificado como não conforme, destinado ao descarte ou reprocessamento.",
    "Assinaturas: Obrigatórias para a validação da retenção e da posterior liberação/saída do item.",
    "Ação Corretiva: Descrição obrigatória para toda não conformidade registrada."
];

export const LEGENDA_VIDROS = [
    "SIM: Item em conformidade (Sem trincas, limpo e íntegro).",
    "NÃO: Item não conforme (Avariado ou sujo - requer ação imediata)."
];

export const COMPLIANCE_REJEITOS = {
    revisedBy: "Clebitânia Carvalho",
    revisionDate: "02/01/2026",
    popCode: "PHU-034",
    area: "Packing Uva",
};