type BaseFreq = "Diaria" | "Semanal" | "Quinzenal" | "Mensal" | "a cada 15 dias" | 'OUTRA';

// Condições especiais (o espaço no começo é proposital)
type Condicao =
    | ""
    | "(ou sempre que necessário)"
    | " (uma vez ao dia)"
    | " (duas vezes ao dia)"
    | " (em dias de processamento)"
    | " (a cada 15 dias)";

// O TypeScript cruza a Base com a Condição automaticamente!
export type CleaningFrequency = `${BaseFreq}${Condicao}`;

export type ColunaDinamica = "Horário" | "Qtd. Cont." | "Qtd. Tesouras";

export type CategoriaArea =
    | "Limpeza Geral"
    | "Processo/Máquinas"
    | "Áreas Estruturais"
    | "Quinzenais/Mensais"
    | "Infraestrutura"
    | "Logística"
    | "Equipamentos";

export interface AreaPreenchimento {
    id: string;
    nome: string;
    doc: string;
    freq: CleaningFrequency;
    tituloProdutos?: string;
    campo2: ColunaDinamica;
    produtos: string[];
    category: CategoriaArea;
    isWeeklyType?: boolean;
    instrucaoUso?: string;
    isMatricial?: boolean;
}

export interface CleaningLog {
    id: number;
    date: string;
    time: string;
    checks: Record<string, boolean | string | null> | any;
    signature: string | null;
    status?: string;
    monitorSignature?: string | null;
}

// =======================================================
// INTERFACE PARA BEBEDOUROS (PHU-017)
// =======================================================
export interface BebedouroLog {
    id: number;
    data: string;
    local: string;
    limpeza: string | null;
    trocaFiltro: 'S' | 'N' | '';
    manutencao: 'S' | 'N' | '';
    observacao: string;
    acaoCorretiva: string;
    signature: string;
}

export const BEBEDOURO_ITENS = [
    { id: 'limpeza', label: 'Limpeza do Bebedouro' },
    { id: 'trocaFiltro', label: 'Troca do Filtro' },
    { id: 'manutencao', label: 'Manutenção do Bebedouro' }
];

// =======================================================
// INTERFACE PARA TESOURAS (CONTROLE SEMANAL)
// =======================================================
export interface RegistroHigienizacaoTesoura {
    id: number;
    dataInicio: string;
    dataFim: string;
    dias: {
        [dia: string]: {
            qtde: number | '';
            status: 'C' | 'NC' | '';
        };
    };
    respLimpeza: string | null;
    monitorResponsavel: string | null;
}

export const DIAS_SEMANA_TESOURA = [
    { id: "segunda", label: "Segunda" },
    { id: "terca", label: "Terça" },
    { id: "quarta", label: "Quarta" },
    { id: "quinta", label: "Quinta" },
    { id: "sexta", label: "Sexta" },
    { id: "sabado", label: "Sábado" }
];

