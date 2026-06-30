"use client";

import { BiTimeFive, BiMap, BiCalendar, BiPackage, BiXCircle, BiError, BiPlus } from "react-icons/bi";
import { SignatureSelector } from "../../../components/SignatureSelector";
import { COMPLIANCE_REJEITOS } from "../model/controleQualidadeModel";

export function AbaRejeitos({ controller }: { controller: any }) {
    const {
        rejeitosLogs, updateRejeitoRow, addRejeitoRow, removeRejeitoRow
    } = controller;

    return (
        <div className="space-y-8 animate-fade-in py-2">

            {/* HEADER INTERNO */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 border-2 border-blue-100 border-l-8 border-l-blue-600 rounded-xl p-5 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-blue-950 uppercase tracking-tight">Registro Diário de Retidos e Rejeitos</h2>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs font-black text-blue-700 uppercase tracking-widest">
                            <BiMap size={16} /> Área: {COMPLIANCE_REJEITOS.area}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
                        <span className="flex items-center gap-1.5 text-xs font-black text-blue-700 uppercase tracking-widest">
                            <BiTimeFive size={16} /> Frequência: Diária
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={addRejeitoRow} // 🟢 Cria um novo registro completo
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md uppercase tracking-wide active:scale-95"
                >
                    <BiPlus size={20} /> Novo Registro
                </button>
            </div>

            {/* LISTA DE REGISTROS */}
            {rejeitosLogs && rejeitosLogs.length > 0 ? (
                <div className="space-y-8">
                    {rejeitosLogs.map((rejeito: any, idx: number) => (
                        <div key={rejeito.id || idx} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md relative">

                            {/* Botão de Remover Registro */}
                            <button
                                onClick={() => removeRejeitoRow(rejeito.id)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors z-10"
                                title="Remover este registro"
                            >
                                <BiXCircle size={24} />
                            </button>

                            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center pr-12">
                                <span className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <BiPackage size={18} className="text-slate-400" />
                                    Registro #{idx + 1} - Produto / Material
                                </span>
                            </div>

                            <div className="p-5 space-y-6">
                                {/* Linha 1: Produto, Quantidade, Local de Destino */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Produto / Material Rejeitado</label>
                                        <input
                                            type="text"
                                            value={rejeito.produto || ""}
                                            onChange={(e) => updateRejeitoRow(rejeito.id, "produto", e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                                            placeholder="Descreva o item..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Quantidade</label>
                                        <input
                                            type="text"
                                            value={rejeito.quantidade || ""}
                                            onChange={(e) => updateRejeitoRow(rejeito.id, "quantidade", e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold text-blue-900 placeholder:text-slate-300"
                                            placeholder="Ex: 5 kg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Local de Destino</label>
                                        <input
                                            type="text"
                                            value={rejeito.localDestino || ""}
                                            onChange={(e) => updateRejeitoRow(rejeito.id, "localDestino", e.target.value)}
                                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                                            placeholder="Destino..."
                                        />
                                    </div>
                                </div>

                                {/* Linhas 2 e 3: Datas e Assinaturas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4">
                                        <h4 className="text-orange-800 font-bold text-xs mb-3 uppercase tracking-wide">Dados da Retenção</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Data da Retenção</label>
                                                <div className="relative flex items-center">
                                                    <BiCalendar className="absolute left-3 text-slate-400 pointer-events-none" size={16} />
                                                    <input
                                                        type="date"
                                                        value={rejeito.dataRetencao || ""}
                                                        onChange={(e) => updateRejeitoRow(rejeito.id, "dataRetencao", e.target.value)}
                                                        className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Responsável pela Retenção</label>
                                                <div className="border border-slate-300 rounded-lg bg-white min-h-[42px] flex items-center p-1 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-400 transition-all">
                                                    <SignatureSelector value={rejeito.responsavelRetencao} onChange={(v) => updateRejeitoRow(rejeito.id, "responsavelRetencao", v)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-green-50/50 border border-green-100 rounded-xl p-4">
                                        <h4 className="text-green-800 font-bold text-xs mb-3 uppercase tracking-wide">Dados da Saída / Liberação</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Data da Saída</label>
                                                <div className="relative flex items-center">
                                                    <BiCalendar className="absolute left-3 text-slate-400 pointer-events-none" size={16} />
                                                    <input
                                                        type="date"
                                                        value={rejeito.dataSaida || ""}
                                                        onChange={(e) => updateRejeitoRow(rejeito.id, "dataSaida", e.target.value)}
                                                        className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-sm font-bold text-slate-700 outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Responsável pelos Rejeitados</label>
                                                <div className="border border-slate-300 rounded-lg bg-white min-h-[42px] flex items-center p-1 focus-within:border-green-400 focus-within:ring-1 focus-within:ring-green-400 transition-all">
                                                    <SignatureSelector value={rejeito.responsavelRejeitados} onChange={(v) => updateRejeitoRow(rejeito.id, "responsavelRejeitados", v)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 🟢 PLANO DE AÇÃO ACOPLADO */}
                                <div className="mt-6 border-t border-slate-200 pt-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                                            <BiError size={18} />
                                        </div>
                                        <h3 className="text-sm font-black text-red-900 uppercase tracking-tight">Plano de Ação Corretiva para este item</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-tighter">Motivo da Rejeição / Não Conformidade</label>
                                            <textarea
                                                value={rejeito.naoConformidade || ""}
                                                onChange={(e) => updateRejeitoRow(rejeito.id, 'naoConformidade', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm h-24 focus:ring-2 focus:ring-red-500 outline-none resize-y text-slate-700 shadow-sm"
                                                placeholder="Descreva o motivo..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-700 mb-1.5 block uppercase tracking-tighter">Ação Corretiva Proposta</label>
                                            <textarea
                                                value={rejeito.acaoCorretiva || ""}
                                                onChange={(e) => updateRejeitoRow(rejeito.id, 'acaoCorretiva', e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm h-24 focus:ring-2 focus:ring-red-500 outline-none resize-y text-slate-700 shadow-sm"
                                                placeholder="O que foi feito com o item..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-xl">
                    <BiPackage size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-600 text-lg">Nenhum registro criado.</p>
                    <p className="text-sm text-slate-500 mt-1">Clique no botão "Novo Registro" acima para começar.</p>
                </div>
            )}
        </div>
    );
}