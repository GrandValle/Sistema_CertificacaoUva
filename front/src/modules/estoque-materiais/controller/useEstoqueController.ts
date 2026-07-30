/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { TabType, ProdutoCatalogo, EstoqueLog, CleaningLog, PRODUTOS_LIMPEZA } from "../model/estoqueModel";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import { exportEstoqueToExcel } from "../services/excelFormatter";
import { getHojeLocal } from "../../../utils/date";
import {
    salvarDocumento,
    buscarProdutos,
    adicionarProduto,
    atualizarSaldosProdutos,
} from "../../../services/api";

interface EstadoPersistido {
    estoqueLogs?: EstoqueLog[];
    cleaningLogs?: CleaningLog[];
    selectedCleaningProduct?: string;
    dataInicio?: string;
    dataFim?: string;
    activeTab?: TabType;
}

// ---------- Funções Utilitárias Puras ----------
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

// 🔥 Função exportada com o nome correto
export function useEstoqueEmbalagemController() {
    // ---------- Carregamento Seguro ----------
    const getPersisted = (): EstadoPersistido | null => {
        if (typeof window === "undefined") return null;
        try {
            const salvo = window.localStorage.getItem(STORAGE_KEYS.estoque);
            return salvo ? JSON.parse(salvo) : null;
        } catch { return null; }
    };

    // ---------- Estados ----------
    const [activeTab, setActiveTab] = useState<TabType>(() => getPersisted()?.activeTab || "estoque");
    const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);
    const [dataInicio, setDataInicio] = useState(() => getPersisted()?.dataInicio || "");
    const [dataFim, setDataFim] = useState(() => getPersisted()?.dataFim || "");
    const [isLoading, setIsLoading] = useState(false);

    const [estoqueLogs, setEstoqueLogs] = useState<EstoqueLog[]>(() => {
        const saved = getPersisted()?.estoqueLogs;
        if (saved && saved.length > 0) return saved;
        return [{ id: Date.now(), date: getHojeLocal(), product: "", entry: "", entryUnit: "", exit: "", exitUnit: "", sector: "", whoTook: null, balance: "", responsible: null }];
    });

    // 🔥 Limpeza (integrada à aba Estoque)
    const [selectedCleaningProduct, setSelectedCleaningProduct] = useState(
        () => getPersisted()?.selectedCleaningProduct || PRODUTOS_LIMPEZA[0]
    );
    const [cleaningLogs, setCleaningLogs] = useState<CleaningLog[]>(() => {
        const saved = getPersisted()?.cleaningLogs;
        if (saved && saved.length > 0) return saved;
        return [{
            id: Date.now(),
            date: "",
            product: PRODUTOS_LIMPEZA[0],
            produtoCorreto: null,
            composicaoOk: null,
            embalagemOk: null,
            padraoExigido: null,
            cumprePedido: null,
            responsavel: null
        }];
    });

    // ---------- Funções auxiliares ----------
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

    // ---------- BOOT MASTER ----------
    useEffect(() => {
        async function bootInicial() {
            setIsLoading(true);
            try {
                await Promise.all([
                    buscarProdutos("LIMPEZA").then(setProdutos),
                ]);
            } catch (error) {
                console.error("Erro no carregamento inicial:", error);
            } finally {
                setIsLoading(false);
            }
        }
        bootInicial();
    }, []);

    // ---------- CRUD Estoque ----------
    const adicionarProdutoCatalogo = async (nome: string, unidade: string, quantidade = "") => {
        try {
            const novo = await adicionarProduto(nome, "LIMPEZA", unidade, quantidade || "0");
            setProdutos(prev => { const novos = [...prev, novo]; setEstoqueLogs(logs => recalcularSaldos(logs, novos)); return novos; });
        } catch (err: any) { alert(err.message); }
    };

    const addEstoqueRow = () => {
        const newRow: EstoqueLog = {
            id: Date.now(),
            date: getHojeLocal(),
            product: "",
            entry: "",
            entryUnit: "",
            exit: "",
            exitUnit: "",
            sector: "",
            whoTook: null,
            balance: "",
            responsible: null
        };
        setEstoqueLogs(prev => recalcularSaldos([...prev, newRow], produtos));
    };

    const updateEstoque = (id: number, field: keyof EstoqueLog, value: any) => {
        setEstoqueLogs(prev => {
            const novos = prev.map(log => {
                if (log.id !== id) return log;
                const atualizado = { ...log, [field]: value };
                if (field === "product") {
                    const prod = produtos.find(p => p.nome === String(value));
                    if (prod) {
                        atualizado.entryUnit = prod.unidade;
                        atualizado.exitUnit = prod.unidade;
                    }
                }
                return atualizado;
            });
            return recalcularSaldos(novos, produtos);
        });
    };

    const removeEstoqueRow = (id: number) => {
        setEstoqueLogs(prev => prev.length <= 1 ? prev : recalcularSaldos(prev.filter(log => log.id !== id), produtos));
    };

    // ---------- CRUD Limpeza ----------
    const addCleaningRow = () => {
        setCleaningLogs([...cleaningLogs, {
            id: Date.now(),
            date: "",
            product: selectedCleaningProduct,
            produtoCorreto: null,
            composicaoOk: null,
            embalagemOk: null,
            padraoExigido: null,
            cumprePedido: null,
            responsavel: null
        }]);
    };

    const updateCleaning = (id: number, field: string, value: any) => {
        setCleaningLogs(cleaningLogs.map(log => log.id === id ? { ...log, [field]: value } : log));
    };

    const removeCleaningRow = (id: number) => {
        if (cleaningLogs.length <= 1) {
            alert("É necessário manter pelo menos um registro.");
            return;
        }
        setCleaningLogs(cleaningLogs.filter(p => p.id !== id));
    };

    // ---------- Salvar no localStorage ----------
    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.estoque, JSON.stringify({
            estoqueLogs,
            cleaningLogs,
            selectedCleaningProduct,
            activeTab,
            dataInicio,
            dataFim
        }));
    }, [estoqueLogs, cleaningLogs, selectedCleaningProduct, activeTab, dataInicio, dataFim]);

    // ---------- Exportar para Excel ----------
    const exportarExcel = async (subTab?: "controle" | "inspecao") => {
        let activeTabExport: TabType = activeTab;

        if (activeTab === "estoque" && subTab === "inspecao") {
            activeTabExport = "limpeza";
            if (!cleaningLogs || cleaningLogs.length === 0) {
                alert("Nenhum registro de inspeção de limpeza para exportar.");
                return;
            }
        }

        try {
            const now = new Date();
            const mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const tabNomes: Record<string, string> = {
                estoque: "Estoque",
                limpeza: "Limpeza"
            };
            const docCodigos: Record<string, string> = {
                estoque: "PHU-029",
                limpeza: "PHU-036"
            };

            let dadosEspecificos = {};
            if (activeTabExport === "estoque") dadosEspecificos = { produtos: atualizarCatalogo(), estoqueLogs };
            else if (activeTabExport === "limpeza") dadosEspecificos = { cleaningLogs, selectedCleaningProduct };

            const excelBlob = await exportEstoqueToExcel({
                activeTab: activeTabExport,
                estoqueLogs,
                tesourasLogs: [],
                oculosLogs: [],
                cleaningLogs: activeTabExport === "limpeza" ? cleaningLogs : undefined,
                dataInicio,
                dataFim,
                frequenciaTesoura: "",
                colaboradoresOculos: [],
                statusMap: {}
            });

            await salvarDocumento("estoque_material", {
                popCode: docCodigos[activeTabExport],
                titulo: `Estoque/Materiais - ${tabNomes[activeTabExport]}`,
                mes,
                aba: tabNomes[activeTabExport],
                dadosEstoque: dadosEspecificos
            }, excelBlob as Blob, `Estoque_${activeTabExport}_${now.getTime()}.xlsx`);

            switch (activeTabExport) {
                case "estoque":
                    await atualizarSaldosProdutos(atualizarCatalogo());
                    setProdutos(atualizarCatalogo());
                    setEstoqueLogs([{ id: Date.now(), date: getHojeLocal(), product: "", entry: "", entryUnit: "", exit: "", exitUnit: "", sector: "", whoTook: null, balance: "", responsible: null }]);
                    break;
                case "limpeza":
                    setCleaningLogs([{
                        id: Date.now(),
                        date: "",
                        product: selectedCleaningProduct,
                        produtoCorreto: null,
                        composicaoOk: null,
                        embalagemOk: null,
                        padraoExigido: null,
                        cumprePedido: null,
                        responsavel: null
                    }]);
                    break;
            }
            alert(`Registro de ${tabNomes[activeTabExport]} salvo com sucesso!`);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar o registro.");
        }
    };

    return {
        activeTab,
        setActiveTab,
        produtos,
        adicionarProdutoCatalogo,
        isLoading,
        estoqueLogs,
        addEstoqueRow,
        updateEstoque,
        removeEstoqueRow,
        cleaningLogs,
        addCleaningRow,
        updateCleaning,
        removeCleaningRow,
        selectedCleaningProduct,
        setSelectedCleaningProduct,
        dataInicio,
        setDataInicio,
        dataFim,
        setDataFim,
        exportarExcel
    };
}