"use client";

import { useState, useEffect } from "react";
import { TabType, ProdutoCatalogo, EstoqueLog, RegistroTesoura, RegistroOculos, EmbalagemEntry } from "../model/estoqueModel";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import { exportEstoqueToExcel } from "../services/excelFormatter";
import {
    salvarDocumento,
    buscarProdutos,
    adicionarProduto,
    atualizarSaldosProdutos,
    listarColaboradoresTesoura,
    criarColaboradorTesoura,
    atualizarColaboradorTesoura,
    listarRegistrosOculos,
    criarRegistroOculos,
    listarColaboradoresOculos,
    criarColaboradorOculos,
    desativarColaboradorOculos,
    atualizarTipoColaboradorOculos,
    atualizarRegistroOculos,
    desativarRegistroOculos,
    atualizarColaboradorOculos
} from "../../../services/api";

interface EstadoPersistido {
    estoqueLogs?: EstoqueLog[];
    tesourasLogs?: RegistroTesoura[];
    oculosLogs?: RegistroOculos[];
    embalagemLogs?: EmbalagemEntry[];
    dataInicio?: string;
    dataFim?: string;
    activeTab?: TabType;
}

export function useEstoqueController() {
    // ---------- Estados principais ----------
    const [activeTab, setActiveTab] = useState<TabType>("estoque");
    const [frequenciaTesoura] = useState("Diária");
    const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    const [colaboradoresAtivos, setColaboradoresAtivos] = useState<any[]>([]);
    const [colaboradoresOculos, setColaboradoresOculos] = useState<any[]>([]);
    const [colaboradoresCompletos, setColaboradoresCompletos] = useState<any[]>([]);

    // ---------- Funções para gerar linhas vazias ----------
    const novaTesoura = (dados?: Partial<RegistroTesoura>): RegistroTesoura => ({
        id: String(Date.now() + Math.random()),
        funcionario: "",
        numeroTesoura: "",
        tipo: "CONTRATADO",
        dias: {
            "SEG": { e: false, d: false }, "TER": { e: false, d: false },
            "QUA": { e: false, d: false }, "QUI": { e: false, d: false },
            "SEX": { e: false, d: false }, "SAB": { e: false, d: false }
        },
        ...dados
    });

    const novoOculos = (colaboradorId?: string): RegistroOculos => ({
        id: String(Date.now() + Math.random()),
        data: "",
        colaboradorId: colaboradorId || "",
        intacto: null,
        assinatura: "",
        observacao: "",
        status: "ATIVO"
    });

    const novaEmbalagem = (): EmbalagemEntry => ({
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        data: new Date().toISOString().split('T')[0],
        horaChegada: "", responsavel: "", tipoTransporte: "", tipoMaterial: "", limpeza: "",
        conservacao: "", estadoTransporte: "", odoresTransporte: "", problemaAcondicionamento: "",
        estadoMaterial: "", materialDanificado: null, materialLimpo: null, comOdores: null,
        observacoes: "", acoesCorretivas: ""
    });

    // ---------- Inicialização dos arrays ----------
    const [estoqueLogs, setEstoqueLogs] = useState<EstoqueLog[]>([{ id: 1, date: new Date().toISOString().split('T')[0], product: "", entry: "", entryUnit: "", exit: "", exitUnit: "", sector: "", whoTook: null, balance: "", responsible: null }]);
    const [tesourasLogs, setTesourasLogs] = useState<RegistroTesoura[]>([]);
    const [oculosLogs, setOculosLogs] = useState<RegistroOculos[]>([]);
    const [embalagemLogs, setEmbalagemLogs] = useState<EmbalagemEntry[]>([novaEmbalagem()]);

    // ---------- Funções auxiliares (estoque) – inalteradas ----------
    const toNumber = (valor: any): number => {
        if (valor == null) return 0;
        const num = Number(String(valor).replace(",", ".").trim());
        return isNaN(num) ? 0 : num;
    };

    const converterUnidade = (qtd: number, deUnidade: string, paraUnidade: string): number | null => {
        if (!qtd) return 0;
        const de = deUnidade?.toLowerCase().trim() || "";
        const para = paraUnidade?.toLowerCase().trim() || "";
        if (!para || de === para) return qtd;
        if (de === "l" && para === "ml") return qtd * 1000;
        if (de === "ml" && para === "l") return qtd / 1000;
        if (de === "kg" && para === "g") return qtd * 1000;
        if (de === "g" && para === "kg") return qtd / 1000;
        return null;
    };

    const recalcularSaldos = (logs: EstoqueLog[], catalogo: ProdutoCatalogo[]): EstoqueLog[] => {
        const saldos = new Map<string, { valor: number; unidade: string }>();
        return logs.map(log => {
            const nomeProduto = log.product?.trim();
            if (!nomeProduto) return { ...log, balance: "" };
            const prodCatalogo = catalogo.find(p => p.nome === nomeProduto);
            const unidadeBase = prodCatalogo?.unidade || log.entryUnit || log.exitUnit || "";
            if (!saldos.has(nomeProduto)) saldos.set(nomeProduto, { valor: toNumber(prodCatalogo?.quantidade), unidade: unidadeBase });
            const estado = saldos.get(nomeProduto)!;
            const unidadeAtual = estado.unidade || unidadeBase;
            const entrada = converterUnidade(toNumber(log.entry), log.entryUnit || unidadeAtual, unidadeAtual);
            const saida = converterUnidade(toNumber(log.exit), log.exitUnit || unidadeAtual, unidadeAtual);
            if (entrada !== null) estado.valor += entrada;
            if (saida !== null) estado.valor -= saida;
            return { ...log, balance: `${Number(estado.valor.toFixed(3))} ${prodCatalogo?.unidade || unidadeAtual}` };
        });
    };

    const atualizarCatalogo = (): ProdutoCatalogo[] => {
        const saldos = new Map<string, number>();
        estoqueLogs.forEach(log => {
            const nomeProduto = log.product?.trim();
            if (!nomeProduto) return;
            const prod = produtos.find(p => p.nome === nomeProduto);
            const unidadBase = prod?.unidade || log.entryUnit || log.exitUnit || "";
            if (!saldos.has(nomeProduto)) saldos.set(nomeProduto, toNumber(prod?.quantidade));
            let atual = saldos.get(nomeProduto)!;
            const entrada = converterUnidade(toNumber(log.entry), log.entryUnit || unidadBase, unidadBase);
            const saida = converterUnidade(toNumber(log.exit), log.exitUnit || unidadBase, unidadBase);
            if (entrada !== null) atual += entrada;
            if (saida !== null) atual -= saida;
            saldos.set(nomeProduto, atual);
        });
        return produtos.map(p => ({
            ...p,
            quantidade: saldos.has(p.nome) ? String(saldos.get(p.nome)) : p.quantidade
        }));
    };


    // ---------- Carregar dados salvos do localStorage ----------
    useEffect(() => {
        const salvo = localStorage.getItem(STORAGE_KEYS.estoque);
        if (salvo) {
            try {
                const parsed = JSON.parse(salvo) as EstadoPersistido;
                if (parsed.activeTab) setActiveTab(parsed.activeTab);
                if (parsed.dataInicio) setDataInicio(parsed.dataInicio);
                if (parsed.dataFim) setDataFim(parsed.dataFim);
                if (parsed.estoqueLogs) setEstoqueLogs(parsed.estoqueLogs);
                if (parsed.tesourasLogs) setTesourasLogs(parsed.tesourasLogs.map(log => ({ ...log, id: String(log.id) })));
                if (parsed.oculosLogs) {
                    setOculosLogs(parsed.oculosLogs.map(log => ({
                        ...log,
                        id: String(log.id),
                        colaboradorId: String(log.colaboradorId || ""),
                        status: log.status || "ATIVO"
                    })));
                }
                if (parsed.embalagemLogs) setEmbalagemLogs(parsed.embalagemLogs);
            } catch (error) { console.error("Erro ao carregar dados salvos:", error); }
        }
    }, []);

    // ---------- Buscar produtos do backend ----------
    useEffect(() => { buscarProdutos("LIMPEZA").then(setProdutos).catch(console.error); }, []);

    // 🔥 CORREÇÃO: Forçar sincronização completa na montagem (force = true)
    useEffect(() => {
        recarregarColaboradores(true);
    }, []);

    const recarregarColaboradores = async (force: boolean = false) => {
        try {
            const data = await listarColaboradoresTesoura();
            setColaboradoresCompletos(data);
            const ativos = data.filter((c: any) => c.tipo !== 'DESLIGADO' && c.tipo !== 'DESLIGADA');
            setColaboradoresAtivos(ativos);

            if (force) {
                const novosLogs = ativos.map((colab: any) => novaTesoura({
                    id: colab.id,
                    funcionario: colab.nome,
                    numeroTesoura: colab.numeroTesoura,
                    tipo: colab.tipo
                }));
                setTesourasLogs(novosLogs);
            } else {
                setTesourasLogs(prev => {
                    const logsExistentes = [...prev];
                    data.forEach((colab: any) => {
                        const jaExiste = logsExistentes.some(log => log.id === colab.id);
                        if (!jaExiste && colab.tipo !== 'DESLIGADO' && colab.tipo !== 'DESLIGADA') {
                            logsExistentes.push(novaTesoura({
                                id: colab.id,
                                funcionario: colab.nome,
                                numeroTesoura: colab.numeroTesoura,
                                tipo: colab.tipo
                            }));
                        }
                    });
                    return logsExistentes;
                });
            }
        } catch (error) {
            console.error("Erro ao recarregar colaboradores:", error);
        }
    };

    // 🔥 Carregar colaboradores de óculos (agora sem filtrar, mantém todos)
    useEffect(() => {
        if (activeTab === "oculos") {
            listarColaboradoresOculos()
                .then((data: any[]) => {
                    setColaboradoresOculos(data); // carrega todos, inclusive INATIVOS
                })
                .catch(console.error);
        }
    }, [activeTab]);

    // 🔥 Carregar registros de óculos com colaboradorId
    useEffect(() => {
        if (activeTab === "oculos") {
            listarRegistrosOculos()
                .then((data: any[]) => {
                    const ativos = data.filter(reg => reg.status !== 'INATIVO').map(reg => ({
                        ...reg,
                        id: String(reg.id),
                        colaboradorId: String(reg.colaboradorId),
                        status: reg.status || "ATIVO"
                    }));
                    setOculosLogs(ativos);
                })
                .catch(console.error);
        }
    }, [activeTab]);

    useEffect(() => { if (produtos.length && estoqueLogs.length) setEstoqueLogs(prev => recalcularSaldos(prev, produtos)); }, [produtos]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.estoque, JSON.stringify({ estoqueLogs, tesourasLogs, oculosLogs, embalagemLogs, activeTab, dataInicio, dataFim }));
    }, [estoqueLogs, tesourasLogs, oculosLogs, embalagemLogs, activeTab, dataInicio, dataFim]);

    // ---------- CRUD Estoque (inalterado) ----------
    const adicionarProdutoCatalogo = async (nome: string, unidade: string, quantidade = "") => {
        try {
            const novo = await adicionarProduto(nome, "LIMPEZA", unidade, quantidade || "0");
            setProdutos(prev => { const novos = [...prev, novo]; setEstoqueLogs(logs => recalcularSaldos(logs, novos)); return novos; });
        } catch (err: any) { alert(err.message); }
    };

    const addEstoqueRow = () => { setEstoqueLogs(prev => recalcularSaldos([...prev, { id: Date.now(), date: new Date().toISOString().split('T')[0], product: "", entry: "", entryUnit: "", exit: "", exitUnit: "", sector: "", whoTook: null, balance: "", responsible: null }], produtos)); };
    const updateEstoque = (id: number, field: keyof EstoqueLog, value: any) => {
        setEstoqueLogs(prev => {
            const novos = prev.map(log => {
                if (log.id !== id) return log;
                const atualizado = { ...log, [field]: value };
                if (field === "product") { const prod = produtos.find(p => p.nome === String(value)); if (prod) { atualizado.entryUnit = prod.unidade; atualizado.exitUnit = prod.unidade; } }
                return atualizado;
            });
            return recalcularSaldos(novos, produtos);
        });
    };
    const removeEstoqueRow = (id: number) => { setEstoqueLogs(prev => prev.length <= 1 ? prev : recalcularSaldos(prev.filter(log => log.id !== id), produtos)); };

    // ---------- CRUD Tesouras ----------
    const addTesouraRow = () => setTesourasLogs(prev => [...prev, novaTesoura()]);

    const updateTesoura = async (id: string, field: string, value: any) => {
        setTesourasLogs(prev => prev.map(log => log.id === id ? { ...log, [field]: value } : log));

        if (field === "tipo" || field === "numeroTesoura" || field === "funcionario") {
            try {
                const logAtual = tesourasLogs.find(log => log.id === id);
                if (!logAtual) return;

                const dadosAtualizacao: any = {};
                if (field === "tipo") dadosAtualizacao.tipo = value;
                if (field === "numeroTesoura") dadosAtualizacao.numeroTesoura = value;
                if (field === "funcionario") dadosAtualizacao.nome = value;

                await atualizarColaboradorTesoura(id, dadosAtualizacao);
                await recarregarColaboradores();
            } catch (error: any) {
                console.error("Erro ao atualizar colaborador:", error);
                if (error.message?.includes("não encontrado") || error.message?.includes("not found")) {
                    alert("Colaborador não existe mais no sistema. Removendo da lista...");
                    setTesourasLogs(prev => prev.filter(log => log.id !== id));
                    await recarregarColaboradores(true);
                } else {
                    alert("Erro ao salvar a alteração. Revertendo...");
                    const valorAntigo = tesourasLogs.find(log => log.id === id)?.[field];
                    setTesourasLogs(prev => prev.map(log =>
                        log.id === id ? { ...log, [field]: valorAntigo } : log
                    ));
                }
            }
        }
    };

    const toggleDiaTesoura = (id: string, dia: string, tipo: 'e' | 'd') => { setTesourasLogs(prev => prev.map(log => log.id === id ? { ...log, dias: { ...log.dias, [dia]: { ...log.dias[dia], [tipo]: !log.dias[dia][tipo] } } } : log)); };
    const removeTesouraRow = (id: string) => { setTesourasLogs(prev => prev.filter(log => log.id !== id)); };

    const adicionarColaborador = async (nome: string, tipo: "EFETIVO" | "CONTRATADO", numero: string) => {
        if (colaboradoresCompletos.length === 0) {
            await recarregarColaboradores();
        }

        const nomeNormalizado = nome.trim().toUpperCase();
        const existente = colaboradoresCompletos.find(
            (c) => c.nome?.trim().toUpperCase() === nomeNormalizado
        );

        if (existente) {
            const tipoAtual = existente.tipo?.toUpperCase();
            if (tipoAtual === 'DESLIGADO' || tipoAtual === 'DESLIGADA') {
                try {
                    await reativarColaborador(existente.id, tipo, numero);
                    await recarregarColaboradores();
                    return;
                } catch (error) {
                    throw error;
                }
            } else {
                throw new Error(`O colaborador ${nome} já está ativo no sistema.`);
            }
        }

        try {
            const novo = await criarColaboradorTesoura({ nome, numeroTesoura: numero, tipo });
            setColaboradoresAtivos(prev => [...prev, novo]);
            setTesourasLogs(prev => [...prev, novaTesoura({ id: novo.id, funcionario: novo.nome, numeroTesoura: novo.numeroTesoura, tipo: novo.tipo })]);
            await recarregarColaboradores();
        } catch (error: any) {
            throw error;
        }
    };

    const reativarColaborador = async (id: string, tipo: "EFETIVO" | "CONTRATADO", numero: string) => {
        try {
            await atualizarColaboradorTesoura(id, {
                tipo,
                numeroTesoura: numero
            });
            await recarregarColaboradores();
        } catch (error) {
            console.error("Erro na reativação:", error);
            throw error;
        }
    };

    // ---------- CRUD Óculos (CORRIGIDO) ----------
    const adicionarColaboradorOculos = async (nome: string, tipo: "EFETIVO" | "CONTRATADO") => {
        const nomeNormalizado = nome.trim().toUpperCase();
        const existente = colaboradoresOculos.find(
            (c) => c.nome?.trim().toUpperCase() === nomeNormalizado
        );

        if (existente) {
            if (existente.status === 'INATIVO') {
                try {
                    await reativarColaboradorOculos(existente.id, nome, tipo);
                    return; // reativação bem-sucedida
                } catch (error) {
                    throw error;
                }
            } else {
                throw new Error(`O colaborador ${nome} já está ativo no sistema.`);
            }
        }

        try {
            const novoColaborador = await criarColaboradorOculos({ nome, tipo });
            setColaboradoresOculos(prev => [...prev, { ...novoColaborador, status: "ATIVO" }]);
            const novaLinha = novoOculos(novoColaborador.id);
            setOculosLogs(prev => [...prev, novaLinha]);
        } catch (error: any) {
            console.error("Erro ao cadastrar colaborador óculos:", error);
            throw error;
        }
    };

    // 🔥 CORREÇÃO: ao desativar, mantém o colaborador no estado com status INATIVO
    const desativarColaborador = async (id: string) => {
        try {
            await desativarColaboradorOculos(id);
            setColaboradoresOculos(prev =>
                prev.map(c =>
                    String(c.id) === String(id) ? { ...c, status: "INATIVO" } : c
                )
            );
            setOculosLogs(prev => prev.filter(log => String(log.colaboradorId) !== String(id)));
            alert("Colaborador desativado com sucesso!");
        } catch (error) {
            console.error("Erro ao desativar:", error);
            alert("Erro ao desativar colaborador.");
        }
    };

    const atualizarTipoColaborador = async (id: string, novoTipo: "EFETIVO" | "CONTRATADO") => {
        if (!id) {
            console.error("Erro: Tentativa de atualizar colaborador sem ID!");
            alert("Erro: Este colaborador não possui um ID válido.");
            return;
        }

        setColaboradoresOculos(prev =>
            prev.map(c => c.id === id ? { ...c, tipo: novoTipo } : c)
        );

        try {
            await atualizarTipoColaboradorOculos(id, novoTipo);
        } catch (error) {
            console.error("Erro ao atualizar o contrato no banco:", error);
            alert("Ocorreu um erro ao atualizar o contrato no banco de dados.");
            const tipoAntigo = novoTipo === "EFETIVO" ? "CONTRATADO" : "EFETIVO";
            setColaboradoresOculos(prev =>
                prev.map(c => c.id === id ? { ...c, tipo: tipoAntigo } : c)
            );
        }
    };

    const editarColaboradorOculos = async (id: string, nome: string, tipo: "EFETIVO" | "CONTRATADO") => {
        if (!id) {
            console.error("Erro: Tentativa de editar colaborador sem ID!");
            alert("Erro: Este colaborador não possui um ID válido.");
            return;
        }

        const colaboradorAntigo = colaboradoresOculos.find(c => c.id === id);

        setColaboradoresOculos(prev =>
            prev.map(c => c.id === id ? { ...c, nome, tipo } : c)
        );

        try {
            await atualizarColaboradorOculos(id, { nome, tipo });
        } catch (error) {
            console.error("Erro ao editar o colaborador no banco:", error);
            alert("Ocorreu um erro ao salvar a edição no banco de dados.");
            if (colaboradorAntigo) {
                setColaboradoresOculos(prev =>
                    prev.map(c => c.id === id ? colaboradorAntigo : c)
                );
            }
        }
    };

    const reativarColaboradorOculos = async (id: string, nome: string, tipo: "EFETIVO" | "CONTRATADO") => {
        try {
            await atualizarColaboradorOculos(id, {
                nome,
                tipo,
                status: "ATIVO"
            });
            setColaboradoresOculos(prev =>
                prev.map(c =>
                    String(c.id) === String(id)
                        ? { ...c, nome, tipo, status: "ATIVO" }
                        : c
                )
            );
        } catch (error) {
            console.error("Erro ao reativar colaborador de óculos:", error);
            throw error;
        }
    };

    const addOculosRow = () => { setOculosLogs(prev => [...prev, novoOculos()]); };

    const updateOculosRow = (colaboradorId: string, field: keyof RegistroOculos, value: any) => {
        setOculosLogs(prev => {
            const existe = prev.some(log => String(log.colaboradorId) === String(colaboradorId));
            if (!existe) {
                const novaLinha = novoOculos(colaboradorId);
                novaLinha.data = new Date().toISOString().split('T')[0];
                return [...prev, { ...novaLinha, [field]: value }];
            }
            return prev.map(log =>
                String(log.colaboradorId) === String(colaboradorId) ? { ...log, [field]: value } : log
            );
        });
    };

    const salvarTodosOculos = async () => {
        try {
            const logsParaSalvar = oculosLogs.filter(log => log.data && log.colaboradorId);
            for (const log of logsParaSalvar) {
                await criarRegistroOculos({
                    data: log.data,
                    colaboradorId: log.colaboradorId,
                    intacto: log.intacto,
                    assinatura: log.assinatura,
                    observacao: log.observacao
                });
            }
            alert("Salvo com sucesso!");
            const data = await listarRegistrosOculos();
            const ativos = (data as any[]).filter(reg => reg.status !== 'INATIVO').map(reg => ({
                ...reg,
                id: String(reg.id),
                colaboradorId: String(reg.colaboradorId),
                status: reg.status || "ATIVO"
            }));
            setOculosLogs(ativos);
        } catch (error) {
            console.error("Erro ao salvar:", error);
        }
    };

    // ---------- CRUD Embalagem (inalterado) ----------
    const addEmbalagemRow = () => setEmbalagemLogs(prev => [...prev, novaEmbalagem()]);
    const updateEmbalagem = (id: string, field: keyof EmbalagemEntry, value: any) => { setEmbalagemLogs(prev => prev.map(log => log.id === id ? { ...log, [field]: value } : log)); };
    const removeEmbalagemRow = (id: string) => { setEmbalagemLogs(prev => prev.length > 1 ? prev.filter(log => log.id !== id) : prev); };

    // ---------- Exportar para Excel ----------
    const exportarExcel = async () => {
        try {
            const now = new Date();
            const mes = now.toISOString().slice(0, 7);
            const tabNomes = { estoque: "Estoque", tesouras: "Tesouras", oculos: "Óculos", embalagem: "Embalagem" };
            const docCodigos = { estoque: "PHU-029", tesouras: "PHU-043", oculos: "PHU-027", embalagem: "PHU-032" };

            let dadosEspecificos = {};
            if (activeTab === "estoque") dadosEspecificos = { produtos: atualizarCatalogo(), estoqueLogs };
            if (activeTab === "tesouras") dadosEspecificos = { tesourasLogs, dataInicio, dataFim, frequenciaTesoura };
            if (activeTab === "oculos") dadosEspecificos = { oculosLogs };
            if (activeTab === "embalagem") dadosEspecificos = { embalagemLogs };

            const excelBlob = await exportEstoqueToExcel({
                activeTab,
                estoqueLogs,
                tesourasLogs,
                oculosLogs,
                embalagemLogs,
                dataInicio,
                dataFim,
                frequenciaTesoura,
                colaboradoresOculos
            });
            await salvarDocumento("estoque_material", {
                popCode: docCodigos[activeTab], titulo: `Estoque/Materiais - ${tabNomes[activeTab]}`, mes, aba: tabNomes[activeTab], dadosEstoque: dadosEspecificos
            }, excelBlob as Blob, `Estoque_${activeTab}_${now.getTime()}.xlsx`);

            switch (activeTab) {
                case "estoque":
                    await atualizarSaldosProdutos(atualizarCatalogo()); setProdutos(atualizarCatalogo());
                    setEstoqueLogs([{ id: Date.now(), date: new Date().toISOString().split('T')[0], product: "", entry: "", entryUnit: "", exit: "", exitUnit: "", sector: "", whoTook: null, balance: "", responsible: null }]);
                    break;
                case "tesouras":
                    setTesourasLogs(prev =>
                        prev
                            .filter(log => log.tipo !== "DESLIGADO" && log.tipo !== "DESLIGADA")
                            .map(log => ({
                                ...log,
                                dias: {
                                    "SEG": { e: false, d: false },
                                    "TER": { e: false, d: false },
                                    "QUA": { e: false, d: false },
                                    "QUI": { e: false, d: false },
                                    "SEX": { e: false, d: false },
                                    "SAB": { e: false, d: false }
                                }
                            }))
                    );
                    setDataInicio("");
                    setDataFim("");
                    break;
                case "oculos": setOculosLogs([novoOculos(), novoOculos(), novoOculos()]); break;
                case "embalagem": setEmbalagemLogs([novaEmbalagem()]); break;
            }
            alert(`Registro de ${tabNomes[activeTab]} salvo com sucesso!`);
        } catch (error) { console.error("Erro ao salvar:", error); alert("Erro ao salvar o registro."); }
    };

    // ---------- RETORNO ----------
    return {
        activeTab, setActiveTab, produtos, adicionarProdutoCatalogo,
        estoqueLogs, addEstoqueRow, updateEstoque, removeEstoqueRow,
        tesourasLogs, addTesouraRow, updateTesoura, toggleDiaTesoura, removeTesouraRow,
        adicionarColaborador, reativarColaborador, colaboradoresAtivos,
        colaboradoresCompletos,
        dataInicio, setDataInicio, dataFim, setDataFim, frequenciaTesoura,
        desativarColaboradorOculos: desativarColaborador,

        oculosLogs,
        addOculosRow,
        updateOculosRow,
        colaboradoresOculos,
        adicionarColaboradorOculos,
        salvarTodosOculos,
        atualizarTipoColaborador,
        editarColaboradorOculos,
        reativarColaboradorOculos,

        embalagemLogs, addEmbalagemRow, updateEmbalagem, removeEmbalagemRow,
        exportarExcel
    };
}