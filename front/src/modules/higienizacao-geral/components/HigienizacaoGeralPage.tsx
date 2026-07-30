"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BiHistory, BiSearch, BiPlus, BiCube, BiNote, BiWater, BiCalendar, BiTime, BiDownload, BiTrash } from "react-icons/bi";
import { SignatureSelector } from "../../../components/SignatureSelector";
import { useHigienizacaoController } from "../controller/useHigienizacaoGeralController";
import {
    AREAS_DATA, CATEGORIES, FREQUENCIES, PRODUTO_LEGENDA, COMPLIANCE,
    extractFrequencyType, AreaPreenchimento, CleaningLog,
    DIAS_SEMANA_TESOURA
} from "../model/higienizacaoGeral";

export default function HigienizacaoGeralPage() {
    // 🔥 CORREÇÃO: Controle de montagem para evitar hidratação
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const controller = useHigienizacaoController();
    const {
        currentTab, setCurrentTab,
        selectedCategory, setSelectedCategory,
        selectedFrequency, setSelectedFrequency,
        searchTerm, setSearchTerm,
        activeArea,
        currentLogs: rawCurrentLogs,
        filteredAreas,
        addRow, removeRow, updateField, toggleCheck, setCheckValue,
        modoOperacao, setModoOperacao,
        exportarExcel,
        observacaoNC, setObservacaoNC,
        // Tesouras
        tesourasLogs: rawTesourasLogs,
        addTesouraWeek,
        updateTesouraWeek,
        updateTesouraDia,
        removeTesouraWeek,
        // Bebedouros
        bebedourosLogs: rawBebedourosLogs,
        addBebedouroRow,
        updateBebedouroField,
        removeBebedouroRow,
    } = controller;

    const tesourasLogs = rawTesourasLogs || [];
    const currentLogs = rawCurrentLogs || [];
    const bebedourosLogs = rawBebedourosLogs || [];

    const setStatus = (idx: number, currentStatus: any, clickedStatus: string) => {
        const nextStatus = currentStatus === clickedStatus ? '' : clickedStatus;
        updateField(idx, 'status', nextStatus);
    };

    // 🔥 Enquanto não montado, retorna um placeholder ou null
    if (!isMounted) {
        return <div className="min-h-screen bg-gray-50 p-4 lg:p-8 flex items-center justify-center">
            <div className="text-gray-500">Carregando...</div>
        </div>;
    }

    if (!activeArea) {
        return <div className="p-8 text-center text-red-600">Área não encontrada. Selecione uma área válida na barra lateral.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 lg:p-8 font-sans text-sm text-gray-800 relative">
            <div className="max-w-400 w-full mx-auto transition-all duration-300">

                {/* HEADER */}
                <header className="relative bg-white rounded-2xl shadow-2xl mb-8 overflow-hidden border border-gray-100">
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
                    {/* SIDEBAR */}
                    <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
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
                                {filteredAreas
                                    .filter((a: AreaPreenchimento) => a.id !== 'lavagem_ref') // 🔥 Oculta o refugo da barra lateral para parecer um único botão unificado
                                    .map((a: AreaPreenchimento) => {
                                        // Renomeia o texto do botão na barra lateral para ficar limpo
                                        const nomeExibicao = a.id === 'lavagem_proc' ? 'Lavagem de Contentores' : a.nome;

                                        const freqType = extractFrequencyType(a.freq);
                                        const categoryColor = CATEGORIES.find((c: any) => c.id === a.category)?.color || "bg-gray-100 text-gray-800";
                                        const freqColorBase = FREQUENCIES.find((f: any) => f.id === freqType)?.color || "bg-gray-100 text-gray-800";

                                        // Mantém ativo tanto se estiver em proc quanto em refugo
                                        const isAtiva = currentTab === a.id || (a.id === 'lavagem_proc' && currentTab === 'lavagem_ref');

                                        const corNome = freqColorBase.split('-')[1];
                                        const freqColor = isAtiva ? `bg-${corNome}-600 text-white shadow-sm ring-1 ring-white/30` : freqColorBase;

                                        return (
                                            <button key={a.id} onClick={() => setCurrentTab(a.id === 'lavagem_proc' ? 'lavagem_proc' : a.id)} className={`w-full text-left p-3 rounded-lg mb-2 transition-all duration-200 ${isAtiva ? "bg-blue-600 text-white shadow border-blue-500" : "hover:bg-gray-50 border border-transparent hover:border-gray-200 text-gray-700"}`}>
                                                <div className="flex justify-between items-start">
                                                    <span className="font-medium text-sm">{nomeExibicao.toUpperCase()}</span>
                                                    {isAtiva && <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">Ativo</span>}
                                                </div>
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isAtiva ? "bg-white/20 text-white" : categoryColor}`}>{a.category}</span>
                                                    {a.id !== 'bebedouros' && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${freqColor}`}>{freqType.charAt(0)}</span>
                                                    )}
                                                </div>
                                                {a.id !== 'bebedouros' && (
                                                    <div className={`mt-2 text-[10px] italic flex items-center gap-1 ${isAtiva ? "text-blue-200" : "text-gray-500"}`}>{a.freq}</div>
                                                )}
                                            </button>
                                        );
                                    })}
                            </div>

                            {/* PRODUTOS / INSTRUÇÕES DE USO */}
                            <div className="bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 mt-4">
                                <div className="pt-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <BiWater className="text-blue-400" size={16} />
                                        <h3 className="font-bold text-gray-800 text-[11px] uppercase tracking-tight">
                                            {activeArea.instrucaoUso ? "Materiais e Instruções:" : "Legenda de produtos:"}
                                        </h3>
                                    </div>

                                    {activeArea.instrucaoUso ? (
                                        <div className="flex flex-col gap-3">
                                            {activeArea.instrucaoUso.split('|').map((block, idx) => (
                                                <div key={idx} className="bg-blue-50 border border-blue-100 rounded-lg p-3 shadow-sm">
                                                    <p className="text-[11px] text-gray-700 font-medium whitespace-pre-line leading-relaxed">
                                                        {block.trim()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        activeArea.produtos && activeArea.produtos.length > 0 && (
                                            <div className="space-y-2">
                                                {activeArea.produtos.map((p: string) => (
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
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CONTENT */}
                    <main className="flex-1 min-w-0">
                        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 mb-6 transition-all duration-300">
                            <div className="bg-gray-50 p-5 border-b border-gray-100">

                                {/* 🔥 BOTÕES DE ALTERNÂNCIA (TOGGLE) PARA CONTENTORES */}
                                {(currentTab === 'lavagem_proc' || currentTab === 'lavagem_ref') && (
                                    <div className="flex items-center gap-2 mb-4 bg-gray-200/60 p-1.5 rounded-xl w-fit border border-gray-200 shadow-inner">
                                        <button
                                            type="button"
                                            onClick={() => setCurrentTab('lavagem_proc')}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentTab === 'lavagem_proc'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'
                                                }`}
                                        >
                                            Processamento
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentTab('lavagem_ref')}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentTab === 'lavagem_ref'
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-300/50'
                                                }`}
                                        >
                                            Refugo
                                        </button>
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            <h1 className="text-xl font-bold text-gray-800 uppercase">
                                                CONTROLE DE HIGIENIZAÇÃO - {activeArea.nome}
                                            </h1>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            {activeArea.id !== 'bebedouros' && (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-gray-200 uppercase">
                                                    {activeArea.freq}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">Código: {activeArea.doc}</span>
                                        </div>
                                    </div>
                                    {activeArea.id === 'tesouras' ? (
                                        <button onClick={addTesouraWeek} className="flex items-center justify-center gap-1.5 px-4 py-3 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-xs whitespace-nowrap hover:shadow-md transition-all active:scale-95 h-fit">
                                            <BiPlus size={16} /> Nova Semana
                                        </button>
                                    ) : activeArea.id === 'bebedouros' ? (
                                        <button onClick={addBebedouroRow} className="flex items-center justify-center gap-1.5 px-4 py-3 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-xs whitespace-nowrap hover:shadow-md transition-all active:scale-95 h-fit">
                                            <BiPlus size={16} /> Nova Linha
                                        </button>
                                    ) : (
                                        <button onClick={addRow} className="flex items-center justify-center gap-1.5 px-4 py-3 bg-linear-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold text-xs whitespace-nowrap hover:shadow-md transition-all active:scale-95 h-fit">
                                            <BiPlus size={16} /> Nova Linha
                                        </button>
                                    )}
                                </div>

                                {activeArea.isMatricial && activeArea.id !== 'transporte' && activeArea.id !== 'tesouras' && activeArea.id !== 'bebedouros' && (
                                    <div className="flex items-center mt-4 pt-4 px-5 border-t border-gray-200">
                                        <div className="inline-flex bg-gray-100 border border-gray-200 rounded-lg p-1">
                                            <button onClick={() => setModoOperacao('packing')} className={`flex items-center gap-2 px-6 py-1.5 rounded-md text-xs font-bold transition-all ${modoOperacao === 'packing' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                                <BiCube size={14} /> Packing
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* TABELAS */}
                            <div className="overflow-x-auto rounded-b-lg bg-white">
                                {activeArea.id === 'tesouras' ? (
                                    <div className="p-4">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-200 w-full border-collapse border border-gray-200 text-sm">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Período</th>
                                                        {DIAS_SEMANA_TESOURA.map(dia => (
                                                            <th key={dia.id} colSpan={2} className="border border-gray-200 px-3 py-2 text-center font-semibold">
                                                                {dia.label}
                                                            </th>
                                                        ))}
                                                        <th className="border border-gray-200 px-3 py-2 text-center font-semibold">Resp./Limpeza</th>
                                                        <th className="border border-gray-200 px-3 py-2 text-center font-semibold">Monitora Resp.</th>
                                                        <th className="border border-gray-200 px-3 py-2 w-8"></th>
                                                    </tr>
                                                    <tr className="bg-gray-50">
                                                        <th className="border border-gray-200 px-3 py-2"></th>
                                                        {DIAS_SEMANA_TESOURA.map(dia => (
                                                            <React.Fragment key={dia.id}>
                                                                <th className="border border-gray-200 px-2 py-2 text-center text-xs font-semibold">Q.T</th>
                                                                <th className="border border-gray-200 px-2 py-2 text-center text-xs font-semibold">C/NC</th>
                                                            </React.Fragment>
                                                        ))}
                                                        <th className="border border-gray-200 px-3 py-2"></th>
                                                        <th className="border border-gray-200 px-3 py-2"></th>
                                                        <th className="border border-gray-200 px-3 py-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tesourasLogs.map((week) => (
                                                        <tr key={week.id} className="hover:bg-gray-50">
                                                            <td className="border border-gray-200 px-2 py-2 align-middle">
                                                                <div className="flex flex-col gap-1">
                                                                    <input type="date" value={week.dataInicio || ''} onChange={(e) => updateTesouraWeek(week.id, 'dataInicio', e.target.value)} className="w-28 border border-gray-300 rounded px-1 py-0.5 text-xs" />
                                                                    <input type="date" value={week.dataFim || ''} onChange={(e) => updateTesouraWeek(week.id, 'dataFim', e.target.value)} className="w-28 border border-gray-300 rounded px-1 py-0.5 text-xs" />
                                                                </div>
                                                            </td>
                                                            {DIAS_SEMANA_TESOURA.map(dia => (
                                                                <React.Fragment key={dia.id}>
                                                                    <td className="border border-gray-200 px-1 py-1 text-center">
                                                                        <input type="number" value={week.dias?.[dia.id]?.qtde ?? ''} onChange={(e) => updateTesouraDia(week.id, dia.id, 'qtde', e.target.value)} className="w-14 border border-gray-300 rounded text-center py-1 text-xs" placeholder="0" />
                                                                    </td>
                                                                    <td className="border border-gray-200 px-1 py-1 text-center">
                                                                        <div className="flex gap-1 justify-center">
                                                                            <button onClick={() => updateTesouraDia(week.id, dia.id, 'status', week.dias?.[dia.id]?.status === 'C' ? '' : 'C')} className={`w-7 h-7 rounded text-xs font-bold transition-colors ${week.dias?.[dia.id]?.status === 'C' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>C</button>
                                                                            <button onClick={() => updateTesouraDia(week.id, dia.id, 'status', week.dias?.[dia.id]?.status === 'NC' ? '' : 'NC')} className={`w-7 h-7 rounded text-xs font-bold transition-colors ${week.dias?.[dia.id]?.status === 'NC' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>NC</button>
                                                                        </div>
                                                                    </td>
                                                                </React.Fragment>
                                                            ))}
                                                            <td className="border border-gray-200 px-2 py-1">
                                                                <SignatureSelector value={week.respLimpeza} onChange={(v) => updateTesouraWeek(week.id, 'respLimpeza', v)} />
                                                            </td>
                                                            <td className="border border-gray-200 px-2 py-1">
                                                                <SignatureSelector value={week.monitorResponsavel} onChange={(v) => updateTesouraWeek(week.id, 'monitorResponsavel', v)} />
                                                            </td>
                                                            <td className="border border-gray-200 px-2 py-1 text-center">
                                                                <button onClick={() => removeTesouraWeek(week.id)} className="text-red-500 hover:text-red-700" title="Remover semana"><BiTrash size={18} /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {tesourasLogs.length === 0 && (
                                                        <tr><td colSpan={DIAS_SEMANA_TESOURA.length * 2 + 4} className="text-center py-8 text-gray-500">Nenhuma semana cadastrada. Clique em &quot;Nova Semana&quot; para começar.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-6">
                                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2">
                                                    <BiNote className="text-green-600" size={16} /> Observações de Não Conformidade:
                                                </label>
                                                <textarea value={observacaoNC} onChange={(e) => setObservacaoNC(e.target.value)} className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-green-500 outline-none resize-none" placeholder="Descreva as observações caso exista alguma não conformidade..." />
                                            </div>
                                        </div>
                                    </div>
                                ) : activeArea.id === 'bebedouros' ? (
                                    <div className="p-4">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-200 w-full border-collapse border border-gray-200 text-sm transition-all">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="border border-gray-200 px-3 py-3 text-left w-32 font-semibold">Data</th>
                                                        <th className="border border-gray-200 px-3 py-3 text-left w-64 font-semibold">Local</th>
                                                        <th className="border border-gray-200 px-2 py-3 text-center w-20 font-semibold text-[11px] leading-tight">Limpeza<br />Bebedouro</th>
                                                        <th className="border border-gray-200 px-2 py-3 text-center w-20 font-semibold text-[11px] leading-tight">Troca<br />Filtro</th>
                                                        <th className="border border-gray-200 px-2 py-3 text-center w-20 font-semibold text-[11px] leading-tight">Manutenção<br />Bebedouro</th>

                                                        <th className="border border-gray-200 px-3 py-3 text-left min-w-50 font-semibold text-red-700 bg-red-50">Observação</th>
                                                        <th className="border border-gray-200 px-3 py-3 text-left min-w-50 font-semibold text-red-700 bg-red-50">Ação Corretiva</th>

                                                        <th className="border border-gray-200 px-3 py-3 text-center min-w-37.5 font-semibold">Assinatura</th>
                                                        <th className="border border-gray-200 px-2 py-3 text-center w-12"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bebedourosLogs.map((log) => {
                                                        return (
                                                            <tr key={log.id} className="hover:bg-gray-50">
                                                                <td className="border border-gray-200 px-2 py-2">
                                                                    <input type="date" value={log.data} onChange={(e) => updateBebedouroField(log.id, 'data', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none" />
                                                                </td>
                                                                <td className="border border-gray-200 px-2 py-2 w-64 min-w-64">
                                                                    <input type="text" value={log.local} onChange={(e) => updateBebedouroField(log.id, 'local', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Ex: Refeitório" />
                                                                </td>

                                                                {(['limpeza', 'trocaFiltro', 'manutencao'] as Array<'limpeza' | 'trocaFiltro' | 'manutencao'>).map((campo) => (
                                                                    <td key={campo} className="border border-gray-200 px-1 py-2 text-center align-middle">
                                                                        <div className="flex justify-center gap-1">
                                                                            <button
                                                                                onClick={() => updateBebedouroField(log.id, campo, log[campo] === 'S' ? '' : 'S')}
                                                                                className={`w-7 h-7 rounded text-[10px] font-bold border transition-all ${log[campo] === 'S' ? 'bg-green-100 text-green-700 border-green-400 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-green-300'}`}
                                                                            >S</button>
                                                                            <button
                                                                                onClick={() => updateBebedouroField(log.id, campo, log[campo] === 'N' ? '' : 'N')}
                                                                                className={`w-7 h-7 rounded text-[10px] font-bold border transition-all ${log[campo] === 'N' ? 'bg-red-100 text-red-600 border-red-400 shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-red-300'}`}
                                                                            >N</button>
                                                                        </div>
                                                                    </td>
                                                                ))}

                                                                <td className="border border-gray-200 px-2 py-2 bg-red-50/30">
                                                                    <input
                                                                        type="text"
                                                                        value={log.observacao || ''}
                                                                        onChange={(e) => updateBebedouroField(log.id, 'observacao', e.target.value)}
                                                                        className="w-full border border-red-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-red-500 outline-none"
                                                                        placeholder="Observações..."
                                                                    />
                                                                </td>
                                                                <td className="border border-gray-200 px-2 py-2 bg-red-50/30">
                                                                    <input
                                                                        type="text"
                                                                        value={log.acaoCorretiva || ''}
                                                                        onChange={(e) => updateBebedouroField(log.id, 'acaoCorretiva', e.target.value)}
                                                                        className="w-full border border-red-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-red-500 outline-none"
                                                                        placeholder="Ação Corretiva..."
                                                                    />
                                                                </td>

                                                                <td className="border border-gray-200 px-2 py-2">
                                                                    <SignatureSelector value={log.signature || null} onChange={(v) => updateBebedouroField(log.id, 'signature', v ?? '')} />
                                                                </td>

                                                                <td className="border border-gray-200 px-2 py-2 text-center align-middle">
                                                                    <button
                                                                        onClick={() => removeBebedouroRow(log.id)}
                                                                        disabled={bebedourosLogs.length <= 1}
                                                                        className={`transition-colors ${bebedourosLogs.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500'}`}
                                                                        title={bebedourosLogs.length <= 1 ? "É necessário manter ao menos 1 registro" : "Remover linha"}
                                                                    >
                                                                        <BiTrash size={18} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {bebedourosLogs.length === 0 && (
                                                        <tr>
                                                            <td colSpan={9} className="text-center py-6 text-gray-500 bg-white">
                                                                Nenhum registro. Clique no botão de Nova Linha acima para adicionar.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : activeArea.id === 'transporte' ? (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Data</th>
                                                {['Baú Limpo', 'Sem Odor', 'Livre Animais', 'Contentor Limpo'].map(h =>
                                                    <th key={h} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">{h}</th>
                                                )}
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monitor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {currentLogs.map((reg: any, idx: number) => (
                                                <tr key={`transporte-${reg.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 w-48 align-middle">
                                                        <div className="relative flex items-center"><BiCalendar className="absolute left-3 text-gray-400 pointer-events-none" size={16} /><input type="date" value={reg.date} onChange={(e) => updateField(idx, 'date', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-blue-500" /></div>
                                                    </td>
                                                    {['bauLimpo', 'semOdor', 'livreAnimais', 'contentorLimpo'].map(field => (
                                                        <td key={field} className="px-4 py-3 align-middle text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button onClick={() => setCheckValue(idx, field, 'C')} className={`w-9 h-9 rounded-lg text-xs font-black transition-all border flex items-center justify-center ${reg.checks?.[field] === 'C' ? 'bg-green-50 text-green-600 border-green-300 shadow-sm scale-105' : 'bg-white text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-500'}`}>C</button>
                                                                <button onClick={() => setCheckValue(idx, field, 'NC')} className={`w-9 h-9 rounded-lg text-xs font-black transition-all border flex items-center justify-center ${reg.checks?.[field] === 'NC' ? 'bg-red-50 text-red-500 border-red-300 shadow-sm scale-105' : 'bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-400'}`}>NC</button>
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 align-middle"><SignatureSelector value={reg.monitorSignature} onChange={(v: any) => updateField(idx, 'monitorSignature', v || "")} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Data</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{activeArea.campo2}</th>
                                                {activeArea.isMatricial ? (
                                                    <>
                                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Status (C/NC)</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Resp. / Limpeza</th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Monitor Responsavel</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                            {activeArea.tituloProdutos || "Produtos Utilizados"}
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                            {activeArea.id === 'lavagem_proc' ? 'Fiscal Responsável' : 'Assinatura'}
                                                        </th>
                                                    </>
                                                )}
                                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentLogs.map((reg: any, idx: number) => (
                                                <tr key={`geral-${reg.id}-${idx}`} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-4 py-3 w-48 align-middle"><div className="relative flex items-center"><BiCalendar className="absolute left-3 text-gray-400 pointer-events-none" size={16} /><input type="date" value={reg.date} onChange={(e) => updateField(idx, 'date', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-blue-500" /></div></td>
                                                    <td className="px-4 py-3 w-40 align-middle">
                                                        {activeArea.campo2 === 'Horário' ? (
                                                            <div className="relative flex items-center"><BiTime className="absolute left-3 text-gray-400 pointer-events-none" size={16} /><input type="time" value={reg.time} onChange={(e) => updateField(idx, 'time', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-blue-500" /></div>
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
                                                            <td className="px-3 py-2 align-middle min-w-44"><SignatureSelector value={reg.signature} onChange={(v: any) => updateField(idx, 'signature', v || "")} /></td>
                                                            <td className="px-3 py-2 align-middle min-w-44"><SignatureSelector value={reg.monitorSignature} onChange={(v: any) => updateField(idx, 'monitorSignature', v || "")} /></td>
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
                                                            <td className="px-4 py-3 align-middle min-w-48"><SignatureSelector value={reg.signature} onChange={(v: any) => updateField(idx, 'signature', v || "")} /></td>
                                                        </>
                                                    )}
                                                    <td className="px-4 py-3 align-middle text-center w-12">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRow(idx)}
                                                            disabled={currentLogs.length <= 1}
                                                            className={`transition-colors ${currentLogs.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-500'}`}
                                                            title={currentLogs.length <= 1 ? "É necessário manter ao menos 1 registro" : "Remover linha"}
                                                        >
                                                            <BiTrash size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {activeArea.isMatricial && activeArea.id !== 'transporte' && activeArea.id !== 'tesouras' && activeArea.id !== 'bebedouros' && (
                                <div className="bg-gray-50 p-4 md:p-6 flex flex-col gap-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <div>Total de registros na tela: <span className="font-bold text-gray-700">{currentLogs.length}</span></div>
                                    </div>
                                    <div className="w-full bg-white border border-gray-200 rounded-xl p-4 shadow-sm mt-2">
                                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-2"><BiNote className="text-green-600" size={16} /> Observações de Não Conformidade:</label>
                                        <textarea value={observacaoNC} onChange={(e) => setObservacaoNC(e.target.value)} className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-green-500 outline-none resize-none" placeholder="Descreva as observações caso exista alguma não conformidade..." />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end mb-8">
                            <button type="button" onClick={async () => { await exportarExcel(); localStorage.removeItem("gv_higienizacao_geral_v5"); }} className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-6 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm">
                                <BiDownload size={22} /> Exportar para Excel
                            </button>
                        </div>
                    </main>
                </div>

                <footer className="mt-6 bg-gray-900 text-white rounded-xl shadow overflow-hidden">
                    <div className="p-4 md:p-5">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold">GV</div><div><p className="text-sm font-medium">GrandValle - Sistema de Controle de Higienização</p><p className="text-xs text-gray-300">© {new Date().getFullYear()} - Todos os direitos reservados</p></div></div>
                            <div className="flex items-center gap-6">
                                <div className="text-center"><p className="text-xs text-gray-300">Revisado por</p><p className="font-bold text-yellow-300">{COMPLIANCE.revisedBy}</p></div>
                                <div className="h-8 w-px bg-gray-700"></div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-300">Código PHU</p>
                                    <p className="font-bold text-white bg-blue-600 px-3 py-1 rounded-lg">
                                        {activeArea.doc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}