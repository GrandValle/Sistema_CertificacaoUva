"use client";

import { useState, useEffect } from "react";
import {
    ManutencaoTabType, RegistroBalanca, RegistroReparo, InspecaoChecklist,
    COMPLIANCE_MANUTENCAO, BALANCAS_OFICIAIS
} from "../model/manutencaoModel";
import { exportManutencaoToExcel } from "../services/excelFormatter";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import { getHojeLocal } from "../../../utils/date";
import { salvarDocumento } from "../../../services/api";

interface ManutencaoPersistedState {
    frequencia?: string;
    balancasLogs?: RegistroBalanca[];
    reparosLogs?: unknown[];
    inspecoesSemanais?: InspecaoChecklist[];
    inspecoesMensais?: InspecaoChecklist[];
    semanalExpandido?: number | null;
    mensalExpandido?: number | null;
}

const createEmptyReparo = (id: number): RegistroReparo => ({
    id,
    data: "",
    equipamento: "",
    servico: "Manutenção",
    solicitante: null,
    solicitadaPor: null,
    confirmacaoLimpeza: null,
    responsavel: null,
    supervisor: null,
    acaoCorretiva: "",
    frequencia: "Mensal"
});

const normalizeReparo = (raw: any): RegistroReparo => ({
    id: typeof raw?.id === "number" ? raw.id : Date.now(),
    data: raw?.data ?? "",
    equipamento: raw?.equipamento ?? "",
    servico: typeof raw?.servico === "string" ? raw.servico : "Manutenção",
    solicitante: raw?.solicitante ?? null,
    solicitadaPor: raw?.solicitadaPor ?? null,
    confirmacaoLimpeza: raw?.confirmacaoLimpeza === "SIM" || raw?.confirmacaoLimpeza === "NÃO" ? raw.confirmacaoLimpeza : null,
    responsavel: raw?.responsavel ?? null,
    supervisor: raw?.supervisor ?? null,
    acaoCorretiva: raw?.acaoCorretiva ?? "",
    frequencia: "Mensal"
});

