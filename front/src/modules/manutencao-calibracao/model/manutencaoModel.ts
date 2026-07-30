export type ManutencaoTabType = "checklist" | "reparos" | "balancas";

// Lista oficial para o preenchimento automático
export const BALANCAS_OFICIAIS = [
    "16", "14", "32", "22", "59", "84", "73", "69", "76", "71",
    "81", "77", "25", "20", "41", "70", "36", "64", "62", "05",
    "23", "25", "01", "10", "63", "94", "85", "96", "90", "67",
    "19", "43", "58", "80", "22", "33", "56", "12"
];

export const ITENS_SEMANAL_PHU040 = [
    "Limpeza bem realizada",
    "Sanitização bem realizada",
    "Resíduos de poeira, ou alguma sujeira",
    "Resíduos de agentes de limpeza ou sanitização",
    "Presença de graxas ou afins nas esteiras",
    "Presença de graxas ou afins nas mesas",
    "Presença de graxas ou afins nas balanças",
    "Presença de graxas ou afins em bandejas",
    "Presença de graxas ou afins em tesouras ou outros utensílios"
];

export const ITENS_MENSAL_PHU040 = [
    "Desprendimento de peças nas esteiras",
    "Desprendimento de peças nas mesas",
    "Esteiras em bom funcionamento",
    "Painel de controle das esteiras em bom funcionamento",
    "Balanças em bom funcionamento"
];

export interface InspecaoChecklist {
    id: number;
    data: string;
    respostas: { [index: number]: "SIM" | "NÃO" | null };
    acaoCorretiva: string;
    responsavel: string | null;
}

// 🟢 FORMATO UNIFICADO: Todas as balanças em um campo de texto único por dia
export interface RegistroBalanca {
    id: number;
    dataCalibracao: string;
    balancasVerificadas: string;
    quantidadeMedida: string;       // 🟢 Adicionado
    houveVariacao: "SIM" | "NÃO";
    quantidadeVariacao: string;     // 🟢 Adicionado
    balancaComDesvio: string;
    acaoCorretiva: string;
    responsavel: string | null;
}

export interface RegistroReparo {
    id: number;
    data: string;
    equipamento: string;
    servico: string;
    solicitante: string | null;
    solicitadaPor: string | null;
    confirmacaoLimpeza: "SIM" | "NÃO" | null;
    responsavel: string | null;
    supervisor: string | null;
    acaoCorretiva: string;
    frequencia: "Mensal";
}

export type FrequenciaAfericao = "Diário" | "Quinzenal" | "Mensal" | "Anual" | null;

export const COMPLIANCE_MANUTENCAO = {
    revisedBy: "Clebitânia Carvalho",
    revisionDate: "02/01/2026",
    pops: {
        balancas: "PHU-044",
        checklist: "PHU-040",
        reparos: "PHU-040"
    }
};

export const LEGENDA_BALANCAS = [
    "• BALANÇAS VERIFICADAS: Campo unificado contendo a relação de todas as balanças aferidas na rotina diária.",
    "• HOUVE VARIAÇÃO: Identificação pontual caso alguma unidade necessite de intervenção ou manutenção corretiva.",
    "• OBS.: As Balanças são aferidas diariamente sempre que houver processamento da fruta."
];
export const LEGENDA_REPAROS = [
    "• SERVIÇO: Natureza da intervenção técnica realizada no equipamento (Manutenção, Reparo ou Limpeza).",
    "• CONFIRMAÇÃO DE LIMPEZA (SIM/NÃO): Indica se o local ou equipamento foi higienizado adequadamente após a execução do serviço.",
    "• ASSINATURAS: Validação formal das partes atestando a solicitação, a execução e a supervisão da atividade."
];

export const LEGENDA_CHECKLIST_SEMANAL = [
    "• Padrão de Conformidade: 'SIM' para procedimentos de limpeza e 'NÃO' para presença de resíduos/graxas.",
    "• Qualquer resposta fora desse padrão indica Não Conformidade e exige Ação Corretiva."
];

export const LEGENDA_CHECKLIST_MENSAL = [
    "• Padrão de Conformidade: 'SIM' para bom estado de funcionamento e 'NÃO' para desprendimento de peças/falhas.",
    "• Qualquer resposta fora desse padrão indica Não Conformidade e exige Ação Corretiva."
];