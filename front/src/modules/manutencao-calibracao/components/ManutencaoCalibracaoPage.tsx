"use client";

import { useState, useEffect } from "react";
import { SignatureSelector } from "../../../components/SignatureSelector";
import Link from "next/link";
import { BiHistory, BiTrash, BiPlus, BiWrench, BiTachometer, BiCog, BiListUl, BiCalendarCheck, BiErrorAlt, BiPen, BiDownload, BiRefresh } from "react-icons/bi";
import { useManutencaoController } from "../controller/useManutencaoController";
import { COMPLIANCE_MANUTENCAO, ITENS_SEMANAL_PHU040, ITENS_MENSAL_PHU040, FrequenciaAfericao } from "../model/manutencaoModel";

export default function ManutencaoCalibracaoPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    activeTab, setActiveTab, frequencia, setFrequencia, freqChecklist, setFreqChecklist,
    balancasLogs, addBalancaRow, updateBalancaRow, removeBalancaRow,
    reparosLogs, addReparoRow, updateReparoRow, removeReparoRow,
    inspecoesSemanais, addSemanal, removeSemanal, updateSemanal, toggleSemanalResposta,
    inspecoesMensais, addMensal, removeMensal, updateMensal, toggleMensalResposta,
    exportarExcel
  } = useManutencaoController();

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Carregando sistema...</p>
      </div>
    );
  }

  const phuAtivo = activeTab === "balancas"
    ? COMPLIANCE_MANUTENCAO.pops.balancas
    : activeTab === "reparos"
      ? COMPLIANCE_MANUTENCAO.pops.reparos
      : COMPLIANCE_MANUTENCAO.pops.checklist;

  const prepareSignatureInteraction = () => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName)) activeElement.blur();
  };

  // 🟢 NOVA LÓGICA INTELIGENTE DE CORES
  const renderToggle = (status: "SIM" | "NÃO" | null, itemName: string, onClick: () => void) => {
    // Verifica se a pergunta é sobre "problemas" (onde NÃO é a resposta boa)
    const isNegativeContext = itemName.toLowerCase().match(/(resíduo|presença|desprendimento|sujeira|graxa)/);

    let colorClass = 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'; // PENDENTE

    if (status === 'SIM') {
      colorClass = isNegativeContext
        ? 'bg-red-100 text-red-700 border-red-200' // SIM para problema = Ruim (Vermelho)
        : 'bg-green-100 text-green-700 border-green-200'; // SIM para limpeza = Bom (Verde)
    } else if (status === 'NÃO') {
      colorClass = isNegativeContext
        ? 'bg-green-100 text-green-700 border-green-200' // NÃO para problema = Bom (Verde)
        : 'bg-red-100 text-red-700 border-red-200'; // NÃO para limpeza = Ruim (Vermelho)
    }

    return (
      <button
        onClick={onClick}
        className={`w-full py-2.5 rounded-lg font-black text-xs transition-all border shadow-sm ${colorClass}`}
      >
        {status || 'PENDENTE'}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 font-sans relative">
      <div className="max-w-6xl mx-auto">

        {/* HEADER - IDENTIDADE UVA */}
        <header className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700 text-white mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0">
                <BiWrench size={24} className="text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">Manutenção Preventiva</h1>
                <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">PHU-2.9.6 •Controle Preventivo e Corretivo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/historico?modulo=manutencao" className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg font-black text-sm hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 border border-slate-700 shadow-inner">
                <BiHistory /> Histórico
              </Link>
            </div>
          </div>
        </header>

        {/* AS 3 ABAS PRINCIPAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button onClick={() => setActiveTab("checklist")} className={`py-4 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 border-2 ${activeTab === "checklist" ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
            <BiListUl size={20} /> Check-list de Manutenção
          </button>
          <button onClick={() => setActiveTab("reparos")} className={`py-4 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 border-2 ${activeTab === "reparos" ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
            <BiCog size={20} /> Registro de Reparos
          </button>
          <button onClick={() => setActiveTab("balancas")} className={`py-4 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 border-2 ${activeTab === "balancas" ? "bg-amber-500 text-white border-amber-500 shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>
            <BiTachometer size={20} /> Aferição de Balanças
          </button>
        </div>

        {/* ABA 1: CHECK-LIST */}
        {activeTab === "checklist" && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-slate-900 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4 shadow-md border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0">
                <BiListUl size={20} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black uppercase tracking-tight text-white">Check-list de Equipamentos</h2>
                <p className="text-slate-400 text-xs mt-0.5">Inspeções periódicas de manutenção preventiva • PHU-040</p>
              </div>
              <button onClick={freqChecklist === "Semanal" ? addSemanal : addMensal} className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all shadow active:scale-95">
                <BiPlus size={16} /> Nova Inspeção
              </button>
            </div>

            {/* SELETOR DE FREQUÊNCIA */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-700">Período de inspeção</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Selecione a frequência para visualizar ou adicionar colunas de registros</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setFreqChecklist("Semanal")}
                  className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${freqChecklist === "Semanal" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-200"}`}
                >Semanal</button>
                <button
                  onClick={() => setFreqChecklist("Mensal")}
                  className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${freqChecklist === "Mensal" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-200"}`}
                >Mensal</button>
              </div>
            </div>

            {/* TABELA UNIFICADA EM COLUNAS LADO A LADO */}
            {freqChecklist === "Semanal" ? (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden transition-all">
                <div className="overflow-x-auto animate-fade-in">
                  <table className="w-full text-left text-sm table-fixed">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-100">
                        <th className="p-4 font-black text-slate-700 w-[300px] border-r-2 border-slate-200 uppercase tracking-widest text-[11px]">
                          Itens Verificados
                        </th>
                        {inspecoesSemanais.map((inspecao, colIndex) => (
                          <th key={inspecao.id} className="p-3 border-r-2 border-slate-200 bg-slate-50 w-[270px]">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest ${inspecoesSemanais.length > 1 ? '' : 'invisible'}`}>
                                Coluna #{colIndex + 1}
                              </span>
                              {inspecoesSemanais.length > 1 && (
                                <button onClick={() => removeSemanal(inspecao.id)} className="text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 p-1 rounded transition-colors shadow-sm border border-slate-200 ml-auto" title="Remover coluna">
                                  <BiTrash size={15} />
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <BiCalendarCheck size={13} />
                              </span>
                              <input
                                type="date"
                                value={inspecao.data}
                                onChange={e => updateSemanal(inspecao.id, "data", e.target.value)}
                                className="w-full border border-slate-300 rounded-lg py-1.5 pl-7 pr-2 text-[11px] font-bold text-slate-800 outline-none focus:border-slate-500 bg-white shadow-sm"
                              />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ITENS_SEMANAL_PHU040.map((item, itemIndex) => (
                        <tr key={itemIndex} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 border-r-2 border-slate-100 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></div>
                            <span className="font-bold text-slate-700 text-xs">{item}</span>
                          </td>
                          {inspecoesSemanais.map((inspecao) => (
                            <td key={inspecao.id} className="p-3 border-r border-slate-100 align-middle text-center w-[270px]">
                              <div className="w-[180px] mx-auto">
                                {/* 🟢 Adicionado 'item' como argumento para ler o contexto da pergunta */}
                                {renderToggle(inspecao.respostas[itemIndex] || null, item, () => toggleSemanalResposta(inspecao.id, itemIndex))}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}

                      {/* LINHA DE AÇÃO CORRETIVA */}
                      <tr className="bg-amber-50/40">
                        <td className="p-4 border-r-2 border-slate-100 font-black text-amber-800 uppercase tracking-widest text-[11px] flex items-center gap-2">
                          <BiErrorAlt size={18} className="text-amber-500" /> Ação Corretiva
                        </td>
                        {inspecoesSemanais.map((inspecao) => (
                          <td key={inspecao.id} className="p-3 border-r border-slate-100 align-top w-[270px]">
                            <textarea
                              value={inspecao.acaoCorretiva}
                              onChange={e => updateSemanal(inspecao.id, "acaoCorretiva", e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-2 text-xs font-normal text-slate-900 outline-none focus:border-amber-400 bg-white min-h-[80px] resize-none shadow-sm"
                              placeholder="O que foi feito?"
                            ></textarea>
                          </td>
                        ))}
                      </tr>

                      {/* LINHA DE ASSINATURA */}
                      <tr className="bg-slate-100/50">
                        <td className="p-4 border-r-2 border-slate-100 font-black text-slate-800 uppercase tracking-widest text-[11px] flex items-center gap-2">
                          <BiPen size={18} className="text-slate-500" /> Assinatura do Responsável
                        </td>
                        {inspecoesSemanais.map((inspecao) => (
                          <td key={inspecao.id} className="p-3 border-r border-slate-100 align-top w-[270px]">
                            <div className={`border-2 rounded-xl p-1.5 min-h-[70px] shadow-sm transition-colors text-center flex flex-col justify-center ${inspecao.responsavel ? "border-green-400 bg-white" : "border-slate-200 bg-white"}`} onPointerDownCapture={prepareSignatureInteraction}>
                              <div className="text-[10px] font-bold leading-tight break-words px-1">
                                <SignatureSelector value={inspecao.responsavel} onChange={v => updateSemanal(inspecao.id, "responsavel", v)} />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* TABELA MENSAL EM COLUNAS LADO A LADO */
              <div className="bg-white rounded-2xl shadow-sm border-2 border-slate-200 overflow-hidden transition-all">
                <div className="overflow-x-auto animate-fade-in">
                  <table className="w-full text-left text-sm table-fixed">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-100">
                        <th className="p-4 font-black text-slate-700 w-[300px] border-r-2 border-slate-200 uppercase tracking-widest text-[11px]">
                          Itens Verificados
                        </th>
                        {inspecoesMensais.map((inspecao, colIndex) => (
                          <th key={inspecao.id} className="p-3 border-r-2 border-slate-200 bg-slate-50 w-[270px]">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-widest ${inspecoesMensais.length > 1 ? '' : 'invisible'}`}>
                                Coluna #{colIndex + 1}
                              </span>
                              {inspecoesMensais.length > 1 && (
                                <button onClick={() => removeMensal(inspecao.id)} className="text-slate-400 hover:text-red-600 bg-white hover:bg-red-50 p-1 rounded transition-colors shadow-sm border border-slate-200 ml-auto" title="Remover coluna">
                                  <BiTrash size={15} />
                                </button>
                              )}
                            </div>
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <BiCalendarCheck size={13} />
                              </span>
                              <input
                                type="date"
                                value={inspecao.data}
                                onChange={e => updateMensal(inspecao.id, "data", e.target.value)}
                                className="w-full border border-slate-300 rounded-lg py-1.5 pl-7 pr-2 text-[11px] font-bold text-slate-800 outline-none focus:border-slate-500 bg-white shadow-sm"
                              />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ITENS_MENSAL_PHU040.map((item, itemIndex) => (
                        <tr key={itemIndex} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-4 border-r-2 border-slate-100 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></div>
                            <span className="font-bold text-slate-700 text-xs">{item}</span>
                          </td>
                          {inspecoesMensais.map((inspecao) => (
                            <td key={inspecao.id} className="p-3 border-r border-slate-100 align-middle text-center w-[270px]">
                              <div className="w-[180px] mx-auto">
                                {/* 🟢 Adicionado 'item' como argumento para ler o contexto da pergunta também no Mensal */}
                                {renderToggle(inspecao.respostas[itemIndex] || null, item, () => toggleMensalResposta(inspecao.id, itemIndex))}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}

                      {/* LINHA DE AÇÃO CORRETIVA MENSAL */}
                      <tr className="bg-amber-50/40">
                        <td className="p-4 border-r-2 border-slate-100 font-black text-amber-800 uppercase tracking-widest text-[11px] flex items-center gap-2">
                          <BiErrorAlt size={18} className="text-amber-500" /> Ação Corretiva
                        </td>
                        {inspecoesMensais.map((inspecao) => (
                          <td key={inspecao.id} className="p-3 border-r border-slate-100 align-top w-[270px]">
                            <textarea
                              value={inspecao.acaoCorretiva}
                              onChange={e => updateMensal(inspecao.id, "acaoCorretiva", e.target.value)}
                              className="w-full border border-slate-200 rounded-xl p-2 text-xs font-normal text-slate-900 outline-none focus:border-amber-400 bg-white min-h-[80px] resize-none shadow-sm"
                              placeholder="O que foi feito?"
                            ></textarea>
                          </td>
                        ))}
                      </tr>

                      {/* LINHA DE ASSINATURA MENSAL */}
                      <tr className="bg-slate-100/50">
                        <td className="p-4 border-r-2 border-slate-100 font-black text-slate-800 uppercase tracking-widest text-[11px] flex items-center gap-2">
                          <BiPen size={18} className="text-slate-500" /> Assinatura do Responsável
                        </td>
                        {inspecoesMensais.map((inspecao) => (
                          <td key={inspecao.id} className="p-3 border-r border-slate-100 align-top w-[270px]">
                            <div className={`border-2 rounded-xl p-1.5 min-h-[70px] shadow-sm transition-colors text-center flex flex-col justify-center ${inspecao.responsavel ? "border-green-400 bg-white" : "border-slate-200 bg-white"}`} onPointerDownCapture={prepareSignatureInteraction}>
                              <div className="text-[10px] font-bold leading-tight break-words px-1">
                                <SignatureSelector value={inspecao.responsavel} onChange={v => updateMensal(inspecao.id, "responsavel", v)} />
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA REPAROS - COM INPUT TEXT PARA RAZÃO DO SERVIÇO */}
        {activeTab === "reparos" && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-slate-900 rounded-2xl px-5 py-4 flex flex-wrap justify-between items-center gap-4 shadow-md border border-slate-700">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0">
                  <BiCog size={20} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-black uppercase tracking-tight text-white">Registro de Reparos e Manutenções</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Registre manutenções corretivas, reparos ou limpezas específicas • PHU-040</p>
                </div>
              </div>
              <button onClick={addReparoRow} className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all shadow active:scale-95 w-full sm:w-auto justify-center">
                <BiPlus size={16} /> Novo Registro
              </button>
            </div>

            {reparosLogs.map((row, idx) => (
              <div key={row.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 pt-4 pb-3 flex flex-wrap items-center gap-3 border-b border-slate-100">
                  <span className="bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-lg tracking-widest">
                    #{String(reparosLogs.length - idx).padStart(3, "0")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-xs"><BiCalendarCheck size={14} className="inline" /></span>
                    <input
                      type="date"
                      value={row.data}
                      onChange={e => updateReparoRow(row.id, "data", e.target.value)}
                      className="border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-slate-400"
                    />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Freq.</span>
                  <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-200">
                    {row.frequencia}
                  </span>
                  <span className="ml-auto">
                    <button onClick={() => removeReparoRow(row.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-slate-200">
                      <BiTrash size={16} />
                    </button>
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Equipamento</label>
                      <input
                        type="text"
                        value={row.equipamento}
                        onChange={e => updateReparoRow(row.id, "equipamento", e.target.value.toUpperCase())}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-colors"
                        placeholder="Ex: Esteira de transporte, Balança..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Razão do serviço</label>
                      <input
                        type="text"
                        value={row.servico}
                        onChange={e => updateReparoRow(row.id, "servico", e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-colors"
                        placeholder="Ex: Manutenção, Limpeza, Reparo..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`rounded-xl border-2 p-2 transition-colors ${row.solicitante ? "border-green-400 bg-slate-50" : "border-dashed border-slate-200 bg-slate-50"}`}>
                      <p className="text-[10px] font-black text-slate-700 text-center">Solicitante</p>
                      <p className="text-[9px] text-slate-400 text-center mb-1">Quem solicitou o serviço</p>
                      <div onPointerDownCapture={prepareSignatureInteraction}>
                        <SignatureSelector value={row.solicitante} onChange={v => updateReparoRow(row.id, "solicitante", v)} />
                      </div>
                    </div>
                    <div className={`rounded-xl border-2 p-2 transition-colors ${row.solicitadaPor ? "border-green-400 bg-slate-50" : "border-dashed border-slate-200 bg-slate-50"}`}>
                      <p className="text-[10px] font-black text-slate-700 text-center">Responsável pelo Serviço</p>
                      <p className="text-[9px] text-slate-400 text-center mb-1">Empresa ou técnico responsável</p>
                      <div onPointerDownCapture={prepareSignatureInteraction}>
                        <SignatureSelector value={row.solicitadaPor} onChange={v => updateReparoRow(row.id, "solicitadaPor", v)} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <BiErrorAlt size={15} className="text-green-600" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ação Corretiva</label>
                    </div>
                    <textarea
                      value={row.acaoCorretiva}
                      onChange={e => updateReparoRow(row.id, "acaoCorretiva", e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-colors min-h-32 resize-none"
                      placeholder="Descreva as ações corretivas realizadas para solucionar o problema..."
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Descreva detalhadamente as medidas tomadas para corrigir a situação</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Limpeza do Equipamento Pós-Reparo</label>
                    <div className="flex items-center gap-4">
                      {(["SIM", "NÃO"] as const).map(opt => (
                        <button
                          key={opt}
                          onClick={() => updateReparoRow(row.id, "confirmacaoLimpeza", opt)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${row.confirmacaoLimpeza === opt ? "border-green-600 bg-green-600" : "border-slate-300 bg-white"}`}>
                            {row.confirmacaoLimpeza === opt && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                          </span>
                          {opt === "SIM" ? "Sim" : "Não"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className={`rounded-xl border-2 p-2 transition-colors ${row.responsavel ? "border-green-400 bg-slate-50" : "border-dashed border-slate-200 bg-slate-50"}`}>
                      <p className="text-[10px] font-black text-slate-700 text-center">Responsável pela Manutenção</p>
                      <p className="text-[9px] text-slate-400 text-center mb-1">Técnico ou prestador do serviço</p>
                      <div onPointerDownCapture={prepareSignatureInteraction}>
                        <SignatureSelector value={row.responsavel} onChange={v => updateReparoRow(row.id, "responsavel", v)} />
                      </div>
                    </div>
                    <div className={`rounded-xl border-2 p-2 transition-colors ${row.supervisor ? "border-green-400 bg-slate-50" : "border-dashed border-slate-200 bg-slate-50"}`}>
                      <p className="text-[10px] font-black text-slate-700 text-center">Coordenador da Área</p>
                      <p className="text-[9px] text-slate-400 text-center mb-1">Responsável pela aprovação</p>
                      <div onPointerDownCapture={prepareSignatureInteraction}>
                        <SignatureSelector value={row.supervisor} onChange={v => updateReparoRow(row.id, "supervisor", v)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ABA BALANÇAS - VISÃO COMPACTA E OTIMIZADA */}
        {activeTab === "balancas" && (
          <div className="animate-fade-in space-y-4">
            <div className="bg-slate-900 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-4 shadow-md border border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0">
                <BiTachometer size={20} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black uppercase tracking-tight text-white">Registro de Aferição de Balanças</h2>
                <p className="text-slate-400 text-xs mt-0.5">Monitoramento diário das balanças da planta em lote • PHU-044</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Freq:</span>
                <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-black uppercase border border-amber-200">
                  Diário
                </span>
              </div>
              <button onClick={addBalancaRow} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl font-black text-xs uppercase shadow active:scale-95 transition-all flex items-center justify-center gap-2">
                <BiPlus size={17} /> Nova Verificação do Dia
              </button>
            </div>

            {/* LISTA EM CARDS COMPACTOS */}
            <div className="space-y-3">
              {balancasLogs.map((row, index) => (
                <div key={row.id} className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-4 transition-all hover:border-slate-300">

                  {/* CABEÇALHO DO CARD (LINHA ÚNICA SUPERIOR) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-900 text-white text-[11px] font-black px-2.5 py-1 rounded-lg tracking-widest">
                        #{String(balancasLogs.length - index).padStart(2, "0")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs"><BiCalendarCheck size={14} /></span>
                        <input
                          type="date"
                          value={row.dataCalibracao}
                          onChange={(e) => updateBalancaRow(row.id, "dataCalibracao", e.target.value)}
                          className="border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {balancasLogs.length > 1 && (
                      <button onClick={() => removeBalancaRow(row.id)} className="text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-slate-200 flex items-center gap-1 text-[11px] font-bold">
                        <BiTrash size={15} /> Remover
                      </button>
                    )}
                  </div>

                  {/* CAMPOS EM GRADE COMPACTA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">

                    {/* Balanças Verificadas */}
                    <div className="lg:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Balanças Verificadas
                      </label>
                      <input
                        type="text"
                        value={row.balancasVerificadas || ""}
                        onChange={(e) => updateBalancaRow(row.id, "balancasVerificadas", e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white p-2 rounded-xl text-xs font-medium outline-none focus:border-amber-500 text-slate-800"
                        placeholder="Números..."
                      />
                    </div>

                    {/* Qtd Medida */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Qtd Medida (G)
                      </label>
                      <input
                        type="text"
                        value={row.quantidadeMedida || ""}
                        onChange={(e) => updateBalancaRow(row.id, "quantidadeMedida", e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 focus:bg-white p-2 rounded-xl text-xs font-black text-center outline-none focus:border-amber-500 text-slate-900"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Houve Variação? */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Variação?
                      </label>
                      <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 h-[34px] items-center">
                        <button
                          type="button"
                          onClick={() => updateBalancaRow(row.id, "houveVariacao", "SIM")}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all ${row.houveVariacao === "SIM" ? "bg-amber-500 text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900"}`}
                        >
                          SIM
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBalancaRow(row.id, "houveVariacao", "NÃO")}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-black transition-all ${row.houveVariacao === "NÃO" ? "bg-green-600 text-white shadow-sm" : "bg-transparent text-slate-600 hover:text-slate-900"}`}
                        >
                          NÃO
                        </button>
                      </div>
                    </div>

                    {/* Qtd Variação */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Qtd Variação (G)
                      </label>
                      <input
                        type="text"
                        disabled={row.houveVariacao !== "SIM"}
                        value={row.quantidadeVariacao || ""}
                        onChange={(e) => updateBalancaRow(row.id, "quantidadeVariacao", e.target.value)}
                        className={`w-full border border-slate-200 p-2 rounded-xl text-xs text-center outline-none transition-colors ${row.houveVariacao === "SIM" ? "bg-white text-slate-900 font-black focus:border-amber-500" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                        placeholder={row.houveVariacao === "SIM" ? "0.00" : "-"}
                      />
                    </div>

                    {/* Balança com Desvio */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Nº da Balança com Variação
                      </label>
                      <input
                        type="text"
                        disabled={row.houveVariacao !== "SIM"}
                        value={row.balancaComDesvio || ""}
                        onChange={(e) => updateBalancaRow(row.id, "balancaComDesvio", e.target.value)}
                        className={`w-full border border-slate-200 p-2 rounded-xl text-xs text-center outline-none transition-colors ${row.houveVariacao === "SIM" ? "bg-white text-slate-900 font-black focus:border-amber-500" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                        placeholder={row.houveVariacao === "SIM" ? "Nº" : "-"}
                      />
                    </div>

                  </div>

                  {/* SEGUNDA LINHA: AÇÃO CORRETIVA E ASSINATURA (MAIS COMPACTAS) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100 items-center">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Ação Corretiva
                      </label>
                      <input
                        type="text"
                        disabled={row.houveVariacao !== "SIM"}
                        value={row.acaoCorretiva || ""}
                        onChange={(e) => updateBalancaRow(row.id, "acaoCorretiva", e.target.value)}
                        className={`w-full border border-slate-200 p-2 rounded-xl text-xs outline-none transition-colors ${row.houveVariacao === "SIM" ? "bg-white text-slate-900 focus:border-amber-500" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                        placeholder={row.houveVariacao === "SIM" ? "Descreva a ação corretiva..." : "N/A (Nenhuma variação registrada)"}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                        Responsável
                      </label>
                      <div className={`border rounded-xl p-1 min-h-[38px] transition-colors ${row.responsavel ? "border-green-400 bg-white" : "border-slate-200 bg-slate-50"}`} onPointerDownCapture={prepareSignatureInteraction}>
                        <SignatureSelector value={row.responsavel} onChange={(v) => updateBalancaRow(row.id, "responsavel", v)} />
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                OBS.: A listagem padrão agrupa todas as balanças ativas no mesmo bloco diário. Caso ocorra desvio em alguma unidade, preencha os dados da ocorrência.
              </p>
            </div>
          </div>
        )}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={async () => {
              await exportarExcel();
              localStorage.removeItem("gv_manutencao_v6");
            }}
            className="flex items-center gap-2 bg-[#00c853] text-white px-6 md:px-7 py-2.5 md:py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-xl hover:brightness-110 active:scale-95"
          >
            <BiDownload size={18} />
            Exportar Relatório
          </button>
        </div>

        <footer className="mt-5 bg-[#091835] rounded-xl shadow-lg px-3 py-3 md:px-4 md:py-3.5 border border-[#193159] text-white">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center font-black text-sm tracking-tight">GV</div>
              <div>
                <p className="text-xs md:text-sm font-semibold leading-tight">Sistema- Manutenção Preventiva</p>
                <p className="text-slate-300 text-[10px] md:text-xs">PHU 2.9.6 - Controle Preventivo e Corretivo</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="sm:border-l sm:border-white/20 sm:pl-4 lg:pl-6">
                <p className="text-slate-300 text-[10px] md:text-xs">Revisado por</p>
                <p className="text-amber-300 text-sm md:text-base font-black leading-tight">{COMPLIANCE_MANUTENCAO.revisedBy}</p>
                <p className="text-slate-300 text-[10px] md:text-xs mt-0.5">Em: {COMPLIANCE_MANUTENCAO.revisionDate}</p>
              </div>

              <div className="sm:border-l sm:border-white/20 sm:pl-4 lg:pl-6">
                <p className="text-slate-300 text-[10px] md:text-xs mb-1">Código PHU</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-[#2563eb] text-white text-xs md:text-sm font-black rounded-lg px-2 py-1 leading-none">{phuAtivo}</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}