const getHojeYMD = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export function useManutencaoController() {
    const getSavedState = (): ManutencaoPersistedState | null => {
        if (typeof window === "undefined") return null;
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.manutencao);
            return saved ? (JSON.parse(saved) as ManutencaoPersistedState) : null;
        } catch {
            return null;
        }
    };

    const savedState = getSavedState();

    const [activeTab, setActiveTab] = useState<ManutencaoTabType>("checklist");
    const [freqChecklist, setFreqChecklist] = useState<"Semanal" | "Mensal">("Semanal");
    const [frequencia, setFrequencia] = useState<string>(() => savedState?.frequencia ?? "Diário");

    const defaultBalancasStr = BALANCAS_OFICIAIS.join(", ");

    // 🟢 1 LINHA POR DIA COM A STRING COMPLETA DAS BALANÇAS
    const [balancasLogs, setBalancasLogs] = useState<RegistroBalanca[]>(() => {
        if (savedState?.balancasLogs && savedState.balancasLogs.length > 0) {
            return savedState.balancasLogs;
        }
        return [{
            id: Date.now(),
            dataCalibracao: getHojeYMD(),
            balancasVerificadas: defaultBalancasStr,
            quantidadeMedida: "500",
            houveVariacao: "NÃO",
            quantidadeVariacao: "",
            balancaComDesvio: "",
            acaoCorretiva: "",
            responsavel: null
        }];
    });
    const [reparosLogs, setReparosLogs] = useState<RegistroReparo[]>(
        () => Array.isArray(savedState?.reparosLogs) && savedState.reparosLogs.length > 0
            ? savedState.reparosLogs.map(normalizeReparo)
            : [createEmptyReparo(1)]
    );

    const [inspecoesSemanais, setInspecoesSemanais] = useState<InspecaoChecklist[]>(
        () => savedState?.inspecoesSemanais && savedState.inspecoesSemanais.length > 0
            ? savedState.inspecoesSemanais
            : [{ id: 1, data: "", respostas: {}, acaoCorretiva: "", responsavel: null }]
    );
    const [inspecoesMensais, setInspecoesMensais] = useState<InspecaoChecklist[]>(
        () => savedState?.inspecoesMensais && savedState.inspecoesMensais.length > 0
            ? savedState.inspecoesMensais
            : [{ id: 2, data: "", respostas: {}, acaoCorretiva: "", responsavel: null }]
    );

    const [semanalExpandido, setSemanalExpandido] = useState<number | null>(
        () => typeof savedState?.semanalExpandido === "number" ? savedState.semanalExpandido : (inspecoesSemanais[0]?.id ?? null)
    );
    const [mensalExpandido, setMensalExpandido] = useState<number | null>(
        () => typeof savedState?.mensalExpandido === "number" ? savedState.mensalExpandido : (inspecoesMensais[0]?.id ?? null)
    );

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.manutencao, JSON.stringify({
            frequencia, balancasLogs, reparosLogs, inspecoesSemanais, inspecoesMensais, semanalExpandido, mensalExpandido
        }));
    }, [frequencia, balancasLogs, reparosLogs, inspecoesSemanais, inspecoesMensais, semanalExpandido, mensalExpandido]);

    const addBalancaRow = () => setBalancasLogs([
        {
            id: Date.now(),
            dataCalibracao: getHojeYMD(),
            balancasVerificadas: defaultBalancasStr,
            quantidadeMedida: "500",
            houveVariacao: "NÃO",
            quantidadeVariacao: "",
            balancaComDesvio: "",
            acaoCorretiva: "",
            responsavel: null
        },
        ...balancasLogs
    ]);

    const updateBalancaRow = (id: number, field: keyof RegistroBalanca, value: any) => {
        setBalancasLogs(balancasLogs.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: value };
                if (field === "houveVariacao" && value === "NÃO") {
                    updated.quantidadeVariacao = "";
                    updated.balancaComDesvio = "";
                    updated.acaoCorretiva = "";
                }
                return updated;
            }
            return r;
        }));
    };

    const removeBalancaRow = (id: number) => setBalancasLogs(balancasLogs.filter(r => r.id !== id));

    const addReparoRow = () => setReparosLogs([createEmptyReparo(Date.now()), ...reparosLogs]);
    const updateReparoRow = (id: number, field: keyof RegistroReparo, value: any) => setReparosLogs(reparosLogs.map(r => r.id === id ? { ...r, [field]: value } : r));
    const removeReparoRow = (id: number) => setReparosLogs(reparosLogs.filter(r => r.id !== id));

    const addSemanal = () => {
        const newId = Date.now();
        setInspecoesSemanais(prev => [{ id: newId, data: "", respostas: {}, acaoCorretiva: "", responsavel: null }, ...prev]);
        setSemanalExpandido(newId);
    };
    const removeSemanal = (id: number) => {
        setInspecoesSemanais(prev => {
            const next = prev.filter(r => r.id !== id);
            setSemanalExpandido(current => current !== id ? current : next.length > 0 ? next[0].id : null);
            return next;
        });
    };
    const updateSemanal = (id: number, field: keyof InspecaoChecklist, value: any) => setInspecoesSemanais(inspecoesSemanais.map(r => r.id === id ? { ...r, [field]: value } : r));
    const toggleSemanalResposta = (id: number, index: number) => {
        setInspecoesSemanais(inspecoesSemanais.map(r => {
            if (r.id === id) {
                const current = r.respostas[index];
                return { ...r, respostas: { ...r.respostas, [index]: current === "SIM" ? "NÃO" : current === "NÃO" ? null : "SIM" } };
            }
            return r;
        }));
    };

    const addMensal = () => {
        const newId = Date.now();
        setInspecoesMensais(prev => [{ id: newId, data: "", respostas: {}, acaoCorretiva: "", responsavel: null }, ...prev]);
        setMensalExpandido(newId);
    };
    const removeMensal = (id: number) => {
        setInspecoesMensais(prev => {
            const next = prev.filter(r => r.id !== id);
            setMensalExpandido(current => current !== id ? current : next.length > 0 ? next[0].id : null);
            return next;
        });
    };
    const updateMensal = (id: number, field: keyof InspecaoChecklist, value: any) => setInspecoesMensais(inspecoesMensais.map(r => r.id === id ? { ...r, [field]: value } : r));
    const toggleMensalResposta = (id: number, index: number) => {
        setInspecoesMensais(inspecoesMensais.map(r => {
            if (r.id === id) {
                const current = r.respostas[index];
                return { ...r, respostas: { ...r.respostas, [index]: current === "SIM" ? "NÃO" : current === "NÃO" ? null : "SIM" } };
            }
            return r;
        }));
    };

    const exportarExcel = async () => {
        try {
            const now = new Date();
            const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const hojeData = getHojeLocal();

            let tipoNome = "";
            let freqNome = "";
            let codigoDoc = "";

            if (activeTab === "checklist") {
                tipoNome = freqChecklist === "Semanal" ? "Checklist Semanal" : "Checklist Mensal";
                freqNome = freqChecklist;
                codigoDoc = COMPLIANCE_MANUTENCAO.pops.checklist;
            } else if (activeTab === "reparos") {
                tipoNome = "Reparos e Manutenções";
                freqNome = reparosLogs[0]?.frequencia || "Mensal";
                codigoDoc = COMPLIANCE_MANUTENCAO.pops.reparos;
            } else if (activeTab === "balancas") {
                tipoNome = "Aferição de Balanças";
                freqNome = frequencia || "Diário";
                codigoDoc = COMPLIANCE_MANUTENCAO.pops.balancas;
            }

            const excelBlob = await exportManutencaoToExcel({
                activeTab,
                frequencia: frequencia as any,
                freqChecklist,
                balancasLogs,
                reparosLogs,
                inspecoesSemanais,
                inspecoesMensais
            });

            let dadosManutencao = {};
            if (activeTab === "checklist") {
                dadosManutencao = { frequencia: freqChecklist, logs: freqChecklist === "Semanal" ? inspecoesSemanais : inspecoesMensais };
            } else if (activeTab === "reparos") {
                dadosManutencao = { logs: reparosLogs };
            } else if (activeTab === "balancas") {
                dadosManutencao = { frequencia, logs: balancasLogs };
            }

            const dadosDoBanco = {
                popCode: codigoDoc,
                titulo: tipoNome,
                mes: mesAtual,
                tipo: tipoNome,
                frequencia: freqNome,
                dadosManutencao: dadosManutencao
            };

            await salvarDocumento(
                "manutencao_calibracao",
                dadosDoBanco,
                excelBlob as Blob,
                `Manutencao_${tipoNome.replace(/\s+/g, '_')}_${hojeData}.xlsx`
            );

            if (activeTab === "checklist") {
                if (freqChecklist === "Semanal") {
                    setInspecoesSemanais([{ id: Date.now(), data: "", respostas: {}, acaoCorretiva: "", responsavel: null }]);
                    setSemanalExpandido(null);
                } else {
                    setInspecoesMensais([{ id: Date.now(), data: "", respostas: {}, acaoCorretiva: "", responsavel: null }]);
                    setMensalExpandido(null);
                }
            } else if (activeTab === "reparos") {
                setReparosLogs([createEmptyReparo(Date.now())]);
            } else if (activeTab === "balancas") {
                setBalancasLogs([{
                    id: Date.now(),
                    dataCalibracao: getHojeYMD(),
                    balancasVerificadas: defaultBalancasStr,
                    quantidadeMedida: "500",
                    houveVariacao: "NÃO",
                    quantidadeVariacao: "",
                    balancaComDesvio: "",
                    acaoCorretiva: "",
                    responsavel: null
                }]);
            }

            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("historicoAtualizado"));

            alert(`Registro de ${tipoNome} salvo no banco de dados com sucesso! 🛠️`);
        } catch (error) {
            console.error("Erro ao salvar no banco:", error);
            alert("Ocorreu um erro ao salvar o registro no banco de dados.");
        }
    };

    return {
        activeTab, setActiveTab, frequencia, setFrequencia,
        freqChecklist, setFreqChecklist,
        balancasLogs, addBalancaRow, updateBalancaRow, removeBalancaRow,
        reparosLogs, addReparoRow, updateReparoRow, removeReparoRow,
        inspecoesSemanais, addSemanal, removeSemanal, updateSemanal, toggleSemanalResposta, semanalExpandido, setSemanalExpandido,
        inspecoesMensais, addMensal, removeMensal, updateMensal, toggleMensalResposta, mensalExpandido, setMensalExpandido,
        exportarExcel
    };
}