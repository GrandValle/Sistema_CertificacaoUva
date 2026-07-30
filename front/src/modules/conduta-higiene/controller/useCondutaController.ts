"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    ChecklistRow,
    ActionPlan,
    LavagemLog,
    ColaboradorLavagem,
    QUESTIONS,
    DAYS,
    DayStatus,
    CondutaTabType,
    ObservacoesPorDia,
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
    weekLavagem?: string;
    signatures?: { coordinator: string | null };
    checklist?: ChecklistRow[];
    actions?: ActionPlan[];
    lavagemLogs?: LavagemLog[];
    lavagemHorarios?: {
        [day: string]: {
            manha: string;
            tarde: string;
        };
    };
    observacoes?: ObservacoesPorDia;
    statusMapLavagem?: Record<string, any>;
    observacaoGeralLavagem?: string;
}

// ==========================================
// FUNÇÕES PURAS E DEFAULTS
// ==========================================
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

const defaultLavagemHorarios = () =>
    DAYS.reduce((acc, day) => {
        acc[day] = { manha: "09:00", tarde: "14:00" };
        return acc;
    }, {} as Record<string, { manha: string; tarde: string }>);

const defaultLavagemLogs: LavagemLog[] = [];

const getPersistedData = (): CondutaPersistedData | null => {
    if (typeof window === "undefined") return null;
    try {
        const saved = window.localStorage.getItem(STORAGE_KEYS.conduta);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
};

export function useCondutaController() {
    // ==========================================
    // 1. ESTADOS
    // ==========================================
    const [activeTab, setActiveTab] = useState<CondutaTabType>("inspecao");
    const [showStats, setShowStats] = useState(true);
    const [showActionPlan, setShowActionPlan] = useState(true);

    const [checklist, setChecklist] = useState<ChecklistRow[]>(() => getPersistedData()?.checklist || defaultChecklist);
    const [actions, setActions] = useState<ActionPlan[]>(() => getPersistedData()?.actions || defaultActions);

    const [lavagemLogs, setLavagemLogs] = useState<LavagemLog[]>(() => {
        const logs = getPersistedData()?.lavagemLogs;
        return logs && logs.length > 0 ? logs : defaultLavagemLogs;
    });

    const [lavagemHorarios, setLavagemHorarios] = useState<Record<string, { manha: string; tarde: string }>>(() => {
        const saved = getPersistedData()?.lavagemHorarios;
        const base = defaultLavagemHorarios();
        if (saved) {
            DAYS.forEach((day) => {
                const val = saved[day];
                if (val?.manha) base[day].manha = val.manha;
                if (val?.tarde) base[day].tarde = val.tarde;
            });
        }
        return base;
    });

    const [week, setWeek] = useState(() => getPersistedData()?.week || getCurrentWeekString(new Date()));

    const [weekLavagem, setWeekLavagem] = useState<string>(() => {
        const saved = getPersistedData()?.weekLavagem;
        return saved || getCurrentWeekString(new Date());
    });

    const [signatures, setSignatures] = useState(() => getPersistedData()?.signatures || { coordinator: null as string | null });

    const [observacoes, setObservacoes] = useState<ObservacoesPorDia>(() => {
        const saved = getPersistedData()?.observacoes;
        if (saved && typeof saved === 'object') {
            const base = DAYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {} as ObservacoesPorDia);
            DAYS.forEach(day => {
                if (saved[day]) base[day] = saved[day];
            });
            return base;
        }
        return DAYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {} as ObservacoesPorDia);
    });

    const [statusMapLavagem, setStatusMapLavagem] = useState<Record<string, { status: string; obsList: { idObs: string; texto: string }[] }>>(() => {
        const saved = getPersistedData()?.statusMapLavagem;
        if (saved && typeof saved === 'object') {
            const converted: Record<string, { status: string; obsList: { idObs: string; texto: string }[] }> = {};
            for (const key in saved) {
                const value = saved[key];
                if (typeof value === 'string') {
                    converted[key] = { status: value, obsList: [] };
                } else if (value && typeof value === 'object' && 'status' in value) {
                    converted[key] = value;
                } else {
                    converted[key] = { status: 'NORMAL', obsList: [] };
                }
            }
            return converted;
        }
        return {};
    });

    const [observacaoGeralLavagem, setObservacaoGeralLavagem] = useState<string>(() => {
        return getPersistedData()?.observacaoGeralLavagem || "";
    });

    const isMounted = useRef(false);

    // 🔥 TRAVA DE SEGURANÇA ADICIONADA AQUI
    const carregandoRef = useRef(false);

    const [colaboradores, setColaboradores] = useState<ColaboradorLavagem[]>([]);

    // ==========================================
    // 2. FUNÇÕES DE API / COLABORADORES
    // ==========================================
    const carregarColaboradores = useCallback(async () => {
        // Bloqueia chamadas em duplicidade
        if (carregandoRef.current) return;
        carregandoRef.current = true;

        try {
            const data = await listarColaboradoresLavagem(false);
            setColaboradores(data);

            setLavagemLogs(prevLogs =>
                prevLogs.map(log => {
                    if (!log.colaboradorId) return log;
                    const colabAtualizado = data.find((c: any) => c.id === log.colaboradorId);
                    if (colabAtualizado) {
                        return {
                            ...log,
                            colaborador: colabAtualizado.nome
                        };
                    }
                    return log;
                })
            );

            setStatusMapLavagem(prev => {
                const novoStatusMap: Record<string, { status: string; obsList: { idObs: string; texto: string }[] }> = {};
                data.forEach((colab: any) => {
                    const statusDetalhe = colab.statusDetalhe || 'NORMAL';
                    const existing = prev[colab.id]?.obsList || [];
                    novoStatusMap[colab.id] = {
                        status: statusDetalhe,
                        obsList: existing
                    };
                });
                return novoStatusMap;
            });
        } catch (error) {
            console.error("Erro ao carregar colaboradores:", error);
        } finally {
            // Libera a trava para permitir futuras requisições
            carregandoRef.current = false;
        }
    }, []);

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

    const atualizarColaborador = async (id: string, nome?: string, tipo?: "EFETIVO" | "CONTRATADO") => {
        try {
            await atualizarColaboradorLavagem(id, nome, tipo, true);
            const dadosAtualizados = await listarColaboradoresLavagem(false);
            setColaboradores(dadosAtualizados);
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

    // ==========================================
    // FUNÇÕES PARA SITUAÇÃO E OBSERVAÇÕES
    // ==========================================
    const updateStatusLavagem = async (id: string, status: string) => {
        try {
            await atualizarColaboradorLavagem(id, undefined, undefined, undefined, undefined, status);
            setStatusMapLavagem(prev => ({
                ...(prev || {}),
                [id]: {
                    ...(prev?.[id] || { status: 'NORMAL', obsList: [] }),
                    status
                }
            }));
        } catch (error) {
            console.error("Erro ao atualizar situação no backend:", error);
            alert("Erro ao salvar situação. Tente novamente.");
        }
    };

    const updateObsLavagem = (id: string, texto: string) => {
        setStatusMapLavagem(prev => {
            const current = prev?.[id] || { status: 'NORMAL', obsList: [] };
            const novaLista = [...current.obsList];
            if (novaLista.length > 0) {
                novaLista[0].texto = texto;
            } else {
                novaLista.push({
                    idObs: Date.now().toString(36) + Math.random().toString(36).substring(2),
                    texto
                });
            }
            return {
                ...prev,
                [id]: {
                    ...current,
                    obsList: novaLista
                }
            };
        });
    };

    const deleteObsLavagem = (id: string) => {
        setStatusMapLavagem(prev => {
            const current = prev?.[id] || { status: 'NORMAL', obsList: [] };
            return {
                ...prev,
                [id]: {
                    ...current,
                    obsList: []
                }
            };
        });
    };

    // ==========================================
    // 3. USE EFFECTS
    // ==========================================
    useEffect(() => {
        // Agora podemos chamar de forma direta e segura graças à trava
        carregarColaboradores();
    }, [carregarColaboradores]);

    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        localStorage.setItem(STORAGE_KEYS.conduta, JSON.stringify({
            week,
            weekLavagem,
            signatures,
            checklist,
            actions,
            lavagemLogs,
            lavagemHorarios,
            observacoes,
            statusMapLavagem: statusMapLavagem || {},
            observacaoGeralLavagem: observacaoGeralLavagem || ""
        }));
    }, [week, weekLavagem, signatures, checklist, actions, lavagemLogs, lavagemHorarios, observacoes, statusMapLavagem, observacaoGeralLavagem]);

    // ==========================================
    // 4. DEMAIS FUNÇÕES
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
            { id: newId, date: "", item: "", nonConformity: "", rootCause: "", action: "", responsible: null, status: "pending" },
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

    const addLavagemRow = () =>
        setLavagemLogs([...lavagemLogs, { id: Date.now(), colaboradorId: "", colaborador: "", dias: defaultDiasLavagem() }]);

    const updateLavagemRow = (id: number, colaboradorId: string) => {
        const colabEncontrado = colaboradores.find(c => c.id === colaboradorId);
        setLavagemLogs(lavagemLogs.map((l) => (l.id === id ? {
            ...l,
            colaboradorId: colaboradorId,
            colaborador: colabEncontrado ? colabEncontrado.nome : ""
        } : l)));
    };

    const removeLavagemRow = (id: number) =>
        setLavagemLogs(lavagemLogs.filter((l) => l.id !== id));

    const toggleLavagemCell = (id: number, day: string, turno: "manha" | "tarde") => {
        setLavagemLogs(prev => prev.map((l) => {
            if (l.id !== id) return l;

            const current = l.dias?.[day]?.[turno] ?? null;

            const estados: ("C" | "NC" | "F" | null)[] = [null, "C", "NC", "F"];
            const currentIndex = estados.indexOf(current);
            const next = estados[(currentIndex + 1) % estados.length];

            let novoTurnoTarde: "C" | "NC" | "F" | null = l.dias[day]?.tarde;

            if (turno === "manha") {
                if (next === "F") {
                    novoTurnoTarde = "F";
                } else if (current === "F") {
                    novoTurnoTarde = null;
                }
            }

            return {
                ...l,
                dias: {
                    ...l.dias,
                    [day]: {
                        ...l.dias[day],
                        [turno]: next,
                        ...(turno === "manha" ? { tarde: novoTurnoTarde } : {})
                    },
                },
            };
        }));
    };

    const updateObservacao = (day: string, value: string) => {
        setObservacoes(prev => ({ ...prev, [day]: value }));
    };

    let okCount = 0, noCount = 0, pendingCount = 0;
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
    // 5. EXPORTAÇÃO
    // ==========================================
    const exportarExcel = async () => {
        try {
            console.log("Gerando arquivo Excel...");
            const now = new Date();
            const areaName = activeTab === "inspecao" ? "Checklist" : "Lavagem";

            const logsLavagemExportar = lavagemLogs.filter(log => {
                const colab = colaboradores.find(c => c.nome === log.colaborador);
                if (!colab) return false;

                const statusData = statusMapLavagem[colab.id];
                const status = statusData?.status || 'NORMAL';

                if (status !== 'NORMAL') {
                    const hasMarks = DAYS.some(day => log.dias[day].manha !== null || log.dias[day].tarde !== null);
                    if (!hasMarks) {
                        return false;
                    }
                }
                return true;
            });

            const weekToUse = activeTab === "inspecao" ? week : weekLavagem;

            const excelBlob = await exportCondutaToExcel({
                activeTab,
                week: weekToUse,
                signatures,
                checklist,
                actions,
                lavagemLogs: activeTab === "lavagem" ? logsLavagemExportar : lavagemLogs,
                lavagemHorarios,
                colaboradores,
                observacoes,
                statusMapLavagem: statusMapLavagem || {},
                observacaoGeralLavagem: observacaoGeralLavagem || ""
            });

            const docCodeMap: Record<CondutaTabType, string> = { inspecao: "PHU-2.9.7", lavagem: "PHU-2.9.1" };
            const titulosMap: Record<CondutaTabType, string> = { inspecao: "Monitoramento de Conduta e Saúde", lavagem: "Monitoramento de Lavagem de Mãos" };

            let dadosConduta = activeTab === "inspecao"
                ? { week, signatures, checklist, actions, observacoes }
                : { week: weekLavagem, lavagemLogs: logsLavagemExportar, lavagemHorarios, statusMapLavagem: statusMapLavagem || {}, observacaoGeralLavagem: observacaoGeralLavagem || "" };

            const dadosDoBanco = {
                popCode: docCodeMap[activeTab],
                titulo: titulosMap[activeTab],
                mes: weekToUse,
                semana: weekToUse,
                aba: areaName,
                setor: areaName,
                dadosConduta: dadosConduta,
            };

            await salvarDocumento("conduta_higiene", dadosDoBanco, excelBlob as Blob, `Conduta_${areaName}_${now.getTime()}.xlsx`);

            if (activeTab === "inspecao") {
                setChecklist(defaultChecklist);
                setActions(defaultActions);
                setSignatures({ coordinator: null });
                setWeek(getCurrentWeekString(new Date()));
                setObservacoes(DAYS.reduce((acc, day) => ({ ...acc, [day]: "" }), {} as ObservacoesPorDia));
            } else {
                const nomesDesligados = new Set(
                    colaboradores.filter(c => c.ativo === false && c.nome).map(c => c.nome.trim().toUpperCase())
                );

                setLavagemLogs(prev =>
                    prev.filter(log => {
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

                setStatusMapLavagem(prev => {
                    const nextStatusMap = { ...prev };
                    for (const key in nextStatusMap) {
                        nextStatusMap[key] = { ...nextStatusMap[key], obsList: [] };
                    }
                    return nextStatusMap;
                });

                setObservacaoGeralLavagem("");
                window.dispatchEvent(new Event("limparAbasObservacao"));
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
    // 6. RETORNO
    // ==========================================
    return {
        activeTab, setActiveTab,
        checklist, toggleStatus,
        actions, addActionRow, updateAction, removeActionRow,
        showStats, setShowStats,
        showActionPlan, setShowActionPlan,
        stats: { okCount, noCount, pendingCount, totalCells, completionRate, complianceRate, ncRate, ncItems },
        lavagemLogs, setLavagemLogs,
        lavagemHorarios, setLavagemHorarios,
        addLavagemRow, updateLavagemRow, toggleLavagemCell, removeLavagemRow,
        week, setWeek,
        weekLavagem, setWeekLavagem,
        signatures, setSignatures,
        colaboradores, carregarColaboradores,
        atualizarColaborador, desativarColaborador, salvarColaborador,
        exportarExcel,
        observacoes, updateObservacao,
        statusMapLavagem,
        updateStatusLavagem,
        updateObsLavagem,
        deleteObsLavagem,
        observacaoGeralLavagem,
        setObservacaoGeralLavagem
    };
}