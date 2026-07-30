// model/condutaModel.ts

export type CondutaTabType = "inspecao" | "lavagem";

// === LOGICA DE DATAS DINÂMICAS ===
export type WeekDayType = "Seg" | "Ter" | "Qua" | "Qui" | "Sex" | "Sáb";

/**
 * Gera os labels dos dias da semana baseados na string da semana.
 * Suporta formatos:
 * - "08 a 13 de Junho" (extenso)
 * - "08/06 a 13/06" (numérico)
 * - "08 a 13 de Junho 2026" (com ano)
 * 
 * Retorna: [{ short: "Seg", label: "Seg (08/06)" }, ...]
 */
export const generateWeekDays = (weekStartString?: string) => {
    const baseDays: WeekDayType[] = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    if (!weekStartString) {
        return baseDays.map(day => ({ short: day, label: day }));
    }

    let startDay: number;
    let startMonth: number;
    let startYear: number;

    const matchExtenso = weekStartString.match(/(\d{2})\s*a\s*\d{2}\s*de\s*([A-Za-zç]+)(?:\s*(\d{4}))?/i);
    if (matchExtenso) {
        startDay = parseInt(matchExtenso[1], 10);
        const monthName = matchExtenso[2];
        startYear = matchExtenso[3] ? parseInt(matchExtenso[3], 10) : new Date().getFullYear();

        const meses: Record<string, number> = {
            janeiro: 0, fevereiro: 1, março: 2, abril: 3, maio: 4, junho: 5,
            julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
        };
        startMonth = meses[monthName.toLowerCase()] ?? 0;
    } else {
        const matchSlash = weekStartString.match(/(\d{2})\/(\d{2})/);
        if (matchSlash) {
            startDay = parseInt(matchSlash[1], 10);
            startMonth = parseInt(matchSlash[2], 10) - 1;
            startYear = new Date().getFullYear();
        } else {
            const numbers = weekStartString.match(/\d+/g);
            if (numbers && numbers.length >= 2) {
                startDay = parseInt(numbers[0], 10);
                startMonth = parseInt(numbers[1], 10) - 1;
                startYear = new Date().getFullYear();
            } else {
                return baseDays.map(day => ({ short: day, label: day }));
            }
        }
    }

    const dataInicio = new Date(startYear, startMonth, startDay);
    if (isNaN(dataInicio.getTime())) {
        return baseDays.map(day => ({ short: day, label: day }));
    }

    const resultado = [];
    for (let i = 0; i < 6; i++) {
        const dataAtual = new Date(dataInicio);
        dataAtual.setDate(dataInicio.getDate() + i);
        const dia = String(dataAtual.getDate()).padStart(2, '0');
        const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
        resultado.push({
            short: baseDays[i],
            label: `${baseDays[i]} (${dia}/${mes})`
        });
    }

    return resultado;
};

// === DADOS E TIPOS ===

