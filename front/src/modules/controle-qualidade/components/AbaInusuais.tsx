"use client";

import { useEffect } from "react";
import { SignatureSelector } from "../../../components/SignatureSelector";
import { BiPlus, BiTrash, BiErrorCircle, BiCheckShield, BiInfoCircle, BiTimeFive } from "react-icons/bi";

export function AbaInusuais({ controller }: { controller: any }) {
    const { inusuaisLogs, addInusualLog, updateInusualLog, removeInusualLog, activeTab } = controller;

    useEffect(() => {
        // Removido: não adicionar registro automaticamente
    }, [activeTab, inusuaisLogs.length, addInusualLog]);

    const getStatus = (log: any) => {
        if (log.respCorrecao && log.respPacking) return 'concluido';
        if (log.respCorrecao) return 'andamento';
        return 'pendente';
    };

    const contagem = {
        pendente: inusuaisLogs.filter((l: any) => getStatus(l) === 'pendente').length,
        andamento: inusuaisLogs.filter((l: any) => getStatus(l) === 'andamento').length,
        concluido: inusuaisLogs.filter((l: any) => getStatus(l) === 'concluido').length,
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">

            {/* TÍTULO PRINCIPAL DESTACADO COM FUNDO */}
            <div className="mb-6 bg-linear-to-r from-orange-100/80 to-transparent p-5 rounded-2xl border-l-8 border-orange-500 shadow-sm flex items-center gap-4">
                <BiErrorCircle className="text-orange-500 hidden sm:block" size={32} />
                <h2 className="text-xl sm:text-2xl font-black text-orange-900 uppercase tracking-tight">
                    Acontecimentos Inusuais e Ações Corretivas Nuoca
                </h2>
            </div>

            {/* BARRA DE RESUMO */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
                <div>
                    <h3 className="font-black text-gray-800 text-sm uppercase tracking-tight">Resumo de Ocorrências</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{inusuaisLogs.length} registro(s) no sistema</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-[10px] font-black text-gray-500 uppercase">{contagem.pendente} Pendente</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="text-[10px] font-black text-gray-500 uppercase">{contagem.andamento} Em Andamento</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span className="text-[10px] font-black text-gray-500 uppercase">{contagem.concluido} Concluído</span>
                    </div>
                </div>
                <button onClick={addInusualLog} className="bg-[#1a1c23] text-white px-5 py-2 rounded-xl font-bold text-xs uppercase flex items-center gap-2 hover:bg-black transition-all">
                    <BiPlus size={18} /> Nova Ocorrência
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* LISTA DE CARDS (LADO ESQUERDO) */}
                <div className="flex-1 space-y-8">
                    {inusuaisLogs.map((log: any, index: number) => {
                        const statusAtual = getStatus(log);

                        return (
                            <div key={log.id} className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden group">

                                {/* HEADER DO CARD */}
                                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                                            <BiErrorCircle size={24} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black text-gray-800 uppercase block">Ocorrência #{String(index + 1).padStart(3, '0')}</span>
                                            {/* Data removida do header do card */}
                                        </div>
                                    </div>

                                    {/* BADGE DE STATUS AUTOMÁTICO */}
                                    <div className="flex items-center gap-4">
                                        <div className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border shadow-sm ${statusAtual === 'concluido' ? 'bg-green-50 border-green-200 text-green-700' :
                                            statusAtual === 'andamento' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                'bg-red-50 border-red-200 text-red-700'
                                            }`}>
                                            {statusAtual === 'concluido' ? '🟢 Concluído' : statusAtual === 'andamento' ? '🟡 Em Andamento' : '🔴 Pendente'}
                                        </div>
                                        <button onClick={() => removeInusualLog(log.id)} className="text-gray-300 hover:text-red-500 transition-colors"><BiTrash size={20} /></button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* DATA OCORRÊNCIA */}
                                    <div className="w-full md:w-48">
                                        <label className="text-[10px] font-black text-gray-500 uppercase mb-1 flex items-center gap-1"><BiTimeFive /> Data da Ocorrência</label>
                                        <div className="relative w-full">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                                            </span>
                                            <input type="date" value={log.data} onChange={(e) => updateInusualLog(log.id, 'data', e.target.value)} className="w-full bg-white border border-gray-200 shadow-sm rounded-xl pl-10 pr-3 py-2 text-sm font-bold outline-none focus:border-amber-400" />
                                        </div>
                                    </div>

                                    {/* DESCRIÇÃO */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-red-600 uppercase flex items-center gap-2"><BiErrorCircle size={16} /> Descrição do Problema ou Situação</label>
                                        <textarea
                                            value={log.descricao}
                                            onChange={(e) => updateInusualLog(log.id, 'descricao', e.target.value)}
                                            className="w-full bg-red-50/30 border-2 border-red-100 rounded-2xl p-4 text-sm font-medium text-gray-700 outline-none focus:border-red-300 focus:bg-white min-h-25 shadow-inner"
                                            placeholder="Descreva detalhadamente o que aconteceu..."
                                        ></textarea>
                                    </div>

                                    {/* AÇÃO CORRETIVA */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-green-600 uppercase flex items-center gap-2"><BiCheckShield size={16} /> Ação Corretiva Tomada</label>
                                        <textarea
                                            value={log.acaoCorretiva}
                                            onChange={(e) => updateInusualLog(log.id, 'acaoCorretiva', e.target.value)}
                                            className="w-full bg-green-50/30 border-2 border-green-100 rounded-2xl p-4 text-sm font-medium text-gray-700 outline-none focus:border-green-300 focus:bg-white min-h-25 shadow-inner"
                                            placeholder="Descreva o que foi feito para corrigir o problema..."
                                        ></textarea>
                                    </div>

                                    {/* ASSINATURAS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border-2 border-slate-100 p-3 sm:p-5 rounded-2xl mt-4">

                                        <div className="space-y-2 p-4 rounded-xl transition-colors duration-300 bg-transparent">
                                            <div className="text-center pb-2">
                                                <label className="text-[11px] font-black text-gray-700 uppercase block">Responsável pela Correção</label>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">Assinatura Digital</span>
                                            </div>
                                            <div className="w-full">
                                                <SignatureSelector value={log.respCorrecao} onChange={(v: any) => updateInusualLog(log.id, 'respCorrecao', v)} />
                                            </div>
                                        </div>

                                        <div className="space-y-2 p-4 rounded-xl transition-colors duration-300 bg-transparent">
                                            <div className="text-center pb-2">
                                                <label className="text-[11px] font-black text-gray-700 uppercase block">Responsável pelo Packing</label>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">Assinatura Digital</span>
                                            </div>
                                            <div className="w-full">
                                                <SignatureSelector value={log.respPacking} onChange={(v: any) => updateInusualLog(log.id, 'respPacking', v)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* PAINEL LATERAL DE INFO */}
                <div className="w-full lg:w-80">
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm sticky top-6">
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                            <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex justify-center items-center">
                                <BiErrorCircle size={20} />
                            </div>
                            <h4 className="font-black text-xs uppercase text-gray-800">Exemplos Comuns</h4>
                        </div>

                        <div className="space-y-3">
                            {[
                                "Objetos estranhos no processo",
                                "Derramamento de produtos químicos",
                                "Material de embalagem rejeitado",
                                "Vidro quebrado ou trincado",
                                "Falta de energia",
                                "Esteira quebrada",
                                "Portas quebradas ou fechadura com problema",
                                "Falta de água",
                                "Vazamento de amônia na câmara fria"
                            ].map((ex, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:bg-red-50 hover:border-red-100 group">
                                    <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shadow-sm group-hover:scale-125 transition-transform"></span>
                                    <span className="text-[11px] font-bold text-gray-600 group-hover:text-red-800">{ex}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                            <h5 className="text-[10px] font-black text-blue-800 uppercase mb-1 flex items-center gap-1"><BiInfoCircle /> Importante</h5>
                            <p className="text-[10px] text-blue-700/80 font-bold leading-relaxed">
                                Este formulário deve ser preenchido sempre que ocorrer algo fora do padrão operacional, garantindo rastreabilidade e correção.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}