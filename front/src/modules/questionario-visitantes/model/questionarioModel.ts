export interface VisitanteData {
    data: string;
    nome: string;
    empresa: string;
    motivo: string;
}

export interface Pergunta {
    id: string;
    grupo: number;
    en: string;
    pt: string;
}

export const GRUPOS_VISITANTE = [
    {
        id: 1,
        en: 'Have you presented or been in contact with someone who presented the following symptoms in the last 21 days?',
        pt: 'Você já apresentou ou esteve em contato com alguém que apresentou os seguintes sintomas nos últimos 21 dias?',
    },
    {
        id: 2,
        en: 'Can the following be found in your medical history?',
        pt: 'Pode ser encontrado o seguinte em seu histórico médico?',
    },
    {
        id: 3,
        en: 'Food Allergies',
        pt: 'Alergias Alimentares',
    },
];

export const PERGUNTAS_VISITANTE: Pergunta[] = [
    { id: 'A', grupo: 1, en: 'Enteric fever (e.g. Typhoid or Paratyphoid fever)', pt: 'Febre entérica (e.g. febre tifoide ou paratifoide)' },
    { id: 'B', grupo: 1, en: 'Infections caused by Salmonella spp. Vibrio cholerae. Shigella spp e Coli.', pt: 'Infecções causadas por Salmonella spp. Vibrio cholerae. Shigella spp e Coli.' },
    { id: 'C', grupo: 1, en: 'Hepatitis', pt: 'Hepatites' },
    { id: 'D', grupo: 2, en: 'Diarrhea or vomits in the last 3 months', pt: 'Diarréia ou vômitos nos últimos 3 meses' },
    { id: 'E', grupo: 2, en: 'Stomachaches, Intestinal pains or constipation.', pt: 'Dores de estômago, dores ou constipação intestinais' },
    { id: 'F', grupo: 2, en: 'Skin Conditions - eczema, dermatitis (including cuts and blisters)', pt: 'Condições de pele - eczema, dermatite (inclusive cortes e bolhas)' },
    { id: 'G', grupo: 2, en: 'Bronchitis or Coughing', pt: 'Bronquites ou Tossindo' },
    { id: 'H', grupo: 2, en: 'Any diseases in general - earache, nose ache, eye ache or other', pt: 'Qualquer infecção em geral - dor de ouvido, dor no nariz, dor nos olhos ou outro' },
    { id: 'I', grupo: 2, en: 'Any gum, throat or mouth diseases', pt: 'Doenças gengivas, boca ou garganta' },
    { id: 'J', grupo: 3, en: 'Are you allergic to eggs?', pt: 'Você é alérgico a ovos?' },
    { id: 'L', grupo: 3, en: 'Are you allergic to milk?', pt: 'Você é alérgico a leite?' },
    { id: 'M', grupo: 3, en: 'Are you allergic to soy?', pt: 'Você é alérgico a soja?' },
    { id: 'N', grupo: 3, en: 'Are you allergic to gluten?', pt: 'Você é alérgico a glúten?' },
    { id: 'O', grupo: 3, en: 'Are you allergic to nuts?', pt: 'Você é alérgico a castanhas?' },
    { id: 'P', grupo: 3, en: 'Are you allergic to seafood?', pt: 'Você é alérgico a frutos do mar?' },
];