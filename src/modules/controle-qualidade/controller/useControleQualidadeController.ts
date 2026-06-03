"use client";

import { useState, useEffect } from "react";
import {
    CQTabType, VidrosLog, PragaGridCell, PragasLog, InusuaisLog, RegistroRejeito,
    VIDROS_ITEMS, PRAGAS_SETORES, PRAGAS_COLUNAS
} from "../model/controleQualidadeModel";
import { STORAGE_KEYS } from "../../../constants/storageKeys";

// 🟢 IMPORTAÇÕES ADICIONADAS: O formatador do Excel e a API de salvamento
import { exportControleQualidadeToExcel } from "../services/excelFormatter";
import { salvarDocumento } from "../../../services/api";

export function useControleQualidadeController() {
    const [activeTab, setActiveTab] = useState<CQTabType>("vidros");

    interface ControleQualidadePersistedState {
        vidrosDate?: string;
        vidrosMonitor?: string | null;
        vidrosResp?: string | null;
        vidrosObs?: string;
        vidrosLogs?: VidrosLog[];
        pragasLogs?: PragasLog[];
        inusuaisLogs?: InusuaisLog[];
        rejeitosLogs?: RegistroRejeito[];
    }

    const getSavedState = (): ControleQualidadePersistedState | null => {
        if (typeof window === "undefined") return null;
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.controleQualidade);
            return saved ? (JSON.parse(saved) as ControleQualidadePersistedState) : null;
        } catch {
            return null;
        }
    };

    const savedState = getSavedState();

    const [vidrosDate, setVidrosDate] = useState(() => savedState?.vidrosDate || "");
    const [vidrosMonitor, setVidrosMonitor] = useState<string | null>(() => savedState?.vidrosMonitor || null);
    const [vidrosResp, setVidrosResp] = useState<string | null>(() => savedState?.vidrosResp || null);
    const [vidrosObs, setVidrosObs] = useState(() => savedState?.vidrosObs || "");
    const [vidrosLogs, setVidrosLogs] = useState<VidrosLog[]>(
        () => savedState?.vidrosLogs?.length
            ? savedState.vidrosLogs
            : VIDROS_ITEMS.map((item, index) => ({ id: index, item: item, conforme: null, acaoRecomendada: "", tempoCorrecao: "" }))
    );

    const [pragasLogs, setPragasLogs] = useState<PragasLog[]>(() => savedState?.pragasLogs || []);
    const [inusuaisLogs, setInusuaisLogs] = useState<InusuaisLog[]>(
        () => savedState?.inusuaisLogs?.length
            ? savedState.inusuaisLogs
            : [{
                id: 1,
                data: new Date().toISOString().split('T')[0],
                descricao: "",
                status: "pendente",
                acaoCorretiva: "",
                respCorrecao: null,
                respPacking: null,
            }]
    );

    const [rejeitosLogs, setRejeitosLogs] = useState<RegistroRejeito[]>(
        () => savedState?.rejeitosLogs?.length
            ? savedState.rejeitosLogs
            : Array.from({ length: 5 }, (_, i) => ({
                id: i + 1,
                quantidade: "",
                dataRetencao: "",
                responsavelRetencao: null,
                dataSaida: "",
                localDestino: "",
                responsavelRejeitados: null,
            }))
    );

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.controleQualidade, JSON.stringify({
            vidrosLogs, vidrosDate, vidrosMonitor, vidrosResp, vidrosObs,
            pragasLogs, inusuaisLogs, rejeitosLogs
        }));
    }, [vidrosLogs, vidrosDate, vidrosMonitor, vidrosResp, vidrosObs, pragasLogs, inusuaisLogs, rejeitosLogs]);

    const updateVidro = <K extends keyof VidrosLog>(id: number, field: K, value: VidrosLog[K]) => {
        setVidrosLogs(vidrosLogs.map(log => {
            if (log.id === id) {
                if (field === 'conforme' && log.conforme === value) return { ...log, [field]: null };
                return { ...log, [field]: value };
            }
            return log;
        }));
    };

    const addPragaLog = () => {
        const newGrid: PragaGridCell = {};
        PRAGAS_SETORES.forEach(s => {
            PRAGAS_COLUNAS.forEach(c => {
                const cUpper = c.toUpperCase();
                if (cUpper.includes("ARMADILHA") || cUpper.includes("QUANTIDADE") || cUpper === "OUTROS") {
                    newGrid[`${s}_${c}`] = "";
                } else {
                    newGrid[`${s}_${c}`] = "SIM";
                }
            });
        });
        setPragasLogs([{
            id: Date.now(),
            data: new Date().toISOString().split('T')[0],
            monitor: null,
            grid: newGrid,
            acaoCorretiva: ""
        }, ...pragasLogs]);
    };

    const updatePragaLog = <K extends keyof PragasLog>(id: number, field: K, value: PragasLog[K]) => {
        setPragasLogs(pragasLogs.map(log => log.id === id ? { ...log, [field]: value } : log));
    };

    const updatePragaGrid = (logId: number, setor: string, coluna: string, value: string) => {
        setPragasLogs(pragasLogs.map(log => {
            if (log.id === logId) {
                return { ...log, grid: { ...log.grid, [`${setor}_${coluna}`]: value } };
            }
            return log;
        }));
    };

    const removePragaLog = (id: number) => setPragasLogs(pragasLogs.filter(p => p.id !== id));

    const addInusualLog = () => {
        setInusuaisLogs([{
            id: Date.now(),
            data: new Date().toISOString().split('T')[0],
            descricao: "",
            status: "pendente",
            acaoCorretiva: "",
            respCorrecao: null,
            respPacking: null
        }, ...inusuaisLogs]);
    };

    const updateInusualLog = <K extends keyof InusuaisLog>(id: number, field: K, value: InusuaisLog[K]) => {
        setInusuaisLogs(inusuaisLogs.map(log => log.id === id ? { ...log, [field]: value } : log));
    };

    const removeInusualLog = (id: number) => setInusuaisLogs(inusuaisLogs.filter(log => log.id !== id));

    const addRejeitoRow = () => {
        setRejeitosLogs([{
            id: Date.now(), quantidade: "", dataRetencao: "", responsavelRetencao: null,
            dataSaida: "", localDestino: "", responsavelRejeitados: null
        }, ...rejeitosLogs]);
    };

    const updateRejeitoRow = <K extends keyof RegistroRejeito>(id: number, field: K, value: RegistroRejeito[K]) => {
        setRejeitosLogs(rejeitosLogs.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const removeRejeitoRow = (id: number) => {
        setRejeitosLogs(rejeitosLogs.filter(row => row.id !== id));
    };

    const getHistoryRecord = () => {
        const now = new Date();
        const tabNameMap: Record<CQTabType, string> = {
            vidros: "Vidros",
            pragas: "Pragas",
            inusuais: "Inusuais",
            rejeitos: "Rejeitos",
        };
        const totalItems =
            activeTab === "vidros" ? vidrosLogs.length
                : activeTab === "pragas" ? pragasLogs.length
                    : activeTab === "rejeitos" ? rejeitosLogs.length
                        : inusuaisLogs.length;

        return {
            module: "qualidade",
            record: {
                id: `QLD-${now.getTime()}`,
                mes: now.toISOString().slice(0, 7),
                aba: tabNameMap[activeTab] || "Qualidade",
                exportedAt: now.toLocaleString("pt-BR"),
                status: totalItems > 0 ? "completo" : "pendente",
            },
        };
    };

    // 🟢 FUNÇÃO INTEGRADA AO BACK-END (SEM AUTO-DOWNLOAD E COM FORMATO EM BLOB)
    const exportarExcel = async () => {
        try {
            console.log("Gerando arquivo Excel de Controle de Qualidade...");
            const now = new Date();
            const mesAtual = now.toISOString().slice(0, 7);

            const tabNameMap: Record<CQTabType, string> = {
                vidros: "Vidros",
                pragas: "Pragas",
                inusuais: "Inusuais",
                rejeitos: "Rejeitos"
            };

            const docCodeMap: Record<CQTabType, string> = {
                vidros: "PHU-022",
                pragas: "PHU-024",
                inusuais: "PHU-025",
                rejeitos: "PHU-026"
            };

            // 1. Gera o arquivo Excel invisível em formato de Blob
            const excelBlob = await exportControleQualidadeToExcel({
                activeTab,
                vidrosDate,
                vidrosMonitor,
                vidrosResp,
                vidrosObs,
                vidrosLogs,
                pragasLogs,
                inusuaisLogs,
                rejeitosLogs
            });

            // 2. Prepara os dados JSON baseados na aba que está ativa
            let dadosQualidade = {};
            if (activeTab === "vidros") dadosQualidade = { vidrosDate, vidrosMonitor, vidrosResp, vidrosObs, vidrosLogs };
            if (activeTab === "pragas") dadosQualidade = { pragasLogs };
            if (activeTab === "inusuais") dadosQualidade = { inusuaisLogs };
            if (activeTab === "rejeitos") dadosQualidade = { rejeitosLogs };

            // 3. Monta o payload unificado aceito pelo seu DocumentoService do Backend
            const dadosDoBanco = {
                popCode: docCodeMap[activeTab],
                titulo: `Qualidade - ${tabNameMap[activeTab]}`,
                mes: mesAtual,
                aba: tabNameMap[activeTab],
                setor: tabNameMap[activeTab], // 🟢 Enviamos setor E aba para sumir com o traço (-) do histórico!
                status: "completo",
                dadosQualidade: dadosQualidade
            };

            console.log("Enviando dados da Qualidade para o servidor...");

            // 4. Salva no Banco de Dados MySQL através do arquivo central da API
            const resposta = await salvarDocumento(
                "controle_qualidade", // Nome exato mapeado no seu backend para a tabela controle_qualidade
                dadosDoBanco,
                excelBlob as Blob,
                `Qualidade_${activeTab}_${now.getTime()}.xlsx`
            );

            console.log("Sucesso! Salvo no banco com o ID:", resposta.id);

            // 5. Limpa exclusivamente os campos da aba ativa que acabou de ser salva
            switch (activeTab) {
                case "vidros":
                    setVidrosDate(""); setVidrosMonitor(null); setVidrosResp(null); setVidrosObs("");
                    setVidrosLogs(VIDROS_ITEMS.map((item, index) => ({ id: index, item, conforme: null, acaoRecomendada: "", tempoCorrecao: "" })));
                    break;
                case "pragas":
                    setPragasLogs([]);
                    break;
                case "inusuais":
                    setInusuaisLogs([{ id: 1, data: new Date().toISOString().split('T')[0], descricao: "", status: "pendente", acaoCorretiva: "", respCorrecao: null, respPacking: null }]);
                    break;
                case "rejeitos":
                    setRejeitosLogs(Array.from({ length: 5 }, (_, i) => ({ id: i + 1, quantidade: "", dataRetencao: "", responsavelRetencao: null, dataSaida: "", localDestino: "", responsavelRejeitados: null })));
                    break;
            }

            // 6. Atualiza a interface reativa de históricos
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("historicoAtualizado"));

            alert(`Registro de ${tabNameMap[activeTab]} exportado e salvo no banco de dados com sucesso! 🍇`);
        } catch (error) {
            console.error("Erro ao exportar e salvar no banco:", error);
            alert("Ocorreu um erro ao enviar para o servidor. Verifique o console.");
        }
    };

    return {
        activeTab, setActiveTab,
        vidrosDate, setVidrosDate, vidrosMonitor, setVidrosMonitor, vidrosResp, setVidrosResp, vidrosObs, setVidrosObs, vidrosLogs, updateVidro,
        pragasLogs, addPragaLog, updatePragaLog, updatePragaGrid, removePragaLog,
        inusuaisLogs, addInusualLog, updateInusualLog, removeInusualLog,
        rejeitosLogs, addRejeitoRow, updateRejeitoRow, removeRejeitoRow,
        exportarExcel, getHistoryRecord
    };
}