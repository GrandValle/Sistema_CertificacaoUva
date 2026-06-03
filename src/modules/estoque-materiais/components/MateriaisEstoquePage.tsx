"use client";

import { SignatureSelector } from "../../../components/SignatureSelector";
import { useState, useRef } from "react";
import Link from "next/link";
import { BiPlus, BiTrash, BiX, BiHistory, BiCalendar, BiTimeFive, BiDownload } from "react-icons/bi";
import { useEstoqueController } from "../controller/useEstoqueController";
import { UNIDADES_MEDIDA, DIAS_SEMANA, RegistroOculos } from "../model/estoqueModel";

export default function MateriaisEstoquePage() {
    const {
        activeTab, setActiveTab,
        produtos, adicionarProdutoCatalogo,
        estoqueLogs, addEstoqueRow, updateEstoque, removeEstoqueRow,
        tesourasLogs, addTesouraRow, updateTesoura, toggleDiaTesoura, removeTesouraRow,
        dataInicio, setDataInicio, dataFim, setDataFim, frequenciaTesoura,
        oculosLogs, addOculosRow, updateOculosRow, removeOculosRow,
        // 🟢 CORREÇÃO: Trocados os métodos antigos pela nova função assíncrona do controller
        exportarExcel
    } = useEstoqueController();

    const suppressTabChangeUntilRef = useRef(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalNome, setModalNome] = useState("");
    const [modalUnidade, setModalUnidade] = useState("");
    const [modalQuantidade, setModalQuantidade] = useState("");

    const prepareSignatureInteraction = () => {
        const activeElement = document.activeElement as HTMLElement | null;
        if (activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName)) activeElement.blur();
        suppressTabChangeUntilRef.current = Date.now() + 450;
    };

    const getFooterInfo = () => {
        if (activeTab === "estoque") return { code: "PHU-029", title: "Controle de Estoque", pop: "POP-EST" };
        if (activeTab === "oculos") return { code: "PHU-027", title: "Lista para Controle de Óculos", pop: "POP-01" };
        return { code: "PHU-043", title: "Entrega e Devolução de Tesouras", pop: "POP-01" };
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6 font-sans relative">

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
                        <div className="flex justify-between items-center mb-6 border-b-2 border-gray-100 pb-3">
                            <h3 className="text-xl font-black text-gray-900">Cadastrar Novo Material</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-600 transition-colors"><BiX size={28} /></button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-1.5">Nome do Produto</label>
                                <input type="text" value={modalNome} onChange={e => setModalNome(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-semibold outline-none" placeholder="Ex: Sabão Líquido" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-1.5">Unidade de Medida Oficial</label>
                                <select value={modalUnidade} onChange={e => setModalUnidade(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-semibold outline-none">
                                    <option value="">Selecione uma medida...</option>
                                    <option value="L">L</option>
                                    <option value="ml">ml</option>
                                    {UNIDADES_MEDIDA.filter(um => um !== "L" && um !== "ml").map(um => <option key={um} value={um}>{um}</option>)}
                                </select>
                            </div>
                            {modalUnidade && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-1.5">Estoque Inicial <span className="text-red-600">({modalUnidade})</span></label>
                                    <div className="relative">
                                        <input type="text" value={modalQuantidade} onChange={e => setModalQuantidade(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-semibold outline-none" placeholder="Ex: 10" />
                                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-red-600 font-black text-lg">{modalUnidade}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Só digite o número. A unidade já foi selecionada.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 font-bold hover:bg-gray-200 rounded-lg">Cancelar</button>
                            <button onClick={() => { adicionarProdutoCatalogo(modalNome, modalUnidade, modalQuantidade); setModalNome(""); setModalUnidade(""); setModalQuantidade(""); setIsModalOpen(false); }} className="px-5 py-2.5 bg-blue-600 text-white font-black rounded-lg shadow-md transition-all active:scale-95">Salvar Produto</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* HEADER PRINCIPAL */}
                <div className="mb-6">
                    <div className="bg-slate-900 rounded-xl p-5 sm:p-6 shadow-xl border border-slate-700 text-white">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-black mb-1 uppercase tracking-tight">{getFooterInfo().title}</h1>
                                <p className="text-slate-400 font-medium text-xs sm:text-sm tracking-widest uppercase">Gestão de Almoxarifado e EPIs</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href="/historico?modulo=estoque" className="flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-lg font-black text-sm transition-all hover:bg-slate-200 shadow-lg">
                                    <BiHistory size={18} /> Histórico
                                </Link>
                                <div className="bg-slate-800 px-5 py-2.5 rounded-lg border border-slate-700 shadow-inner">
                                    <span className="text-cyan-400 font-black text-sm tracking-widest">{getFooterInfo().code}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MENU DE ABAS */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 bg-white rounded-xl shadow-sm border-2 border-slate-200 p-2">
                        <button onClick={() => setActiveTab("estoque")} className={`px-5 py-3 rounded-lg text-sm font-black transition-all ${activeTab === "estoque" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}>
                            📦 Controle de Estoque
                        </button>
                        <button onClick={() => setActiveTab("tesouras")} className={`px-5 py-3 rounded-lg text-sm font-black transition-all ${activeTab === "tesouras" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}>
                            ✂️ Devolução de Tesouras
                        </button>
                        <button onClick={() => setActiveTab("oculos")} className={`px-5 py-3 rounded-lg text-sm font-black transition-all ${activeTab === "oculos" ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}>
                            👓 Controle de Óculos
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-4 sm:p-6 mb-8">

                    {/* ABA 1: ESTOQUE */}
                    {activeTab === "estoque" && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-slate-50 border-l-4 border-blue-600 rounded-r-lg p-5 shadow-sm">
                                <h3 className="font-black text-slate-800 text-lg uppercase">Controle de Estoque - Material de Limpeza</h3>
                                <p className="text-slate-500 text-sm font-medium">Controle de entradas e saídas de Material de limpeza.</p>
                            </div>

                            <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-300">
                                        <thead className="bg-slate-100 border-b-2 border-slate-200 uppercase text-[11px] text-slate-700 font-black">
                                            <tr>
                                                <th className="py-4 px-3 text-left w-36">Data</th>
                                                <th className="py-4 px-3 text-left min-w-50">Produto</th>
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
                                            {estoqueLogs.map((log) => {
                                                const hasProduct = Boolean(log.product);
                                                return (
                                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-3 px-2">
                                                            <div className="relative flex items-center">
                                                                <BiCalendar className="absolute left-2.5 text-slate-400 pointer-events-none" size={15} />
                                                                <input type="date" value={log.date} onChange={(e) => updateEstoque(log.id, "date", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg pl-8 pr-2 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500" />
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <select value={log.product} onChange={(e) => updateEstoque(log.id, "product", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-2 py-2 text-xs font-bold text-slate-900 outline-none">
                                                                <option value="">Selecione...</option>
                                                                {produtos.map(p => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
                                                            </select>
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <div className={`flex items-center w-full border-2 rounded-lg overflow-hidden ${hasProduct ? 'bg-white border-slate-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                                                                <input type="number" disabled={!hasProduct} value={log.entry} onChange={(e) => updateEstoque(log.id, "entry", e.target.value)} className="w-14 px-2 py-2 text-xs text-slate-900 text-center outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:text-slate-700 disabled:opacity-100" placeholder="0" />
                                                                <select disabled={!hasProduct} value={log.entryUnit} onChange={(e) => updateEstoque(log.id, "entryUnit", e.target.value)} className="flex-1 bg-transparent text-[10px] font-semibold text-slate-900 outline-none cursor-pointer disabled:text-slate-700 disabled:opacity-100">
                                                                    <option value="">-</option><option value="L">L</option><option value="ml">ml</option>
                                                                </select>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <div className={`flex items-center w-full border-2 rounded-lg overflow-hidden ${hasProduct ? 'bg-white border-slate-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                                                                <input type="number" disabled={!hasProduct} value={log.exit} onChange={(e) => updateEstoque(log.id, "exit", e.target.value)} className="w-14 px-2 py-2 text-xs text-slate-900 text-center outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:text-slate-700 disabled:opacity-100" placeholder="0" />
                                                                <select disabled={!hasProduct} value={log.exitUnit} onChange={(e) => updateEstoque(log.id, "exitUnit", e.target.value)} className="flex-1 bg-transparent text-[10px] font-semibold text-slate-900 outline-none cursor-pointer disabled:text-slate-700 disabled:opacity-100">
                                                                    <option value="">-</option><option value="L">L</option><option value="ml">ml</option>
                                                                </select>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <input type="text" value={log.sector} onChange={(e) => updateEstoque(log.id, "sector", e.target.value.toUpperCase())} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400" placeholder="SETOR..." />
                                                        </td>
                                                        <td className="py-3 px-2 transition-colors duration-300"><div onPointerDownCapture={prepareSignatureInteraction} className="w-full"><SignatureSelector value={log.whoTook} onChange={(val) => updateEstoque(log.id, "whoTook", val)} /></div></td>
                                                        <td className="py-3 px-3"><input type="text" value={log.balance} readOnly className="w-36 bg-rose-50 border-2 border-rose-200 text-rose-900 font-black rounded-lg px-3 py-2 text-sm text-center outline-none shadow-inner cursor-default" placeholder="Saldo" /></td>
                                                        <td className="py-3 px-2 transition-colors duration-300"><div onPointerDownCapture={prepareSignatureInteraction} className="w-full"><SignatureSelector value={log.responsible} onChange={(val) => updateEstoque(log.id, "responsible", val)} /></div></td>
                                                        <td className="py-3 px-2 text-center"><button onClick={() => removeEstoqueRow(log.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><BiTrash size={20} /></button></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-xl font-black text-xs uppercase shadow-sm active:scale-95 transition-all"> + Cadastrar Produto</button>
                                <button onClick={addEstoqueRow} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase shadow-md active:scale-95 transition-all"> + Nova Linha</button>
                            </div>
                        </div>
                    )}

                    {/* ABA 2: TESOURAS */}
                    {activeTab === "tesouras" && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 shadow-inner relative overflow-hidden">
                                <div className="flex flex-col lg:flex-row gap-8 justify-between items-end">
                                    <div className="flex flex-wrap gap-6 items-end">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1"><BiCalendar size={16} className="text-blue-600" /> Período de Monitoramento</label>
                                            <div className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-xl p-2.5 shadow-sm">
                                                <BiCalendar size={15} className="text-slate-400 shrink-0" />
                                                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="bg-transparent border-none outline-none font-black text-slate-900 text-xs" />
                                                <span className="text-[10px] font-black text-slate-300">ATÉ</span>
                                                <BiCalendar size={15} className="text-slate-400 shrink-0" />
                                                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-transparent border-none outline-none font-black text-slate-900 text-xs" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1"><BiTimeFive size={16} className="text-blue-600" /> Frequência</label>
                                            <div className="bg-blue-50 border-2 border-blue-100 rounded-xl px-5 py-2.5 text-xs font-black text-blue-700 shadow-sm flex items-center h-11.5">{frequenciaTesoura}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block text-right mr-1">Legenda Operacional</label>
                                        <div className="flex gap-2 bg-white border-2 border-slate-200 rounded-2xl p-2 shadow-md">
                                            <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl shadow-sm"><span className="text-[12px] font-black">T</span><span className="text-[10px] font-black uppercase opacity-70 border-l border-white/20 pl-2">Tesoura</span></div>
                                            <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl shadow-sm"><span className="text-[12px] font-black">E</span><span className="text-[10px] font-black uppercase opacity-70 border-l border-white/20 pl-2">Entrega</span></div>
                                            <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-sm"><span className="text-[12px] font-black">D</span><span className="text-[10px] font-black uppercase opacity-70 border-l border-white/20 pl-2">Devolução</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-widest text-center font-black">
                                                <th className="py-6 px-6 text-left border-r border-slate-800 w-80">Nome do Funcionário</th>
                                                <th className="py-6 px-4 border-r border-slate-800 w-32">Nº T.</th>
                                                {DIAS_SEMANA.map(dia => (<th key={dia} className="py-6 px-2 border-r border-slate-800 w-32">{dia}</th>))}
                                                <th className="py-6 px-4 w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-center font-bold">
                                            {tesourasLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 px-4 border-r border-slate-100"><input type="text" value={log.funcionario} onChange={(e) => updateTesoura(log.id, "funcionario", e.target.value.toUpperCase())} className="w-full bg-transparent font-black text-sm outline-none text-slate-800 placeholder:text-slate-300" placeholder="DIGITE O NOME..." /></td>
                                                    <td className="py-4 px-4 border-r border-slate-100"><input type="text" value={log.numeroTesoura} onChange={(e) => updateTesoura(log.id, "numeroTesoura", e.target.value)} className="w-24 bg-slate-100 border-2 border-slate-200 rounded-xl p-2.5 text-center font-black text-blue-700 shadow-inner" placeholder="00" /></td>
                                                    {DIAS_SEMANA.map(dia => (
                                                        <td key={dia} className="py-4 px-2 border-r border-slate-100">
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={() => toggleDiaTesoura(log.id, dia, 'e')} className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${log.dias[dia].e ? 'bg-green-600 text-white shadow-lg scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>E</button>
                                                                <button onClick={() => toggleDiaTesoura(log.id, dia, 'd')} className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${log.dias[dia].d ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>D</button>
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td className="py-4 px-4 text-center">
                                                        <button onClick={() => removeTesouraRow(log.id)} className="text-slate-300 hover:text-red-600 transition-colors"><BiTrash size={22} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex justify-end"><button onClick={addTesouraRow} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2"><BiPlus size={20} /> Adicionar Novo Colaborador</button></div>
                        </div>
                    )}

                    {/* ABA 3: CONTROLE DE ÓCULOS */}
                    {activeTab === "oculos" && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                        Controle de Óculos
                                    </h2>
                                </div>
                                <button onClick={addOculosRow} className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-black transition-all flex items-center gap-2 shadow-lg uppercase tracking-wide active:scale-95">
                                    <BiPlus size={20} /> Nova Verificação
                                </button>
                            </div>

                            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xl bg-white">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-widest font-black">
                                            <th className="py-5 px-4 text-center border-r border-slate-800 w-40">Data</th>
                                            <th className="py-5 px-4 border-r border-slate-800 min-w-[280px]">Nome do Funcionário (a)</th>
                                            <th className="py-5 px-4 text-center border-r border-slate-800 w-48">Óculos Intactos?</th>
                                            <th className="py-5 px-4 border-r border-slate-800 min-w-[200px]">Assinatura do Responsável</th>
                                            <th className="py-5 px-4 border-r border-slate-800 min-w-[250px]">Observação</th>
                                            <th className="py-5 px-4 w-16 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {oculosLogs.map((row: RegistroOculos) => (
                                            <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-3 border-r border-slate-100">
                                                    <input type="date" value={row.data} onChange={(e) => updateOculosRow(row.id, "data", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-800 outline-none focus:border-slate-500 focus:bg-white transition-colors" />
                                                </td>
                                                <td className="p-3 border-r border-slate-100">
                                                    <input type="text" value={row.colaborador} onChange={(e) => updateOculosRow(row.id, "colaborador", e.target.value.toUpperCase())} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-black text-slate-800 outline-none focus:border-slate-500 focus:bg-white placeholder:text-slate-400 transition-colors" placeholder="DIGITE O NOME..." />
                                                </td>
                                                <td className="p-3 border-r border-slate-100 text-center">
                                                    <div className="flex justify-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                                                        <button
                                                            onClick={() => updateOculosRow(row.id, "intacto", row.intacto === "SIM" ? null : "SIM")}
                                                            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${row.intacto === 'SIM' ? 'bg-green-500 text-white shadow-md scale-105' : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                                                        >
                                                            SIM
                                                        </button>
                                                        <div className="w-px bg-slate-300 my-1"></div>
                                                        <button
                                                            onClick={() => updateOculosRow(row.id, "intacto", row.intacto === "NÃO" ? null : "NÃO")}
                                                            className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${row.intacto === 'NÃO' ? 'bg-red-500 text-white shadow-md scale-105' : 'bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
                                                        >
                                                            NÃO
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-3 border-r border-slate-100">
                                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-1 min-h-[46px]" onPointerDownCapture={prepareSignatureInteraction}>
                                                        <SignatureSelector value={row.assinatura} onChange={(v) => updateOculosRow(row.id, "assinatura", v)} />
                                                    </div>
                                                </td>
                                                <td className="p-3 border-r border-slate-100">
                                                    <input type="text" value={row.observacao} onChange={(e) => updateOculosRow(row.id, "observacao", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-normal outline-none focus:border-slate-500 focus:bg-white placeholder:text-slate-400 transition-colors" placeholder="Observações..." />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button onClick={() => removeOculosRow(row.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <BiTrash size={22} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>

                {/* 🟢 CORREÇÃO: Substituição completa do ExcelExportButton pelo botão nativo assíncrono */}
                <div className="flex justify-end mb-6">
                    <button
                        type="button"
                        onClick={async () => {
                            // 1. Dispara a exportação direta usando a função do hook desestruturado
                            await exportarExcel();

                            // 2. Limpa a chave correta do LocalStorage correspondente a este módulo
                            localStorage.removeItem("gv_estoque_materiais_v4");
                        }}
                        className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
                    >
                        <BiDownload size={22} />
                        Exportar para Excel
                    </button>
                </div>

                <div className="bg-[#181c24] rounded-2xl shadow-xl px-8 py-6 text-white border border-slate-800/60">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-[11px] text-slate-400 mb-1">Revisado por</p>
                            <p className="text-base font-bold text-yellow-400">Clebitânia Carvalho</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-400 mb-1">Última Revisão</p>
                            <p className="text-base font-bold text-white">02/01/2026</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-400 mb-1">Código do Documento</p>
                            <p className="text-base font-bold text-white">{getFooterInfo().code}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-center text-xs text-slate-400 pb-4">
                    <p>GrandValle © 2026 • Documento: {getFooterInfo().code} - {getFooterInfo().title}</p>
                    <p>Última revisão: 02/01/2026</p>
                </div>
            </div>
        </div>
    );
}