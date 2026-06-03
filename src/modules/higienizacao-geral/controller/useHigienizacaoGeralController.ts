"use client";

import { useState, useEffect, useMemo } from "react";
import { AREAS_DATA, CleaningLog, AreaPreenchimento } from "../model/higienizacaoGeral";
import { salvarDocumento } from "../../../services/api";
import { STORAGE_KEYS } from "../../../constants/storageKeys";

// 🟢 Descomentamos a importação para gerar o Excel
import { exportHigienizacaoToExcel } from "../services/excelFormatter";

export type TabType = "panos" | string;

export function useHigienizacaoController() {
    const [currentTab, setCurrentTab] = useState<string>("panos");
    const [modoOperacao, setModoOperacao] = useState<'campo' | 'packing'>('campo');
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedFrequency, setSelectedFrequency] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // 🟢 ESTADO NOVO: Guarda o texto digitado na caixa de observações
    const [observacaoNC, setObservacaoNC] = useState<string>("");

    const getSavedLogs = (): Record<string, CleaningLog[]> => {
        if (typeof window === "undefined") return {};
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.higienizacao);
            return saved ? (JSON.parse(saved) as Record<string, CleaningLog[]>) : {};
        } catch {
            return {};
        }
    };

    const [logsByTab, setLogsByTab] = useState<Record<string, CleaningLog[]>>(() => getSavedLogs());

    // 🟢 EFEITO NOVO: Limpa a caixa de texto automaticamente ao mudar de aba/setor
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setObservacaoNC("");
    }, [currentTab]);

    useEffect(() => {
        if (Object.keys(logsByTab).length > 0) {
            const cleanedLogsByTab: Record<string, CleaningLog[]> = {};

            Object.entries(logsByTab).forEach(([tab, logs]) => {
                cleanedLogsByTab[tab] = logs.filter(log => {
                    const checksEmpty = !log.checks || Object.values(log.checks).every(v => !v);
                    return (
                        log.date ||
                        log.time ||
                        log.signature ||
                        log.status ||
                        log.monitorSignature ||
                        !checksEmpty
                    ) ? true : false;
                });
            });
            localStorage.setItem(STORAGE_KEYS.higienizacao, JSON.stringify(cleanedLogsByTab));
        }
    }, [logsByTab]);

    const filteredAreas = useMemo(() => {
        return AREAS_DATA.filter((a: AreaPreenchimento) => {
            const matchCat = selectedCategory === "all" || a.category === selectedCategory;
            const matchFreq = selectedFrequency === "all" || a.freq.toUpperCase().includes(selectedFrequency.toUpperCase());
            const matchSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase()) || a.doc.toLowerCase().includes(searchTerm.toLowerCase());
            return matchCat && matchFreq && matchSearch;
        });
    }, [selectedCategory, selectedFrequency, searchTerm]);

    const activeArea = AREAS_DATA.find((a: AreaPreenchimento) => a.id === currentTab) || AREAS_DATA[0];

    let currentLogs = logsByTab[currentTab] || [];
    if (currentLogs.length < 4) {
        const emptyRow: CleaningLog = {
            id: -1,
            date: "",
            time: "",
            checks: {},
            signature: null,
            status: "",
            monitorSignature: null
        };
        while (currentLogs.length < 4) {
            currentLogs = [...currentLogs, { ...emptyRow, id: -(currentLogs.length + 1) }];
        }
    }

    const updateTabLogs = (newLogs: CleaningLog[]) => {
        setLogsByTab((prev: Record<string, CleaningLog[]>) => ({ ...prev, [currentTab]: newLogs }));
    };

    const addRow = () => updateTabLogs([...currentLogs, { id: Date.now(), date: "", time: "", checks: {}, signature: null, status: "", monitorSignature: null }]);

    const updateField = <K extends keyof CleaningLog>(index: number, field: K, value: CleaningLog[K]) => {
        const updated = currentLogs.map((log, i) => i === index ? { ...log, [field]: value } : log);
        updateTabLogs(updated);
    };

    const toggleCheck = (index: number, key: string) => {
        const updated = currentLogs.map((log, i) => {
            if (i === index) return { ...log, checks: { ...log.checks, [key]: !log.checks?.[key] } };
            return log;
        });
        updateTabLogs(updated);
    };

    const setCheckValue = (index: number, key: string, value: string) => {
        const updated = currentLogs.map((log, i) => {
            if (i === index) {
                const nextValue = log.checks?.[key] === value ? null : value;
                return { ...log, checks: { ...log.checks, [key]: nextValue } };
            }
            return log;
        });
        updateTabLogs(updated);
    };

    // ============================================================================
    // 1. FUNÇÕES DE VALIDAÇÃO (Movidas para cima para o exportarExcel poder ler)
    // ============================================================================
    const hasText = (value: unknown): boolean => String(value ?? "").trim() !== "";

    const isCheckSelected = (value: unknown): boolean => {
        if (value === true) return true;
        if (typeof value === "string") {
            const normalized = value.trim().toUpperCase();
            return normalized === "C" || normalized === "NC";
        }
        return false;
    };

    const isLogStarted = (log: CleaningLog): boolean => {
        const checks = log.checks || {};
        const hasAnyCheck = Object.values(checks).some((v) => isCheckSelected(v));
        return hasText(log.date)
            || hasText(log.time)
            || hasText(log.signature)
            || hasText(log.status)
            || hasText(log.monitorSignature)
            || hasAnyCheck;
    };

    const isLogComplete = (log: CleaningLog): boolean => {
        // 🟢 Fantasma do "transporte" removido! Agora o código foca na Higienização.
        if (activeArea.isMatricial) {
            const normalizedStatus = String(log.status ?? "").trim().toUpperCase();
            return hasText(log.date)
                && hasText(log.time)
                && (normalizedStatus === "C" || normalizedStatus === "NC")
                && hasText(log.signature)
                && hasText(log.monitorSignature);
        }

        return hasText(log.date)
            && hasText(log.time)
            && hasText(log.signature)
            && (activeArea.produtos || []).every((produto) => Boolean(log.checks?.[produto]));
    };

    // ============================================================================
    // 2. FUNÇÃO EXPORTAR (Comunicação com o Backend)
    // ============================================================================
    const exportarExcel = async () => {
        try {
            console.log("Gerando arquivo Excel...");
            const now = new Date();

            // As funções agora são lidas sem dar erro de inicialização
            const logsPreenchidos = currentLogs.filter(log => isLogStarted(log));
            const todosCompletos = logsPreenchidos.length > 0 && logsPreenchidos.every(log => isLogComplete(log));
            const statusCalculado = todosCompletos ? "completo" : "incompleto";

            // 1. GERA O ARQUIVO EXCEL FÍSICO (Blob)
            const excelBlob = await exportHigienizacaoToExcel({
                activeArea,
                currentLogs,
                modoOperacao,
                observacaoGeral: observacaoNC
            });

            // 2. PREPARA OS DADOS PARA O BANCO DE DADOS
            const dadosDoBanco = {
                popCode: "PHU-039", // Código PHU específico da Higienização Geral
                titulo: "Higienização Geral", // Nome fixo da tela
                setor: activeArea.nome,
                mes: now.toISOString().slice(0, 7),
                ano: now.getFullYear(),
                frequencia: selectedFrequency,
                registrosDiarios: currentLogs,
                status: statusCalculado
            };

            console.log("Enviando dados para o servidor...");

            // 3. ENVIA TUDO PARA O BACK-END (Padrão Controle de Acesso)
            const resposta = await salvarDocumento(
                "higienizacao_geral", // Nome exato lá no DocumentoService
                dadosDoBanco,
                excelBlob as Blob,
                `Higienizacao_${activeArea.id}_${now.toISOString().split("T")[0]}.xlsx`
            );

            console.log("Sucesso! Salvo no banco com o ID:", resposta.id);

            // 4. LIMPEZA DA TELA (Reset) APÓS O SUCESSO
            const emptyRow: CleaningLog = {
                id: -1,
                date: "",
                time: "",
                checks: {},
                signature: null,
                status: "",
                monitorSignature: null
            };

            const newEmptyLogs = Array.from({ length: 4 }).map((_, idx) => ({
                ...emptyRow,
                id: -(idx + 1)
            }));

            updateTabLogs(newEmptyLogs);
            setObservacaoNC(""); // Reseta a observação também

            // Avisa a interface global que algo mudou
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("historicoAtualizado"));

            alert("Planilha exportada e salva no Banco de Dados com sucesso! 🍇");

        } catch (error) {
            console.error("Erro ao exportar e salvar:", error);
            alert("Ocorreu um erro ao enviar para o servidor. Verifique o console.");
        }
    };

    return {
        currentTab, setCurrentTab, selectedCategory, setSelectedCategory,
        selectedFrequency, setSelectedFrequency, searchTerm, setSearchTerm,
        activeArea, currentLogs, filteredAreas, addRow, updateField, toggleCheck,
        setCheckValue,
        modoOperacao, setModoOperacao,
        exportarExcel,
        observacaoNC,
        setObservacaoNC
    };
}