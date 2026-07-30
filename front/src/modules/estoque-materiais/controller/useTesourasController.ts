/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RegistroTesoura } from "../model/estoqueModel";
import { exportEstoqueToExcel } from "../services/excelFormatter";
import {
    listarColaboradoresTesoura,
    criarColaboradorTesoura,
    atualizarColaboradorTesoura,
    salvarDocumento
} from "../../../services/api";

// --- Helpers ---
const gerarIdUnico = () => Date.now().toString(36) + Math.random().toString(36).substring(2);
const novaTesoura = (dados?: Partial<RegistroTesoura>): RegistroTesoura => ({
    id: gerarIdUnico(),
    funcionario: "",
    numeroTesoura: "",
    tipo: "CONTRATADO",
    statusTesoura: "EM_USO",
    visivel: true, // 🔥 Adicionado controle de visibilidade (Excel)
    dias: {
        "SEG": { e: false, d: false, f: false }, "TER": { e: false, d: false, f: false },
        "QUA": { e: false, d: false, f: false }, "QUI": { e: false, d: false, f: false },
        "SEX": { e: false, d: false, f: false }, "SAB": { e: false, d: false, f: false }
    },
    ...dados
});

export function useTesourasController() {
    // 🔥 CORREÇÃO: Buscando a dataInicio do localStorage para não sumir no F5
    const [dataInicio, setDataInicio] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('tesouras_dataInicio');
            if (saved) return saved;
        }
        return "";
    });

    // 🔥 CORREÇÃO: Buscando a dataFim do localStorage para não sumir no F5
    const [dataFim, setDataFim] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('tesouras_dataFim');
            if (saved) return saved;
        }
        return "";
    });

    const [frequenciaTesoura] = useState("Diária");
    const [busca, setBusca] = useState("");
    const [colaboradoresAtivos, setColaboradoresAtivos] = useState<any[]>([]);
    const [colaboradoresCompletos, setColaboradoresCompletos] = useState<any[]>([]);

    const [tesourasLogs, setTesourasLogs] = useState<any[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('tesouras_dados');
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

    const [statusMap, setStatusMap] = useState<Record<string, any>>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('status_tesouras');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { /* ignore */ }
            }
        }
        return {};
    });

    const [observacaoGeral, setObservacaoGeral] = useState<string>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('tesouras_observacao_geral');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { /* ignore */ }
            }
        }
        return "";
    });

    const [exportadosIds, setExportadosIds] = useState<Set<string>>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('tesouras_exportados');
            if (saved) {
                try { return new Set(JSON.parse(saved)); } catch (e) { }
            }
        }
        return new Set();
    });

    const carregandoRef = useRef(false);

    const salvarExportados = useCallback((ids: string[]) => {
        const novoSet = new Set([...exportadosIds, ...ids]);
        setExportadosIds(novoSet);
        localStorage.setItem('tesouras_exportados', JSON.stringify([...novoSet]));
    }, [exportadosIds]);

    // 🔥 CORREÇÃO: Salvando as datas no localStorage sempre que mudarem
    useEffect(() => { localStorage.setItem('tesouras_dataInicio', dataInicio); }, [dataInicio]);
    useEffect(() => { localStorage.setItem('tesouras_dataFim', dataFim); }, [dataFim]);

    useEffect(() => { localStorage.setItem('tesouras_dados', JSON.stringify(tesourasLogs)); }, [tesourasLogs]);
    useEffect(() => { localStorage.setItem('tesouras_observacao_geral', JSON.stringify(observacaoGeral)); }, [observacaoGeral]);
    useEffect(() => { localStorage.setItem('status_tesouras', JSON.stringify(statusMap)); }, [statusMap]);

    const recarregarColaboradores = useCallback(async (force: boolean = false) => {
        if (carregandoRef.current) return;
        carregandoRef.current = true;

        try {
            const data = await listarColaboradoresTesoura();
            setColaboradoresCompletos(data);
            const dadosFiltrados = data.filter((colab: any) => !exportadosIds.has(colab.id));
            const ativos = dadosFiltrados.filter((c: any) => c.tipo !== 'DESLIGADO' && c.tipo !== 'DESLIGADA');
            setColaboradoresAtivos(ativos);

            const novoStatusMap: Record<string, any> = {};
            ativos.forEach((colab: any) => {
                const situacao = colab.statusDetalhe || 'NORMAL';
                novoStatusMap[colab.id] = {
                    status: situacao,
                    obsList: statusMap[colab.id]?.obsList || []
                };
            });
            setStatusMap(prev => ({ ...prev, ...novoStatusMap }));

            setTesourasLogs(prev => {
                const logsExistentes = new Map(prev.map(log => [log.id, log]));
                if (force) {
                    return dadosFiltrados.map((colab: any) => ({
                        ...novaTesoura({
                            id: colab.id,
                            funcionario: colab.nome,
                            numeroTesoura: colab.numeroTesoura,
                            tipo: colab.tipo,
                            statusTesoura: "EM_USO"
                        }),
                        dias: logsExistentes.get(colab.id)?.dias || novaTesoura().dias,
                    }));
                }
                const novosLogs: any[] = [];
                dadosFiltrados.forEach((colab: any) => {
                    const existente = logsExistentes.get(colab.id);
                    if (existente) {
                        novosLogs.push({
                            ...existente,
                            funcionario: colab.nome,
                            numeroTesoura: colab.numeroTesoura,
                            tipo: colab.tipo,
                            statusTesoura: colab.statusTesoura || "EM_USO",
                            visivel: existente.visivel !== false // mantém o state de visibilidade
                        });
                    } else {
                        novosLogs.push(novaTesoura({
                            id: colab.id,
                            funcionario: colab.nome,
                            numeroTesoura: colab.numeroTesoura,
                            tipo: colab.tipo,
                            statusTesoura: "EM_USO"
                        }));
                    }
                });
                return novosLogs;
            });
        } catch (error) {
            console.error("Erro ao recarregar colaboradores:", error);
        } finally {
            carregandoRef.current = false;
        }
    }, [exportadosIds]);

    useEffect(() => {
        recarregarColaboradores(false);
    }, [recarregarColaboradores]);

    const handleUpdateStatusDropdown = async (id: string, novoStatus: string) => {
        try {
            await atualizarColaboradorTesoura(id, { statusDetalhe: novoStatus });
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
                        [id]: { ...current, status: novoStatus, obsList: [] }
                    };
                }
                return {
                    ...prev,
                    [id]: { ...current, status: novoStatus, obsList: novaLista }
                };
            });
        } catch (error) {
            console.error("Erro ao atualizar situação:", error);
            alert("Erro ao salvar situação. Tente novamente.");
        }
    };

    const handleUpdateObsText = (idUser: string, idObs: string, novoTexto: string) => {
        setStatusMap(prev => {
            const current = prev[idUser] || { status: 'NORMAL', obsList: [] };
            const novaLista = current.obsList.map((o: any) => o.idObs === idObs ? { ...o, texto: novoTexto } : o);
            return { ...prev, [idUser]: { ...current, obsList: novaLista } };
        });
    };

    const handleDeleteObs = (idUser: string, idObs: string) => {
        setStatusMap(prev => {
            const current = prev[idUser] || { status: 'NORMAL', obsList: [] };
            const novaLista = current.obsList.filter((o: any) => o.idObs !== idObs);
            return { ...prev, [idUser]: { ...current, obsList: novaLista } };
        });
    };

    const updateTesoura = async (id: string, field: string, value: any) => {
        setTesourasLogs(prev => prev.map(log => log.id === id ? { ...log, [field]: value } : log));
        const camposPersistiveis = ["tipo", "numeroTesoura", "funcionario", "statusTesoura", "statusDetalhe", "status"];
        if (camposPersistiveis.includes(field)) {
            try {
                const logAtual = tesourasLogs.find(log => log.id === id);
                if (!logAtual) return;
                const dadosAtualizacao: any = {};
                switch (field) {
                    case "funcionario": dadosAtualizacao.nome = value; break;
                    case "numeroTesoura":
                        dadosAtualizacao.numeroTesoura = value;
                        if (value && String(value).trim() !== "") {
                            dadosAtualizacao.statusTesoura = "EM_USO";
                            setTesourasLogs(prev => prev.map(log => log.id === id ? { ...log, statusTesoura: "EM_USO" } : log));
                        }
                        break;
                    case "tipo": case "statusTesoura": case "statusDetalhe": case "status":
                        dadosAtualizacao[field] = value; break;
                }
                await atualizarColaboradorTesoura(id, dadosAtualizacao);
                await recarregarColaboradores();
            } catch (error: any) {
                console.error("Erro ao atualizar colaborador:", error);
                const logEncontrado = tesourasLogs.find(log => log.id === id);
                const valorAntigo = logEncontrado ? (logEncontrado as any)[field] : undefined;
                setTesourasLogs(prev => prev.map(log => log.id === id ? { ...log, [field]: valorAntigo } : log));
                alert("Erro ao salvar a alteração. Tente novamente.");
            }
        }
    };

    // 🔥 NOVA FUNÇÃO PARA ALTERNAR VISIBILIDADE
    const toggleVisibilidade = (id: string) => {
        setTesourasLogs(prev => prev.map(log => log.id === id ? { ...log, visivel: log.visivel === false ? true : false } : log));
    };

    const toggleDiaTesoura = (id: string, dia: string, tipo: 'e' | 'd') => {
        setTesourasLogs(prev => prev.map(log => {
            if (log.id !== id) return log;
            const diaAtual = log.dias[dia as keyof typeof log.dias] || { e: false, d: false, f: false };
            let novoDia = { ...diaAtual };

            if (!novoDia.e && !novoDia.d && !novoDia.f) {
                novoDia = { e: tipo === 'e', d: tipo === 'd', f: false };
            } else if ((tipo === 'e' && novoDia.e && !novoDia.f) || (tipo === 'd' && novoDia.d && !novoDia.f)) {
                novoDia = { e: false, d: true, f: true };
            } else if (novoDia.f) {
                novoDia = { e: false, d: false, f: false };
            } else {
                novoDia[tipo] = !novoDia[tipo];
            }
            return { ...log, dias: { ...log.dias, [dia]: novoDia } };
        }));
    };

    const removeTesouraRow = (id: string) => { setTesourasLogs(prev => prev.filter(log => log.id !== id)); };
    const addTesouraRow = () => setTesourasLogs(prev => [...prev, novaTesoura()]);

    const adicionarColaborador = async (nome: string, tipo: "EFETIVO" | "CONTRATADO", numero: string) => {
        let listaAtual = colaboradoresCompletos;
        if (listaAtual.length === 0) {
            listaAtual = await listarColaboradoresTesoura();
            await recarregarColaboradores();
        }
        const nomeNormalizado = nome.trim().toUpperCase();
        const existente = listaAtual.find((c: any) => c.nome?.trim().toUpperCase() === nomeNormalizado);

        if (existente) {
            const tipoAtual = existente.tipo?.toUpperCase();
            if (tipoAtual === 'DESLIGADO' || tipoAtual === 'DESLIGADA') {
                try {
                    const novosExportados = new Set(exportadosIds);
                    novosExportados.delete(existente.id);
                    setExportadosIds(novosExportados);
                    localStorage.setItem('tesouras_exportados', JSON.stringify([...novosExportados]));
                    await reativarColaborador(existente.id, tipo, numero);
                    await recarregarColaboradores();
                    return;
                } catch (error) { throw error; }
            } else { throw new Error(`O colaborador ${nome} já está ativo no sistema.`); }
        }

        try {
            const novo = await criarColaboradorTesoura({
                nome, numeroTesoura: numero, tipo, status: "NORMAL", statusDetalhe: "NORMAL"
            });
            setColaboradoresAtivos(prev => [...prev, novo]);
            setStatusMap(prev => ({ ...prev, [novo.id]: { status: 'NORMAL', obsList: [] } }));
            setTesourasLogs(prev => [...prev, novaTesoura({ id: novo.id, funcionario: novo.nome, numeroTesoura: novo.numeroTesoura, tipo: novo.tipo, statusTesoura: "EM_USO" })]);
            await recarregarColaboradores();
        } catch (error: any) { throw error; }
    };

    const reativarColaborador = async (id: string, tipo: "EFETIVO" | "CONTRATADO", numero: string) => {
        try {
            await atualizarColaboradorTesoura(id, { tipo, numeroTesoura: numero, statusTesoura: "EM_USO" });
            await recarregarColaboradores();
        } catch (error) {
            console.error("Erro na reativação:", error);
            throw error;
        }
    };

    const exportarExcel = async () => {
        const confirmar = window.confirm(
            "⚠️ ATENÇÃO!\n\nAo exportar os dados da aba TESOURAS:\n• Os colaboradores DESLIGADOS serão removidos da lista.\n• Os dias (E/D/F) serão resetados.\n\nDeseja continuar com a exportação?"
        );
        if (!confirmar) return;

        try {
            const now = new Date();
            const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const excelBlob = await exportEstoqueToExcel({
                activeTab: "tesouras",
                estoqueLogs: [],
                oculosLogs: [],
                tesourasLogs,
                dataInicio,
                dataFim,
                frequenciaTesoura,
                colaboradoresOculos: [],
                statusMap,
                observacaoGeral
            });

            await salvarDocumento("estoque_material", {
                popCode: "PHU-043",
                titulo: `Estoque/Materiais - Tesouras`,
                mes,
                aba: "Tesouras",
                dadosEstoque: { tesourasLogs, dataInicio, dataFim, frequenciaTesoura, observacaoGeral }
            }, excelBlob as Blob, `Estoque_Tesouras_${now.getTime()}.xlsx`);

            const desligadosIds = tesourasLogs.filter(log => log.tipo === 'DESLIGADO' || log.tipo === 'DESLIGADA').map(log => log.id);
            if (desligadosIds.length > 0) { salvarExportados(desligadosIds); }

            // Resetar
            setTesourasLogs(prev => prev.filter(log => log.tipo !== "DESLIGADO" && log.tipo !== "DESLIGADA").map(log => ({ ...log, dias: { "SEG": { e: false, d: false, f: false }, "TER": { e: false, d: false, f: false }, "QUA": { e: false, d: false, f: false }, "QUI": { e: false, d: false, f: false }, "SEX": { e: false, d: false, f: false }, "SAB": { e: false, d: false, f: false } } })));

            const novoStatusMap: Record<string, any> = {};
            for (const colab of colaboradoresAtivos) {
                const statusAtual = statusMap[colab.id]?.status || 'NORMAL';
                novoStatusMap[colab.id] = { status: statusAtual, obsList: [] };
            }
            setStatusMap(novoStatusMap);

            setObservacaoGeral("");
            setDataInicio("");
            setDataFim("");

            // 🔥 CORREÇÃO: Limpando os localStorages ao finalizar a exportação
            localStorage.removeItem('tesouras_dataInicio');
            localStorage.removeItem('tesouras_dataFim');

            alert(`Registro de Tesouras salvo com sucesso!`);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar o registro.");
        }
    };

    const tesourasLogsOrdenados = [...tesourasLogs].sort((a, b) => {
        const isDesligadoA = a.tipo === 'DESLIGADO' || a.tipo === 'DESLIGADA';
        const isDesligadoB = b.tipo === 'DESLIGADO' || b.tipo === 'DESLIGADA';
        if (isDesligadoA && !isDesligadoB) return 1;
        if (!isDesligadoA && isDesligadoB) return -1;
        return (a.funcionario || "").localeCompare(b.funcionario || "");
    });

    return {
        dataInicio, setDataInicio, dataFim, setDataFim, frequenciaTesoura, busca, setBusca,
        tesourasLogs: tesourasLogsOrdenados,
        colaboradoresAtivos, colaboradoresCompletos,
        statusMap, handleUpdateStatusDropdown, handleUpdateObsText, handleDeleteObs,
        observacaoGeral, setObservacaoGeral,
        exportarExcel, updateTesoura, toggleDiaTesoura, removeTesouraRow, toggleVisibilidade, // 🔥 EXPORTADO AQUI
        addTesouraRow,
        adicionarColaborador, reativarColaborador, recarregarColaboradores
    };
}