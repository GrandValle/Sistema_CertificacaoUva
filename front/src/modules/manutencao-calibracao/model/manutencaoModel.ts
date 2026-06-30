export type ManutencaoTabType = "checklist" | "reparos" | "balancas"; // as 3 telas agora!

// Perguntas exatas da foto (PHU-040 - Semanal)
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

// Perguntas exatas da foto (PHU-040 - Mensal)
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

export interface RegistroBalanca {
    id: number;
    dataCalibracao: string;
    identificacaoBalanca: string;
    quantidadeMedida: string;
    houveVariacao: "SIM" | "NÃO" | null;
    quantidadeVariacao: string;
    acaoCorretiva: string;
    responsavel: string | null;
}

export interface RegistroReparo {
    id: number;
    data: string;
    equipamento: string;
    servico: "Manutenção" | "Limpeza" | "Reparo";
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

// 🟢 LEGENDAS E OBSERVAÇÕES
export const LEGENDA_CHECKLIST = [
    "• SIM: Item inspecionado e encontra-se em total conformidade com o padrão exigido.",
    "• NÃO: Item inspecionado encontra-se fora do padrão (Gera não conformidade e exige Ação Corretiva)."
];

export const LEGENDA_REPAROS = [
    "• SERVIÇO: Natureza da intervenção técnica realizada no equipamento (Manutenção, Reparo ou Limpeza).",
    "• CONFIRMAÇÃO DE LIMPEZA (SIM/NÃO): Indica se o local ou equipamento foi higienizado adequadamente após a execução do serviço.",
    "• ASSINATURAS: Validação formal das partes atestando a solicitação, a execução e a supervisão da atividade."
];

export const LEGENDA_BALANCAS = [
    "• VARIAÇÃO (SIM/NÃO): Indica se houve divergência entre a pesagem padrão da massa de calibração e o valor medido pela balança.",
    "• QUANTIDADE VARIAÇÃO: Valor numérico referente à diferença de peso identificada durante a aferição.",
    "• AÇÃO CORRETIVA: Medida adotada para regularização do equipamento caso tenha sido identificada variação na pesagem.",
    "• OBS.: As Balanças são aferidas diariamente sempre que houver processamento da fruta."
];