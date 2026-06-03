"use client";

import React from "react";
import Link from "next/link";
import { BiHistory, BiSearch, BiPlus, BiLeaf, BiCube, BiNote, BiInfoCircle, BiWater, BiCalendar, BiTime, BiDownload } from "react-icons/bi";
import { SignatureSelector } from "../../../components/SignatureSelector";

import { useHigienizacaoController } from "../controller/useHigienizacaoGeralController";
import {
    AREAS_DATA, CATEGORIES, FREQUENCIES, PRODUTO_LEGENDA, COMPLIANCE,
    extractFrequencyType, AreaPreenchimento, CleaningLog
} from "../model/higienizacaoGeral";

export default function HigienizacaoGeralPage() {
    const {
        currentTab, setCurrentTab,
        selectedCategory, setSelectedCategory,
        selectedFrequency, setSelectedFrequency,
        searchTerm, setSearchTerm,
        activeArea, currentLogs, filteredAreas, addRow, updateField, toggleCheck,
        setCheckValue,
        modoOperacao, setModoOperacao,
        exportarExcel,
        observacaoNC, setObservacaoNC
    } = useHigienizacaoController();

    // Função original mantida para as Tesouras
    const setStatus = (idx: number, currentStatus: any, clickedStatus: string) => {
        const nextStatus = currentStatus === clickedStatus ? '' : clickedStatus;
        updateField(idx, 'status', nextStatus);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-8 font-sans text-sm text-gray-800 relative">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <header className="relative bg-white rounded-2xl shadow-2xl mb-8 overflow-hidden border border-gray-100 transition-all duration-300" style={{ boxShadow: '0 8px 32px 0 rgba(60, 60, 120, 0.13), 0 1.5px 8px 0 rgba(80,80,120,0.08)' }}>
                    <div className="flex items-center justify-between p-4 md:p-6">

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-green-600 flex items-center justify-center shadow">
                                <span className="text-white font-bold text-lg">GV</span>
                            </div>
                            <div>
                                <h1 className="text-lg md:text-xl font-bold text-gray-800">Controle de Higienização</h1>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    Sistema Integrado • <span className="font-xs text-gray-500">{AREAS_DATA.length} áreas de controle</span>
                                </p>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/historico?modulo=higienizacao" className="flex items-center gap-2 bg-gray-100 text-gray-800 hover:bg-gray-200 px-4 py-2.5 rounded-lg font-bold text-sm transition-colors border border-gray-200">
                                <BiHistory size={18} /> Histórico
                            </Link>
                            <div className="bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                                <p className="text-xs text-gray-600">Revisado por:</p>
                                <p className="font-semibold text-gray-800">{COMPLIANCE.revisedBy}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 px-4 md:px-6 py-5 border-t border-gray-100 rounded-b-2xl shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Filtrar por Categoria</label>
                                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-white border-2 border-blue-300 rounded-xl py-2.5 px-4 text-sm font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm transition-all cursor-pointer">
                                    {CATEGORIES.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Filtrar por Frequência</label>
                                <select value={selectedFrequency} onChange={(e) => setSelectedFrequency(e.target.value)} className="w-full bg-white border-2 border-blue-300 rounded-xl py-2.5 px-4 text-sm font-medium text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm transition-all cursor-pointer">
                                    {FREQUENCIES.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* SIDEBAR DE ÁREAS */}
                    <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300" style={{ boxShadow: '0 6px 24px 0 rgba(60, 60, 120, 0.13), 0 1.5px 8px 0 rgba(80,80,120,0.08)' }}>
                            <div className="bg-gray-900 p-4 pb-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-white font-bold text-sm uppercase tracking-wider">Áreas de Controle</h2>
                                        <p className="text-gray-300 text-xs mt-1">{filteredAreas.length} de {AREAS_DATA.length} áreas</p>
                                    </div>
                                    <div className="text-white text-xs bg-blue-600 px-1 py-1 rounded font-bold">Filtrado</div>
                                </div>
                            </div>

                            <div className="p-2 bg-gray-50 border-b border-gray-100">
                                <div className="relative">
                                    <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="Buscar área..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-xs text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="overflow-y-auto p-2 scrollbar-thin" style={{ maxHeight: 450 }}>
                                {filteredAreas.map((a: AreaPreenchimento) => {
                                    const freqType = extractFrequencyType ? extractFrequencyType(a.freq) : "DIÁRIA";
                                    const categoryColor = CATEGORIES.find((c: any) => c.id === a.category)?.color || "bg-gray-100 text-gray-800";
                                    const freqColor = FREQUENCIES.find((f: any) => f.id === freqType)?.color || "bg-gray-100 text-gray-800";
                                    const isAtiva = currentTab === a.id;

                                    return (
                                        <button
                                            key={a.id}
                                            onClick={() => setCurrentTab(a.id)}
                                            className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200 ${isAtiva ? "bg-blue-600 text-white shadow border-blue-500" : "hover:bg-gray-50 border border-transparent hover:border-gray-200 text-gray-700"}`}
                                        >
                                            {/* Linha 1: Título e Status */}
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium text-sm">{a.nome.toUpperCase()}</span>
                                                {isAtiva && <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">Ativo</span>}
                                            </div>

                                            {/* Linha 2: Categoria (esquerda) e Badge de Frequência (direita) */}
                                            <div className="flex justify-between items-center mt-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${isAtiva ? "bg-white/20 text-white" : categoryColor}`}>
                                                    {a.category}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isAtiva ? "bg-white/20 text-white" : freqColor}`}>
                                                    {freqType.charAt(0)}
                                                </span>
                                            </div>

                                            {/* Linha 3: Texto completo da frequência (NOVA LINHA) */}
                                            <div className="mt-2 text-gray-500 text-[10px] italic flex items-center gap-1">
                                                {/* Aqui exibimos o texto completo que vem em a.freq */}
                                                {a.freq}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 transition-all duration-300" style={{ boxShadow: '0 6px 24px 0 rgba(60, 60, 120, 0.10), 0 1.5px 8px 0 rgba(80,80,120,0.07)' }}>
                                {activeArea.isMatricial && activeArea.id !== 'transporte' && (
                                    <div className="mb-6">
                                        <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                                            <BiInfoCircle className="text-blue-600" size={18} />
                                            <h3 className="font-bold text-gray-800 text-sm">Legenda</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded bg-green-100 border border-green-200 flex items-center justify-center font-bold text-green-700 text-xs shadow-sm">C</div>
                                                <p className="text-xs font-semibold text-gray-600">Conforme</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded bg-red-100 border border-red-200 flex items-center justify-center font-bold text-red-700 text-xs shadow-sm">NC</div>
                                                <p className="text-xs font-semibold text-gray-600">Não Conforme</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded bg-gray-100 border border-gray-200 flex items-center justify-center font-bold text-gray-500 text-xs shadow-sm">Q.T</div>
                                                <p className="text-xs font-semibold text-gray-600">Qtd. Tesouras</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                                        <BiWater className="text-blue-400" size={18} />
                                        <h3 className="font-bold text-gray-800 text-[11px] uppercase tracking-tight">Produto utilizado para higiene:</h3>
                                    </div>

                                    {activeArea.isMatricial && activeArea.instrucaoUso ? (
                                        <p className="text-xs text-gray-500 leading-relaxed italic px-1">
                                            {activeArea.instrucaoUso}
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {activeArea.produtos && activeArea.produtos.map((p: string) => (
                                                <div key={p} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                                                            <span className="font-bold text-blue-700 text-xs">{p}</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-gray-600 leading-tight">{PRODUTO_LEGENDA[p]}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </aside>

                    {/* ÁREA PRINCIPAL DA TABELA */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 mb-6 transition-all duration-300 animate-fade-in">

                            <div className="bg-gray-50 p-5 border-b border-gray-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            <h1 className="text-xl font-bold text-gray-800 uppercase">
                                                CONTROLE DE HIGIENIZAÇÃO - {activeArea.nome}
                                            </h1>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-gray-200 uppercase">
                                                {activeArea.freq}
                                            </span>
                                            <span className="text-xs text-gray-500">Código: {activeArea.doc}</span>
                                        </div>
                                    </div>
                                    <button onClick={addRow} className="flex items-center justify-center gap-1.5 px-4 py-3 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-xs whitespace-nowrap hover:shadow-md transition-all active:scale-95 h-fit">
                                        <BiPlus size={16} />
                                        Nova Linha
                                    </button>
                                </div>

                                {activeArea.isMatricial && activeArea.id !== 'transporte' && (
                                    <div className="flex items-center mt-4 pt-4 px-5 border-t border-gray-200">
                                        <div className="inline-flex bg-gray-100 border border-gray-200 rounded-lg p-1">
                                            <button onClick={() => setModoOperacao('campo')} className={`flex items-center gap-2 px-6 py-1.5 rounded-md text-xs font-bold transition-all ${modoOperacao === 'campo' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><BiLeaf size={14} /> Campo</button>
                                            <button onClick={() => setModoOperacao('packing')} className={`flex items-center gap-2 px-6 py-1.5 rounded-md text-xs font-bold transition-all ${modoOperacao === 'packing' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><BiCube size={14} /> Packing</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="overflow-x-auto rounded-b-lg bg-white">
                                {activeArea.id === 'transporte' ? (
                                    /* TABELA: Transporte */
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Data</th>
                                                {['Baú Limpo', 'Sem Odor', 'Livre Animais', 'Contentor Limpo'].map(h =>
                                                    <th key={h} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">{h}</th>
                                                )}
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monitora</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {currentLogs.map((reg: any, idx: number) => (
                                                <tr key={`transporte-${reg.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 w-48 align-middle">
                                                        <div className="relative flex items-center">
                                                            <BiCalendar className="absolute left-3 text-gray-400 pointer-events-none" size={16} />
                                                            <input type="date" value={reg.date} onChange={(e) => updateField(idx, 'date', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-blue-500" />
                                                        </div>
                                                    </td>

                                                    {['bauLimpo', 'semOdor', 'livreAnimais', 'contentorLimpo'].map(field => (
                                                        <td key={field} className="px-4 py-3 align-middle text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button onClick={() => setCheckValue(idx, field, 'C')} className={`w-9 h-9 rounded-lg text-xs font-black transition-all border flex items-center justify-center ${reg.checks?.[field] === 'C' ? 'bg-green-50 text-green-600 border-green-300 shadow-sm scale-105' : 'bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-500'}`}>C</button>
                                                                <button onClick={() => setCheckValue(idx, field, 'NC')} className={`w-9 h-9 rounded-lg text-xs font-black transition-all border flex items-center justify-center ${reg.checks?.[field] === 'NC' ? 'bg-red-50 text-red-500 border-red-300 shadow-sm scale-105' : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-400'}`}>NC</button>
                                                            </div>
                                                        </td>
                                                    ))}

                                                    <td className="px-4 py-3 align-middle transition-colors duration-300">
                                                        <SignatureSelector value={reg.monitorSignature} onChange={(v: any) => updateField(idx, 'monitorSignature', v || "")} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    /* TABELA ORIGINAL: Panos, Tesouras, etc */
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Data</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{activeArea.campo2}</th>
                                                {activeArea.isMatricial ? (
                                                    <>
                                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status (C/NC)</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Resp. / Limpeza</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monitora</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{activeArea.tituloProdutos || "Produtos Utilizados"}</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Assinatura</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentLogs.map((reg: any, idx: number) => (
                                                <tr key={`geral-${reg.id}-${idx}`} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-4 py-3 w-48 align-middle">
                                                        <div className="relative flex items-center">
                                                            <BiCalendar className="absolute left-3 text-gray-400 pointer-events-none" size={16} />
                                                            <input type="date" value={reg.date} onChange={(e) => updateField(idx, 'date', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-blue-500" />
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 w-40 align-middle">
                                                        {activeArea.campo2 === 'Horário' ? (
                                                            <div className="relative flex items-center">
                                                                <BiTime className="absolute left-3 text-gray-400 pointer-events-none" size={16} />
                                                                <input type="time" value={reg.time} onChange={(e) => updateField(idx, 'time', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-blue-500" />
                                                            </div>
                                                        ) : (
                                                            <input type="number" min="0" placeholder="Ex: 50" value={reg.time} onChange={(e) => updateField(idx, 'time', e.target.value)} className="w-24 text-center mx-auto block bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm font-bold focus:ring-blue-500" />
                                                        )}
                                                    </td>
                                                    {activeArea.isMatricial ? (
                                                        <>
                                                            <td className="px-4 py-3 align-middle text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button type="button" onClick={() => setStatus(idx, reg.status, 'C')} className={`w-10 h-10 rounded-lg text-sm font-black transition-all border flex items-center justify-center ${reg.status === 'C' ? 'bg-green-50 text-green-600 border-green-300 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-500'}`}>C</button>
                                                                    <button type="button" onClick={() => setStatus(idx, reg.status, 'NC')} className={`w-10 h-10 rounded-lg text-sm font-black transition-all border flex items-center justify-center ${reg.status === 'NC' ? 'bg-red-50 text-red-500 border-red-300 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-400'}`}>NC</button>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 align-middle min-w-44 transition-colors duration-300">
                                                                <SignatureSelector value={reg.signature} onChange={(v: any) => updateField(idx, 'signature', v || "")} />
                                                            </td>
                                                            <td className="px-3 py-2 align-middle min-w-44 transition-colors duration-300">
                                                                <SignatureSelector value={reg.monitorSignature} onChange={(v: any) => updateField(idx, 'monitorSignature', v || "")} />
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4 py-3 align-middle">
                                                                <div className="flex items-center gap-2">
                                                                    {activeArea.produtos && activeArea.produtos.map((p: string) => (
                                                                        <button key={p} type="button" onClick={() => toggleCheck(idx, p)} className={`flex flex-col items-center justify-center rounded-lg px-2 py-1 shadow-sm border-2 transition-all shrink-0 ${reg.checks?.[p] ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`} style={{ width: '80px', height: '52px' }}>
                                                                            <span className="font-black text-sm leading-none mb-0.5">{p}</span>
                                                                            <span className="text-[9px] font-medium text-center w-full leading-tight" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{PRODUTO_LEGENDA[p]}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 align-middle min-w-48 transition-colors duration-300"><SignatureSelector value={reg.signature} onChange={(v: any) => updateField(idx, 'signature', v || "")} /></td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div className="bg-gray-50 p-4 md:p-6 flex flex-col gap-4 border-t border-gray-100">
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <div>Total de registros na tela: <span className="font-bold text-gray-700">{currentLogs.length}</span></div>
                                </div>

                                {activeArea.isMatricial && activeArea.id !== 'transporte' && (
                                    <div className="w-full bg-white border border-gray-200 rounded-xl p-4 shadow-sm mt-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
                                            <BiNote className="text-green-600" size={16} />
                                            Observações de Não Conformidade:
                                        </label>
                                        <textarea
                                            value={observacaoNC}
                                            onChange={(e) => setObservacaoNC(e.target.value)}
                                            className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-green-500 outline-none resize-none"
                                            placeholder="Descreva as observações caso exista alguma não conformidade..."
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botão de exportar do Excel em Tailwind */}
                        <div className="flex justify-end mb-8">
                            <button
                                type="button"
                                onClick={async () => {
                                    await exportarExcel();
                                    localStorage.removeItem("gv_higienizacao_geral_v5");
                                }}
                                className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
                            >
                                <BiDownload size={22} />
                                Exportar para Excel
                            </button>
                        </div>
                    </main>
                </div>

                <footer className="mt-6 bg-gray-900 text-white rounded-xl shadow overflow-hidden">
                    <div className="p-4 md:p-5">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold">GV</div>
                                <div>
                                    <p className="text-sm font-medium">GrandValle - Sistema de Controle de Higienização</p>
                                    <p className="text-xs text-gray-300">© {new Date().getFullYear()} - Todos os direitos reservados</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-xs text-gray-300">Revisado por</p>
                                    <p className="font-bold text-yellow-300">{COMPLIANCE.revisedBy}</p>
                                </div>
                                <div className="h-8 w-px bg-gray-700"></div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-300">Código PHU</p>
                                    <p className="font-bold text-white bg-blue-600 px-3 py-1 rounded-lg">{activeArea.doc}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}