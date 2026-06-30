"use client";

import { useState, useEffect } from "react";
import {
    CQTabType, VidrosLog, PragaGridCell, PragasLog, InusuaisLog,
    VIDROS_ITEMS, PRAGAS_SETORES, PRAGAS_COLUNAS
} from "../model/controleQualidadeModel";
import { STORAGE_KEYS } from "../../../constants/storageKeys";

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
        rejeitosLogs?: any[];
        colunasPragas?: string[];
        setoresPragas?: string[];
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

    // --- Estados existentes ---
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
                id: 1, data: new Date().toISOString().split('T')[0], descricao: "", status: "pendente", acaoCorretiva: "", respCorrecao: null, respPacking: null
            }]
    );
    const [rejeitosLogs, setRejeitosLogs] = useState<any[]>(() => savedState?.rejeitosLogs || []);

    // 🔥 NOVOS ESTADOS: listas dinâmicas
    const [colunasPragas, setColunasPragas] = useState<string[]>(() => {
        if (savedState?.colunasPragas && savedState.colunasPragas.length > 0) {
            return savedState.colunasPragas;
        }
        const base = PRAGAS_COLUNAS.filter((col: string) => col.toUpperCase() !== "OUTROS");
        if (!base.some(c => c.toUpperCase().includes("QUANTIDADE"))) {
            base.push("Quantidade Encontrada");
        }
        return base;
    });

    const [setoresPragas, setSetoresPragas] = useState<string[]>(() => {
        return savedState?.setoresPragas && savedState.setoresPragas.length > 0
            ? savedState.setoresPragas
            : [...PRAGAS_SETORES];
    });

    // Persistência no localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.controleQualidade, JSON.stringify({
            vidrosLogs, vidrosDate, vidrosMonitor, vidrosResp, vidrosObs,
            pragasLogs, inusuaisLogs, rejeitosLogs,
            colunasPragas, setoresPragas
        }));
    }, [vidrosLogs, vidrosDate, vidrosMonitor, vidrosResp, vidrosObs, pragasLogs, inusuaisLogs, rejeitosLogs, colunasPragas, setoresPragas]);

    // --- Funções Vidros ---
    const updateVidro = <K extends keyof VidrosLog>(id: number, field: K, value: VidrosLog[K]) => {
        setVidrosLogs(vidrosLogs.map(log => {
            if (log.id === id) {
                if (field === 'conforme' && log.conforme === value) return { ...log, [field]: null };
                return { ...log, [field]: value };
            }
            return log;
        }));
    };

    // --- Funções Pragas (logs) ---
    const addPragaLog = () => {
        const newGrid: PragaGridCell = {};
        setoresPragas.forEach(s => {
            colunasPragas.forEach(c => {
                const cUpper = c.toUpperCase();
                if (cUpper.includes("ARMADILHA") || cUpper.includes("QUANTIDADE")) {
                    newGrid[`${s}_${c}`] = "";
                } else {
                    newGrid[`${s}_${c}`] = "SIM";
                }
            });
        });
        setPragasLogs([{ id: Date.now(), data: new Date().toISOString().split('T')[0], monitor: null, grid: newGrid, acaoCorretiva: "" }, ...pragasLogs]);
    };

    const updatePragaLog = <K extends keyof PragasLog>(id: number, field: K, value: PragasLog[K]) => setPragasLogs(pragasLogs.map(log => log.id === id ? { ...log, [field]: value } : log));
    const updatePragaGrid = (logId: number, setor: string, coluna: string, value: string) => setPragasLogs(pragasLogs.map(log => log.id === logId ? { ...log, grid: { ...log.grid, [`${setor}_${coluna}`]: value } } : log));
    const removePragaLog = (id: number) => setPragasLogs(pragasLogs.filter(p => p.id !== id));

    // 🔥 Funções para manipular listas dinâmicas
    const adicionarPraga = (praga: string) => {
        const pragaUpper = praga.toUpperCase().trim();
        if (pragaUpper && !colunasPragas.some((c: string) => c.toUpperCase() === pragaUpper)) {
            const novasColunas = [...colunasPragas];
            const insertIndex = novasColunas.findIndex((c: string) =>
                c.toUpperCase().includes("ARMADILHA") || c.toUpperCase().includes("QUANTIDADE")
            );
            if (insertIndex !== -1) novasColunas.splice(insertIndex, 0, pragaUpper);
            else novasColunas.push(pragaUpper);
            setColunasPragas(novasColunas);

            // Atualiza grids existentes
            setPragasLogs(prev => prev.map(log => {
                const newGrid = { ...log.grid };
                setoresPragas.forEach(setor => {
                    newGrid[`${setor}_${pragaUpper}`] = "SIM";
                });
                return { ...log, grid: newGrid };
            }));
        }
    };

    const removerPraga = (praga: string) => {
        const pragaUpper = praga.toUpperCase().trim();
        if (window.confirm(`Remover a praga "${pragaUpper}"?`)) {
            setColunasPragas(colunasPragas.filter((p: string) => p !== pragaUpper));
            setPragasLogs(prev => prev.map(log => {
                const newGrid = { ...log.grid };
                setoresPragas.forEach(setor => {
                    delete newGrid[`${setor}_${pragaUpper}`];
                });
                return { ...log, grid: newGrid };
            }));
        }
    };

    const adicionarSetor = (setor: string) => {
        const setorTrim = setor.trim();
        if (setorTrim && !setoresPragas.includes(setorTrim)) {
            setSetoresPragas([...setoresPragas, setorTrim]);
            setPragasLogs(prev => prev.map(log => {
                const newGrid = { ...log.grid };
                colunasPragas.forEach(col => {
                    const colUpper = col.toUpperCase();
                    if (colUpper.includes("ARMADILHA") || colUpper.includes("QUANTIDADE")) {
                        newGrid[`${setorTrim}_${col}`] = "";
                    } else {
                        newGrid[`${setorTrim}_${col}`] = "SIM";
                    }
                });
                return { ...log, grid: newGrid };
            }));
        }
    };

    const removerSetor = (setor: string) => {
        if (window.confirm(`Remover o setor "${setor}"?`)) {
            setSetoresPragas(setoresPragas.filter((s: string) => s !== setor));
            setPragasLogs(prev => prev.map(log => {
                const newGrid = { ...log.grid };
                colunasPragas.forEach(col => {
                    delete newGrid[`${setor}_${col}`];
                });
                return { ...log, grid: newGrid };
            }));
        }
    };

    // --- Funções Inusuais ---
    const addInusualLog = () => setInusuaisLogs([{ id: Date.now(), data: new Date().toISOString().split('T')[0], descricao: "", status: "pendente", acaoCorretiva: "", respCorrecao: null, respPacking: null }, ...inusuaisLogs]);
    const updateInusualLog = <K extends keyof InusuaisLog>(id: number, field: K, value: InusuaisLog[K]) => setInusuaisLogs(inusuaisLogs.map(log => log.id === id ? { ...log, [field]: value } : log));
    const removeInusualLog = (id: number) => setInusuaisLogs(inusuaisLogs.filter(log => log.id !== id));

    // --- Funções Rejeitos ---
    const addRejeitoRow = () => {
        setRejeitosLogs([...rejeitosLogs, {
            id: Date.now(),
            produto: "", quantidade: "", localDestino: "", dataRetencao: "", responsavelRetencao: null,
            dataSaida: "", responsavelRejeitados: null,
            naoConformidade: "", acaoCorretiva: ""
        }]);
    };
    const updateRejeitoRow = (id: number, field: string, value: any) => {
        setRejeitosLogs(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const removeRejeitoRow = (id: number) => {
        setRejeitosLogs(prev => prev.filter(item => item.id !== id));
    };

    // --- Histórico ---
    const getHistoryRecord = () => {
        const now = new Date();
        const tabNameMap: Record<CQTabType, string> = { vidros: "Vidros", pragas: "Pragas", inusuais: "Inusuais", rejeitos: "Rejeitos" };
        let totalItems = 0;
        if (activeTab === "vidros") totalItems = vidrosLogs.length;
        if (activeTab === "pragas") totalItems = pragasLogs.length;
        if (activeTab === "inusuais") totalItems = inusuaisLogs.length;
        if (activeTab === "rejeitos") totalItems = rejeitosLogs.length;
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

    // --- Exportação ---
    const exportarExcel = async () => {
        try {
            console.log("Gerando arquivo Excel de Controle de Qualidade...");
            const now = new Date();
            const mesAtual = now.toISOString().slice(0, 7);
            const tabNameMap: Record<CQTabType, string> = { vidros: "Vidros", pragas: "Pragas", inusuais: "Inusuais", rejeitos: "Rejeitos" };
            const docCodeMap: Record<CQTabType, string> = { vidros: "PHU-022", pragas: "PHU-024", inusuais: "PHU-025", rejeitos: "PHU-026" };

            const excelBlob = await exportControleQualidadeToExcel({
                activeTab,
                vidrosDate,
                vidrosMonitor,
                vidrosResp,
                vidrosObs,
                vidrosLogs,
                pragasLogs,
                inusuaisLogs,
                rejeitosLogs,
                pragasColunas: colunasPragas,
                pragasSetores: setoresPragas,
                responsavel: pragasLogs[0]?.monitor || null,
            });

            // ... resto (salvar documento, limpar estado, etc.)
            // (mantenha o código que você já tem para salvar e limpar)

            let dadosQualidade = {};
            if (activeTab === "vidros") dadosQualidade = { vidrosDate, vidrosMonitor, vidrosResp, vidrosObs, vidrosLogs };
            if (activeTab === "pragas") dadosQualidade = { pragasLogs };
            if (activeTab === "inusuais") dadosQualidade = { inusuaisLogs };
            if (activeTab === "rejeitos") dadosQualidade = { rejeitosLogs };

            const dadosDoBanco = {
                popCode: docCodeMap[activeTab],
                titulo: `Qualidade - ${tabNameMap[activeTab]}`,
                mes: mesAtual,
                aba: tabNameMap[activeTab],
                setor: tabNameMap[activeTab],
                status: "completo",
                dadosQualidade: dadosQualidade
            };

            await salvarDocumento("controle_qualidade", dadosDoBanco, excelBlob as Blob, `Qualidade_${activeTab}_${now.getTime()}.xlsx`);

            // Limpar aba
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
                    setRejeitosLogs([]);
                    break;
            }

            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("historicoAtualizado"));

            alert(`Registro de ${tabNameMap[activeTab]} exportado e salvo com sucesso! 🍇`);
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
        colunasPragas, setColunasPragas,
        setoresPragas, setSetoresPragas,
        adicionarPraga, removerPraga, adicionarSetor, removerSetor,
        exportarExcel, getHistoryRecord
    };
}