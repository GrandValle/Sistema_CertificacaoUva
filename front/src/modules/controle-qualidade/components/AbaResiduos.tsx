"use client";

import React, { useState } from "react";
import { ResiduosLog, LEGENDA_RESIDUOS } from "../model/controleQualidadeModel";
import { BiPlus, BiTrash, BiCalendar, BiPackage, BiDownload, BiCheck } from "react-icons/bi";
import { SignatureSelector } from "../../../components/SignatureSelector";

interface AbaResiduosProps {
    residuosLogs: ResiduosLog[];
    addResiduoLog: () => void;
    updateResiduoLog: <K extends keyof ResiduosLog>(id: number, field: K, value: ResiduosLog[K]) => void;
    removeResiduoLog: (id: number) => void;
    prepareSignatureInteraction?: () => void;
    onExportar?: () => Promise<void>;
}

// 🔥 Componente de Card para Dia (Terça/Sexta)
const DiaCard = ({
    valor,
    onChange,
}: {
    valor: string;
    onChange: (novoValor: string) => void;
}) => {
    const isRealizado = valor === "SIM";

    const handleClick = () => {
        onChange(isRealizado ? "" : "SIM");
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                ${isRealizado
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-200 scale-105"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:scale-105"
                }
            `}
            title={isRealizado ? "Coleta realizada ✓" : "Clique para marcar como realizada"}
        >
            {isRealizado ? <BiCheck size={22} /> : <span className="text-xs font-black">—</span>}
        </button>
    );
};

export function AbaResiduos({
    residuosLogs,
    addResiduoLog,
    updateResiduoLog,
    removeResiduoLog,
    prepareSignatureInteraction,
    onExportar,
}: AbaResiduosProps) {
    return (
        <div className="space-y-6 animate-fade-in py-2">
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-50 border-2 border-emerald-100 border-l-8 border-l-emerald-600 rounded-xl p-5 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tight">
                            Manejo de Resíduos
                        </h2>
                        <span className="text-xs bg-emerald-700 text-white font-black px-3 py-1 rounded-full">
                            PHU-045
                        </span>
                    </div>
                    <p className="text-sm text-emerald-700 font-medium mt-1">
                        Controle de recolhimento de resíduos: Plástico, Papelão, Vidro, Madeira e Outros
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={addResiduoLog}
                        className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md uppercase tracking-wide active:scale-95"
                    >
                        <BiPlus size={18} /> Nova Semana
                    </button>
                    {onExportar && (
                        <button
                            type="button"
                            onClick={onExportar}
                            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md uppercase tracking-wide active:scale-95"
                        >
                            <BiDownload size={18} /> Exportar Aba para Excel
                        </button>
                    )}
                </div>
            </div>

            {/* TABELA */}
            {residuosLogs.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[850px]">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="py-3 px-3 text-left font-bold text-slate-600 text-xs uppercase tracking-wider min-w-[220px]">
                                        Data Período
                                    </th>
                                    <th className="py-3 px-4 text-center font-bold text-slate-600 text-xs uppercase tracking-wider w-[120px]">
                                        Terça
                                    </th>
                                    <th className="py-3 px-4 text-center font-bold text-slate-600 text-xs uppercase tracking-wider w-[120px]">
                                        Sexta
                                    </th>
                                    <th className="py-3 px-4 text-left font-bold text-slate-600 text-xs uppercase tracking-wider min-w-[200px]">
                                        Responsável / Recolhimento
                                    </th>
                                    <th className="py-3 px-4 text-left font-bold text-slate-600 text-xs uppercase tracking-wider min-w-[200px]">
                                        Monitor Responsável
                                    </th>
                                    <th className="py-3 px-4 text-center font-bold text-slate-600 text-xs uppercase tracking-wider w-[60px]">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {residuosLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                                        {/* Data Período - MAIS LARGO */}
                                        <td className="py-2 px-4">
                                            <div className="relative flex items-center">
                                                <BiCalendar className="absolute left-3 text-slate-400 pointer-events-none" size={15} />
                                                <input
                                                    type="text"
                                                    value={log.dataPeriodo || ""}
                                                    onChange={(e) => updateResiduoLog(log.id, "dataPeriodo", e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all placeholder:text-slate-400"
                                                    placeholder="Ex: 29/06 a 04/07/2026"
                                                />
                                            </div>
                                        </td>

                                        {/* Terça - Card */}
                                        <td className="py-2 px-4 text-center">
                                            <div className="flex justify-center">
                                                <DiaCard
                                                    valor={log.terca || ""}
                                                    onChange={(val) => updateResiduoLog(log.id, "terca", val)}
                                                />
                                            </div>
                                        </td>

                                        {/* Sexta - Card */}
                                        <td className="py-2 px-4 text-center">
                                            <div className="flex justify-center">
                                                <DiaCard
                                                    valor={log.sexta || ""}
                                                    onChange={(val) => updateResiduoLog(log.id, "sexta", val)}
                                                />
                                            </div>
                                        </td>

                                        {/* Responsável / Recolhimento */}
                                        <td className="py-2 px-4">
                                            <div
                                                onPointerDownCapture={prepareSignatureInteraction}
                                                className="w-full border border-slate-200 rounded-lg bg-white min-h-[36px] flex items-center p-1 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400 transition-all"
                                            >
                                                <SignatureSelector
                                                    value={log.responsavelRecolhimento}
                                                    onChange={(val) => updateResiduoLog(log.id, "responsavelRecolhimento", val)}
                                                />
                                            </div>
                                        </td>

                                        {/* Monitor Responsável */}
                                        <td className="py-2 px-4">
                                            <div
                                                onPointerDownCapture={prepareSignatureInteraction}
                                                className="w-full border border-slate-200 rounded-lg bg-white min-h-[36px] flex items-center p-1 focus-within:border-emerald-400 focus-within:ring-1 focus-within:ring-emerald-400 transition-all"
                                            >
                                                <SignatureSelector
                                                    value={log.monitorResponsavel}
                                                    onChange={(val) => updateResiduoLog(log.id, "monitorResponsavel", val)}
                                                />
                                            </div>
                                        </td>

                                        {/* Ações */}
                                        <td className="py-2 px-4 text-center">
                                            <button
                                                onClick={() => removeResiduoLog(log.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                                                title="Remover registro"
                                            >
                                                <BiTrash size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-xl">
                    <BiPackage size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-600 text-lg">Nenhum registro de resíduos criado.</p>
                    <p className="text-sm text-slate-500 mt-1">Clique em "Nova Semana" para começar.</p>
                </div>
            )}
        </div>
    );
}