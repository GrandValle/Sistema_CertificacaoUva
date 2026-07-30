"use client";

import { useState, useEffect } from "react";
import { SignatureSelector } from "../../../components/SignatureSelector";
import { BiPlus, BiTrash, BiCalendar, BiClipboard, BiPackage, BiFilterAlt } from "react-icons/bi";
import { UNIDADES_MEDIDA, ProdutoCatalogo, EstoqueLog } from "../model/estoqueModel";
import { PRODUTOS_LIMPEZA } from "../model/estoqueModel";

interface AbaEstoqueProps {
    produtos: ProdutoCatalogo[];
    estoqueLogs: EstoqueLog[];
    addEstoqueRow: () => void;
    updateEstoque: (id: number, field: keyof EstoqueLog, value: any) => void;
    removeEstoqueRow: (id: number) => void;
    adicionarProdutoCatalogo: (nome: string, unidade: string, quantidade?: string) => Promise<void>;
    prepareSignatureInteraction: () => void;

    // Props da inspeção de limpeza
    cleaningLogs: any[];
    addCleaningRow: () => void;
    updateCleaning: (id: number, field: string, value: any) => void;
    removeCleaningRow: (id: number) => void;
    selectedCleaningProduct: string;
    setSelectedCleaningProduct: (product: string) => void;

    // Controle da sub-aba
    subTab: "controle" | "inspecao";
    setSubTab: (tab: "controle" | "inspecao") => void;
}

