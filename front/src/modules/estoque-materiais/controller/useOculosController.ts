/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { exportEstoqueToExcel } from "../services/excelFormatter";
import {
    listarRegistrosOculos,
    criarRegistroOculos,
    listarColaboradoresOculos,
    criarColaboradorOculos,
    desativarColaboradorOculos,
    atualizarColaboradorOculos,
    salvarDocumento
} from "../../../services/api";

// --- Helpers ---
const gerarIdUnico = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

const DIAS_SEMANA = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

const novoOculos = (colaboradorId?: string): any => ({
    id: gerarIdUnico(),
    colaboradorId: colaboradorId || "",
    dias: { SEG: null, TER: null, QUA: null, QUI: null, SEX: null, SAB: null },
    incidentes: {},
    status: "ATIVO",
    assinaturaSemanal: ""
});

export function useOculosController() {
    // 🔥 CORREÇÃO: Buscando a dataInicio do localStorage para não sumir no F5
    const [dataInicio, setDataInicio] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('oculos_dataInicio');
            if (saved) return saved;
        }
        return "";
    });

    // 🔥 CORREÇÃO: Buscando a dataFim do localStorage para não sumir no F5
    const [dataFim, setDataFim] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('oculos_dataFim');
            if (saved) return saved;
        }
        return "";
    });

    // 🔥 Persistência dos logs no localStorage
    const [oculosLogs, setOculosLogs] = useState<any[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('oculos_dados');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                } catch (e) { /* ignore */ }
            }
        }
        return [];
    });

    const [colaboradoresOculos, setColaboradoresOculos] = useState<any[]>([]);
    const [colaboradoresOculosCompletos, setColaboradoresOculosCompletos] = useState<any[]>([]);

    // 🔥 Persistência do statusMap (situações + observações) no localStorage
    const [statusMap, setStatusMap] = useState<Record<string, any>>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('status_oculos');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { /* ignore */ }
            }
        }
        return {};
    });

    // 🔥 Observação geral
    const [observacaoGeral, setObservacaoGeral] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('oculos_observacao_geral');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { /* ignore */ }
            }
        }
        return "";
    });

    // 🔥 TRAVA DE SEGURANÇA CONTRA MÚLTIPLAS REQUISIÇÕES
    const carregandoRef = useRef(false);

    // --- Persistência automática (UseEffects) ---

    // 🔥 CORREÇÃO: Salvando as datas sempre que elas mudarem
    useEffect(() => {
        localStorage.setItem('oculos_dataInicio', dataInicio);
    }, [dataInicio]);

    useEffect(() => {
        localStorage.setItem('oculos_dataFim', dataFim);
    }, [dataFim]);

    useEffect(() => {
        localStorage.setItem('oculos_observacao_geral', JSON.stringify(observacaoGeral));
    }, [observacaoGeral]);

    useEffect(() => {
        localStorage.setItem('status_oculos', JSON.stringify(statusMap));
    }, [statusMap]);

    useEffect(() => {
        if (oculosLogs.length > 0) {
            localStorage.setItem('oculos_dados', JSON.stringify(oculosLogs));
        } else {
            localStorage.removeItem('oculos_dados');
        }
    }, [oculosLogs]);

    // --- Recarregar dados da API ---
    const recarregarOculos = useCallback(async () => {
        // Bloqueia a execução se já estiver buscando dados
        if (carregandoRef.current) return;
        carregandoRef.current = true;

        try {
            const [colaboradoresData, registrosData] = await Promise.all([
                listarColaboradoresOculos(),
                listarRegistrosOculos()
            ]);

            setColaboradoresOculosCompletos(colaboradoresData);
            const ativos = colaboradoresData.filter((c: any) => c.status !== 'INATIVO');
            setColaboradoresOculos(ativos);

            setStatusMap(prev => {
                const atualizado = { ...prev };
                ativos.forEach((colab: any) => {
                    const statusDoBanco = colab.statusDetalhe || 'NORMAL';
                    atualizado[colab.id] = {
                        status: statusDoBanco,
                        obsList: prev[colab.id]?.obsList || []
                    };
                });
                return atualizado;
            });

            const registrosAtivos = registrosData.filter((reg: any) => reg.status !== 'INATIVO');

            setOculosLogs(prev => {
                if (prev.length > 0) return prev;

                const matrizInicial = ativos.map((c: any) => novoOculos(c.id));

                if (registrosAtivos.length > 0 && dataInicio && dataInicio.length >= 10) {
                    const diasMapa: Record<string, number> = { SEG: 0, TER: 1, QUA: 2, QUI: 3, SEX: 4, SAB: 5 };
                    const dataBase = new Date(dataInicio + "T00:00:00");

                    registrosAtivos.forEach((reg: any) => {
                        const logColab = matrizInicial.find((m: any) => String(m.colaboradorId) === String(reg.colaboradorId));
                        if (logColab) {
                            const dataReg = new Date(reg.data + "T00:00:00");
                            const diffTime = dataReg.getTime() - dataBase.getTime();
                            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                            const diaNome = Object.keys(diasMapa).find(key => diasMapa[key] === diffDays);
                            if (diaNome) {
                                logColab.dias[diaNome] = reg.intacto;
                                if (reg.intacto === false) {
                                    logColab.incidentes[diaNome] = { observacao: reg.observacao || "", assinatura: reg.assinatura || "" };
                                }
                            }
                        }
                    });
                }
                return matrizInicial;
            });
        } catch (error) {
            console.error("Erro ao carregar dados de óculos:", error);
        } finally {
            carregandoRef.current = false;
        }
    }, [dataInicio]);

    useEffect(() => {
        recarregarOculos();
    }, [recarregarOculos]);

    useEffect(() => {
        if (dataInicio) {
            recarregarOculos();
        }
    }, [dataInicio]);

    // --- Gestão do StatusMap ---
    const handleUpdateStatusDropdown = async (id: string, novoStatus: string) => {
        try {
            await atualizarColaboradorOculos(id, { statusDetalhe: novoStatus });

            setStatusMap(prev => {
                const current = prev[id] || { status: 'NORMAL', obsList: [] };
                const novaLista = [...(current.obsList || [])];

                if (novoStatus !== 'NORMAL') {
                    const jaExiste = novaLista.find(o => o.tipo === novoStatus);
                    if (!jaExiste) {
                        novaLista.push({
                            idObs: Date.now().toString(36) + Math.random().toString(36).substring(2),
                            tipo: novoStatus,
                            texto: ''
                        });
                    }
                } else {
                    return {
                        ...prev,
                        [id]: {
                            ...current,
                            status: novoStatus,
                            obsList: []
                        }
                    };
                }

                return {
                    ...prev,
                    [id]: {
                        ...current,
                        status: novoStatus,
                        obsList: novaLista
                    }
                };
            });
        } catch (error: any) {
            console.error("❌ Erro ao atualizar situação:", error);
            alert(`Erro: ${error.message || "Erro ao salvar situação. Tente novamente."}`);
        }
    };

    const handleUpdateObsText = (idUser: string, idObs: string, novoTexto: string) => {
        setStatusMap(prev => {
            const current = prev[idUser] || { status: 'NORMAL', obsList: [] };
            const novaLista = current.obsList.map((o: any) => o.idObs === idObs ? { ...o, texto: novoTexto } : o);
            return {
                ...prev,
                [idUser]: { ...current, obsList: novaLista }
            };
        });
    };

    const handleDeleteObs = (idUser: string, idObs: string) => {
        setStatusMap(prev => {
            const current = prev[idUser] || { status: 'NORMAL', obsList: [] };
            const novaLista = current.obsList.filter((o: any) => o.idObs !== idObs);
            return {
                ...prev,
                [idUser]: { ...current, obsList: novaLista }
            };
        });
    };

    // --- Lógicas da API ---
    const salvarTodosOculos = async () => {
        try {
            if (!dataInicio) { alert("Por favor, selecione a data de início da semana no cabeçalho antes de salvar."); return; }

            const diasMapa: Record<string, number> = { SEG: 0, TER: 1, QUA: 2, QUI: 3, SEX: 4, SAB: 5 };
            const dataBase = new Date(dataInicio + "T00:00:00");
            const promessas = [];

            for (const log of oculosLogs) {
                if (!log.colaboradorId) continue;
                for (const dia of Object.keys(log.dias || {})) {
                    const status = log.dias[dia];
                    if (status === null || status === undefined) continue;

                    const offset = diasMapa[dia] ?? 0;
                    const dataDia = new Date(dataBase);
                    dataDia.setDate(dataBase.getDate() + offset);
                    const dataFormatada = dataDia.toISOString().split("T")[0];

                    const infoIncidente = log.incidentes?.[dia] || {};

                    const intactoStr = status === true ? "SIM" : status === false ? "NÃO" : "FALTA";

                    promessas.push(
                        criarRegistroOculos({
                            data: dataFormatada,
                            colaboradorId: log.colaboradorId,
                            intacto: status === "F" ? null : intactoStr,
                            assinatura: status === false ? infoIncidente.assinatura || "" : "",
                            observacao: status === "F" ? "FALTA DO COLABORADOR" : (status === false ? infoIncidente.observacao || "" : "ÓCULOS INTACTO")
                        })
                            .then(() => ({ sucesso: true, id: log.colaboradorId, dia }))
                            .catch((err) => ({ sucesso: false, erro: err.message }))
                    );
                }
            }

            if (promessas.length === 0) return;

            const resultados = await Promise.all(promessas);
            const erros = resultados.filter(r => !r.sucesso);
            const salvos = resultados.filter(r => r.sucesso).length;

            if (erros.length > 0) {
                console.warn("Erros ao salvar:", erros);
                alert(`Atenção: ${erros.length} registro(s) falharam. Verifique a conexão com o banco.`);
            } else {
                alert(`Todos os ${salvos} registros de óculos foram salvos com sucesso no banco!`);
            }
        } catch (error) {
            console.error("Erro fatal ao salvar:", error);
            alert("Erro geral ao processar os registros de óculos.");
        }
    };

    const addOculosRow = () => setOculosLogs(prev => [...prev, novoOculos()]);

    const adicionarColaboradorOculos = async (nome: string, tipo: "EFETIVO" | "CONTRATADO") => {
        const nomeNormalizado = nome.trim().toUpperCase();
        let listaAtual = colaboradoresOculosCompletos;

        if (listaAtual.length === 0) {
            try {
                listaAtual = await listarColaboradoresOculos();
                setColaboradoresOculosCompletos(listaAtual);
                setColaboradoresOculos(listaAtual.filter((c: any) => c.status !== 'INATIVO'));
            } catch (error) { throw new Error("Não foi possível verificar a existência do colaborador."); }
        }

        const existente = listaAtual.find((c: any) => c.nome?.trim().toUpperCase() === nomeNormalizado);
        if (existente) {
            if (existente.status === 'INATIVO') {
                try { await reativarColaboradorOculos(existente.id, nome, tipo); return; }
                catch (error) { throw new Error("Erro ao reativar colaborador. Tente novamente."); }
            } else { throw new Error(`O colaborador ${existente.nome} já está ativo no sistema.`); }
        }

        try {
            const novoColaborador = await criarColaboradorOculos({
                nome,
                tipo,
                status: "ATIVO",
                statusDetalhe: "NORMAL"
            });
            const novo = { ...novoColaborador, status: "ATIVO", statusDetalhe: "NORMAL" };
            setColaboradoresOculosCompletos(prev => [...prev, novo]);
            setColaboradoresOculos(prev => [...prev, novo]);
            setOculosLogs(prev => [...prev, novoOculos(novo.id)]);

            setStatusMap(prev => ({
                ...prev,
                [novo.id]: { status: 'NORMAL', obsList: [] }
            }));
        } catch (error: any) { throw new Error(error.message || "Erro ao cadastrar colaborador."); }
    };

    const desativarColaboradorOculosHook = async (id: string) => {
        try {
            await desativarColaboradorOculos(id);
            setColaboradoresOculosCompletos(prev => prev.map((c: any) => String(c.id) === String(id) ? { ...c, status: "INATIVO" } : c));
            setColaboradoresOculos(prev => prev.map((c: any) => String(c.id) === String(id) ? { ...c, status: "INATIVO" } : c));
            alert("Colaborador desativado com sucesso! Ele permanecerá visível até a exportação.");
        } catch (error) { alert("Erro ao desativar colaborador."); }
    };

    const atualizarTipoColaborador = async (id: string, novoTipo: "EFETIVO" | "CONTRATADO") => {
        if (!id) { alert("Erro: Este colaborador não possui um ID válido."); return; }
        setColaboradoresOculos(prev => prev.map((c: any) => c.id === id ? { ...c, tipo: novoTipo } : c));
        setColaboradoresOculosCompletos(prev => prev.map((c: any) => c.id === id ? { ...c, tipo: novoTipo } : c));
        try { await atualizarColaboradorOculos(id, { tipo: novoTipo }); }
        catch (error) {
            const tipoAntigo = novoTipo === "EFETIVO" ? "CONTRATADO" : "EFETIVO";
            setColaboradoresOculos(prev => prev.map((c: any) => c.id === id ? { ...c, tipo: tipoAntigo } : c));
            setColaboradoresOculosCompletos(prev => prev.map((c: any) => c.id === id ? { ...c, tipo: tipoAntigo } : c));
        }
    };

    const editarColaboradorOculos = async (id: string, nome: string, tipo: "EFETIVO" | "CONTRATADO") => {
        if (!id) { alert("Erro: ID inválido."); return; }
        const colaboradorAntigo = colaboradoresOculosCompletos.find((c: any) => c.id === id);
        setColaboradoresOculos(prev => prev.map((c: any) => c.id === id ? { ...c, nome, tipo } : c));
        setColaboradoresOculosCompletos(prev => prev.map((c: any) => c.id === id ? { ...c, nome, tipo } : c));
        try { await atualizarColaboradorOculos(id, { nome, tipo }); }
        catch (error) {
            if (colaboradorAntigo) {
                setColaboradoresOculos(prev => prev.map((c: any) => c.id === id ? colaboradorAntigo : c));
                setColaboradoresOculosCompletos(prev => prev.map((c: any) => c.id === id ? colaboradorAntigo : c));
            }
        }
    };

    const reativarColaboradorOculos = async (id: string, nome: string, tipo: "EFETIVO" | "CONTRATADO") => {
        try {
            await atualizarColaboradorOculos(id, { nome, tipo, status: "ATIVO", statusDetalhe: "NORMAL" });
            let existente = colaboradoresOculosCompletos.find((c: any) => c.id === id);
            if (!existente) {
                const data: any[] = await listarColaboradoresOculos();
                setColaboradoresOculosCompletos(data);
                existente = data.find((c: any) => c.id === id);
            }
            const atualizado = { ...existente, nome, tipo, status: "ATIVO", statusDetalhe: "NORMAL" };
            setColaboradoresOculosCompletos((prev: any[]) => prev.map((c: any) => c.id === id ? atualizado : c));
            setColaboradoresOculos((prev: any[]) => [...prev.filter((c: any) => c.id !== id), atualizado]);

            setStatusMap(prev => ({
                ...prev,
                [id]: { status: 'NORMAL', obsList: [] }
            }));
        } catch (error) { throw error; }
    };

    const toggleDiaOculos = (colaboradorId: string, dia: string) => {
        setOculosLogs(prev => prev.map(log => {
            if (String(log.colaboradorId) !== String(colaboradorId)) return log;

            const statusAtual = log.dias?.[dia] ?? null;

            const estados: (boolean | string | null)[] = [null, true, false, "F"];
            const currentIndex = estados.indexOf(statusAtual);
            const novoStatus = estados[(currentIndex + 1) % estados.length];

            const novosDias = { ...log.dias, [dia]: novoStatus };
            const novosIncidentes = { ...log.incidentes };

            if (novoStatus === false) {
                novosIncidentes[dia] = { observacao: "", assinatura: "" };
            } else {
                delete novosIncidentes[dia];
            }

            return { ...log, dias: novosDias, incidentes: novosIncidentes };
        }));
    };

    const updateOculosRow = (colaboradorId: string, field: string, value: any) => {
        setOculosLogs(prev => {
            const existe = prev.some(log => String(log.colaboradorId) === String(colaboradorId));
            if (!existe) return [...prev, { ...novoOculos(colaboradorId), [field]: value }];
            return prev.map(log => String(log.colaboradorId) === String(colaboradorId) ? { ...log, [field]: value } : log);
        });
    };

    // --- Exportação ---
    const exportarExcel = async () => {
        if (!dataInicio || dataInicio.trim() === "") {
            alert("⚠️ O campo 'Data início' é obrigatório para exportar a aba Óculos. Preencha a data e tente novamente.");
            return;
        }
        const confirmar = window.confirm(
            "⚠️ ATENÇÃO!\n\nAo exportar os dados da aba ÓCULOS:\n• Os registros da semana serão salvos.\n• A tela será limpa para um novo período.\n\nDeseja continuar com a exportação?"
        );
        if (!confirmar) return;

        try {
            const now = new Date();
            const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            const logsOculosExportar = oculosLogs.filter(log => {
                const colab = colaboradoresOculos.find(c => String(c.id) === String(log.colaboradorId));
                if (!colab) return false;

                const statusData = statusMap[colab.id];
                const status = statusData?.status || 'NORMAL';

                const hasMarks = DIAS_SEMANA.some(dia => log.dias?.[dia] !== null);

                return status === 'NORMAL' || hasMarks;
            });

            const excelBlob = await exportEstoqueToExcel({
                activeTab: "oculos",
                estoqueLogs: [],
                tesourasLogs: [],
                oculosLogs: logsOculosExportar,
                dataInicio,
                dataFim,
                frequenciaTesoura: "",
                colaboradoresOculos,
                statusMap,
                observacaoGeral
            });

            await salvarDocumento("estoque_material", {
                popCode: "PHU-027",
                titulo: `Estoque/Materiais - Óculos`,
                mes,
                aba: "Óculos",
                dadosEstoque: { oculosLogs: logsOculosExportar }
            }, excelBlob as Blob, `Estoque_Oculos_${now.getTime()}.xlsx`);

            await salvarTodosOculos();

            const ativosOculos = colaboradoresOculosCompletos.filter((c: any) => c.status !== 'INATIVO');
            setColaboradoresOculos(ativosOculos);
            setColaboradoresOculosCompletos(ativosOculos);

            setOculosLogs(ativosOculos.map(c => novoOculos(c.id)));

            setStatusMap(prev => {
                const novoMapa: Record<string, any> = {};
                for (const colab of ativosOculos) {
                    const statusAtual = prev[colab.id]?.status || 'NORMAL';
                    novoMapa[colab.id] = { status: statusAtual, obsList: [] };
                }
                return novoMapa;
            });

            setObservacaoGeral("");
            setDataInicio("");
            setDataFim("");

            // 🔥 CORREÇÃO: Limpando os novos localStorages ao finalizar a exportação
            localStorage.removeItem('oculos_dados');
            localStorage.removeItem('oculos_observacao_geral');
            localStorage.removeItem('oculos_dataInicio');
            localStorage.removeItem('oculos_dataFim');

            alert(`Registro de Óculos salvo e tela limpa com sucesso!`);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar o registro. Verifique a conexão e tente novamente.");
        }
    };

    return {
        dataInicio, setDataInicio, dataFim, setDataFim,
        oculosLogs, colaboradoresOculos,
        statusMap, handleUpdateStatusDropdown, handleUpdateObsText, handleDeleteObs,
        observacaoGeral, setObservacaoGeral,
        exportarExcel, updateOculosRow, toggleDiaOculos,
        addOculosRow,
        adicionarColaboradorOculos,
        desativarColaboradorOculos: desativarColaboradorOculosHook,
        atualizarTipoColaborador,
        editarColaboradorOculos,
        reativarColaboradorOculos,
        recarregarOculos
    };
}