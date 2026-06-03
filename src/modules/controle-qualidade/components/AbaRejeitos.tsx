"use client";

import { BiTrash, BiPlus, BiTimeFive, BiMap, BiCalendar } from "react-icons/bi";
import { SignatureSelector } from "../../../components/SignatureSelector";
import { COMPLIANCE_REJEITOS } from "../model/controleQualidadeModel";

export function AbaRejeitos({ controller }: { controller: any }) {
    const { rejeitosLogs, addRejeitoRow, updateRejeitoRow, removeRejeitoRow } = controller;

    const prepareSignatureInteraction = () => {
        const activeElement = document.activeElement as HTMLElement | null;
        if (activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName)) activeElement.blur();
    };

    return (
        <div className="space-y-6 animate-fade-in p-2">

            {/* Cabeçalho Interno - Mais vivo, com cores e sem timidez! */}
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
                <button onClick={addRejeitoRow} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all flex items-center gap-2 shadow-md uppercase tracking-wide active:scale-95">
                    <BiPlus size={20} /> Nova Linha
                </button>
            </div>

            {/* Tabela de Dados (Sem a frase amarela em cima) */}
            <div className="overflow-x-auto border-2 border-slate-200 rounded-xl shadow-sm bg-white">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-100 border-b-2 border-slate-200">
                            <th className="py-4 px-4 font-black text-slate-700 text-[11px] uppercase tracking-widest w-28 border-r border-slate-200 text-center">Quant.</th>
                            <th className="py-4 px-4 font-black text-slate-700 text-[11px] uppercase tracking-widest w-44 border-r border-slate-200 text-center">Data Retenção</th>
                            <th className="py-4 px-4 font-black text-slate-700 text-[11px] uppercase tracking-widest min-w-50 border-r border-slate-200">Responsável Retenção</th>
                            <th className="py-4 px-4 font-black text-slate-700 text-[11px] uppercase tracking-widest w-44 border-r border-slate-200 text-center">Data Saída</th>
                            <th className="py-4 px-4 font-black text-slate-700 text-[11px] uppercase tracking-widest min-w-50 border-r border-slate-200">Local de Destino</th>
                            <th className="py-4 px-4 font-black text-slate-700 text-[11px] uppercase tracking-widest min-w-50 border-r border-slate-200">Resp. Rejeitados</th>
                            <th className="py-4 px-4 w-16 text-center"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rejeitosLogs.map((row: any) => (
                            <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
                                <td className="p-3 border-r border-slate-100">
                                    <input type="text" value={row.quantidade} onChange={(e) => updateRejeitoRow(row.id, "quantidade", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg p-3 text-sm font-black text-center text-blue-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300" placeholder="0 kg" />
                                </td>
                                <td className="p-3 border-r border-slate-100">
                                    <div className="relative flex items-center">
                                        <BiCalendar className="absolute left-3 text-slate-400 pointer-events-none" size={15} />
                                        <input type="date" value={row.dataRetencao} onChange={(e) => updateRejeitoRow(row.id, "dataRetencao", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg p-3 pl-8 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                </td>
                                <td className="p-3 border-r border-slate-100">
                                    <div className="border-2 border-slate-300 rounded-lg p-1 min-h-12.5 bg-white shadow-sm" onPointerDownCapture={prepareSignatureInteraction}>
                                        <SignatureSelector value={row.responsavelRetencao} onChange={(v) => updateRejeitoRow(row.id, "responsavelRetencao", v)} />
                                    </div>
                                </td>
                                <td className="p-3 border-r border-slate-100">
                                    <div className="relative flex items-center">
                                        <BiCalendar className="absolute left-3 text-slate-400 pointer-events-none" size={15} />
                                        <input type="date" value={row.dataSaida} onChange={(e) => updateRejeitoRow(row.id, "dataSaida", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg p-3 pl-8 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                </td>
                                <td className="p-3 border-r border-slate-100">
                                    <input type="text" value={row.localDestino} onChange={(e) => updateRejeitoRow(row.id, "localDestino", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg p-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300" placeholder="Destino..." />
                                </td>
                                <td className="p-3 border-r border-slate-100">
                                    <div className="border-2 border-slate-300 rounded-lg p-1 min-h-12.5 bg-white shadow-sm" onPointerDownCapture={prepareSignatureInteraction}>
                                        <SignatureSelector value={row.responsavelRejeitados} onChange={(v) => updateRejeitoRow(row.id, "responsavelRejeitados", v)} />
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <button onClick={() => removeRejeitoRow(row.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <BiTrash size={22} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Rodapé da tabela igualzinho ao documento original */}
                <div className="p-4 bg-slate-50 border-t-2 border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Observação: Frequência de controle de Resíduos diário.
                    </p>
                </div>
            </div>
        </div>
    );
}