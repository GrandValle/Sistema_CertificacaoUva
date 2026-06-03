export interface RegistroAcesso {
    id: number;
    data: string;
    hora: string;
    nome: string;
    objetivo: string;
    autorizacao: string;
    horaSaida: string; // Agora é uma string simples para o seletor manual
    status: 'andamento' | 'concluido';
}

export const INITIAL_STATE: RegistroAcesso[] = [
    { id: 1, data: "", hora: "", nome: "", objetivo: "", autorizacao: "", horaSaida: "", status: 'andamento' },
    { id: 2, data: "", hora: "", nome: "", objetivo: "", autorizacao: "", horaSaida: "", status: 'andamento' },
    { id: 3, data: "", hora: "", nome: "", objetivo: "", autorizacao: "", horaSaida: "", status: 'andamento' },
    { id: 3, data: "", hora: "", nome: "", objetivo: "", autorizacao: "", horaSaida: "", status: 'andamento' },
];