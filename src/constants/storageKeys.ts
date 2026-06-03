/**
 * Chaves de Armazenamento Centralizadas
 * Todas as chaves do localStorage usadas na aplicação
 * Versionado para permitir invalidação de cache
 */

export const STORAGE_KEYS = {
    // Armazenamento dos módulos principais
    inspecao: "gv_inspecao_v11",
    conduta: "gv_conduta_saude_uva_v4",
    estoque: "gv_estoque_materiais_v4",
    controleQualidade: "gv_controle_qualidade_v5",
    controleAcesso: "@GV:controle_acesso_v1",
    manutencao: "gv_manutencao_v6",
    higienizacao: "gv_higienizacao_geral_v5",

    // Registros de exportação históricos (um por módulo)
    historicoInspecao: "gv_inspecao_historico",
    historicoConduta: "gv_conduta_historico",
    historicoEstoque: "gv_estoque_historico",
    historicoQualidade: "gv_controle_qualidade_historico",
    historicoAcesso: "gv_controle_acesso_historico",
    historicoManutencao: "gv_manutencao_historico",
    historicoHigienizacao: "gv_higienizacao_geral_historico",
} as const;

/**
 * Obtém a chave de armazenamento histórico para um módulo específico
 * @param module Identificador do módulo
 * @returns Chave de armazenamento histórico
 */
export const getHistoricoKey = (module: string): string => {
    return `gv_${module}_historico`;
};
