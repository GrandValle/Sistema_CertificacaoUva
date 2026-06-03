"use client";

import { useState, useEffect } from "react";
import { PRE_OP_ITEMS_DATA, WEEK_DAYS, PreOpItem, ActionPlan } from "../model/inspecaoModel";
import { exportInspecaoToExcel } from "../services/excelFormatter";
import { STORAGE_KEYS } from "../../../constants/storageKeys";

// 🟢 IMPORTAÇÃO CORRIGIDA: Agora a função que comunica com o backend está disponível!
import { salvarDocumento } from "../../../services/api";

export type TabType = "pre_inspecao" | "transporte" | "embalagem" | "limpeza";

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
}

export const CLEANING_PRODUCTS = ["Primmax Sanclor"];

export function useInspecaoController() {
    const [activeTab, setActiveTab] = useState<TabType>("pre_inspecao");

    const getSavedState = (): InspecaoPersistedState | null => {
        if (typeof window === "undefined") return null;
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.inspecao);
            return saved ? (JSON.parse(saved) as InspecaoPersistedState) : null;
        } catch {
            return null;
        }
    };

    const savedState = getSavedState();

    const [preOpInfo, setPreOpInfo] = useState(() => savedState?.preOpInfo || { week: "", coordinator: null as string | null, area: "Packing Uva" });
    const [preOpData, setPreOpData] = useState<PreOpItem[]>(
        () => savedState?.preOpData || PRE_OP_ITEMS_DATA.map(item => ({ ...item, checks: WEEK_DAYS.reduce((acc, day) => ({ ...acc, [day.short]: null }), {}) }))
    );
    const [actionPlans, setActionPlans] = useState<ActionPlan[]>(
        () => savedState?.actionPlans?.length
            ? savedState.actionPlans
            : [{ id: 1, date: "", item: "", naoConformidade: "", causaRaiz: "", acaoCorretiva: "", responsavel: null }]
    );

    const [transportLogs, setTransportLogs] = useState<TransportLog[]>(
        () => savedState?.transportLogs?.length
            ? savedState.transportLogs
            : [
                { id: 1, date: "", bauLimpo: null, semOdor: null, livreAnimais: null, contentorLimpo: null, monitor: null },
                { id: 2, date: "", bauLimpo: null, semOdor: null, livreAnimais: null, contentorLimpo: null, monitor: null },
                { id: 3, date: "", bauLimpo: null, semOdor: null, livreAnimais: null, contentorLimpo: null, monitor: null }
            ]
    );

    const [packagingLogs, setPackagingLogs] = useState<PackagingLog[]>(
        () => savedState?.packagingLogs?.length
            ? savedState.packagingLogs
            : [
                { id: 4, date: "", materialType: "", quantity: "", lote: "", validity: "", livrePragas: null, embalagemFechada: null, qualidadeConforme: null, obs: "", responsavel: null },
                { id: 5, date: "", materialType: "", quantity: "", lote: "", validity: "", livrePragas: null, embalagemFechada: null, qualidadeConforme: null, obs: "", responsavel: null },
                { id: 6, date: "", materialType: "", quantity: "", lote: "", validity: "", livrePragas: null, embalagemFechada: null, qualidadeConforme: null, obs: "", responsavel: null }
            ]
    );

    const [selectedCleaningProduct, setSelectedCleaningProduct] = useState(CLEANING_PRODUCTS[0]);

    const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>(
        () => savedState?.cleaningLogs?.length
            ? savedState.cleaningLogs
            : [{ id: 7, date: "", product: CLEANING_PRODUCTS[0], produtoCorreto: null, composicaoOk: null, embalagemOk: null, padraoExigido: null, cumprePedido: null, responsavel: null }]
    );

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.inspecao, JSON.stringify({
            preOpInfo, preOpData, actionPlans, transportLogs, packagingLogs, cleaningLogs
        }));
    }, [preOpInfo, preOpData, actionPlans, transportLogs, packagingLogs, cleaningLogs]);

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

    // 🟢 FUNÇÃO DE EXPORTAÇÃO E SALVAMENTO CORRIGIDA
    const exportarExcel = async () => {
        try {
            console.log("Gerando arquivo Excel da Inspeção...");
            const now = new Date();

            // 1. Gera o arquivo Excel invisível (Blob)
            const excelBlob = await exportInspecaoToExcel({
                activeTabParam: activeTab,
                preOpInfo,
                preOpData,
                actionPlans,
                transportLogs,
                packagingLogs,
                currentCleaningLogs: cleaningLogs,
                selectedCleaningProduct
            });

            // 2. Prepara os dados JSON baseados na aba atual
            const mesAtual = now.toISOString().slice(0, 7);
            const tabNameMap: Record<TabType, string> = {
                pre_inspecao: "Pré-Inspeção",
                transporte: "Transporte",
                embalagem: "Embalagem",
                limpeza: "Limpeza"
            };

            const docCodeMap: Record<TabType, string> = {
                pre_inspecao: "2.11.7",
                transporte: "PHU-031",
                embalagem: "PHU-032",
                limpeza: "PHU-036"
            };

            let dadosInspecao = {};
            if (activeTab === "pre_inspecao") dadosInspecao = { preOpInfo, preOpData, actionPlans };
            if (activeTab === "transporte") dadosInspecao = { transportLogs };
            if (activeTab === "embalagem") dadosInspecao = { packagingLogs };
            if (activeTab === "limpeza") dadosInspecao = { cleaningLogs, selectedCleaningProduct };

            // 3. Monta o pacote no formato exato que o backend exige 
            // (Baseado no seu DocumentoService.ts para inspecao_operacional)
            const dadosDoBanco = {
                popCode: docCodeMap[activeTab],
                titulo: `Inspeção - ${tabNameMap[activeTab]}`,
                mes: mesAtual,
                aba: tabNameMap[activeTab],
                setor: tabNameMap[activeTab], // Envia o nome da tela para o backend
                dadosInspecao: dadosInspecao
            };

            console.log("Enviando dados para o servidor...");

            // 4. ENVIA PARA A API USANDO A FUNÇÃO 'salvarDocumento'
            const resposta = await salvarDocumento(
                "inspecao_operacional", // 🟢 Tipo exato da tela no DocumentoService
                dadosDoBanco,
                excelBlob as Blob,
                `Inspecao_${activeTab}_${now.getTime()}.xlsx`
            );

            console.log("Sucesso! Salvo no banco com o ID:", resposta.id);

            // 5. Limpa a tela após o salvamento
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
                        { id: 5, date: "", materialType: "", quantity: "", lote: "", validity: "", livrePragas: null, embalagemFechada: null, qualidadeConforme: null, obs: "", responsavel: null },
                        { id: 6, date: "", materialType: "", quantity: "", lote: "", validity: "", livrePragas: null, embalagemFechada: null, qualidadeConforme: null, obs: "", responsavel: null }
                    ]);
                    break;
                case "limpeza":
                    setCleaningLogs([{
                        id: 7, date: "", product: CLEANING_PRODUCTS[0],
                        produtoCorreto: null, composicaoOk: null, embalagemOk: null, padraoExigido: null, cumprePedido: null, responsavel: null
                    }]);
                    break;
            }

            // 6. Atualiza o histórico
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
        CLEANING_PRODUCTS, selectedCleaningProduct, setSelectedCleaningProduct,
        cleaningLogs, addCleaningRow, updateCleaning, removeCleaningRow,
        exportarExcel
    };
}