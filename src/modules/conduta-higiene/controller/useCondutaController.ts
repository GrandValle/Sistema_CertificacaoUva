"use client";

import { useState, useEffect, useRef } from "react";
import { ChecklistRow, ActionPlan, LavagemLog, QUESTIONS, DAYS, DayStatus, CondutaTabType } from "../model/condutaModel";
import { exportCondutaToExcel } from "../services/excelFormatter";
import { STORAGE_KEYS } from "../../../constants/storageKeys";

// 🟢 IMPORTAÇÃO DA API PARA SALVAR NO BANCO DE DADOS
import { salvarDocumento } from "../../../services/api";

interface CondutaPersistedData {
    week?: string;
    signatures?: { coordinator: string | null };
    checklist?: ChecklistRow[];
    actions?: ActionPlan[];
    lavagemLogs?: LavagemLog[];
    localLavagem?: string;
}

export function useCondutaController() {
    const [activeTab, setActiveTab] = useState<CondutaTabType>("inspecao");
    const [showStats, setShowStats] = useState(true);
    const [showActionPlan, setShowActionPlan] = useState(true);

    const getCurrentWeekString = (date = new Date()) => {
        const dayOfWeek = date.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(date);
        monday.setDate(date.getDate() + diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        const pad = (n: number) => String(n).padStart(2, "0");
        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const inicio = pad(monday.getDate());
        const fim = pad(sunday.getDate());
        const mesInicio = meses[monday.getMonth()];
        const mesFim = meses[sunday.getMonth()];
        return mesInicio === mesFim ? `${inicio} a ${fim} de ${mesInicio}` : `${inicio} de ${mesInicio} a ${fim} de ${mesFim}`;
    };

    const defaultChecklist: ChecklistRow[] = QUESTIONS.map((_, i) => ({
        questionId: i + 1, Seg: null, Ter: null, Qua: null, Qui: null, Sex: null, Sáb: null,
    }));

    const defaultActions: ActionPlan[] = [
        { id: 1, date: "", item: "", nonConformity: "", rootCause: "", action: "", responsible: null, status: "pending" }
    ];

    const defaultDiasLavagem = () => DAYS.reduce((acc, day) => { acc[day] = { manha: null, tarde: null }; return acc; }, {} as any);

    const getSavedCondutaData = (): CondutaPersistedData | null => {
        if (typeof window === "undefined") return null;
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.conduta);
            return saved ? (JSON.parse(saved) as CondutaPersistedData) : null;
        } catch {
            return null;
        }
    };

    const savedData = getSavedCondutaData();

    const [checklist, setChecklist] = useState<ChecklistRow[]>(() => savedData?.checklist || defaultChecklist);
    const [actions, setActions] = useState<ActionPlan[]>(() => savedData?.actions || defaultActions);
    const [lavagemLogs, setLavagemLogs] = useState<LavagemLog[]>(() => {
        if (savedData?.lavagemLogs?.length) return savedData.lavagemLogs;
        return Array.from({ length: 5 }, (_, i) => ({
            id: Date.now() + i,
            colaborador: "",
            dias: defaultDiasLavagem(),
        }));
    });
    const [localLavagem, setLocalLavagem] = useState<string>(() => savedData?.localLavagem || "Campo");
    const [week, setWeek] = useState(() => savedData?.week || getCurrentWeekString(new Date()));
    const [signatures, setSignatures] = useState(() => savedData?.signatures || { coordinator: null as string | null });

    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;
            return;
        }
        localStorage.setItem(STORAGE_KEYS.conduta, JSON.stringify({ week, signatures, checklist, actions, lavagemLogs, localLavagem }));
    }, [week, signatures, checklist, actions, lavagemLogs, localLavagem]);

    const toggleStatus = (rowIndex: number, day: string) => {
        const newChecklist = [...checklist];
        //@ts-ignore
        const current = newChecklist[rowIndex][day];
        let next: DayStatus = "ok";
        if (current === "ok") next = "no";
        if (current === "no") next = null;
        //@ts-ignore
        newChecklist[rowIndex][day] = next;
        setChecklist(newChecklist);
    };

    const addActionRow = () => {
        const newId = actions.length > 0 ? actions[actions.length - 1].id + 1 : 1;
        setActions([...actions, { id: newId, date: "", item: "", nonConformity: "", rootCause: "", action: "", responsible: null, status: "pending" }]);
    };

    const updateAction = (index: number, field: keyof ActionPlan, value: string) => {
        const newActions = [...actions];
        //@ts-ignore
        newActions[index][field] = value;
        setActions(newActions);
    };

    const removeActionRow = (id: number) => {
        setActions(prev => prev.filter(a => a.id !== id));
    };

    const addLavagemRow = () => setLavagemLogs([...lavagemLogs, { id: Date.now(), colaborador: "", dias: defaultDiasLavagem() }]);
    const updateLavagemRow = (id: number, nome: string) => setLavagemLogs(lavagemLogs.map(l => l.id === id ? { ...l, colaborador: nome } : l));
    const removeLavagemRow = (id: number) => setLavagemLogs(lavagemLogs.filter(l => l.id !== id));

    const toggleLavagemCell = (id: number, day: string, turno: 'manha' | 'tarde') => {
        setLavagemLogs(lavagemLogs.map(l => {
            if (l.id === id) {
                const current = l.dias[day][turno];
                let next: "C" | "NC" | null = "C";
                if (current === "C") next = "NC";
                if (current === "NC") next = null;
                return { ...l, dias: { ...l.dias, [day]: { ...l.dias[day], [turno]: next } } };
            }
            return l;
        }));
    };

    let okCount = 0; let noCount = 0; let pendingCount = 0;
    checklist.forEach((row) => {
        DAYS.forEach((day) => {
            //@ts-ignore
            const status = row[day];
            if (status === "ok") okCount++;
            if (status === "no") noCount++;
            if (status === null) pendingCount++;
        });
    });

    const totalCells = DAYS.length * QUESTIONS.length;
    const completionRate = Math.round(((okCount + noCount) / totalCells) * 100);
    const complianceRate = totalCells > 0 ? Math.round((okCount / totalCells) * 100) : 0;
    const ncRate = totalCells > 0 ? Math.round((noCount / totalCells) * 100) : 0;
    const ncItems = actions.filter((a) => a.nonConformity.trim()).length;

    // 🟢 FUNÇÃO INTEGRADA AO BACK-END (MYSQL)
    const exportarExcel = async () => {
        try {
            console.log("Gerando arquivo Excel de Conduta e Higiene...");
            const now = new Date();
            const areaName = activeTab === "inspecao" ? "Checklist" : "Lavagem";

            // 1. GERA O ARQUIVO EM BACKGROUND (Blob)
            const excelBlob = await exportCondutaToExcel({
                activeTab,
                week,
                signatures,
                checklist,
                actions,
                lavagemLogs,
                localLavagem
            });

            // 2. PREPARA OS DADOS PARA O BACKEND
            const docCodeMap: Record<CondutaTabType, string> = {
                inspecao: "PHU-2.9.7",
                lavagem: "PHU-2.9.1"
            };

            const titulosMap: Record<CondutaTabType, string> = {
                inspecao: "Monitoramento de Conduta e Saúde",
                lavagem: "Monitoramento de Lavagem de Mãos"
            };

            // Pega apenas os dados relevantes da aba ativa para salvar no JSON
            let dadosConduta = {};
            if (activeTab === "inspecao") {
                dadosConduta = { week, signatures, checklist, actions };
            } else {
                dadosConduta = { week, localLavagem, lavagemLogs };
            }

            // O schema do prisma exige "semana". O "mes" e "setor" vão para compatibilidade no Front
            const dadosDoBanco = {
                popCode: docCodeMap[activeTab],
                titulo: titulosMap[activeTab],
                mes: week,
                semana: week, // Campo obrigatório da tabela conduta_higiene
                aba: areaName,
                setor: areaName, // Enviamos aba e setor juntos para prevenir falha no histórico (-)
                dadosConduta: dadosConduta
            };

            console.log("Enviando dados para o servidor...");

            // 3. SALVA NO BANCO DE DADOS
            const resposta = await salvarDocumento(
                "conduta_higiene", // Tabela correspondente no Prisma
                dadosDoBanco,
                excelBlob as Blob,
                `Conduta_${areaName}_${now.getTime()}.xlsx`
            );

            console.log("Sucesso! Salvo no banco com o ID:", resposta.id);

            // 4. LIMPEZA DOS DADOS DA TELA
            if (activeTab === "inspecao") {
                setChecklist(defaultChecklist);
                setActions(defaultActions);
                setSignatures({ coordinator: null });
                setWeek(getCurrentWeekString(new Date()));
            } else {
                setLavagemLogs(Array.from({ length: 5 }, (_, i) => ({
                    id: Date.now() + i,
                    colaborador: "",
                    dias: defaultDiasLavagem(),
                })));
                setLocalLavagem("Campo");
            }

            // 5. ATUALIZA O HISTÓRICO GLOBAL
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("historicoAtualizado"));

            alert(`Registro de ${areaName} salvo no banco de dados com sucesso!`);
        } catch (error) {
            console.error("Erro ao exportar e salvar no banco:", error);
            alert("Ocorreu um erro ao enviar o registro para o servidor.");
        }
    };

    return {
        activeTab, setActiveTab,
        week, setWeek, signatures, setSignatures, checklist, toggleStatus,
        actions, addActionRow, updateAction, removeActionRow,
        showStats, setShowStats, showActionPlan, setShowActionPlan,
        stats: { okCount, noCount, pendingCount, totalCells, completionRate, complianceRate, ncRate, ncItems },
        lavagemLogs, addLavagemRow, updateLavagemRow, toggleLavagemCell, removeLavagemRow,
        localLavagem, setLocalLavagem,
        exportarExcel
    };
}