export const QUESTIONS = [
    "01. Todos os uniformes estão limpos e em bom estado de conservação, todos lavaram as mãos antes de entrar no packing house e depois de usar os banheiros e após os intervalos de trabalho?",
    "02. Todos estão utilizando seu EPI de forma correta, como especificado por área de risco?",
    "03. A higiene pessoal é rigorosamente respeitada? (Unhas, barba, cabelo...)",
    "04. Foram encontrados objetos pessoais na área de produção (Aplica-se também a relógios e Celulares)?",
    "05. Práticas educacionais como; Não fumar, não comer, não tossir, não cuspir no chão, etc. (na área de produção), são respeitadas?",
    "06. Todos antes de entrarem na área de produção, lavam e sanitizam as mãos?",
    "07. Funcionários que possuem feridas expostas e/ou doenças infectocontagiosas são retirados da atividade, que requer contato direto com o fruto?",
    "08. Todos inclusive os visitantes e os funcionários administrativos se ajustam às práticas de segurança alimentar ao adentrarem as áreas de produção e/ou áreas sanitárias?",
    "09. Os funcionários despem-se dos uniformes ao saírem da área de produção e/ou quando utilizam os sanitários?",
    "10. Os cestos de lixo estão tampados e com sacos plásticos? São esvaziados constantemente?",
    "11. As informações existentes nos cartazes educativos contemplam às necessidades do packing e estão em bom estado de conservação e limpeza?",
    "12. As instalações sanitárias estão funcionando adequadamente? (vasos, pias, chuveiros, estações de lavagem das mãos).",
    "13. Há disponibilidade de maneira adequada e satisfatória dos materiais de limpeza, higienização e sanitização? (gel, sabonete antisséptico, papel higiênico, sanitizantes)",
    "14. Os equipamentos e materiais utilizados na produção são devidamente manuseados e guardados, adequadamente, durante e após seu uso?",
    "15. Os bebedouros são limpos e sanitizados periodicamente?",
    "16. Equipamentos portáteis, como balanças, são devidamente limpos e sanitizados?",
    "17. Os Funcionários apresentam-se isentos de feridas expostas, lesões ou cortes na pele?",
    "18. Os Funcionários estão acometidos de doenças gastrintestinais crônicas ou agudas?",
    "19. Os funcionários estão acometidos de sintomas como infecções pulmonares ou faringites?",
];

export const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type DayStatus = "ok" | "no" | null;

export interface ChecklistRow {
    questionId: number;
    Seg: DayStatus;
    Ter: DayStatus;
    Qua: DayStatus;
    Qui: DayStatus;
    Sex: DayStatus;
    Sáb: DayStatus;
}

export interface ActionPlan {
    id: number;
    date: string;
    item: string;
    nonConformity: string;
    rootCause: string;
    action: string;
    responsible: string | null;
    status: "pending" | "in_progress" | "completed";
}

// 🔥 NOVO: Tipo para observações por dia (justificativas para dias não preenchidos)
export type ObservacoesPorDia = Record<string, string>; // ex: { Seg: "", Ter: "", ... }

export type LavagemStatus = "C" | "NC" | "F" | null;

export interface LavagemTurnos {
    manha: LavagemStatus;
    tarde: LavagemStatus;
}

export interface LavagemLog {
    id: number;
    colaboradorId?: string;
    colaborador: string;
    dias: {
        [key: string]: LavagemTurnos;
    }
}

export interface ColaboradorLavagem {
    id: string;
    nome: string;
    tipo: "EFETIVO" | "CONTRATADO";
    ativo: boolean;
    criadoEm: string;
    atualizadoEm: string;
}

export const COMPLIANCE = {
    revisedBy: "Clebitânia Carvalho",
    revisionDate: "02/01/2026",
    popCode: "PHU-037",
    area: "Packing Uva",
};

export const COMPLIANCE_LAVAGEM = {
    revisedBy: "Clebitânia Carvalho",
    revisionDate: "02/01/2026",
    popCode: "PHU-039",
    area: "Packing Uva",
};

export const buildInspecaoGeralLegend = (): string[] => {
    return [
        "• SIM: Indica atendimento aos requisitos de boas práticas e higiene estabelecidos.",
        "• NÃO: Indica desvio, ausência ou inadequação em relação ao padrão exigido.",
        "",
        "Nota: Para itens de verificação de ocorrências indesejadas (ex: presença de objetos ou sintomas),",
        "a resposta 'NÃO' representa conformidade, enquanto 'SIM' aponta uma não conformidade."
    ];
};

export const isInverseQuestion = (questionText: string): boolean => {
    if (!questionText) return false;
    const text = questionText.toLowerCase();
    return (
        text.includes("objetos pessoais") ||
        text.includes("doenças gastrintestinais") ||
        text.includes("infecções pulmonares") ||
        text.includes("sintomas")
    );
};