// === DADOS ORGANIZADOS E VERTICAIS ===
export const AREAS_DATA: AreaPreenchimento[] = [
    // ... (todas as áreas existentes)
    {
        id: 'panos',
        nome: 'Panos de Limpeza',
        doc: 'PHU-001',
        freq: 'Diaria (em dias de processamento)',
        campo2: 'Horário',
        produtos: ['AL', 'DAC'],
        category: 'Limpeza Geral'
    },
    {
        id: 'lavagem_cont',
        nome: 'Lavagem de Contentores',
        doc: 'PHU-002',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Qtd. Cont.',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Infraestrutura'
    },
    {
        id: 'recepcao_fruta',
        nome: 'Recepção da Fruta',
        doc: 'PHU-003',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Processo/Máquinas'
    },
    {
        id: 'mesas',
        nome: 'Mesas do Packing House',
        doc: 'PHU-004',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Processo/Máquinas'
    },
    {
        id: 'esteiras',
        nome: 'Esteiras',
        doc: 'PHU-005',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Processo/Máquinas'
    },
    {
        id: 'local_lavagem',
        nome: 'Local Lavagem Contentor',
        doc: 'PHU-006',
        freq: 'Semanal',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Áreas Estruturais'
    },
    {
        id: 'janelas_portas',
        nome: 'Janelas e Portas',
        doc: 'PHU-007',
        freq: 'a cada 15 dias (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Quinzenais/Mensais'
    },
    {
        id: 'teto',
        nome: 'Teto',
        doc: 'PHU-008',
        freq: 'a cada 15 dias (em dias de processamento)',
        tituloProdutos: 'Material Utilizado',
        campo2: 'Horário',
        produtos: ['V', 'HS', 'PA'],
        category: 'Áreas Estruturais'
    },
    {
        id: 'lampadas',
        nome: 'Lâmpadas',
        doc: 'PHU-009',
        freq: 'a cada 15 dias (em dias de processamento)',
        tituloProdutos: 'Materiais e Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['PA', 'AL', 'HS'],
        category: 'Áreas Estruturais'
    },
    {
        id: 'piso_ralos',
        nome: 'Piso e Ralos',
        doc: 'PHU-010',
        freq: 'Diaria',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Áreas Estruturais'
    },
    {
        id: 'material_embalagem',
        nome: 'Depósito de Material de Embalagem',
        doc: 'PHU-011',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Infraestrutura'
    },
    {
        id: 'area_refugo',
        nome: 'Área de Refugo',
        doc: 'PHU-012',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Infraestrutura'
    },
    {
        id: 'sala_controle',
        nome: 'Sala de Controle',
        doc: 'PHU-013',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Infraestrutura'
    },
    {
        id: 'colmeias_ventiladores',
        nome: 'Colmeias e Ventiladores',
        doc: 'PHU-016',
        freq: 'Mensal',
        tituloProdutos: 'Materiais e Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['PA', 'HS'],
        category: 'Equipamentos'
    },
    {
        id: 'paleteiras',
        nome: 'Paleteiras',
        doc: 'PHU-018',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['PA', 'HS'],
        category: 'Equipamentos'
    },
    {
        id: 'banheiros_pias',
        nome: 'Banheiros e Pias',
        doc: 'PHU-019',
        freq: 'Diaria (duas vezes ao dia)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Infraestrutura'
    },
    {
        id: 'bebedouros',
        nome: 'Bebedouro',
        doc: 'PHU-017',
        freq: 'Mensal',
        campo2: 'Horário',
        produtos: [],
        category: 'Infraestrutura',
        isMatricial: true, // Garante que a legenda padrão S/N apareça
        instrucaoUso: 'Materiais Necessários:\n- Balde\n- Esponja\n- Luvas Nitrílicas\n- Bota PVC\n- Óculos\n| Diluição dos Produtos:\n1) 50 mL de detergente neutro para 10 litros de água\n2) 100 mL de hipoclorito de sódio para 10 litros de água',
    },
    {
        id: 'balde_lixo_lixeiras',
        nome: 'Baldes de Lixo e Lixeiras',
        doc: 'PHU-020',
        freq: 'Semanal',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'HS'],
        category: 'Limpeza Geral'
    },
    {
        id: 'material_limpeza',
        nome: 'Depósito Mat. Limpeza',
        doc: 'PHU-022',
        freq: 'Semanal(ou sempre que necessário)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN'],
        category: 'Limpeza Geral'
    },
    {
        id: 'tesouras',
        nome: 'Tesouras',
        doc: 'PHU-024',
        freq: 'Diaria',
        campo2: 'Qtd. Tesouras',
        isMatricial: true,
        instrucaoUso: 'Água e Sanclor (Hipoclorito de sódio 20ml p/ 10L de água)',
        produtos: ['AL', 'Sanclor'],
        category: 'Equipamentos'
    },
    {
        id: 'contentores_refugo',
        nome: 'Contentores de Refugo',
        doc: 'PHU-025',
        freq: 'Diaria',
        campo2: 'Qtd. Cont.',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Infraestrutura'
    },
    {
        id: 'balancas',
        nome: 'Balanças',
        doc: 'PHU-026',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'HS'],
        category: 'Equipamentos'
    },
    {
        id: 'batas',
        nome: 'Batas',
        doc: 'PHU-030',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'HS'],
        category: 'Infraestrutura'
    },
    {
        id: 'paredes',
        nome: 'Paredes do Packing House',
        doc: 'PHU-013',
        freq: 'a cada 15 dias (em dias de processamento)',
        campo2: 'Horário',
        produtos: ['DN', 'HS'],
        category: 'Áreas Estruturais'
    },
    {
        id: 'recepcao_visitante',
        nome: 'Recepção de Visitante Packing House',
        doc: 'PHU-015',
        freq: 'Diaria (em dias de processamento)',
        tituloProdutos: 'Produtos Utilizados',
        campo2: 'Horário',
        produtos: ['AL', 'DN', 'HS'],
        category: 'Infraestrutura'
    }
];

// === CONSTANTES COMPLEMENTARES ===
export const PRODUTO_LEGENDA: Record<string, string> = {
    'AL': 'Água Limpa',
    'DAC': 'Detergente Alcalino Clorado',
    'DN': 'Detergente Neutro',
    'HS': 'Hipoclorito de Sódio',
    'V': 'Vassoura',
    'PA': 'Pano Úmido',
    'P': 'Pá',
    'S': 'Saco de Lixo',
    'DT': 'Detergente Banheiro',
    'A70': 'Álcool 70%',
    'Sanclor': 'Sanclor',
    'J': 'Jato com água'
};

export const COMPLIANCE = {
    revisedBy: "Clebitânia Carvalho",
    revisionDate: "02/01/2026"
};

export const CATEGORIES = [
    { id: "all", name: "Todas as Áreas", color: "bg-gray-100 text-gray-800" },
    { id: "Processo/Máquinas", name: "Processo/Máquinas", color: "bg-blue-50 text-blue-700" },
    { id: "Áreas Estruturais", name: "Áreas Estruturais", color: "bg-green-50 text-green-700" },
    { id: "Quinzenais/Mensais", name: "Quinzenais/Mensais", color: "bg-purple-50 text-purple-700" },
    { id: "Equipamentos", name: "Equipamentos", color: "bg-amber-50 text-amber-700" },
    { id: "Limpeza Geral", name: "Limpeza Geral", color: "bg-cyan-50 text-cyan-700" },
    { id: "Infraestrutura", name: "Infraestrutura", color: "bg-pink-50 text-pink-700" }
];

export const FREQUENCIES = [
    { id: "all", name: "Todas as Frequências", color: "bg-gray-100 text-gray-800" },
    { id: "Diaria", name: "Diária", color: "bg-green-50 text-green-700" },
    { id: "Semanal", name: "Semanal", color: "bg-yellow-50 text-yellow-700" },
    { id: "Quinzenal", name: "Quinzenal", color: "bg-blue-50 text-blue-700" },
    { id: "Mensal", name: "Mensal", color: "bg-purple-50 text-purple-700" }
];

export const extractFrequencyType = (freq: string): string => {
    if (!freq) return "OUTRA";
    const upperFreq = freq.toUpperCase();
    if (upperFreq.includes('DIARIA') || upperFreq.includes('DIÁRIA')) return "Diaria";
    if (upperFreq.includes('QUINZENAL') || upperFreq.includes('15 DIAS')) return "Quinzenal";
    if (upperFreq.includes('SEMANAL')) return "Semanal";
    if (upperFreq.includes('MENSAL')) return "Mensal";
    return "OUTRA";
};