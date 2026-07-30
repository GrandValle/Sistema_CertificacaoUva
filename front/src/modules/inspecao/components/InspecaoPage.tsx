"use client";

import { SignatureSelector } from "../../../components/SignatureSelector";
import { useInspecaoController } from "../controller/useInspecaoController";
import {
  WEEK_DAYS,
  ITENS_SEGURANCA_TRANSPORTE,
  criarSegurancaTransportePadrao,
  SegurancaTransporteItem
} from "../model/inspecaoModel";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BiPlus, BiHistory,
  BiCheckCircle, BiXCircle, BiCalendarWeek,
  BiBuilding, BiUser, BiError, BiTrash, BiTime, BiX,
  BiCheck, BiCalendar, BiCar
} from "react-icons/bi";
import { FaTruck } from "react-icons/fa";

export default function InspecaoPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const {
    activeTab, setActiveTab,
    preOpInfo, setPreOpInfo,
    preOpData, togglePreOp,
    actionPlans, addActionRow, updateAction, removeActionRow,
    foreignObjectLogs,
    FOREIGN_OBJECT_LOCATIONS,
    addForeignObjectRow,
    updateForeignObject,
    removeForeignObjectRow,
    exportarExcel,
    observacoesGerais,
    addObservacaoGeral,
    removeObservacaoGeral,
    updateObservacaoGeral,
  } = useInspecaoController();

  // 🔥 ESTADO: COLUNAS DE TRANSPORTE (Lado a Lado com Rolagem)
  const [colunasTransporte, setColunasTransporte] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("seguranca_transporte_colunas");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) { /* ignore */ }
      }
    }
    return [{
      id: Date.now(),
      dataInspecao: "",
      placa: "",
      responsavel: null,
      itens: ITENS_SEGURANCA_TRANSPORTE.map((textoItem: any) => ({
        item: typeof textoItem === "string" ? textoItem : textoItem.item,
        conforme: null,
        observacao: "",
        acaoCorretiva: ""
      })),
      observacaoGeral: "",
      acaoCorretivaGeral: ""
    }];
  });

  // Salvar colunas no localStorage
  useEffect(() => {
    localStorage.setItem("seguranca_transporte_colunas", JSON.stringify(colunasTransporte));
  }, [colunasTransporte]);

  const adicionarColunaCaminhao = () => {
    setColunasTransporte(prev => [
      ...prev,
      {
        id: Date.now(),
        dataInspecao: "",
        placa: "",
        responsavel: null,
        itens: ITENS_SEGURANCA_TRANSPORTE.map((textoItem: any) => ({
          item: typeof textoItem === "string" ? textoItem : textoItem.item,
          conforme: null,
          observacao: "",
          acaoCorretiva: ""
        })),
        observacaoGeral: "",
        acaoCorretivaGeral: ""
      }
    ]);
  };

  // Cálculo de resumo (pré-inspeção)
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
    if (activeTab === "transporte") return { name: "Inspeção de Segurança no Transporte da Fruta", title: "INSPEÇÃO DE TRANSPORTE" };
    if (activeTab === "objetos_estranhos") return { code: "PHU-033", name: "Controle de inspeção de objetos estranhos", title: "INSPEÇÃO DE OBJETOS ESTRANHOS" };
    return { code: "PHU-036", name: "Entrada de Material de Limpeza", title: "INSPEÇÃO DE MATERIAIS DE LIMPEZA" };
  };

  const docInfo = getDocInfo();
  const [activeForeignSector, setActiveForeignSector] = useState<string>(FOREIGN_OBJECT_LOCATIONS[0]);

  const filteredForeignObjectRows = foreignObjectLogs
    .map((log, originalIdx) => ({ log, originalIdx }))
    .filter(({ log }) => log.location === activeForeignSector);

  useEffect(() => {
    if (activeTab !== "objetos_estranhos") return;

    const hasRowsForSector = foreignObjectLogs.some(
      (row) => row.location === activeForeignSector
    );

    if (!hasRowsForSector) {
      addForeignObjectRow(activeForeignSector);
    }
  }, [activeTab, activeForeignSector, foreignObjectLogs, addForeignObjectRow]);

  const getCategoryBadgeClass = (category: string) => {
    const normalized = category.trim().toLowerCase();
    if (normalized === "instalações" || normalized === "instalacoes") return "bg-orange-50 text-orange-700 border-orange-200";
    if (normalized === "suprimentos") return "bg-teal-50 text-teal-700 border-teal-200";
    if (normalized === "higiene" || normalized === "limpeza") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (normalized === "pragas" || normalized === "controle de pragas") return "bg-blue-50 text-blue-700 border-blue-200";
    if (normalized === "segurança" || normalized === "seguranca") return "bg-red-50 text-red-700 border-red-200";
    if (normalized === "área externa" || normalized === "area externa") return "bg-cyan-50 text-cyan-700 border-cyan-200";
    if (normalized === "logística" || normalized === "logistica") return "bg-violet-50 text-violet-700 border-violet-200";
    if (normalized === "frio") return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

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

          {/* MENU DE ABAS */}
          <div className="flex flex-wrap md:flex-nowrap gap-2 px-6 pb-4">
            <button type="button" onClick={() => setActiveTab("pre_inspecao")} className={`flex-1 py-3 px-2 text-[11px] sm:text-xs font-bold uppercase rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === "pre_inspecao" ? "bg-orange-600 text-white shadow-md" : "bg-[#2a2d36] text-gray-400 hover:text-white"}`}>📋 Pré-Inspeção & Ação</button>
            <button type="button" onClick={() => setActiveTab("transporte")} className={`flex-1 py-3 px-2 text-[11px] sm:text-xs font-bold uppercase rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === "transporte" ? "bg-blue-600 text-white shadow-md" : "bg-[#2a2d36] text-gray-400 hover:text-white"}`}>
              <FaTruck size={18} /> Transporte
            </button>
            <button type="button" onClick={() => setActiveTab("objetos_estranhos")} className={`flex-1 py-3 px-2 text-[11px] sm:text-xs font-bold uppercase rounded-lg transition-all flex justify-center items-center gap-2 ${activeTab === "objetos_estranhos" ? "bg-amber-600 text-white shadow-md" : "bg-[#2a2d36] text-gray-400 hover:text-white"}`}><BiError size={18} /> Obj. Estranhos</button>
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

              <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <BiError size={18} className="text-orange-500" />
                    Observações Gerais da Semana
                  </label>
                  <button
                    type="button"
                    onClick={addObservacaoGeral}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <BiPlus size={16} /> Adicionar
                  </button>
                </div>

                <div className="space-y-3">
                  {observacoesGerais.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Nenhuma observação registrada. Clique em "Adicionar" para começar.</p>
                  ) : (
                    observacoesGerais.map((obs, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <textarea
                          value={obs}
                          onChange={(e) => updateObservacaoGeral(idx, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-y transition-all"
                          rows={2}
                          placeholder={`Observação ${idx + 1} (ex: feriado, manutenção, intercorrência...)`}
                        />
                        <button
                          type="button"
                          onClick={() => removeObservacaoGeral(idx)}
                          className="mt-1 text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Remover esta observação"
                        >
                          <BiX size={20} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-[#fff8f6] border border-red-100 rounded-2xl p-5 sm:p-7 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shadow-sm border border-red-200/50"><BiError size={24} /></div>
                    <div>
                      <h3 className="text-xl font-black text-red-900 tracking-tight">Plano de Ação Corretiva</h3>
                      <p className="text-sm font-medium text-red-600/80 mt-0.5">Preencher quando houver "Não Conformidade" identificada</p>
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
                          <label className="text-xs font-bold text-gray-700 mb-1.5 block uppercase tracking-tighter">Responsável</label>
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

          {/* ================= ABA 2: TRANSPORTE (COLUNAS LATERAIS COM ROLAGEM) ================= */}
          {activeTab === "transporte" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm border border-blue-200/50">
                    <FaTruck size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-blue-950 uppercase tracking-tight">
                      Inspeção de Segurança no Transporte da Fruta
                    </h2>
                    <p className="text-[11px] font-bold text-blue-700/70 mt-0.5 uppercase tracking-wider">
                      Caminhão-Baú — Registros em Colunas
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={adicionarColunaCaminhao}
                  className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm shrink-0"
                >
                  <BiPlus size={20} /> Adicionar Nova Coluna
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex">
                <div className="overflow-x-auto w-full pb-4 hide-scrollbar">
                  <table className="w-full text-sm border-collapse min-w-max">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-4 px-5 text-left font-black text-gray-700 text-xs uppercase tracking-wider min-w-[300px] sticky left-0 bg-gray-50 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          Itens Verificados
                        </th>
                        {colunasTransporte.map((coluna: any, idx: number) => (
                          <th key={coluna.id} className="p-3 border-r border-gray-200 min-w-[280px] bg-white align-top">
                            <div className="flex justify-between items-center mb-3">
                              <span className="bg-blue-900 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                                Coluna #{idx + 1}
                              </span>
                              {colunasTransporte.length > 1 && (
                                <button
                                  onClick={() => setColunasTransporte(prev => prev.filter((c: any) => c.id !== coluna.id))}
                                  className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                                >
                                  <BiTrash size={16} />
                                </button>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden h-9 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                                <div className="pl-3 text-gray-400"><BiCalendar size={16} /></div>
                                <input
                                  type="date"
                                  value={coluna.dataInspecao}
                                  onChange={(e) => setColunasTransporte(prev => prev.map((c: any) => c.id === coluna.id ? { ...c, dataInspecao: e.target.value } : c))}
                                  className="w-full h-full px-2 text-xs font-medium text-gray-700 outline-none bg-transparent"
                                />
                              </div>
                              <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden h-9 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                                <div className="pl-3 text-gray-400"><FaTruck size={14} /></div>
                                <input
                                  type="text"
                                  placeholder="PLACA (Ex: ABC-1234)"
                                  value={coluna.placa}
                                  onChange={(e) => setColunasTransporte(prev => prev.map((c: any) => c.id === coluna.id ? { ...c, placa: e.target.value.toUpperCase() } : c))}
                                  className="w-full h-full px-2 text-xs font-bold text-gray-700 outline-none uppercase bg-transparent"
                                />
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {ITENS_SEGURANCA_TRANSPORTE.map((itemPadrao: any, idxItem: number) => (
                        <tr key={idxItem} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-5 text-gray-700 font-medium text-xs sticky left-0 bg-white z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"></span>
                              {typeof itemPadrao === "string" ? itemPadrao : itemPadrao.item}
                            </div>
                          </td>

                          {colunasTransporte.map((coluna: any) => {
                            const conformeStatus = coluna.itens[idxItem]?.conforme;
                            return (
                              <td key={coluna.id} className="p-3 border-r border-gray-200 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setColunasTransporte(prev => prev.map((c: any) => c.id === coluna.id ? { ...c, itens: c.itens.map((it: any, i: number) => i === idxItem ? { ...it, conforme: conformeStatus === true ? null : true } : it) } : c))}
                                    className={`w-[45%] py-2 rounded-lg text-xs font-black transition-all border ${conformeStatus === true
                                      ? "bg-emerald-500 text-white border-emerald-500 shadow-md"
                                      : "bg-gray-50 text-gray-400 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                                      }`}
                                  >
                                    SIM
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setColunasTransporte(prev => prev.map((c: any) => c.id === coluna.id ? { ...c, itens: c.itens.map((it: any, i: number) => i === idxItem ? { ...it, conforme: conformeStatus === false ? null : false } : it) } : c))}
                                    className={`w-[45%] py-2 rounded-lg text-xs font-black transition-all border ${conformeStatus === false
                                      ? "bg-rose-500 text-white border-rose-500 shadow-md"
                                      : "bg-gray-50 text-gray-400 border-gray-200 hover:border-rose-300 hover:bg-rose-50"
                                      }`}
                                  >
                                    NÃO
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      <tr className="bg-amber-50/30">
                        <td className="py-4 px-5 font-black text-amber-700 text-[11px] uppercase tracking-wider sticky left-0 bg-amber-50/90 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-2"><BiError size={16} /> Observação</div>
                        </td>
                        {colunasTransporte.map((coluna: any) => (
                          <td key={`obs-${coluna.id}`} className="p-3 border-r border-gray-200 align-top">
                            <textarea
                              value={coluna.observacaoGeral}
                              onChange={(e) => setColunasTransporte(prev => prev.map((c: any) => c.id === coluna.id ? { ...c, observacaoGeral: e.target.value } : c))}
                              placeholder="Observações do veículo..."
                              className="w-full h-16 border border-amber-200 rounded-lg p-2 text-xs outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white resize-none"
                            />
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-rose-50/30">
                        <td className="py-4 px-5 font-black text-rose-700 text-[11px] uppercase tracking-wider sticky left-0 bg-rose-50/90 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-2"><BiError size={16} /> Ação Corretiva</div>
                        </td>
                        {colunasTransporte.map((coluna: any) => (
                          <td key={`acao-${coluna.id}`} className="p-3 border-r border-gray-200 align-top">
                            <textarea
                              value={coluna.acaoCorretivaGeral}
                              onChange={(e) => setColunasTransporte(prev => prev.map((c: any) => c.id === coluna.id ? { ...c, acaoCorretivaGeral: e.target.value } : c))}
                              placeholder="O que foi feito em caso de NC..."
                              className="w-full h-16 border border-rose-200 rounded-lg p-2 text-xs outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-white resize-none"
                            />
                          </td>
                        ))}
                      </tr>

                      <tr className="bg-slate-50">
                        <td className="py-4 px-5 font-black text-gray-600 text-[11px] uppercase tracking-wider sticky left-0 bg-slate-50 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center gap-2"><BiUser size={16} /> Responsável</div>
                        </td>
                        {colunasTransporte.map((coluna: any) => (
                          <td key={`ass-${coluna.id}`} className="p-3 border-r border-gray-200 align-middle">
                            <div className="bg-white border border-gray-200 rounded-lg p-1">
                              <SignatureSelector
                                value={coluna.responsavel}
                                onChange={(val) => setColunasTransporte(prev => prev.map((c: any) => c.id === coluna.id ? { ...c, responsavel: val } : c))}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= ABA 3: OBJETOS ESTRANHOS ================= */}
          {activeTab === "objetos_estranhos" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100 text-amber-700 rounded-lg"><BiError size={22} /></div>
                  <div>
                    <h2 className="font-bold text-gray-800 text-lg">Controle de Inspeção de Objetos Estranhos</h2>
                    <p className="text-xs text-gray-500 font-medium tracking-wide">Documento PHU-033</p>
                  </div>
                </div>
                <button type="button" onClick={() => addForeignObjectRow(activeForeignSector)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-lg font-bold text-sm shadow-md active:scale-95 transition-all"><BiPlus size={18} /> Novo Registro</button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-3">Setor de Registro</p>
                <div className="flex flex-wrap gap-2">
                  {FOREIGN_OBJECT_LOCATIONS.map((sector) => (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => setActiveForeignSector(sector)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${activeForeignSector === sector
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-300 hover:border-amber-300 hover:text-amber-700"
                        }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                <table className="min-w-250 w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-[11px] uppercase tracking-tighter text-gray-500 font-black">
                      <th className="p-4 text-left">Data</th>
                      <th className="p-4 text-left">Horário</th>
                      <th className="p-4 text-center">C</th>
                      <th className="p-4 text-center">NC</th>
                      <th className="p-4 text-left">Objeto Encontrado</th>
                      <th className="p-4 text-left">Ação Corretiva</th>
                      <th className="p-4 text-left">Responsável</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredForeignObjectRows.map(({ log, originalIdx }) => (
                      <tr key={log.id} className="hover:bg-amber-50/30 transition-colors group">
                        <td className="p-2 w-40">
                          <input type="date" value={log.date} onChange={(e) => updateForeignObject(originalIdx, 'date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-400 shadow-sm" />
                        </td>
                        <td className="p-2 w-36">
                          <div className="relative">
                            <BiTime className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input type="time" value={log.time} onChange={(e) => updateForeignObject(originalIdx, 'time', e.target.value)} className="w-full border border-gray-300 rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:border-amber-400 shadow-sm" />
                          </div>
                        </td>
                        <td className="p-2 text-center w-20">
                          <button
                            type="button"
                            onClick={() => updateForeignObject(originalIdx, 'status', log.status === 'C' ? null : 'C')}
                            className={`w-10 h-9 rounded-lg font-black text-xs transition-all ${log.status === 'C' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 border border-gray-200 text-gray-400 hover:bg-green-50'}`}
                          >
                            C
                          </button>
                        </td>
                        <td className="p-2 text-center w-20">
                          <button
                            type="button"
                            onClick={() => updateForeignObject(originalIdx, 'status', log.status === 'NC' ? null : 'NC')}
                            className={`w-10 h-9 rounded-lg font-black text-xs transition-all ${log.status === 'NC' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 border border-gray-200 text-gray-400 hover:bg-red-50'}`}
                          >
                            NC
                          </button>
                        </td>
                        <td className="p-2 min-w-55">
                          <input type="text" value={log.foundObject} onChange={(e) => updateForeignObject(originalIdx, 'foundObject', e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-400 shadow-sm" placeholder="Ex: lâmina, pedra, vidro..." />
                        </td>
                        <td className="p-2 min-w-55">
                          <input type="text" value={log.correctiveAction} onChange={(e) => updateForeignObject(originalIdx, 'correctiveAction', e.target.value)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-400 shadow-sm" placeholder="Descreva a ação corretiva" />
                        </td>
                        <td className="p-2 min-w-57.5">
                          <SignatureSelector value={log.responsible} onChange={(v) => updateForeignObject(originalIdx, 'responsible', v)} />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (filteredForeignObjectRows.length > 1) {
                                removeForeignObjectRow(log.id);
                              }
                            }}
                            disabled={filteredForeignObjectRows.length <= 1}
                            className={`transition-colors p-1.5 ${filteredForeignObjectRows.length <= 1
                              ? "text-gray-200 cursor-not-allowed"
                              : "text-gray-300 hover:text-red-500"
                              }`}
                          >
                            <BiTrash size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredForeignObjectRows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-gray-400 font-medium">
                          Nenhum registro para {activeForeignSector}. Clique em "Novo Registro" para começar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-wide text-amber-800 mb-1.5">Observação</p>
                <p className="text-sm text-amber-900 leading-relaxed">
                  Caso seja encontrado algum objeto considerado estranho no processo, comunicar ao responsável pela segurança do alimento e registrar na planilha de controle de objetos estranhos. Exemplo: grampo, lâminas, ferramenta, peças de equipamentos, pedra, vidro, metal, plástico, madeira, adornos, caneta e insetos.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BOTÃO EXPORTAR */}
        <div className="p-4 sm:p-6 bg-white border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={async () => {
              const segurancaData = activeTab === "transporte" ? {
                logs: colunasTransporte[0]?.itens || [],
                metadados: {
                  dataInspecao: colunasTransporte[0]?.dataInspecao,
                  responsavel: colunasTransporte[0]?.responsavel,
                  placa: colunasTransporte[0]?.placa
                },
                todasColunas: colunasTransporte
              } as any : undefined;

              await exportarExcel(
                activeTab === "objetos_estranhos" ? activeForeignSector : undefined,
                segurancaData
              );

              localStorage.removeItem("gv_inspecao_v11");
              localStorage.removeItem("seguranca_transporte_colunas");

              setColunasTransporte([{
                id: Date.now(),
                dataInspecao: "",
                placa: "",
                responsavel: null,
                itens: ITENS_SEGURANCA_TRANSPORTE.map((textoItem: any) => ({
                  item: typeof textoItem === "string" ? textoItem : textoItem.item,
                  conforme: null,
                  observacao: "",
                  acaoCorretiva: ""
                })),
                observacaoGeral: "",
                acaoCorretivaGeral: ""
              }]);
            }}
            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
          >
            Exportar para Excel
          </button>
        </div>

        {/* RODAPÉ */}
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