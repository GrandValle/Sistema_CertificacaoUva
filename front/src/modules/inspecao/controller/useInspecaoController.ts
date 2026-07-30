"use client";

import { useState, useEffect } from "react";
import {
    PRE_OP_ITEMS_DATA,
    WEEK_DAYS,
    PreOpItem,
    ActionPlan,
    ForeignObjectLog,
    SegurancaTransporteItem,
    CleaningLog,
    FOREIGN_OBJECT_LOCATIONS,
    criarSegurancaTransportePadrao,
    ITENS_SEGURANCA_TRANSPORTE,
} from "../model/inspecaoModel";
import { exportInspecaoToExcel } from "../services/excelFormatter";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import { salvarDocumento } from "../../../services/api";
import { getHojeLocal } from "../../../utils/date";

export type TabType = "pre_inspecao" | "transporte" | "objetos_estranhos";

interface InspecaoPersistedState {
    preOpInfo?: { week: string; coordinator: string | null; area: string; observacaoGeral?: string };
    preOpData?: PreOpItem[];
    actionPlans?: ActionPlan[];
    cleaningLogs?: CleaningLog[];
    foreignObjectLogs?: ForeignObjectLog[];
    observacoesGerais?: string[];
    segurancaLogs?: SegurancaTransporteItem[];
}

