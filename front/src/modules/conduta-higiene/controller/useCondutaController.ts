"use client";

import { useState, useEffect } from "react";
import {
    ChecklistRow,
    ActionPlan,
    LavagemLog,
    ColaboradorLavagem,
    QUESTIONS,
    DAYS,
    DayStatus,
    CondutaTabType,
} from "../model/condutaModel";
import { exportCondutaToExcel } from "../services/excelFormatter";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import { salvarDocumento } from "../../../services/api";

import {
    listarColaboradoresLavagem,
    criarColaboradorLavagem,
    atualizarColaboradorLavagem,
    desativarColaboradorLavagem,
    reativarColaboradorLavagem,
} from "../../../services/api";

interface CondutaPersistedData {
    week?: string;
    signatures?: { coordinator: string | null };
    checklist?: ChecklistRow[];
    actions?: ActionPlan[];
    lavagemLogs?: LavagemLog[];
}

export function useCondutaController() {
    const getCurrentWeekString = (date = new Date()) => {
        const dayOfWeek = date.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(date);
        monday.setDate(date.getDate() + diffToMonday);
        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5);

        const pad = (n: number) => String(n).padStart(2, "0");
        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const inicio = pad(monday.getDate());
        const fim = pad(saturday.getDate());
        const mesInicio = meses[monday.getMonth()];
        const mesFim = meses[saturday.getMonth()];

        return mesInicio === mesFim ? `${inicio} a ${fim} de ${mesInicio}` : `${inicio} de ${mesInicio} a ${fim} de ${mesFim}`;
    };

    const defaultChecklist: ChecklistRow[] = QUESTIONS.map((_, i) => ({
        questionId: i + 1,
        Seg: null,
        Ter: null,
        Qua: null,
        Qui: null,
        Sex: null,
        Sáb: null,
    }));

    const defaultActions: ActionPlan[] = [
        {
            id: 1,
            date: "",
            item: "",
            nonConformity: "",
            rootCause: "",
            action: "",
            responsible: null,
            status: "pending",
        },
    ];

    const defaultDiasLavagem = () =>
        DAYS.reduce((acc, day) => {
            acc[day] = { manha: null, tarde: null };
            return acc;
        }, {} as any);

    const defaultLavagemLogs: LavagemLog[] = [];

    // ==========================================
    // 1. DECLARAÇÃO DE ESTADOS
    // ==========================================
    const [activeTab, setActiveTab] = useState<CondutaTabType>("inspecao");
    const [showStats, setShowStats] = useState(true);
    const [showActionPlan, setShowActionPlan] = useState(true);
    const [checklist, setChecklist] = useState<ChecklistRow[]>(defaultChecklist);
    const [actions, setActions] = useState<ActionPlan[]>(defaultActions);
    const [lavagemLogs, setLavagemLogs] = useState<LavagemLog[]>(defaultLavagemLogs);
    const [week, setWeek] = useState(getCurrentWeekString(new Date()));
    const [signatures, setSignatures] = useState({ coordinator: null as string | null });
    const [isInitialized, setIsInitialized] = useState(false);
    const [colaboradores, setColaboradores] = useState<ColaboradorLavagem[]>([]);

    // ==========================================
    // 2. FUNÇÕES DE API / COLABORADORES (Definidas antes dos useEffects)
    // ==========================================
    const carregarColaboradores = async () => {
        try {
            const data = await listarColaboradoresLavagem(false);
            setColaboradores(data);
        } catch (error) {
            console.error("Erro ao carregar colaboradores:", error);
        }
    };

    const salvarColaborador = async (nome: string, tipo: "EFETIVO" | "CONTRATADO") => {
        const nomeNormalizado = nome.trim().toUpperCase();
        const existente = colaboradores.find(
            (c) => c.nome?.toUpperCase() === nomeNormalizado
        );

        if (existente) {
            if (!existente.ativo) {
                try {
                    await atualizarColaboradorLavagem(existente.id, nome, tipo, true);
                    await carregarColaboradores();
                    return { success: true, message: `Colaborador ${nome} reativado com sucesso!` };
                } catch (error) {
                    return { success: false, message: "Erro ao reativar colaborador." };
                }
            } else {
                return { success: false, message: `O colaborador ${nome} já está ativo no sistema.` };
            }
        }

        try {
            await criarColaboradorLavagem(nome, tipo);
            await carregarColaboradores();
            return { success: true, message: `Colaborador ${nome} criado com sucesso!` };
        } catch (error) {
            return { success: false, message: "Erro ao criar colaborador." };
        }
    };

    const criarColaborador = async (nome: string, tipo: "EFETIVO" | "CONTRATADO") => {
        try {
            await criarColaboradorLavagem(nome, tipo);
            await carregarColaboradores();
        } catch (error) {
            console.error("Erro ao criar colaborador:", error);
            throw error;
        }
    };

    const atualizarColaborador = async (id: string, nome?: string, tipo?: "EFETIVO" | "CONTRATADO") => {
        try {
            await atualizarColaboradorLavagem(id, nome, tipo);
            await carregarColaboradores();
        } catch (error) {
            console.error("Erro ao atualizar colaborador:", error);
            throw error;
        }
    };

    const desativarColaborador = async (id: string) => {
        try {
            await desativarColaboradorLavagem(id);
            await carregarColaboradores();
        } catch (error) {
            console.error("Erro ao desativar colaborador:", error);
            throw error;
        }
    };

    const reativarColaborador = async (id: string) => {
        try {
            await reativarColaboradorLavagem(id);
            await carregarColaboradores();
        } catch (error) {
            console.error("Erro ao reativar colaborador:", error);
            throw error;
        }
    };

    // ==========================================
    // 3. USE EFFECTS (Ciclo de Vida)
    // ==========================================
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.conduta);
            if (saved) {
                const savedData = JSON.parse(saved) as CondutaPersistedData;
                if (savedData.checklist) setChecklist(savedData.checklist);
                if (savedData.actions) setActions(savedData.actions);
                if (savedData.lavagemLogs && savedData.lavagemLogs.length > 0)
                    setLavagemLogs(savedData.lavagemLogs);
                if (savedData.signatures) setSignatures(savedData.signatures);
            }
        } catch (error) {
            console.error("Erro ao ler LocalStorage", error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if (!isInitialized) return;
        localStorage.setItem(STORAGE_KEYS.conduta, JSON.stringify({
            week,
            signatures,
            checklist,
            actions,
            lavagemLogs,
        }));
    }, [isInitialized, week, signatures, checklist, actions, lavagemLogs]);

    // Agora o useEffect chama carregarColaboradores depois dela já existir
    useEffect(() => {
        if (isInitialized) {
            carregarColaboradores();
        }
    }, [isInitialized]);

    // ==========================================
    // 4. FUNÇÕES DE INSPEÇÃO
    // ==========================================
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
        setActions([
            ...actions,
            {
                id: newId,
                date: "",
                item: "",
                nonConformity: "",
                rootCause: "",
                action: "",
                responsible: null,
                status: "pending",
            },
        ]);
    };

    const updateAction = (index: number, field: keyof ActionPlan, value: string) => {
        const newActions = [...actions];
        //@ts-ignore
        newActions[index][field] = value;
        setActions(newActions);
    };

    const removeActionRow = (id: number) => {
        setActions((prev) => prev.filter((a) => a.id !== id));
    };

    // ==========================================
    // 5. FUNÇÕES DE LAVAGEM
    // ==========================================
    const addLavagemRow = () =>
        setLavagemLogs([
            ...lavagemLogs,
            { id: Date.now(), colaborador: "", dias: defaultDiasLavagem() },
        ]);

    const updateLavagemRow = (id: number, nome: string) =>
        setLavagemLogs(lavagemLogs.map((l) => (l.id === id ? { ...l, colaborador: nome } : l)));

    const removeLavagemRow = (id: number) =>
        setLavagemLogs(lavagemLogs.filter((l) => l.id !== id));

    const toggleLavagemCell = (id: number, day: string, turno: "manha" | "tarde") => {
        setLavagemLogs(
            lavagemLogs.map((l) => {
                if (l.id === id) {
                    const current = l.dias[day][turno];
                    let next: "C" | "NC" | null = "C";
                    if (current === "C") next = "NC";
                    if (current === "NC") next = null;
                    return {
                        ...l,
                        dias: {
                            ...l.dias,
                            [day]: { ...l.dias[day], [turno]: next },
                        },
                    };
                }
                return l;
            })
        );
    };

    // ==========================================
    // 6. ESTATÍSTICAS
    // ==========================================
    let okCount = 0,
        noCount = 0,
        pendingCount = 0;
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

    // ==========================================
    // 7. EXPORTAÇÃO
    // ==========================================
    const exportarExcel = async () => {
        try {
            console.log("Gerando arquivo Excel...");
            const now = new Date();
            const areaName = activeTab === "inspecao" ? "Checklist" : "Lavagem";

            const excelBlob = await exportCondutaToExcel({
                activeTab,
                week,
                signatures,
                checklist,
                actions,
                lavagemLogs,
                colaboradores,
            });

            const docCodeMap: Record<CondutaTabType, string> = {
                inspecao: "PHU-2.9.7",
                lavagem: "PHU-2.9.1",
            };

            const titulosMap: Record<CondutaTabType, string> = {
                inspecao: "Monitoramento de Conduta e Saúde",
                lavagem: "Monitoramento de Lavagem de Mãos",
            };

            let dadosConduta = {};
            if (activeTab === "inspecao") {
                dadosConduta = { week, signatures, checklist, actions };
            } else {
                dadosConduta = { week, lavagemLogs };
            }

            const dadosDoBanco = {
                popCode: docCodeMap[activeTab],
                titulo: titulosMap[activeTab],
                mes: week,
                semana: week,
                aba: areaName,
                setor: areaName,
                dadosConduta: dadosConduta,
            };

            await salvarDocumento(
                "conduta_higiene",
                dadosDoBanco,
                excelBlob as Blob,
                `Conduta_${areaName}_${now.getTime()}.xlsx`
            );

            // 🔥 RESETA APENAS AS MARCAÇÕES, MANTÉM OS COLABORADORES
            if (activeTab === "inspecao") {
                setChecklist(defaultChecklist);
                setActions(defaultActions);
                setSignatures({ coordinator: null });
                setWeek(getCurrentWeekString(new Date()));
            } else {
                // 1. Criamos a lista blindada, ignorando quem não tem nome salvo (evita crash)
                const nomesDesligados = new Set(
                    colaboradores
                        .filter(c => c.ativo === false && c.nome)
                        .map(c => c.nome.trim().toUpperCase())
                );

                // 2. Filtramos e limpamos a tabela
                setLavagemLogs(prev =>
                    prev
                        .filter(log => {
                            if (!log.colaborador) return false;
                            return !nomesDesligados.has(log.colaborador.trim().toUpperCase());
                        })
                        .map(log => ({
                            ...log,
                            dias: DAYS.reduce((acc, day) => {
                                acc[day] = { manha: null, tarde: null };
                                return acc;
                            }, {} as any)
                        }))
                );
            }

            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("historicoAtualizado"));

            alert(`Registro de ${areaName} salvo com sucesso!`);
        } catch (error) {
            console.error("Erro ao exportar:", error);
            alert("Ocorreu um erro ao enviar para o servidor.");
        }
    };

    // ==========================================
    // 8. RETORNO DO HOOK
    // ==========================================
    return {
        activeTab,
        setActiveTab,
        checklist,
        toggleStatus,
        actions,
        addActionRow,
        updateAction,
        removeActionRow,
        showStats,
        setShowStats,
        showActionPlan,
        setShowActionPlan,
        stats: {
            okCount,
            noCount,
            pendingCount,
            totalCells,
            completionRate,
            complianceRate,
            ncRate,
            ncItems,
        },
        lavagemLogs,
        setLavagemLogs,
        addLavagemRow,
        updateLavagemRow,
        toggleLavagemCell,
        removeLavagemRow,
        week,
        setWeek,
        signatures,
        setSignatures,
        colaboradores,
        carregarColaboradores,
        criarColaborador,
        atualizarColaborador,
        desativarColaborador,
        reativarColaborador,
        salvarColaborador,
        exportarExcel,
    };
}