export function AbaEstoque({
    produtos,
    estoqueLogs,
    addEstoqueRow,
    updateEstoque,
    removeEstoqueRow,
    adicionarProdutoCatalogo,
    prepareSignatureInteraction,
    cleaningLogs,
    addCleaningRow,
    updateCleaning,
    removeCleaningRow,
    selectedCleaningProduct,
    setSelectedCleaningProduct,
    subTab,
    setSubTab,
}: AbaEstoqueProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEstoqueInitialized, setIsEstoqueInitialized] = useState(false);
    const [isInspecaoInitialized, setIsInspecaoInitialized] = useState(false);

    // 🔥 1. LISTA EXCLUSIVA PARA O CONTROLE DE ESTOQUE (Catálogo dinâmico)
    const produtosEstoqueUnicos = produtos.filter((p, index, self) =>
        index === self.findIndex(t => t.nome.toLowerCase() === p.nome.toLowerCase())
    );

    // 🔥 2. LISTA EXCLUSIVA PARA A INSPEÇÃO DE LIMPEZA (Produtos de recebimento)
    const produtosInspecaoUnicos = PRODUTOS_LIMPEZA.filter((nome, index, self) =>
        index === self.findIndex(t => t.toLowerCase() === nome.toLowerCase())
    );

    // ─────────────────────────────────────────────────────────
    // 🔥 ESTADOS E AUTOMAÇÕES DA ABA CONTROLE (ESTOQUE)
    // ─────────────────────────────────────────────────────────
    const [selectedProductTab, setSelectedProductTab] = useState<string>("");

    useEffect(() => {
        if (!isEstoqueInitialized && produtosEstoqueUnicos.length > 0) {
            setSelectedProductTab(produtosEstoqueUnicos[0].nome);
            setIsEstoqueInitialized(true);
        }
    }, [produtosEstoqueUnicos, isEstoqueInitialized]);

    useEffect(() => {
        if (isEstoqueInitialized && selectedProductTab) {
            const logsDoProdutoAtual = estoqueLogs.filter(log => log.product === selectedProductTab);
            const temLinhaVaziaEsperando = estoqueLogs.some(log => !log.product);

            if (logsDoProdutoAtual.length === 0 && !temLinhaVaziaEsperando) {
                addEstoqueRow();
            }
        }
    }, [selectedProductTab, estoqueLogs, isEstoqueInitialized, addEstoqueRow]);

    useEffect(() => {
        const linhaNova = estoqueLogs.find(log => !log.product);
        if (linhaNova && selectedProductTab) {
            updateEstoque(linhaNova.id, "product", selectedProductTab);
            updateEstoque(linhaNova.id, "sector", "PACKING UVA");
        }
    }, [estoqueLogs, selectedProductTab, updateEstoque]);

    const logsFiltradosEstoque = estoqueLogs.filter(log => log.product === selectedProductTab);


    // ─────────────────────────────────────────────────────────
    // 🔥 ESTADOS E AUTOMAÇÕES DA ABA INSPEÇÃO (INDEPENDENTE)
    // ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isInspecaoInitialized && produtosInspecaoUnicos.length > 0) {
            setSelectedCleaningProduct(produtosInspecaoUnicos[0]);
            setIsInspecaoInitialized(true);
        }
    }, [produtosInspecaoUnicos, selectedCleaningProduct, setSelectedCleaningProduct, isInspecaoInitialized]);

    useEffect(() => {
        if (isInspecaoInitialized && selectedCleaningProduct) {
            const logsDaInspecao = cleaningLogs.filter(log => log.product === selectedCleaningProduct);
            const temLinhaVaziaInspecao = cleaningLogs.some(log => !log.product);

            if (logsDaInspecao.length === 0 && !temLinhaVaziaInspecao) {
                addCleaningRow();
            }
        }
    }, [selectedCleaningProduct, cleaningLogs, isInspecaoInitialized, addCleaningRow]);

    useEffect(() => {
        const linhaNovaInspecao = cleaningLogs.find(log => !log.product);
        if (linhaNovaInspecao && selectedCleaningProduct) {
            updateCleaning(linhaNovaInspecao.id, 'product', selectedCleaningProduct);
        }
    }, [cleaningLogs, selectedCleaningProduct, updateCleaning]);

    const logsFiltradosInspecao = cleaningLogs.filter(log => log.product === selectedCleaningProduct);

    const handleAddCleaningRow = () => {
        addCleaningRow();
        setTimeout(() => {
            const ultimoLog = cleaningLogs[cleaningLogs.length - 1];
            if (ultimoLog && !ultimoLog.product && selectedCleaningProduct) {
                updateCleaning(ultimoLog.id, 'product', selectedCleaningProduct);
            }
        }, 30);
    };

    return (
        <div className="space-y-6 animate-fade-in relative">

            {/* ───────────────────────────────────────────────────────── */}
            {/* CABEÇALHO PRINCIPAL E ABAS DE CONTROLE / INSPEÇÃO          */}
            {/* ───────────────────────────────────────────────────────── */}
            <div className="bg-slate-50 border-l-4 border-blue-600 rounded-r-lg p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-black text-slate-800 text-lg uppercase">
                        {subTab === "controle"
                            ? "Controle de Estoque - Material de Limpeza"
                            : "Inspeção de Material de Limpeza"}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium">
                        {subTab === "controle" ? "Gerenciamento de estoque por produto" : "Inspeção de entrada de insumos no recebimento"}
                    </p>
                </div>
                <div className="flex bg-slate-200 rounded-lg p-1 shadow-inner">
                    <button
                        onClick={() => setSubTab("controle")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${subTab === "controle"
                            ? "bg-white text-blue-600 shadow-md"
                            : "text-slate-600 hover:bg-slate-300/50"
                            }`}
                    >
                        <BiPackage size={18} /> Controle
                    </button>
                    <button
                        onClick={() => setSubTab("inspecao")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-black transition-all ${subTab === "inspecao"
                            ? "bg-white text-cyan-600 shadow-md"
                            : "text-slate-600 hover:bg-slate-300/50"
                            }`}
                    >
                        <BiClipboard size={18} /> Inspeção
                    </button>
                </div>
            </div>

            {/* ───────────────────────────────────────────────────────── */}
            {/* CONTEÚDO DA SUB-ABA CONTROLE (ESTOQUE)                    */}
            {/* ───────────────────────────────────────────────────────── */}
            {subTab === "controle" ? (
                <>
                    {/* BARRA DE SELEÇÃO DE PRODUTOS DE ESTOQUE */}
                    <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-md">
                        <div className="flex items-center gap-2 mb-3">
                            <BiFilterAlt className="text-blue-600" size={18} />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Selecione o Produto para Visualizar e Lançar</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-blue-300">
                            {produtosEstoqueUnicos.map(p => {
                                const isSelected = selectedProductTab === p.nome;
                                return (
                                    <button
                                        key={p.nome}
                                        onClick={() => setSelectedProductTab(p.nome)}
                                        className={`whitespace-nowrap px-5 py-3 rounded-xl text-xs font-black transition-all shadow-sm border-2 ${isSelected
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-700 shadow-lg scale-105 ring-4 ring-blue-100"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                            }`}
                                    >
                                        📦 {p.nome}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* TABELA DE ESTOQUE */}
                    <div className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-md bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-300">
                                <thead className="bg-slate-100 border-b-2 border-slate-200 uppercase text-[11px] text-slate-700 font-black">
                                    <tr>
                                        <th className="py-4 px-3 text-left w-36">Data</th>
                                        <th className="py-4 px-3 text-left min-w-40">Produto</th>
                                        <th className="py-4 px-2 text-center w-27.5">Entrada</th>
                                        <th className="py-4 px-2 text-center w-27.5">Saída</th>
                                        <th className="py-4 px-3 text-left min-w-40">Setor</th>
                                        <th className="py-4 px-3 text-center min-w-50">Quem Pegou?</th>
                                        <th className="py-4 px-3 text-center w-36">Saldo</th>
                                        <th className="py-4 px-3 text-center min-w-50">Responsável</th>
                                        <th className="py-4 px-3 text-center w-16">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-slate-50">
                                    {logsFiltradosEstoque.map((log) => {
                                        return (
                                            <tr key={log.id} className="hover:bg-blue-50/30 transition-colors bg-white group">
                                                <td className="py-3 px-2">
                                                    <div className="relative flex items-center">
                                                        <BiCalendar className="absolute left-2.5 text-slate-400 pointer-events-none" size={15} />
                                                        <input
                                                            type="date"
                                                            value={log.date}
                                                            onChange={(e) => updateEstoque(log.id, "date", e.target.value)}
                                                            className="w-full bg-white border-2 border-slate-200 rounded-lg pl-8 pr-2 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 group-hover:border-blue-300 transition-colors !bg-white !text-slate-900"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="w-full bg-slate-100 border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-black text-slate-500 flex items-center shadow-inner cursor-not-allowed uppercase">
                                                        {log.product || selectedProductTab}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center w-full border-2 rounded-lg overflow-hidden transition-colors bg-white border-slate-200 group-hover:border-blue-300 shadow-sm">
                                                        <input
                                                            type="number"
                                                            value={log.entry}
                                                            onChange={(e) => updateEstoque(log.id, "entry", e.target.value)}
                                                            className="w-14 px-2 py-2 text-xs font-bold text-green-700 placeholder:text-slate-300 text-center outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="0"
                                                        />
                                                        <select
                                                            value={log.entryUnit}
                                                            onChange={(e) => updateEstoque(log.id, "entryUnit", e.target.value)}
                                                            className="flex-1 bg-transparent text-[10px] font-bold text-slate-600 outline-none cursor-pointer !bg-transparent"
                                                        >
                                                            <option value="">-</option><option value="L">L</option><option value="ml">ml</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <div className="flex items-center w-full border-2 rounded-lg overflow-hidden transition-colors bg-white border-slate-200 group-hover:border-blue-300 shadow-sm">
                                                        <input
                                                            type="number"
                                                            value={log.exit}
                                                            onChange={(e) => updateEstoque(log.id, "exit", e.target.value)}
                                                            className="w-14 px-2 py-2 text-xs font-bold text-red-600 placeholder:text-slate-300 text-center outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            placeholder="0"
                                                        />
                                                        <select
                                                            value={log.exitUnit}
                                                            onChange={(e) => updateEstoque(log.id, "exitUnit", e.target.value)}
                                                            className="flex-1 bg-transparent text-[10px] font-bold text-slate-600 outline-none cursor-pointer !bg-transparent"
                                                        >
                                                            <option value="">-</option><option value="L">L</option><option value="ml">ml</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <input
                                                        type="text"
                                                        value={log.sector}
                                                        onChange={(e) => updateEstoque(log.id, "sector", e.target.value.toUpperCase())}
                                                        className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 group-hover:border-blue-300 transition-colors outline-none !bg-white !text-slate-900"
                                                        placeholder="SETOR..."
                                                    />
                                                </td>
                                                <td className="py-3 px-2 transition-colors duration-300">
                                                    <div onPointerDownCapture={prepareSignatureInteraction} className="w-full">
                                                        <SignatureSelector value={log.whoTook} onChange={(val) => updateEstoque(log.id, "whoTook", val)} />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <input
                                                        type="text"
                                                        value={log.balance}
                                                        readOnly
                                                        className={`w-36 font-black rounded-lg px-3 py-2 text-sm text-center outline-none shadow-inner cursor-default transition-colors ${Number(log.balance) > 0 ? 'bg-blue-50 border-2 border-blue-200 text-blue-800' : 'bg-rose-50 border-2 border-rose-200 text-rose-900'
                                                            }`}
                                                        placeholder="Saldo"
                                                    />
                                                </td>
                                                <td className="py-3 px-2 transition-colors duration-300">
                                                    <div onPointerDownCapture={prepareSignatureInteraction} className="w-full">
                                                        <SignatureSelector value={log.responsible} onChange={(val) => updateEstoque(log.id, "responsible", val)} />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    <button onClick={() => removeEstoqueRow(log.id)} className="p-2 text-slate-300 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                                        <BiTrash size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* BOTÕES DE AÇÃO INFERIORES */}
                    <div className="flex justify-end gap-4 mt-6">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3.5 bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-100 rounded-xl font-black text-xs uppercase shadow-md active:scale-95 transition-all"
                        >
                            + Cadastrar Produto
                        </button>
                        <button
                            onClick={addEstoqueRow}
                            className="px-7 py-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 hover:from-slate-800 hover:to-indigo-900 text-white rounded-xl font-black text-xs uppercase shadow-xl hover:shadow-2xl active:scale-95 transition-all ring-2 ring-slate-900/20"
                        >
                            + Nova Linha
                        </button>
                    </div>
                </>
            ) : (
                // ─────────────────────────────────────────────────────────
                // CONTEÚDO DA SUB-ABA INSPEÇÃO DE LIMPEZA (USANDO PRODUTOS_LIMPEZA)
                // ─────────────────────────────────────────────────────────
                <div className="space-y-6">
                    {/* 🔥 BARRA DE SELEÇÃO DE PRODUTOS EXCLUSIVA DA INSPEÇÃO */}
                    <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-md">
                        <div className="flex items-center gap-2 mb-3">
                            <BiFilterAlt className="text-cyan-600" size={18} />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Selecione o Produto para Inspeção de Recebimento</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-cyan-300">
                            {produtosInspecaoUnicos.map(nomeProd => {
                                const isSelected = selectedCleaningProduct === nomeProd;
                                return (
                                    <button
                                        key={nomeProd}
                                        onClick={() => setSelectedCleaningProduct(nomeProd)}
                                        className={`whitespace-nowrap px-5 py-3 rounded-xl text-xs font-black transition-all shadow-sm border-2 ${isSelected
                                            ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-700 shadow-lg scale-105 ring-4 ring-cyan-100"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                                            }`}
                                    >
                                        📋 {nomeProd}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* TABELA DE INSPEÇÃO */}
                    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-250 w-full text-sm border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr className="text-[10px] lg:text-[11px] uppercase tracking-widest text-gray-600 font-black leading-tight">
                                        <th className="p-3 text-left w-32">Data</th>
                                        <th className="p-3 text-left w-48">Produto</th>
                                        <th className="p-3 text-center w-24">Produto Correto?</th>
                                        <th className="p-3 text-center w-24">Composição. OK?</th>
                                        <th className="p-3 text-center w-24">Embalagem. OK?</th>
                                        <th className="p-3 text-center w-24">Padrão Exigido?</th>
                                        <th className="p-3 text-center w-24">Cumpre com as exigências?</th>
                                        <th className="p-3 text-left w-48">Resp. Recebimento</th>
                                        <th className="p-3 w-12 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logsFiltradosInspecao.map((log) => (
                                        <tr key={log.id} className="hover:bg-cyan-50/30 transition-colors bg-white group">
                                            <td className="p-2">
                                                <input
                                                    type="date"
                                                    value={log.date}
                                                    onChange={(e) => updateCleaning(log.id, 'date', e.target.value)}
                                                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-[11px] font-bold outline-none focus:border-cyan-400 shadow-sm !bg-white !text-slate-900"
                                                />
                                            </td>

                                            <td className="p-2">
                                                <div className="w-full bg-slate-100 border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-black text-slate-500 flex items-center shadow-inner cursor-not-allowed uppercase">
                                                    {log.product || selectedCleaningProduct}
                                                </div>
                                            </td>

                                            {(['produtoCorreto', 'composicaoOk', 'embalagemOk', 'padraoExigido', 'cumprePedido'] as const).map(field => (
                                                <td key={field} className="p-2">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {(['Sim', 'Não'] as const).map(opt => {
                                                            const isSelected = log[field] === opt;
                                                            return (
                                                                <button
                                                                    key={opt}
                                                                    type="button"
                                                                    onClick={() => updateCleaning(log.id, field, isSelected ? null : opt)}
                                                                    className={`px-2 py-1 rounded font-black text-[10px] transition-all ${isSelected
                                                                        ? (opt === 'Sim' ? 'bg-cyan-600 text-white shadow' : 'bg-red-500 text-white shadow')
                                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                                        }`}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            ))}
                                            <td className="p-2">
                                                <SignatureSelector
                                                    value={log.responsavel}
                                                    onChange={(v) => updateCleaning(log.id, 'responsavel', v)}
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeCleaningRow(log.id)}
                                                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors p-1.5"
                                                >
                                                    <BiTrash size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* BOTÃO DE ADICIONAR NOVA LINHA COM DESTAQUE */}
                    <div className="flex justify-end mt-4">
                        <button
                            type="button"
                            onClick={handleAddCleaningRow}
                            className="px-7 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-black text-xs uppercase shadow-xl hover:shadow-2xl active:scale-95 transition-all ring-2 ring-cyan-600/20 flex items-center gap-2"
                        >
                            <BiPlus size={18} /> + Nova Linha para {selectedCleaningProduct}
                        </button>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────── */}
            {/* MODAL DE CADASTRO DE PRODUTO                               */}
            {/* ───────────────────────────────────────────────────────── */}
            {isModalOpen && (
                <CadastroProdutoModal
                    adicionarProdutoCatalogo={adicionarProdutoCatalogo}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}

// Sub-componente do Modal
function CadastroProdutoModal({ adicionarProdutoCatalogo, onClose }: any) {
    const [nome, setNome] = useState("");
    const [unidade, setUnidade] = useState("");
    const [quantidade, setQuantidade] = useState("");

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h3 className="text-xl font-black text-slate-900">Cadastrar Novo Material</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-red-600 transition-colors">✕</button>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Nome do Produto</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            className="w-full border-2 border-slate-300 rounded-lg px-4 py-2.5 font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-colors !bg-white"
                            placeholder="Ex: Sabão Líquido"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Unidade</label>
                        <select
                            value={unidade}
                            onChange={e => setUnidade(e.target.value)}
                            className="w-full border-2 border-slate-300 rounded-lg px-4 py-2.5 font-bold text-slate-900 focus:border-blue-500 outline-none transition-colors !bg-white !text-slate-900"
                        >
                            <option value="" className="text-slate-400">Selecione...</option>
                            {UNIDADES_MEDIDA.map((um: string) => <option key={um} value={um} className="text-slate-900">{um}</option>)}
                        </select>
                    </div>
                    {unidade && (
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-1">Estoque Inicial ({unidade})</label>
                            <input
                                type="text"
                                value={quantidade}
                                onChange={e => setQuantidade(e.target.value)}
                                className="w-full border-2 border-slate-300 rounded-lg px-4 py-2.5 font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none transition-colors !bg-white"
                                placeholder="Ex: 10"
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-8 border-t pt-4">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                    <button
                        onClick={() => { adicionarProdutoCatalogo(nome, unidade, quantidade); onClose(); }}
                        className="px-6 py-2.5 bg-blue-600 text-white font-black rounded-xl shadow-md hover:bg-blue-700 transition-colors"
                    >
                        Salvar Produto
                    </button>
                </div>
            </div>
        </div>
    );
}