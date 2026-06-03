"use client";

import React, { useState, useEffect } from "react";
import { SignatureSelector } from "../../../components/SignatureSelector";
import Link from "next/link";
import { BiHistory, BiTrash, BiShieldQuarter, BiClipboard, BiWater, BiPlus, BiInfoCircle, BiCalendar, BiDownload } from "react-icons/bi";
import { useCondutaController } from "../controller/useCondutaController";
import { COMPLIANCE, COMPLIANCE_LAVAGEM, QUESTIONS, DAYS } from "../model/condutaModel";

export default function CondutaHigienePage() {
    // 🟢 TRAVA DE SEGURANÇA PARA EVITAR ERRO DE HYDRATION
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    const {
        activeTab, setActiveTab, week, setWeek, signatures, setSignatures, checklist, toggleStatus,
        actions, addActionRow, updateAction, removeActionRow, showStats, setShowStats, showActionPlan, setShowActionPlan, stats,
        lavagemLogs, addLavagemRow, updateLavagemRow, toggleLavagemCell, removeLavagemRow,
        localLavagem, setLocalLavagem,
        exportarExcel
    } = useCondutaController();

    const getDocInfo = () => {
        if (activeTab === "inspecao") return { code: COMPLIANCE.popCode, title: "Monitoramento de Conduta e Saúde", area: COMPLIANCE.area, rev: COMPLIANCE.revisionDate, by: COMPLIANCE.revisedBy };
        return { code: COMPLIANCE_LAVAGEM.popCode, title: "Monitoramento de Lavagem de Mãos", area: COMPLIANCE_LAVAGEM.area, rev: COMPLIANCE_LAVAGEM.revisionDate, by: COMPLIANCE_LAVAGEM.revisedBy };
    };

    const docInfo = getDocInfo();

    // Se o navegador ainda não estiver pronto, não renderizamos nada para evitar conflito com o servidor
    if (!isMounted) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-slate-500 font-bold">Carregando sistema...</div>;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-indigo-50 p-4 md:p-6 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto">

                {/* HEADER DA PÁGINA */}
                <header className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl mb-6 overflow-hidden border border-gray-200">
                    <div className="p-4 sm:p-6 bg-linear-to-r from-indigo-700 to-purple-700">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                                    <BiShieldQuarter size={32} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight uppercase tracking-tight">{docInfo.title}</h1>
                                    <p className="text-xs sm:text-sm text-indigo-100 mt-1 uppercase font-semibold">Sistema de Segurança Alimentar e BPF</p>
                                </div>
                            </div>
                            <div className="flex justify-end md:block items-center gap-4">
                                <Link href="/historico?modulo=conduta" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-white/30 mr-2"><BiHistory size={18} /> Histórico</Link>
                                <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-lg text-right">
                                    <p className="text-white text-xs sm:text-sm">Código</p>
                                    <p className="text-white font-bold text-lg sm:text-xl">{docInfo.code}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CABEÇALHO CONDICIONAL (PHU-037) */}
                    {activeTab === "inspecao" && (
                        <div className="p-4 sm:p-5 bg-linear-to-r from-indigo-50 to-purple-50 border-t border-indigo-100 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                <div>
                                    <label className="font-bold text-slate-700 text-xs sm:text-sm mb-2 flex items-center gap-2">📅 Período da Semana</label>
                                    <input type="text" value={week} onChange={(e) => setWeek(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 sm:py-3 sm:px-4 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400" />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 text-xs sm:text-sm mb-2 flex items-center gap-2">📍 Área de Monitoramento</label>
                                    <div className="bg-gray-100 p-1 rounded-lg flex relative"><span className="flex-1 py-2 px-3 rounded-md text-sm font-bold text-indigo-700 flex items-center justify-center gap-2 bg-white shadow-sm ring-1 ring-gray-200">{docInfo.area}</span></div>
                                    <p className="text-xs text-gray-400 mt-1.5 text-center">Área de Processamento Primário</p>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 text-xs sm:text-sm mb-2 flex items-center gap-2">✍️ Auxiliar de Segurança</label>
                                    <div className="min-h-12 border border-gray-200 rounded-lg flex items-center justify-center p-1 transition-colors bg-white"><SignatureSelector value={signatures.coordinator} onChange={(v) => setSignatures((prev) => ({ ...prev, coordinator: v }))} /></div>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* BOTÕES DAS ABAS */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex items-center overflow-x-auto mb-6 hide-scrollbar">
                    <button onClick={() => setActiveTab("inspecao")} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "inspecao" ? "text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}><BiClipboard size={20} /> Checklist de Conduta e Saúde</button>
                    <div className="w-px h-8 bg-gray-300 mx-2 shrink-0"></div>
                    <button onClick={() => setActiveTab("lavagem")} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "lavagem" ? "text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}><BiWater size={20} /> Lavagem de Mãos</button>
                </div>

                {/* TELA 1: CHECKLIST DIÁRIO */}
                {activeTab === "inspecao" && (
                    <div className="space-y-6 animate-fade-in">
                        {showStats && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
                                    <div className="flex items-center justify-between"><div>
                                        <p className="text-gray-500 text-sm">Conformidade</p><p className="text-3xl font-bold text-green-600">{stats.complianceRate}%</p><p className="text-xs text-gray-400 mt-1">{stats.okCount} de {stats.totalCells}</p></div><div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 text-2xl">✅</div></div></div>
                                <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Não Conformidades</p><p className="text-3xl font-bold text-red-600">{stats.noCount}</p><p className="text-xs text-gray-400 mt-1">{stats.ncRate}% das verificações</p></div><div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 text-2xl">⚠️</div></div></div>
                                <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Preenchimento</p><p className="text-3xl font-bold text-indigo-600">{stats.completionRate}%</p><p className="text-xs text-gray-400 mt-1">{stats.pendingCount} pendentes</p></div><div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl">📊</div></div></div>
                                <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200"><div className="flex items-center justify-between"><div><p className="text-gray-500 text-sm">Ações Pendentes</p><p className="text-3xl font-bold text-amber-600">{stats.ncItems}</p><p className="text-xs text-gray-400 mt-1">no plano de ação</p></div><div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 text-2xl">📋</div></div></div>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                            <div className="p-5 bg-linear-to-r from-gray-50 to-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div><h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Checklist de Conduta e Saúde</h2><p className="text-sm text-gray-500 mt-1">{QUESTIONS.length} itens • {DAYS.length} dias da semana</p></div>
                                <button onClick={() => setShowStats(!showStats)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">{showStats ? "Ocultar" : "Mostrar"} Estatísticas</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left"><thead>
                                    <tr className="bg-linear-to-r from-gray-100 to-gray-50 border-b border-gray-200">
                                        <th className="py-4 px-4 font-bold text-gray-700 text-sm uppercase sticky left-0 bg-gray-100 z-10 w-20">Item</th>
                                        <th className="py-4 px-4 font-bold text-gray-700 text-sm uppercase min-w-96">Inspeção - Itens Observados</th>{DAYS.map((day) =>
                                            <th key={day} className="py-4 px-2 text-center font-bold text-gray-700 text-xs uppercase w-20">{day}</th>)}</tr></thead>
                                    <tbody className="divide-y divide-gray-100">{checklist.map((row, index) => (<tr key={row.questionId} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-center font-bold text-gray-700 sticky left-0 bg-white z-10 border-r border-gray-200">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mx-auto text-indigo-800">{String(row.questionId).padStart(2, "0")}</div></td>
                                        <td className="py-3 px-4 text-gray-700 text-sm font-medium leading-relaxed border-r border-gray-200">{QUESTIONS[index]}</td>{DAYS.map((day) => { //@ts-ignore
                                            const status = row[day];
                                            return (<td key={day}
                                                onClick={() => toggleStatus(index, day)}
                                                className="py-3 px-2 text-center border-r border-gray-200">
                                                <div className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center cursor-pointer transition-all ${status === "ok" ? "bg-green-100 border-2 border-green-500 text-green-800" : status === "no" ? "bg-red-100 border-2 border-red-500 text-red-800" : "bg-gray-50 border-2 border-gray-200 text-gray-400"}`}>
                                                    <span className="font-bold text-sm">{status === "ok" ? "SIM" : status === "no" ? "NÃO" : "—"}</span></div></td>);
                                        })}</tr>))}</tbody></table>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                            <div className="p-5 bg-linear-to-r from-indigo-50 to-purple-50 border-b border-indigo-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">🛠️ Plano de Ação Corretiva</h2>
                                    <p className="text-sm text-gray-500 mt-1">Obrigatório para não conformidades</p></div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setShowActionPlan(!showActionPlan)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">{showActionPlan ? "Recolher" : "Expandir"}</button>
                                    <button onClick={addActionRow}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm">+ Nova Ação</button></div></div>
                            {showActionPlan && (<div className="overflow-x-auto">
                                <table className="w-full text-left"><thead>
                                    <tr className="bg-linear-to-r from-indigo-100 to-indigo-50 border-b border-indigo-200 text-indigo-950 uppercase text-[11px] tracking-widest font-black">
                                        <th className="py-4 px-4 min-w-37.5">📅 Data</th>
                                        <th className="py-4 px-4 w-32 text-center">Nº</th>
                                        <th className="py-4 px-4 min-w-50">Não Conformidade</th>
                                        <th className="py-4 px-4 min-w-50">Causa Raiz</th>
                                        <th className="py-4 px-4 min-w-50">Ação Corretiva</th>
                                        <th className="py-4 px-4 min-w-50">Responsável</th>
                                        <th className="py-4 px-4 min-w-35">Status</th>
                                        <th className="py-4 px-4 w-12"></th></tr></thead>
                                    <tbody className="divide-y divide-indigo-100">
                                        {actions.map((action, index) => (<tr key={action.id}
                                            className="hover:bg-blue-50/50 transition-colors">
                                            <td className="p-3">
                                                <div className="relative">
                                                    <input type="date"
                                                        value={action.date}
                                                        onChange={(e) =>
                                                            updateAction(index, "date", e.target.value)}
                                                        className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-sm font-bold text-gray-900 outline-none focus:border-indigo-600 appearance-none"
                                                        placeholder="DD/MM/AAAA"
                                                    />
                                                    <BiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                                                </div>
                                            </td>
                                            <td className="p-3 min-w-32">
                                                <input type="text" placeholder="#"
                                                    value={action.item}
                                                    onChange={(e) => updateAction(index, "item", e.target.value)}
                                                    className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-sm font-black text-center text-indigo-800 outline-none focus:border-indigo-600 placeholder:text-gray-500" /></td>
                                            <td className="p-3">
                                                <textarea placeholder="Descreva..."
                                                    value={action.nonConformity}
                                                    onChange={(e) => updateAction(index, "nonConformity", e.target.value)} className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-sm font-normal text-gray-900 outline-none focus:border-indigo-600 min-h-12.5 placeholder:text-gray-600" /></td>
                                            <td className="p-3">
                                                <textarea placeholder="Identifique..."
                                                    value={action.rootCause}
                                                    onChange={(e) =>
                                                        updateAction(index, "rootCause", e.target.value)}
                                                    className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-sm font-normal text-gray-900 outline-none focus:border-indigo-600 min-h-12.5 placeholder:text-gray-600" /></td>
                                            <td className="p-3">
                                                <textarea placeholder="O que será feito..."
                                                    value={action.action} onChange={(e) =>
                                                        updateAction(index, "action", e.target.value)} className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-sm font-normal text-gray-900 outline-none focus:border-indigo-600 min-h-12.5 placeholder:text-gray-600" /></td>
                                            <td className="p-3">
                                                <div className="border border-gray-200 rounded-lg p-1 min-h-12.5 bg-white">
                                                    <SignatureSelector
                                                        value={action.responsible}
                                                        onChange={(v) => updateAction(index, "responsible", v || "")} />
                                                </div></td>
                                            <td className="p-3">
                                                <select value={action.status}
                                                    onChange={(e) =>
                                                        updateAction(index, "status", e.target.value)} className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-xs font-black uppercase text-gray-900 outline-none focus:border-indigo-600 cursor-pointer">
                                                    <option value="pending">⏳ Pendente</option>
                                                    <option value="in_progress">🔄 Em Andamento</option>
                                                    <option value="completed">✅ Concluído</option>
                                                </select></td>
                                            <td className="p-3 text-center"><button onClick={() => removeActionRow(action.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><BiTrash size={22} />
                                            </button>
                                            </td></tr>))}
                                    </tbody></table>
                            </div>)}
                        </div>
                    </div>
                )}

                {/* TELA 2: LAVAGEM DE MÃOS */}
                {activeTab === "lavagem" && (
                    <div className="space-y-6 animate-fade-in">
                        {/* CABEÇALHO UNIFICADO */}
                        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200">
                            <div className="px-6 py-4 bg-linear-to-r from-indigo-600 to-indigo-500 flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-black text-white uppercase tracking-widest">Registro Diário de Lavagem</h2>
                                    <p className="text-indigo-200 text-[11px] mt-0.5">Horário Packing: 09:00h e 14:00h de segunda a sexta, sábados até as 13h</p>
                                </div>
                                <button onClick={addLavagemRow} className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"><BiPlus size={18} /> Adicionar Colaborador</button>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Local:</span>
                                    <button onClick={() => setLocalLavagem("Campo")} className={`px-6 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${localLavagem === 'Campo' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border-2 border-slate-300 text-slate-600 hover:border-indigo-400'}`}>
                                        Campo
                                    </button>
                                    <button onClick={() => setLocalLavagem("Packing House")} className={`px-6 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${localLavagem === 'Packing House' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border-2 border-slate-300 text-slate-600 hover:border-indigo-400'}`}>
                                        Packing House
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm"><thead><tr className="bg-slate-100 border-b border-slate-200"><th rowSpan={2} className="py-4 px-4 font-bold text-slate-700 text-xs uppercase tracking-widest sticky left-0 bg-slate-100 z-10 w-64 border-r border-slate-200 align-middle">Colaborador</th>{DAYS.map(day => (<th colSpan={2} key={day} className="py-2 px-2 text-center font-bold text-slate-700 text-[11px] uppercase border-r border-b border-slate-200">{day}</th>))}<th rowSpan={2} className="w-14"></th></tr><tr className="bg-slate-50 border-b border-slate-200">{DAYS.map(day => (<React.Fragment key={`sub-${day}`}><th className="py-2 text-center font-bold text-indigo-700 text-[9px] uppercase border-r border-slate-200 min-w-10">09h</th><th className="py-2 text-center font-bold text-indigo-700 text-[9px] uppercase border-r border-slate-200 min-w-10">14h</th></React.Fragment>))}</tr></thead><tbody className="divide-y divide-gray-100">{lavagemLogs.map((row) => (<tr key={row.id} className="hover:bg-indigo-50/20 transition-colors"><td className="p-2 sticky left-0 bg-white z-10 border-r border-gray-200"><input type="text" value={row.colaborador} onChange={(e) => updateLavagemRow(row.id, e.target.value.toUpperCase())} className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 placeholder:text-gray-300 uppercase" placeholder="NOME..." /></td>{DAYS.map(day => { const m = row.dias[day].manha; const t = row.dias[day].tarde; return (<React.Fragment key={`cell-${row.id}-${day}`}><td onClick={() => toggleLavagemCell(row.id, day, 'manha')} className="p-1 border-r border-gray-200 cursor-pointer text-center hover:bg-gray-50"><div className={`w-9 h-9 mx-auto rounded-md flex items-center justify-center transition-all ${m === 'C' ? 'bg-green-500 text-white shadow-sm scale-110' : m === 'NC' ? 'bg-red-500 text-white shadow-sm scale-110' : 'bg-slate-100 text-slate-400'}`}><span className="font-black text-xs">{m || "—"}</span></div></td><td onClick={() => toggleLavagemCell(row.id, day, 'tarde')} className="p-1 border-r border-gray-200 cursor-pointer text-center hover:bg-gray-50"><div className={`w-9 h-9 mx-auto rounded-md flex items-center justify-center transition-all ${t === 'C' ? 'bg-green-500 text-white shadow-sm scale-110' : t === 'NC' ? 'bg-red-500 text-white shadow-sm scale-110' : 'bg-slate-100 text-slate-400'}`}><span className="font-black text-xs">{t || "—"}</span></div></td></React.Fragment>) })}<td className="p-2 text-center"><button onClick={() => removeLavagemRow(row.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><BiTrash size={20} /></button></td></tr>))}</tbody></table></div>
                        </div>

                        {/* PROIBIÇÕES */}
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 items-start shadow-sm">
                            <BiInfoCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-rose-900 font-black text-xs uppercase mb-1.5 tracking-widest">É Proibido:</h3>
                                <p className="text-rose-800 text-xs font-semibold leading-relaxed uppercase">Fumar • Unhas grandes • Unhas c/ esmaltes • Unhas postiças • Anel • Relógio • Pulseiras • Colar • Brincos • Perfume / Maquiagem • Barba / Bigode • Sem touca • Uniforme incompleto • Uniforme sujo • Conversas paralelas.</p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    onClick={async () => await exportarExcel()}
                    // 🟢 ml-auto: empurra para a direita
                    // 🟢 mt-6: dá um espaço de 24px (1.5rem) em relação à tabela de cima
                    className="ml-auto mt-6 flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95"
                >
                    <BiDownload size={18} />
                    Exportar para Excel
                </button>

                {/* FOOTER */}
                <footer className="bg-linear-to-r from-gray-900 to-black text-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mt-6"><div className="p-4 sm:p-5"><div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4"><div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left"><div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 flex items-center justify-center shrink-0"><span className="font-bold text-base sm:text-lg">GV</span></div><div><h3 className="font-bold text-base sm:text-lg">GrandValle</h3><p className="text-gray-400 text-xs sm:text-sm">Monitoramento de Conduta e Saúde</p></div></div><div className="flex flex-wrap justify-center md:justify-end items-center gap-x-6 gap-y-4 w-full md:w-auto"><div className="text-center"><p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">Revisado por</p><p className="font-bold text-sm sm:text-base text-indigo-300">{docInfo.by}</p></div><div className="hidden md:block h-8 w-px bg-gray-700"></div><div className="text-center"><p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">Revisão</p><p className="font-bold text-sm sm:text-base">{docInfo.rev}</p></div><div className="hidden md:block h-8 w-px bg-gray-700"></div><div className="text-center flex flex-col items-center"><p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider mb-1">POP</p><div className="px-3 py-1 bg-indigo-600/90 rounded-md border border-indigo-500/50"><span className="font-bold text-xs sm:text-sm">{docInfo.code}</span></div></div></div></div><div className="mt-6 pt-4 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 text-center md:text-left gap-2"><p>© {new Date().getFullYear()} GrandValle. Segurança Alimentar.</p><p>Módulo 1.4.1 - Conduta</p></div></div></footer>
            </div>
        </div>
    );
}