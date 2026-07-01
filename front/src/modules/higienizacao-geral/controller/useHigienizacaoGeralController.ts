"use client";

import { useState, useEffect, useMemo } from "react";
import { AREAS_DATA, CleaningLog, AreaPreenchimento, RegistroHigienizacaoTesoura, DIAS_SEMANA_TESOURA, BebedouroLog } from "../model/higienizacaoGeral";
import { salvarDocumento } from "../../../services/api";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import { exportHigienizacaoToExcel } from "../services/excelFormatter";

export type TabType = "panos" | string;

const FIXED_BEBEDOURO_ROWS = 4;

export function useHigienizacaoController() {
    const createEmptyBebedouroRow = (id: number = Date.now()): BebedouroLog => ({
        id,
        data: '',
        local: '',
        limpeza: '',
        trocaFiltro: '',
        manutencao: '',
        observacao: '',
        acaoCorretiva: '',
        signature: ''
    });

    const createFixedBebedouroRows = (rows?: BebedouroLog[]): BebedouroLog[] => {
        const existingRows = rows ?? [];
        const paddedRows = [...existingRows];

        while (paddedRows.length < FIXED_BEBEDOURO_ROWS) {
            paddedRows.push(createEmptyBebedouroRow(Date.now() + paddedRows.length));
        }

        return paddedRows;
    };

    const [currentTab, setCurrentTab] = useState<string>("panos");
    const [modoOperacao, setModoOperacao] = useState<'campo' | 'packing'>('campo');
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedFrequency, setSelectedFrequency] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Dicionário de observações separadas por aba
    const [observacoesByTab, setObservacoesByTab] = useState<Record<string, string>>({});

    const observacaoNC = observacoesByTab[currentTab] || "";
    const setObservacaoNC = (texto: string) => {
        setObservacoesByTab(prev => ({ ...prev, [currentTab]: texto }));
    };

    // ========== CARREGAR DADOS DO LOCALSTORAGE (UNIFICADO) ==========
    const getSavedLogs = (): Record<string, any> => {
        if (typeof window === "undefined") return {};
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.higienizacao);
            const parsed = saved ? JSON.parse(saved) : {};
            parsed.bebedouros = createFixedBebedouroRows(Array.isArray(parsed.bebedouros) ? parsed.bebedouros : undefined);
            return parsed;
        } catch {
            return { bebedouros: createFixedBebedouroRows() };
        }
    };

    const [logsByTab, setLogsByTab] = useState<Record<string, any>>({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setLogsByTab(getSavedLogs());
        if (typeof window !== "undefined") {
            try {
                const savedObs = localStorage.getItem(`${STORAGE_KEYS.higienizacao}_obs`);
                if (savedObs) {
                    setObservacoesByTab(JSON.parse(savedObs));
                }
            } catch (error) {
                console.error("Erro ao ler observações do storage", error);
            }
        }
        setIsLoaded(true);
    }, []);

    // ========== DADOS DA ÁREA ATUAL ==========
    const activeArea = AREAS_DATA.find((a: AreaPreenchimento) => a.id === currentTab) || AREAS_DATA[0];

    let currentLogs: CleaningLog[] = [];
    let tesourasLogs: RegistroHigienizacaoTesoura[] = [];
    let bebedourosLogs: BebedouroLog[] = [];

    if (activeArea.id === 'tesouras') {
        tesourasLogs = logsByTab['tesouras'] || [];
    } else if (activeArea.id === 'bebedouros') {
        bebedourosLogs = logsByTab['bebedouros'] || [];
    } else {
        let logs = logsByTab[currentTab] || [];
        if (logs.length < 4) {
            const emptyRow: CleaningLog = {
                id: -1,
                date: "",
                time: "",
                checks: {},
                signature: null,
                status: "",
                monitorSignature: null
            };
            while (logs.length < 4) {
                logs = [...logs, { ...emptyRow, id: -(logs.length + 1) }];
            }
        }
        currentLogs = logs;
    }

    // ========== FUNÇÕES GENÉRICAS PARA ATUALIZAR O ESTADO ==========
    const updateTabLogs = (newLogs: any) => {
        setLogsByTab((prev) => ({ ...prev, [currentTab]: newLogs }));
    };

    // ========== CRUD PARA ÁREAS NORMAIS ==========
    const addRow = () => {
        if (activeArea.id === 'tesouras' || activeArea.id === 'bebedouros') return;
        const newRow: CleaningLog = {
            id: Date.now(),
            date: "",
            time: "",
            checks: {},
            signature: null,
            status: "",
            monitorSignature: null
        };
        updateTabLogs([...currentLogs, newRow]);
    };

    const removeRow = (index: number) => {
        if (activeArea.id === 'tesouras' || activeArea.id === 'bebedouros') return;
        if (currentLogs.length <= 1) return;
        const updated = currentLogs.filter((_, i) => i !== index);
        updateTabLogs(updated);
    };

    const updateField = <K extends keyof CleaningLog>(index: number, field: K, value: CleaningLog[K]) => {
        if (activeArea.id === 'tesouras' || activeArea.id === 'bebedouros') return;
        const updated = currentLogs.map((log, i) => i === index ? { ...log, [field]: value } : log);
        updateTabLogs(updated);
    };

    const toggleCheck = (index: number, key: string) => {
        if (activeArea.id === 'tesouras' || activeArea.id === 'bebedouros') return;
        const updated = currentLogs.map((log, i) => {
            if (i === index) {
                const safeChecks = log?.checks || {};
                return { ...log, checks: { ...safeChecks, [key]: !safeChecks[key] } };
            }
            return log;
        });
        updateTabLogs(updated);
    };

    const setCheckValue = (index: number, key: string, value: string) => {
        if (activeArea.id === 'tesouras' || activeArea.id === 'bebedouros') return;
        const updated = currentLogs.map((log, i) => {
            if (i === index) {
                const safeChecks = log?.checks || {};
                const nextValue = safeChecks[key] === value ? null : value;
                return { ...log, checks: { ...safeChecks, [key]: nextValue } };
            }
            return log;
        });
        updateTabLogs(updated);
    };

    // ========== FUNÇÕES ESPECÍFICAS PARA TESOURAS ==========
    const addTesouraWeek = () => {
        if (activeArea.id !== 'tesouras') return;
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 5);

        const newWeek: RegistroHigienizacaoTesoura = {
            id: Date.now(),
            dataInicio: inicioSemana.toISOString().split('T')[0],
            dataFim: fimSemana.toISOString().split('T')[0],
            dias: {},
            respLimpeza: null,
            monitorResponsavel: null
        };
        DIAS_SEMANA_TESOURA.forEach(dia => {
            newWeek.dias[dia.id] = { qtde: '', status: '' };
        });
        const updated = [...tesourasLogs, newWeek];
        updateTabLogs(updated);
    };

    const updateTesouraWeek = (id: number, field: string, value: any) => {
        if (activeArea.id !== 'tesouras') return;
        const updated = tesourasLogs.map(week => week.id === id ? { ...week, [field]: value } : week);
        updateTabLogs(updated);
    };

    const updateTesouraDia = (weekId: number, dia: string, subfield: 'qtde' | 'status', value: any) => {
        if (activeArea.id !== 'tesouras') return;
        const updated = tesourasLogs.map(week => {
            if (week.id !== weekId) return week;
            const diasAtuais = week.dias || {};
            const diaAtual = diasAtuais[dia] || { qtde: '', status: '' };
            const novoDia = { ...diaAtual, [subfield]: value };
            return {
                ...week,
                dias: {
                    ...diasAtuais,
                    [dia]: novoDia
                }
            };
        });
        updateTabLogs(updated);
    };

    const removeTesouraWeek = (id: number) => {
        if (activeArea.id !== 'tesouras') return;
        const updated = tesourasLogs.filter(week => week.id !== id);
        updateTabLogs(updated);
    };

    // ========== FUNÇÕES ESPECÍFICAS PARA BEBEDOUROS ==========
    const addBebedouroRow = () => {
        if (activeArea.id !== 'bebedouros') return;
        const updated = [...bebedourosLogs, createEmptyBebedouroRow(Date.now())];
        setLogsByTab(prev => ({ ...prev, bebedouros: updated }));
    };

    const updateBebedouroField = <K extends keyof BebedouroLog>(id: number, field: K, value: BebedouroLog[K]) => {
        if (activeArea.id !== 'bebedouros') return;
        const updated = bebedourosLogs.map(log => log.id === id ? { ...log, [field]: value } : log);
        setLogsByTab(prev => ({ ...prev, bebedouros: updated }));
    };

    const removeBebedouroRow = (id: number) => {
        if (activeArea.id !== 'bebedouros') return;
        if (bebedourosLogs.length <= 1) return;
        const updated = bebedourosLogs.filter(log => log.id !== id);
        setLogsByTab(prev => ({ ...prev, bebedouros: updated }));
    };

    // ========== PERSISTÊNCIA (SALVAR NO LOCALSTORAGE) ==========
    useEffect(() => {
        if (Object.keys(logsByTab).length > 0) {
            const cleaned: Record<string, any> = {};
            for (const [tab, logs] of Object.entries(logsByTab)) {
                if (tab === 'tesouras' || tab === 'bebedouros') {
                    cleaned[tab] = logs;
                    continue;
                }
                const typedLogs = logs as CleaningLog[];
                cleaned[tab] = typedLogs.filter(log => {
                    if (!log) return false;
                    const checksEmpty = !log.checks || Object.values(log.checks).every(v => !v);
                    return log.date || log.time || log.signature || log.status || log.monitorSignature || !checksEmpty;
                });
            }
            localStorage.setItem(STORAGE_KEYS.higienizacao, JSON.stringify(cleaned));
        }
    }, [logsByTab]);

    // Salva observações
    useEffect(() => {
        if (Object.keys(observacoesByTab).length > 0) {
            localStorage.setItem(`${STORAGE_KEYS.higienizacao}_obs`, JSON.stringify(observacoesByTab));
        }
    }, [observacoesByTab]);

    // ========== FILTROS ==========
    const filteredAreas = useMemo(() => {
        return AREAS_DATA.filter((a: AreaPreenchimento) => {
            const matchCat = selectedCategory === "all" || a.category === selectedCategory;
            const matchFreq = selectedFrequency === "all" || a.freq.toUpperCase().includes(selectedFrequency.toUpperCase());
            const matchSearch = a.nome.toLowerCase().includes(searchTerm.toLowerCase()) || a.doc.toLowerCase().includes(searchTerm.toLowerCase());
            return matchCat && matchFreq && matchSearch;
        });
    }, [selectedCategory, selectedFrequency, searchTerm]);

    // ========== VALIDAÇÃO E EXPORTAÇÃO ==========
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

    // ========== EXPORTAÇÃO ==========
    const exportarExcel = async () => {
        try {
            console.log("Gerando arquivo Excel...");
            const now = new Date();

            // Exportação para Tesouras
            if (activeArea.id === 'tesouras') {
                const excelBlob = await exportHigienizacaoToExcel({
                    activeArea,
                    currentLogs: [],
                    modoOperacao,
                    observacaoGeral: observacaoNC,
                    tesourasLogs: tesourasLogs
                });

                const dadosDoBanco = {
                    popCode: "PHU-024",
                    titulo: "Higienização Geral - Tesouras",
                    setor: activeArea.nome,
                    mes: now.toISOString().slice(0, 7),
                    ano: now.getFullYear(),
                    frequencia: selectedFrequency,
                    registrosDiarios: [],
                    status: "completo"
                };

                const resposta = await salvarDocumento(
                    "higienizacao_geral",
                    dadosDoBanco,
                    excelBlob as Blob,
                    `Higienizacao_Tesouras_${now.toISOString().split("T")[0]}.xlsx`
                );

                console.log("Salvo com ID:", resposta.id);
                updateTabLogs([]);
                setObservacaoNC("");
                window.dispatchEvent(new Event("storage"));
                window.dispatchEvent(new Event("historicoAtualizado"));
                alert("Planilha de Tesouras exportada e salva com sucesso!");
                return;
            }

            // Exportação para Bebedouros
            if (activeArea.id === 'bebedouros') {
                const excelBlob = await exportHigienizacaoToExcel({
                    activeArea,
                    currentLogs: [],
                    modoOperacao,
                    observacaoGeral: observacaoNC,
                    bebedourosLogs: bebedourosLogs
                });

                const dadosDoBanco = {
                    popCode: "PHU-017",
                    titulo: "Higienização dos Bebedouros",
                    setor: activeArea.nome,
                    mes: now.toISOString().slice(0, 7),
                    ano: now.getFullYear(),
                    frequencia: selectedFrequency,
                    registrosDiarios: [],
                    status: "completo"
                };

                const resposta = await salvarDocumento(
                    "higienizacao_geral",
                    dadosDoBanco,
                    excelBlob as Blob,
                    `Higienizacao_Bebedouros_${now.toISOString().split("T")[0]}.xlsx`
                );

                console.log("Salvo com ID:", resposta.id);
                setLogsByTab(prev => ({ ...prev, bebedouros: createFixedBebedouroRows() }));
                setObservacaoNC("");
                window.dispatchEvent(new Event("storage"));
                window.dispatchEvent(new Event("historicoAtualizado"));
                alert("Planilha de Bebedouros exportada e salva com sucesso!");
                return;
            }

            // Áreas normais (Panos, etc.)
            const logsPreenchidos = currentLogs.filter(log => isLogStarted(log));
            const todosCompletos = logsPreenchidos.length > 0 && logsPreenchidos.every(log => isLogComplete(log));
            const statusCalculado = todosCompletos ? "completo" : "incompleto";

            const excelBlob = await exportHigienizacaoToExcel({
                activeArea,
                currentLogs,
                modoOperacao,
                observacaoGeral: observacaoNC
            });

            const dadosDoBanco = {
                popCode: "PHU-039",
                titulo: "Higienização Geral",
                setor: activeArea.nome,
                mes: now.toISOString().slice(0, 7),
                ano: now.getFullYear(),
                frequencia: selectedFrequency,
                registrosDiarios: currentLogs,
                status: statusCalculado
            };

            const resposta = await salvarDocumento(
                "higienizacao_geral",
                dadosDoBanco,
                excelBlob as Blob,
                `Higienizacao_${activeArea.id}_${now.toISOString().split("T")[0]}.xlsx`
            );

            console.log("Salvo com ID:", resposta.id);

            const emptyRow: CleaningLog = {
                id: -1,
                date: "",
                time: "",
                checks: {},
                signature: null,
                status: "",
                monitorSignature: null
            };
            const newEmptyLogs = Array.from({ length: 4 }).map((_, idx) => ({ ...emptyRow, id: -(idx + 1) }));

            updateTabLogs(newEmptyLogs);
            setObservacaoNC("");
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("historicoAtualizado"));
            alert("Planilha exportada e salva no Banco de Dados com sucesso!");
        } catch (error) {
            console.error("Erro ao exportar:", error);
            alert("Ocorreu um erro ao enviar para o servidor.");
        }
    };

    return {
        currentTab, setCurrentTab,
        selectedCategory, setSelectedCategory,
        selectedFrequency, setSelectedFrequency,
        searchTerm, setSearchTerm,
        activeArea,
        currentLogs,
        tesourasLogs,
        bebedourosLogs,   // 🔥 NOVO
        filteredAreas,
        addRow,
        removeRow,
        updateField,
        toggleCheck,
        setCheckValue,
        addTesouraWeek,
        updateTesouraWeek,
        updateTesouraDia,
        removeTesouraWeek,
        addBebedouroRow,
        updateBebedouroField, // 🔥 NOVO
        removeBebedouroRow,
        modoOperacao, setModoOperacao,
        exportarExcel,
        observacaoNC, setObservacaoNC
    };
}