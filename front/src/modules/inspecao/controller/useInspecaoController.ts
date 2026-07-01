"use client";

import { useState, useEffect } from "react";
import { PRE_OP_ITEMS_DATA, WEEK_DAYS, PreOpItem, ActionPlan, PRODUTOS_LIMPEZA, FOREIGN_OBJECT_LOCATIONS, ForeignObjectLog } from "../model/inspecaoModel"; // <-- importa PRODUTOS_LIMPEZA
import { exportInspecaoToExcel } from "../services/excelFormatter";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import { salvarDocumento } from "../../../services/api";

export type TabType = "pre_inspecao" | "transporte" | "embalagem" | "limpeza" | "objetos_estranhos";

export interface TransportLog {
    id: number; date: string; bauLimpo: "C" | "NC" | null; semOdor: "C" | "NC" | null;
    livreAnimais: "C" | "NC" | null; contentorLimpo: "C" | "NC" | null; monitor: string | null;
}

export interface PackagingLog {
    id: number; date: string; materialType: string; quantity: string; lote: string; validity: string;
    livrePragas: "C" | "NC" | null; embalagemFechada: "C" | "NC" | null; qualidadeConforme: "C" | "NC" | null;
    obs: string; responsavel: string | null;
}

export interface CleaningLog {
    id: number; date: string; product: string;
    produtoCorreto: "Sim" | "Não" | null; composicaoOk: "Sim" | "Não" | null;
    embalagemOk: "Sim" | "Não" | null; padraoExigido: "Sim" | "Não" | null;
    cumprePedido: "Sim" | "Não" | null; responsavel: string | null;
}

interface InspecaoPersistedState {
    preOpInfo?: { week: string; coordinator: string | null; area: string };
    preOpData?: PreOpItem[];
    actionPlans?: ActionPlan[];
    transportLogs?: TransportLog[];
    packagingLogs?: PackagingLog[];
    cleaningLogs?: CleaningLog[];
    foreignObjectLogs?: ForeignObjectLog[];
}

// REMOVA a linha: export const CLEANING_PRODUCTS = ["Primmax Sanclor"];

