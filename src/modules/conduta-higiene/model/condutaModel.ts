export type CondutaTabType = "inspecao" | "lavagem";

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

export type LavagemStatus = "C" | "NC" | null;

export interface LavagemTurnos {
    manha: LavagemStatus;
    tarde: LavagemStatus;
}

export interface LavagemLog {
    id: number;
    colaborador: string;
    dias: {
        [key: string]: LavagemTurnos;
    }
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