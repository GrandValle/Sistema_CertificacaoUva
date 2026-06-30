"use client";

import { SignatureSelector } from "../../../components/SignatureSelector";
import { useInspecaoController } from "../controller/useInspecaoController";
import { WEEK_DAYS } from "../model/inspecaoModel";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BiPlus, BiHistory, BiPackage,
  BiCheckCircle, BiXCircle, BiCalendarWeek,
  BiBuilding, BiUser, BiError, BiWater, BiTrash
} from "react-icons/bi";
import { FaTractor } from "react-icons/fa";
import { PRODUTOS_LIMPEZA } from "../model/inspecaoModel";

export default function InspecaoPage() {
  const [isMounted, setIsMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsMounted(true); }, []);
  const {
    activeTab, setActiveTab,
    preOpInfo, setPreOpInfo,
    preOpData, togglePreOp,
    actionPlans, addActionRow, updateAction, removeActionRow,
    transportLogs, addTransportRow, updateTransport, removeTransportRow,
    packagingLogs, addPackagingRow, updatePackaging, removePackagingRow,
    selectedCleaningProduct,
    cleaningLogs, addCleaningRow, updateCleaning, removeCleaningRow,
    // 🟢 CORREÇÃO: Trocado os métodos antigos pela nossa nova função direta
    exportarExcel
  } = useInspecaoController();

  // Cálculo de resumo (Corrigido: sem a trava isMounted)
  let totalChecks = 0; let conformes = 0; let naoConformes = 0;
  preOpData.forEach(row => {
    Object.values(row.checks).forEach(val => {
      if (val !== null) totalChecks++;
      if (val === "C") conformes++;
      if (val === "NC") naoConformes++;
    });
  });

  const getDocInfo = () => {
    if (activeTab === "pre_inspecao") return { code: "2.11.7", name: "Pré-Inspeção Operacional", title: "PRÉ-INSPEÇÃO OPERACIONAL" };
    if (activeTab === "transporte") return { code: "PHU-031", name: "Controle de higiene dos veículos e contentores", title: "INSPEÇÃO DE TRANSPORTE" };
    if (activeTab === "embalagem") return { code: "PHU-032", name: "Inspeção de Material de Embalagem", title: "INSPEÇÃO DE MATERIAL DE EMBALAGEM" };
    return { code: "PHU-036", name: "Entrada de Material de Limpeza", title: "INSPEÇÃO DE MATERIAIS DE LIMPEZA" };
  };

  const docInfo = getDocInfo();

  const getCategoryBadgeClass = (category: string) => {
    const normalized = category.trim().toLowerCase();
    if (normalized === "instalações" || normalized === "instalacoes") {
      return "bg-orange-50 text-orange-700 border-orange-200";
    }
    if (normalized === "suprimentos") {
      return "bg-teal-50 text-teal-700 border-teal-200";
    }
    if (normalized === "higiene" || normalized === "limpeza") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (normalized === "pragas" || normalized === "controle de pragas") {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (normalized === "segurança" || normalized === "seguranca") {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (normalized === "área externa" || normalized === "area externa") {
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    }
    if (normalized === "logística" || normalized === "logistica") {
      return "bg-violet-50 text-violet-700 border-violet-200";
    }
    if (normalized === "frio") {
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  // Filtra os logs para mostrar apenas os do produto selecionado na aba de limpeza
  const currentCleaningLogs = cleaningLogs || [];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-sans text-gray-800 flex justify-center">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-xl flex flex-col overflow-hidden transition-all duration-300">

        {/* HEADER */}
        <div className="bg-[#1a1c23] text-white">
          <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 flex items-center justify-center font-black rounded-lg text-white text-xl shadow-lg">GV</div>
              <Link href="/historico?modulo=inspecao" className="text-sm font-bold flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 border border-white/20 transition-all">
                <BiHistory size={18} /> Histórico
              </Link>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black uppercase tracking-wide">{docInfo.title}</h1>
              <p className="text-xs font-medium text-gray-400 mt-1">Cód.: {docInfo.code}</p>
            </div>
            <div className="text-right text-[10px] font-medium text-gray-400 hidden md:block">
              <p>Rev: <span className="font-bold text-yellow-400">Clebitânia Carvalho</span></p>
              <p>02/01/2026</p>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-nowrap gap-2 px-6 pb-4">
            <button type="button" onClick={() => setActiveTab("pre_inspecao")} className={`flex-1 py-3 px-2 text-[11px] sm:text-xs font-bold uppercase rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === "pre_inspecao" ? "bg-orange-600 text-white shadow-md" : "bg-[#2a2d36] text-gray-400 hover:text-white"}`}>📋 Pré-Inspeção & Ação</button>
            <button type="button" onClick={() => setActiveTab("transporte")} className={`flex-1 py-3 px-2 text-[11px] sm:text-xs font-bold uppercase rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === "transporte" ? "bg-blue-600 text-white shadow-md" : "bg-[#2a2d36] text-gray-400 hover:text-white"}`}><FaTractor size={18} /> Transporte</button>
            <button type="button" onClick={() => setActiveTab("embalagem")} className={`flex-1 py-3 px-2 text-[11px] sm:text-xs font-bold uppercase rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === "embalagem" ? "bg-purple-600 text-white shadow-md" : "bg-[#2a2d36] text-gray-400 hover:text-white"}`}><BiPackage size={18} /> Embalagem</button>
            <button type="button" onClick={() => setActiveTab("limpeza")} className={`flex-1 py-3 px-2 text-[11px] sm:text-xs font-bold uppercase rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === "limpeza" ? "bg-cyan-600 text-white shadow-md" : "bg-[#2a2d36] text-gray-400 hover:text-white"}`}><BiWater size={18} /> Mat. Limpeza</button>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-gray-50 flex-1 overflow-auto">

          {/* ================= ABA 1: PRÉ-INSPEÇÃO ================= */}
          {activeTab === "pre_inspecao" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-orange-50/70 p-5 rounded-xl border border-orange-200 shadow-sm flex flex-col lg:flex-row gap-6">
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-center gap-3 mb-5 lg:mb-0">
                    <div className="p-2.5 bg-orange-100 text-orange-600 rounded-lg shadow-sm border border-orange-200/50"><BiCalendarWeek size={22} /></div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">Pré-Inspeção Operacional</h2>
                      <p className="text-xs text-gray-500">Controle diário das condições operacionais</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5"><BiCalendarWeek size={14} /> Semana de Inspeção</label>
                      <input type="text" value={preOpInfo.week} onChange={(e) => setPreOpInfo({ ...preOpInfo, week: e.target.value })} className="w-full h-11 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-sm" placeholder="Ex: 01 a 07 Jan" />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5"><BiBuilding size={14} /> Área de Inspeção</label>
                      <button type="button" className="w-full h-11 bg-orange-500 text-white font-bold rounded-lg text-sm shadow-sm cursor-default uppercase tracking-wider">Packing Uva</button>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5"><BiUser size={14} /> Coordenador Responsável</label>
                      <SignatureSelector value={preOpInfo.coordinator} onChange={(v) => setPreOpInfo({ ...preOpInfo, coordinator: v })} />
                    </div>
                  </div>
                </div>

                {/* PAINEL DE RESUMO CORRIGIDO: sem isMounted e com suppressHydrationWarning */}
                <div className="lg:w-64 bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-center">
                  <h3 className="text-sm font-bold text-center text-gray-800 mb-4 tracking-tighter">RESUMO</h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Verificações:</span>
                      <span suppressHydrationWarning className="font-bold text-gray-800">{totalChecks}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                      <span>Conformes:</span>
                      <span suppressHydrationWarning className="font-bold text-green-700">{conformes}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span>Não Conformes:</span>
                      <span suppressHydrationWarning className="font-bold text-red-700">{naoConformes}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABELA DE CHECKLIST */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-5 text-left text-sm font-black text-gray-700 w-[60%]">Itens de Verificação</th>
                      {WEEK_DAYS.map(d => (
                        <th key={d.short} className="p-4 text-center text-sm font-black text-gray-600 uppercase">
                          {d.short}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preOpData.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 text-orange-700 flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                              {String(idx + 1).padStart(2, '0')}
                            </div>
                            <div className="flex items-start gap-3">
                              <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border whitespace-nowrap ${getCategoryBadgeClass(row.category)}`}>
                                {row.category}
                              </span>
                              <span className="font-bold text-gray-800 text-base leading-snug">{row.item}</span>
                            </div>
                          </div>
                        </td>
                        {WEEK_DAYS.map(day => (
                          <td key={day.short} onClick={() => togglePreOp(idx, day.short)} className="p-3 text-center cursor-pointer">
                            <div className="flex justify-center items-center h-full">
                              {/* @ts-ignore */}
                              {row.checks[day.short] === "C" ? (
                                <BiCheckCircle className="text-green-500 text-3xl" />
                              ) : /* @ts-ignore */
                                row.checks[day.short] === "NC" ? (
                                  <BiXCircle className="text-red-500 text-3xl" />
                                ) : (
                                  <span className="text-gray-300 font-bold">-</span>
                                )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PLANO DE AÇÃO CORRETIVA */}
              <div className="bg-[#fff8f6] border border-red-100 rounded-2xl p-5 sm:p-7 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shadow-sm border border-red-200/50"><BiError size={24} /></div>
                    <div>
                      <h3 className="text-xl font-black text-red-900 tracking-tight">Plano de Ação Corretiva</h3>
                      <p className="text-sm font-medium text-red-600/80 mt-0.5">Preencher quando houver &quot;Não Conformidade&quot; identificada</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addActionRow}
                    className="flex items-center justify-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-all"
                  >
                    <BiPlus size={18} /> Nova Ação
                  </button>
                </div>

                <div className="space-y-4">
                  {actionPlans.map((action, idx) => (
                    <div key={action.id} className="bg-white rounded-xl p-5 border border-red-100 shadow-sm relative group transition-all hover:shadow-md">
                      <button type="button" onClick={() => removeActionRow(action.id)} className="absolute -top-3 -right-3 bg-white text-gray-400 hover:text-white hover:bg-red-500 border border-gray-200 border-dashed hover:border-red-500 rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"><BiXCircle size={18} /></button>

                      <div className="flex flex-col md:flex-row gap-4 mb-4 items-start">
                        <div className="w-full md:w-40 shrink-0">
                          <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-tighter">Data</label>
                          <input type="date" value={action.date || ''} onChange={(e) => updateAction(idx, 'date', e.target.value)} className="w-full h-11 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none text-gray-700 transition-all shadow-sm" />
                        </div>
                        <div className="w-full md:w-24 shrink-0">
                          <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-tighter">Nº do Item</label>
                          <input type="text" value={action.item} onChange={(e) => updateAction(idx, 'item', e.target.value)} className="w-full h-11 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none text-gray-700 text-center font-bold shadow-sm" placeholder="Ex: 05" />
                        </div>
                        <div className="w-full md:w-80">
                          <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-tighter">Responsável (Assinatura)</label>
                          <SignatureSelector value={action.responsavel} onChange={(v) => updateAction(idx, 'responsavel', v)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-tighter">Não Conformidade Identificada</label>
                          <textarea value={action.naoConformidade} onChange={(e) => updateAction(idx, 'naoConformidade', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 focus:ring-2 focus:ring-red-500 outline-none resize-y text-gray-700 shadow-sm" placeholder="Descrição..." />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-tighter">Ação Corretiva Proposta</label>
                          <textarea value={action.acaoCorretiva} onChange={(e) => updateAction(idx, 'acaoCorretiva', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm h-20 focus:ring-2 focus:ring-red-500 outline-none resize-y text-gray-700 shadow-sm" placeholder="Ação..." />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= ABA 2: TRANSPORTE ================= */}
          {activeTab === "transporte" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg"><FaTractor size={22} /></div>
                  <div>
                    <h2 className="font-bold text-gray-800 text-lg">Inspeção do Transporte de Colheita</h2>
                    <p className="text-xs text-gray-500 font-medium tracking-wide">Documento PHU-031 - Controle de higiene dos veículos e contentores</p>
                  </div>
                </div>
                <button type="button" onClick={addTransportRow} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md active:scale-95 transition-all"><BiPlus size={18} /> Novo Veículo</button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-[11px] uppercase tracking-tighter text-gray-500 font-black">
                      <th className="p-4 text-left">Data / Período</th>
                      {['Baú Limpo', 'Sem Odor', 'Livre de Animais', 'Contentor Limpo'].map(h => <th key={h} className="p-4 text-center">{h}</th>)}
                      <th className="p-4 text-left">Monitor Responsável</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transportLogs.map((log, idx) => (
                      <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-4 w-48"><input type="date" value={log.date} onChange={(e) => updateTransport(idx, 'date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-blue-500 outline-none shadow-sm" /></td>
                        {['bauLimpo', 'semOdor', 'livreAnimais', 'contentorLimpo'].map(f => (
                          <td key={f} className="p-4 text-center">
                            <div className="flex gap-1 justify-center">
                              {(['C', 'NC'] as const).map((opt) => {
                                const isSelected = log[f as keyof typeof log] === opt;
                                const isConforme = opt === 'C';

                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => updateTransport(idx, f as any, isSelected ? null : opt)}
                                    className={`w-9 h-9 rounded-lg font-black text-[10px] transition-all ${isSelected
                                      ? (isConforme ? 'bg-green-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md')
                                      : `bg-gray-100 border border-gray-200 text-gray-400 ${isConforme ? 'hover:bg-green-50' : 'hover:bg-red-50'}`
                                      }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        ))}
                        <td className="p-4 w-56"><SignatureSelector value={log.monitor} onChange={(v) => updateTransport(idx, 'monitor', v)} /></td>
                        <td className="p-4 text-center"><button type="button" onClick={() => removeTransportRow(log.id)} className="text-gray-300 hover:text-red-500 transition-colors"><BiXCircle size={22} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= ABA 3: EMBALAGEM (PHU-032) ================= */}
          {activeTab === "embalagem" && (
            <div className="space-y-6 animate-fade-in">
              {/* HEADER */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg"><BiPackage size={22} /></div>
                  <div>
                    <h2 className="font-bold text-gray-800 text-lg">Inspeção de Material de Embalagem</h2>
                    <p className="text-xs text-gray-500 font-medium tracking-wide">Documento PHU-032 1.3.6 - Controle de qualidade de insumos</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addPackagingRow}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg font-bold text-sm shadow-md active:scale-95 transition-all"
                >
                  <BiPlus size={18} /> Novo Registro
                </button>
              </div>

              {/* LISTA DE CARDS */}
              <div className="space-y-6">
                {packagingLogs.map((p, idx) => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Cabeçalho do card com número e botão remover */}
                    <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                      <span className="font-bold text-gray-700 text-sm uppercase tracking-wider">
                        Registro #{idx + 1}
                      </span>
                      <button
                        onClick={() => removePackagingRow(p.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <BiXCircle size={20} />
                      </button>
                    </div>

                    {/* CORPO DO CARD */}
                    <div className="p-5 space-y-5">
                      {/* Linha 1: Data, Material, Quantidade, Lote, Validade */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Data</label>
                          <input
                            type="date"
                            value={p.date}
                            onChange={(e) => updatePackaging(idx, 'date', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Tipo de Material</label>
                          <input
                            type="text"
                            placeholder="Papelão, plástico..."
                            value={p.materialType}
                            onChange={(e) => updatePackaging(idx, 'materialType', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Quantidade</label>
                          <input
                            type="text"
                            placeholder="0"
                            value={p.quantity}
                            onChange={(e) => updatePackaging(idx, 'quantity', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Lote</label>
                          <input
                            type="text"
                            placeholder="LOTE"
                            value={p.lote}
                            onChange={(e) => updatePackaging(idx, 'lote', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Validade</label>
                          <input
                            type="date"
                            value={p.validity}
                            onChange={(e) => updatePackaging(idx, 'validity', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400"
                          />
                        </div>
                      </div>

                      {/* Linha 2: Status da Inspeção */}
                      <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">

                        <h4 className="text-purple-700 font-bold text-sm mb-4 uppercase tracking-wide">
                          Status da Inspeção
                        </h4>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                          {[
                            { key: "livrePragas", label: "Livre de Pragas/Roedores?" },
                            { key: "embalagemFechada", label: "Embalagem Fechada?" },
                            { key: "qualidadeConforme", label: "Qualidade Conforme?" }
                          ].map((item) => (

                            <div
                              key={item.key}
                              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm"
                            >

                              <span className="text-sm font-semibold text-gray-700 leading-tight max-w-[140px]">
                                {item.label}
                              </span>

                              <div className="flex gap-2">
                                {['C', 'NC'].map((val) => {
                                  const isSelected = p[item.key as keyof typeof p] === val;
                                  const isGreen = val === "C";

                                  return (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() => updatePackaging(idx, item.key as any, isSelected ? "" : val)}
                                      className={`w-12 h-10 rounded-lg font-bold text-sm transition-all ${isSelected
                                        ? isGreen ? "bg-green-500 text-white shadow-md" : "bg-red-500 text-white shadow-md"
                                        : isGreen ? "bg-white border border-green-300 text-green-600" : "bg-white border border-red-300 text-red-500"
                                        }`}
                                    >
                                      {val}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Linha 3: Observações (destacada) + Responsável */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Observações</label>
                          <div className="bg-blue-50/70 rounded-xl border border-blue-200 p-3 shadow-sm">
                            <textarea
                              rows={3}
                              placeholder="Notas importantes sobre a inspeção..."
                              value={p.obs}
                              onChange={(e) => updatePackaging(idx, 'obs', e.target.value)}
                              className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none bg-white/80"
                            />
                            <p className="text-[10px] text-blue-500/70 mt-1 italic">
                              Inclua detalhes sobre não conformidades ou observações gerais.
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Responsável (Assinatura)</label>
                          <div className="border border-gray-300 rounded-lg bg-white min-h-[44px] flex items-center p-1">
                            <SignatureSelector
                              value={p.responsavel}
                              onChange={(v) => updatePackaging(idx, 'responsavel', v)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Caso não haja registros (nunca vai acontecer, mas deixamos por segurança) */}
              {packagingLogs.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <BiPackage size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum registro de embalagem ainda.</p>
                  <p className="text-sm">Clique em "Novo Registro" para começar.</p>
                </div>
              )}
            </div>
          )}

          {/* ================= ABA 4: MATERIAIS DE LIMPEZA ================= */}
          {activeTab === "limpeza" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Cabeçalho Ciano */}
                <div className="p-5 sm:p-6 bg-cyan-50/80 border-b border-cyan-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center border border-cyan-200/50 shadow-sm">
                      <BiWater size={24} />
                    </div>
                    <div>
                      {/* Título dinâmico: mostra o produto da 1ª linha ou o texto padrão */}
                      <h2 className="font-black text-gray-800 text-xl tracking-tight">
                        {currentCleaningLogs[0]?.product || "Materiais de Limpeza"}
                      </h2>
                      <p className="text-sm font-medium text-cyan-600 mt-0.5">
                        Planilha de inspeção de entrada de insumos
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addCleaningRow}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-sm shadow-md active:scale-95 transition-all"
                  >
                    <BiPlus size={18} /> Novo Registro
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[1000px] w-full text-sm border-collapse">
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
                      {currentCleaningLogs.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-gray-400 font-medium">
                            Nenhum registro preenchido. Clique em &quot;Novo Registro&quot;.
                          </td>
                        </tr>
                      ) : (
                        currentCleaningLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-cyan-50/30 transition-colors group">
                            <td className="p-2">
                              <input type="date" value={log.date} onChange={(e) => updateCleaning(log.id, 'date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-cyan-400 shadow-sm" />
                            </td>

                            {/* SELECT DE PRODUTOS */}
                            <td className="p-2">
                              <select
                                value={log.product || ""}
                                onChange={(e) => updateCleaning(log.id, 'product', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-cyan-400 bg-white"
                              >
                                <option value="">Selecione...</option>
                                {PRODUTOS_LIMPEZA.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </td>

                            {/* Colunas Sim/Não */}
                            {(['produtoCorreto', 'composicaoOk', 'embalagemOk', 'padraoExigido', 'cumprePedido'] as const).map(field => (
                              <td key={field} className="p-2">
                                <div className="flex items-center justify-center gap-2">
                                  {(['Sim', 'Não'] as const).map(opt => {
                                    const isSelected = log[field] === opt; // Verifica se este botão já está selecionado

                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        // 🟢 A MÁGICA ACONTECE AQUI: Se já estiver selecionado, passa null (desmarca). Senão, passa a opção ('Sim' ou 'Não')
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
                              <SignatureSelector value={log.responsavel} onChange={(v) => updateCleaning(log.id, 'responsavel', v)} />
                            </td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => removeCleaningRow(log.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1.5">
                                <BiTrash size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 text-center italic md:hidden py-2 tracking-widest uppercase">Deslize a tabela para o lado para preencher assinatura ↔️</p>
            </div>
          )}
        </div>

        {/* BOTÃO EXPORTAR PERFEITO E CORRIGIDO */}
        <div className="p-4 sm:p-6 bg-white border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={async () => {
              // 🟢 Chamando a função direta (sem controller.) desestruturada do hook
              await exportarExcel();

              // Limpa a chave do LocalStorage direto no clique
              localStorage.removeItem("gv_inspecao_v11");
            }}
            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
          >
            Exportar para Excel
          </button>
        </div>

        {/* RODAPÉ PROFISSIONAL */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="bg-[#1a1f2e] rounded-xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 shadow-lg border border-gray-800">
            <div>
              <p className="text-[11px] text-gray-400 mb-1">Revisado por</p>
              <p className="font-bold text-yellow-400 text-sm">Clebitânia Carvalho</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-1">Última Revisão</p>
              <p className="font-bold text-white text-sm">02/01/2026</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-1">Código do Documento</p>
              <p className="font-bold text-white text-sm">{docInfo.code}</p>
            </div>
          </div>

          <div className="text-center text-[11px] text-gray-500 space-y-1.5">
            <p>GrandValle © {new Date().getFullYear()} • {docInfo.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}