export function useInspecaoController() {
    const [activeTab, setActiveTab] = useState<TabType>("pre_inspecao");
    const [isInitialized, setIsInitialized] = useState(false); // <-- NOVO CONTROLE

    const getSavedState = (): InspecaoPersistedState | null => {
        if (typeof window === "undefined") return null;
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.inspecao);
            return saved ? (JSON.parse(saved) as InspecaoPersistedState) : null;
        } catch {
            return null;
        }
    };

    // 1. INICIALIZAMOS OS ESTADOS VAZIOS/PADRÃO (Sem olhar o localStorage ainda)
    const [preOpInfo, setPreOpInfo] = useState({ week: "", coordinator: null as string | null, area: "Packing Uva" });
    const [preOpData, setPreOpData] = useState<PreOpItem[]>(
        () => PRE_OP_ITEMS_DATA.map(item => ({ ...item, checks: WEEK_DAYS.reduce((acc, day) => ({ ...acc, [day.short]: null }), {}) }))
    );
    const [actionPlans, setActionPlans] = useState<ActionPlan[]>([{ id: 1, date: "", item: "", naoConformidade: "", causaRaiz: "", acaoCorretiva: "", responsavel: null }]);

    const [transportLogs, setTransportLogs] = useState<TransportLog[]>([
        { id: 1, date: "", bauLimpo: null, semOdor: null, livreAnimais: null, contentorLimpo: null, monitor: null },
        { id: 2, date: "", bauLimpo: null, semOdor: null, livreAnimais: null, contentorLimpo: null, monitor: null },
        { id: 3, date: "", bauLimpo: null, semOdor: null, livreAnimais: null, contentorLimpo: null, monitor: null }
    ]);

    const [packagingLogs, setPackagingLogs] = useState<PackagingLog[]>([
        { id: 4, date: "", materialType: "", quantity: "", lote: "", validity: "", livrePragas: null, embalagemFechada: null, qualidadeConforme: null, obs: "", responsavel: null },
        { id: 5, date: "", materialType: "", quantity: "", lote: "", validity: "", livrePragas: null, embalagemFechada: null, qualidadeConforme: null, obs: "", responsavel: null },
        { id: 6, date: "", materialType: "", quantity: "", lote: "", validity: "", livrePragas: null, embalagemFechada: null, qualidadeConforme: null, obs: "", responsavel: null }
    ]);

    const [selectedCleaningProduct, setSelectedCleaningProduct] = useState(PRODUTOS_LIMPEZA[0]);

    const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>([
        { id: 7, date: "", product: PRODUTOS_LIMPEZA[0], produtoCorreto: null, composicaoOk: null, embalagemOk: null, padraoExigido: null, cumprePedido: null, responsavel: null }
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
            responsible: null
        }
    ]);

    // 2. LÊ O LOCALSTORAGE APENAS NO CLIENTE APÓS A MONTAGEM
    useEffect(() => {
        const savedState = getSavedState();
        if (savedState) {
            if (savedState.preOpInfo) setPreOpInfo(savedState.preOpInfo);
            if (savedState.preOpData?.length) setPreOpData(savedState.preOpData);
            if (savedState.actionPlans?.length) setActionPlans(savedState.actionPlans);
            if (savedState.transportLogs?.length) setTransportLogs(savedState.transportLogs);
            if (savedState.packagingLogs?.length) setPackagingLogs(savedState.packagingLogs);
            if (savedState.cleaningLogs?.length) setCleaningLogs(savedState.cleaningLogs);
            if (savedState.foreignObjectLogs?.length) setForeignObjectLogs(savedState.foreignObjectLogs);
        }
        setIsInitialized(true); // Marca que já carregou
    }, []);

    // 3. SALVA NO LOCALSTORAGE (Mas só depois de carregar os dados!)
    useEffect(() => {
        if (!isInitialized) return; // <-- Evita que os valores em branco apaguem o localStorage!

        localStorage.setItem(STORAGE_KEYS.inspecao, JSON.stringify({
            preOpInfo, preOpData, actionPlans, transportLogs, packagingLogs, cleaningLogs, foreignObjectLogs
        }));
    }, [preOpInfo, preOpData, actionPlans, transportLogs, packagingLogs, cleaningLogs, foreignObjectLogs, isInitialized]);

    const togglePreOp = (idx: number, day: string) => { const newData = [...preOpData]; const current = newData[idx].checks[day]; newData[idx].checks[day] = current === null ? "C" : current === "C" ? "NC" : null; setPreOpData(newData); };
    const addActionRow = () => setActionPlans([...actionPlans, { id: Date.now(), date: "", item: "", naoConformidade: "", causaRaiz: "", acaoCorretiva: "", responsavel: null }]);
    const updateAction = <K extends keyof ActionPlan>(idx: number, field: K, value: ActionPlan[K]) => {
        setActionPlans((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };
    const removeActionRow = (id: number) => setActionPlans(actionPlans.filter(a => a.id !== id));

    const addTransportRow = () => setTransportLogs([...transportLogs, { id: Date.now(), date: "", bauLimpo: null, semOdor: null, livreAnimais: null, contentorLimpo: null, monitor: null }]);
    const updateTransport = <K extends keyof TransportLog>(idx: number, field: K, value: TransportLog[K]) => {
        setTransportLogs((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };
    const removeTransportRow = (id: number) => setTransportLogs(transportLogs.filter(l => l.id !== id));

    const addPackagingRow = () => setPackagingLogs([...packagingLogs, { id: Date.now(), date: "", materialType: "", quantity: "", lote: "", validity: "", livrePragas: null, embalagemFechada: null, qualidadeConforme: null, obs: "", responsavel: null }]);
    const updatePackaging = <K extends keyof PackagingLog>(idx: number, field: K, value: PackagingLog[K]) => {
        setPackagingLogs((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };
    const removePackagingRow = (id: number) => setPackagingLogs(packagingLogs.filter(p => p.id !== id));

    const addCleaningRow = () => {
        setCleaningLogs([...cleaningLogs, {
            id: Date.now(), date: "", product: selectedCleaningProduct,
            produtoCorreto: null, composicaoOk: null, embalagemOk: null, padraoExigido: null, cumprePedido: null, responsavel: null
        }]);
    };
    const updateCleaning = <K extends keyof CleaningLog>(id: number, field: K, value: CleaningLog[K]) => {
        setCleaningLogs(cleaningLogs.map(log => log.id === id ? { ...log, [field]: value } : log));
    };
    const removeCleaningRow = (id: number) => setCleaningLogs(cleaningLogs.filter(p => p.id !== id));

    const addForeignObjectRow = (location?: string) => setForeignObjectLogs([
        ...foreignObjectLogs,
        {
            id: Date.now(),
            date: "",
            time: "",
            location: location ?? FOREIGN_OBJECT_LOCATIONS[0],
            status: null,
            foundObject: "",
            correctiveAction: "",
            responsible: null
        }
    ]);

    const updateForeignObject = <K extends keyof ForeignObjectLog>(idx: number, field: K, value: ForeignObjectLog[K]) => {
        setForeignObjectLogs((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    const removeForeignObjectRow = (id: number) => setForeignObjectLogs(foreignObjectLogs.filter(r => r.id !== id));

    const exportarExcel = async (selectedForeignSector?: string) => {
        try {
            console.log("Gerando arquivo Excel da Inspeção...");
            const now = new Date();

            const foreignRowsToExport =
                activeTab === "objetos_estranhos" && selectedForeignSector
                    ? foreignObjectLogs.filter((row) => row.location === selectedForeignSector)
                    : foreignObjectLogs;

            const excelBlob = await exportInspecaoToExcel({
                activeTabParam: activeTab,
                preOpInfo,
                preOpData,
                actionPlans,
                transportLogs,
                packagingLogs,
                currentCleaningLogs: cleaningLogs,
                selectedCleaningProduct,
                objetosEstranhosLogs: foreignRowsToExport
            });

            const mesAtual = now.toISOString().slice(0, 7);
            const tabNameMap: Record<TabType, string> = {
                pre_inspecao: "Pré-Inspeção",
                transporte: "Transporte",
                embalagem: "Embalagem",
                limpeza: "Limpeza",
                objetos_estranhos: "Objetos Estranhos"
            };

            const docCodeMap: Record<TabType, string> = {
                pre_inspecao: "2.11.7",
                transporte: "PHU-031",
                embalagem: "PHU-032",
                limpeza: "PHU-036",
                objetos_estranhos: "PHU-033"
            };

            let dadosInspecao = {};
            if (activeTab === "pre_inspecao") dadosInspecao = { preOpInfo, preOpData, actionPlans };
            if (activeTab === "transporte") dadosInspecao = { transportLogs };
            if (activeTab === "embalagem") dadosInspecao = { packagingLogs };
            if (activeTab === "limpeza") dadosInspecao = { cleaningLogs, selectedCleaningProduct };
            if (activeTab === "objetos_estranhos") dadosInspecao = { foreignObjectLogs: foreignRowsToExport };

            const dadosDoBanco = {
                popCode: docCodeMap[activeTab],
                titulo: `Inspeção - ${tabNameMap[activeTab]}`,
                mes: mesAtual,
                aba: tabNameMap[activeTab],
                setor: activeTab === "objetos_estranhos" && selectedForeignSector
                    ? selectedForeignSector
                    : tabNameMap[activeTab],
                dadosInspecao: dadosInspecao
            };

            console.log("Enviando dados para o servidor...");

            const resposta = await salvarDocumento(
                "inspecao_operacional",
                dadosDoBanco,
                excelBlob as Blob,
                `Inspecao_${activeTab}_${now.getTime()}.xlsx`
            );

            console.log("Sucesso! Salvo no banco com o ID:", resposta.id);

            switch (activeTab) {
                case "pre_inspecao":
                    setPreOpInfo({ week: "", coordinator: null, area: "Packing Uva" });
                    setPreOpData(PRE_OP_ITEMS_DATA.map(item => ({ ...item, checks: WEEK_DAYS.reduce((acc, day) => ({ ...acc, [day.short]: null }), {}) })));
                    setActionPlans([{ id: 1, date: "", item: "", naoConformidade: "", causaRaiz: "", acaoCorretiva: "", responsavel: null }]);
                    break;
                case "transporte":
                    setTransportLogs([
                        { id: 1, date: "", bauLimpo: null, semOdor: null, livreAnimais: null, contentorLimpo: null, monitor: null },
                        { id: 2, date: "", bauLimpo: null, semOdor: null, livreAnimais: null, contentorLimpo: null, monitor: null },
                        { id: 3, date: "", bauLimpo: null, semOdor: null, livreAnimais: null, contentorLimpo: null, monitor: null }
                    ]);
                    break;
                case "embalagem":
                    setPackagingLogs([
                        { id: 4, date: "", materialType: "", quantity: "", lote: "", validity: "", livrePragas: null, embalagemFechada: null, qualidadeConforme: null, obs: "", responsavel: null },
                    ]);
                    break;
                case "limpeza":
                    setCleaningLogs([{
                        id: Date.now(), // ID dinâmico e seguro
                        date: "",
                        product: PRODUTOS_LIMPEZA[0],
                        produtoCorreto: null,
                        composicaoOk: null,
                        embalagemOk: null,
                        padraoExigido: null,
                        cumprePedido: null,
                        responsavel: null
                    }]);
                    break;
                case "objetos_estranhos":
                    setForeignObjectLogs([
                        {
                            id: Date.now(),
                            date: "",
                            time: "",
                            location: FOREIGN_OBJECT_LOCATIONS[0],
                            status: null,
                            foundObject: "",
                            correctiveAction: "",
                            responsible: null
                        }
                    ]);
                    break;
            }

            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("historicoAtualizado"));

            alert(`Registro de ${tabNameMap[activeTab]} exportado e salvo no banco de dados com sucesso!`);

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
        transportLogs, addTransportRow, updateTransport, removeTransportRow,
        packagingLogs, addPackagingRow, updatePackaging, removePackagingRow,
        CLEANING_PRODUCTS: PRODUTOS_LIMPEZA, // <-- exporta a lista do model
        selectedCleaningProduct,
        setSelectedCleaningProduct,
        cleaningLogs, addCleaningRow, updateCleaning, removeCleaningRow,
        foreignObjectLogs,
        FOREIGN_OBJECT_LOCATIONS,
        addForeignObjectRow,
        updateForeignObject,
        removeForeignObjectRow,
        exportarExcel
    };
}