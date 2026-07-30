// src/utils/date.ts

/**
 * Converte strings de data (YYYY-MM-DD) para objetos Date do JS 
 * sem sofrer com o problema de fuso horário (UTC).
 */
export const parseDataLocal = (dataString: string): Date => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
        const [ano, mes, dia] = dataString.split("-").map(Number);
        return new Date(ano, mes - 1, dia);
    }
    return new Date(dataString);
};

/**
 * Retorna a data atual no formato YYYY-MM-DD (sem pular dia por causa do UTC)
 */
export const getHojeLocal = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Formata uma data para o padrão brasileiro (DD/MM/AAAA)
 */
export const formatarDataBR = (data: string | Date): string => {
    const d = typeof data === 'string' ? parseDataLocal(data) : data;
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
};

/**
 * Formata uma data para exibir horas (HH:MM:SS)
 */
export const formatarHoraBR = (data: string | Date): string => {
    const d = new Date(data);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
};