export function useInspecaoController() {
    const [activeTab, setActiveTab] = useState<TabType>("pre_inspecao");
    const [isInitialized, setIsInitialized] = useState(false);

    const getSavedState = (): InspecaoPersistedState | null => {
        if (typeof window === "undefined") return null;
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.inspecao);
            return saved ? (JSON.parse(saved) as InspecaoPersistedState) : null;
        } catch {
            return null;
        }
    };

    const [preOpInfo, setPreOpInfo] = useState({
        week: "",
        coordinator: null as string | null,
        area: "Packing Uva",
        observacaoGeral: "",
    });

    const [preOpData, setPreOpData] = useState<PreOpItem[]>(
        () =>
            PRE_OP_ITEMS_DATA.map((item) => ({
                ...item,
                checks: WEEK_DAYS.reduce((acc, day) => ({ ...acc, [day.short]: null }), {}),
            }))
    );

    const [actionPlans, setActionPlans] = useState<ActionPlan[]>([
        {
            id: 1,
            date: "",
            item: "",
            naoConformidade: "",
            causaRaiz: "",
            acaoCorretiva: "",
            responsavel: null,
        },
    ]);

    const [foreignObjectLogs, setForeignObjectLogs] = useState<ForeignObjectLog[]>([
        {
            id: 8,
            date: "",
            time: "",
            location: FOREIGN_OBJECT_LOCATIONS[0],
            status: null,
            foundObject: "",
            correctiveAction: "",
            responsible: null,
        },
    ]);

    const [observacoesGerais, setObservacoesGerais] = useState<string[]>([]);

    // 🔥 INSPEÇÃO DE SEGURANÇA (Estado antigo mantido por precaução)
    const [segurancaLogs, setSegurancaLogs] = useState<SegurancaTransporteItem[]>(() => {
        const saved = getSavedState();
        if (saved?.segurancaLogs && saved.segurancaLogs.length === ITENS_SEGURANCA_TRANSPORTE.length) {
            return saved.segurancaLogs;
        }
        return criarSegurancaTransportePadrao();
    });

    useEffect(() => {
        const savedState = getSavedState();
        if (savedState) {
            if (savedState.preOpInfo) {
                setPreOpInfo({
                    week: savedState.preOpInfo.week || "",
                    coordinator: savedState.preOpInfo.coordinator || null,
                    area: savedState.preOpInfo.area || "Packing Uva",
                    observacaoGeral: savedState.preOpInfo.observacaoGeral || "",
                });
            }
            if (savedState.preOpData?.length) setPreOpData(savedState.preOpData);
            if (savedState.actionPlans?.length) setActionPlans(savedState.actionPlans);
            if (savedState.foreignObjectLogs?.length) setForeignObjectLogs(savedState.foreignObjectLogs);
            if (savedState.segurancaLogs?.length === ITENS_SEGURANCA_TRANSPORTE.length) {
                setSegurancaLogs(savedState.segurancaLogs);
            }
            if (savedState.observacoesGerais && Array.isArray(savedState.observacoesGerais)) {
                setObservacoesGerais(savedState.observacoesGerais);
            } else if (savedState.preOpInfo?.observacaoGeral && savedState.preOpInfo.observacaoGeral.trim() !== "") {
                setObservacoesGerais([savedState.preOpInfo.observacaoGeral]);
            }
        }
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        if (!isInitialized) return;

        localStorage.setItem(STORAGE_KEYS.inspecao, JSON.stringify({
            preOpInfo,
            preOpData,
            actionPlans,
            foreignObjectLogs,
            observacoesGerais,
            segurancaLogs,
        }));
    }, [
        preOpInfo,
        preOpData,
        actionPlans,
        foreignObjectLogs,
        observacoesGerais,
        segurancaLogs,
        isInitialized,
    ]);

    const addObservacaoGeral = () => setObservacoesGerais([...observacoesGerais, ""]);
    const removeObservacaoGeral = (index: number) => {
        if (observacoesGerais.length <= 1) {
            alert("É necessário manter pelo menos uma observação.");
            return;
        }
        setObservacoesGerais(observacoesGerais.filter((_, i) => i !== index));
    };
    const updateObservacaoGeral = (index: number, value: string) => {
        const novo = [...observacoesGerais];
        novo[index] = value;
        setObservacoesGerais(novo);
    };

    const togglePreOp = (idx: number, day: string) => {
        const newData = [...preOpData];
        const current = newData[idx].checks[day];
        newData[idx].checks[day] = current === null ? "C" : current === "C" ? "NC" : null;
        setPreOpData(newData);
    };

    const addActionRow = () =>
        setActionPlans([
            ...actionPlans,
            { id: Date.now(), date: "", item: "", naoConformidade: "", causaRaiz: "", acaoCorretiva: "", responsavel: null },
        ]);

    const updateAction = <K extends keyof ActionPlan>(idx: number, field: K, value: ActionPlan[K]) => {
        setActionPlans((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    const removeActionRow = (id: number) => setActionPlans(actionPlans.filter((a) => a.id !== id));

    const addForeignObjectRow = (location?: string) =>
        setForeignObjectLogs([
            ...foreignObjectLogs,
            { id: Date.now(), date: "", time: "", location: location ?? FOREIGN_OBJECT_LOCATIONS[0], status: null, foundObject: "", correctiveAction: "", responsible: null },
        ]);

    const updateForeignObject = <K extends keyof ForeignObjectLog>(idx: number, field: K, value: ForeignObjectLog[K]) => {
        setForeignObjectLogs((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    const removeForeignObjectRow = (id: number) => setForeignObjectLogs(foreignObjectLogs.filter((r) => r.id !== id));

    const toggleSegurancaConforme = (idx: number, value: boolean) => {
        setSegurancaLogs((prev) => {
            const novo = [...prev];
            novo[idx] = { ...novo[idx], conforme: novo[idx].conforme === value ? null : value };
            return novo;
        });
    };

    const updateSegurancaObservacao = (idx: number, value: string) => {
        setSegurancaLogs((prev) => {
            const novo = [...prev];
            novo[idx] = { ...novo[idx], observacao: value };
            return novo;
        });
    };

    const updateSegurancaAcao = (idx: number, value: string) => {
        setSegurancaLogs((prev) => {
            const novo = [...prev];
            novo[idx] = { ...novo[idx], acaoCorretiva: value };
            return novo;
        });
    };

    // ================================================================
    // EXPORTAÇÃO E LIMPEZA AUTOMÁTICA
    // ================================================================
    const exportarExcel = async (
        selectedForeignSector?: string,
        // 🔥 Aceitamos "todasColunas" vindo da tela de Transporte
        segurancaData?: { logs?: any[]; metadados?: any; todasColunas?: any[] }
    ) => {
        try {
            const now = new Date();

            const foreignRowsToExport =
                activeTab === "objetos_estranhos" && selectedForeignSector
                    ? foreignObjectLogs.filter((row) => row.location === selectedForeignSector)
                    : foreignObjectLogs;

            const observacaoGeral = observacoesGerais.length > 0
                ? observacoesGerais.filter((o) => o.trim() !== "").join("; ")
                : preOpInfo.observacaoGeral || "";

            const excelBlob = await exportInspecaoToExcel({
                activeTabParam: activeTab,
                subTabTransporte: "seguranca",
                preOpInfo,
                preOpData,
                actionPlans,
                currentCleaningLogs: [],
                selectedCleaningProduct: "",
                objetosEstranhosLogs: foreignRowsToExport,
                observacaoGeral,
                observacoesGerais,
                // Passamos as colunas montadas na tela para o Excel
                todasColunasTransporte: activeTab === "transporte" ? segurancaData?.todasColunas : undefined,
            });

            const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
            const hojeData = getHojeLocal();

            const tabNameMap: Record<TabType, string> = {
                pre_inspecao: "Pré-Inspeção",
                transporte: "Transporte",
                objetos_estranhos: "Objetos Estranhos",
            };

            const docCodeMap: Record<TabType, string> = {
                pre_inspecao: "2.11.7",
                transporte: "PHU-031",
                objetos_estranhos: "PHU-033",
            };

            let dadosInspecao = {};
            if (activeTab === "pre_inspecao") {
                dadosInspecao = { preOpInfo, preOpData, actionPlans, observacaoGeral, observacoesGerais };
            } else if (activeTab === "transporte") {
                dadosInspecao = {
                    todasColunas: segurancaData?.todasColunas || []
                };
            } else if (activeTab === "objetos_estranhos") {
                dadosInspecao = { foreignObjectLogs: foreignRowsToExport };
            }

            const dadosDoBanco = {
                popCode: docCodeMap[activeTab],
                titulo: `Inspeção - ${tabNameMap[activeTab]}`,
                mes: mesAtual,
                aba: tabNameMap[activeTab],
                setor: activeTab === "objetos_estranhos" && selectedForeignSector ? selectedForeignSector : tabNameMap[activeTab],
                dadosInspecao,
            };

            await salvarDocumento(
                "inspecao_operacional",
                dadosDoBanco,
                excelBlob as Blob,
                `Inspecao_${activeTab}_${hojeData}.xlsx`
            );

            // 🔥 LIMPEZA DA ABA APÓS EXPORTAÇÃO
            if (activeTab === "pre_inspecao") {
                setPreOpInfo({ week: "", coordinator: null, area: "Packing Uva", observacaoGeral: "" });
                setPreOpData(
                    PRE_OP_ITEMS_DATA.map((item) => ({
                        ...item,
                        checks: WEEK_DAYS.reduce((acc, day) => ({ ...acc, [day.short]: null }), {}),
                    }))
                );
                setActionPlans([{ id: Date.now(), date: "", item: "", naoConformidade: "", causaRaiz: "", acaoCorretiva: "", responsavel: null }]);
                setObservacoesGerais([]);
            } else if (activeTab === "transporte") {
                setSegurancaLogs(criarSegurancaTransportePadrao());
            } else if (activeTab === "objetos_estranhos") {
                if (selectedForeignSector) {
                    setForeignObjectLogs((prev) => prev.filter((row) => row.location !== selectedForeignSector));
                } else {
                    setForeignObjectLogs([
                        { id: Date.now(), date: "", time: "", location: FOREIGN_OBJECT_LOCATIONS[0], status: null, foundObject: "", correctiveAction: "", responsible: null },
                    ]);
                }
            }

            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("historicoAtualizado"));
            alert(`Registro de ${tabNameMap[activeTab]} exportado, salvo e limpo com sucesso!`);
        } catch (error) {
            console.error("Erro ao exportar e salvar:", error);
            alert("Ocorreu um erro ao enviar para o servidor. Verifique o console.");
        }
    };

    return {
        activeTab, setActiveTab,
        preOpInfo, setPreOpInfo,
        preOpData, togglePreOp,
        actionPlans, addActionRow, updateAction, removeActionRow,
        foreignObjectLogs, FOREIGN_OBJECT_LOCATIONS, addForeignObjectRow, updateForeignObject, removeForeignObjectRow,
        exportarExcel,
        observacoesGerais, addObservacaoGeral, removeObservacaoGeral, updateObservacaoGeral,
        segurancaLogs, toggleSegurancaConforme, updateSegurancaObservacao, updateSegurancaAcao,
    };
}