"use client";

import React from "react";
import { ResiduosLog } from "../model/controleQualidadeModel";
import { BiPlus, BiTrash, BiCalendar, BiPackage, BiDownload, BiCheck, BiNote, BiError, BiX } from "react-icons/bi";
import { SignatureSelector } from "../../../components/SignatureSelector";

interface AbaResiduosProps {
    residuosLogs: ResiduosLog[];
    addResiduoLog: () => void;
    updateResiduoLog: <K extends keyof ResiduosLog>(id: number, field: K, value: ResiduosLog[K]) => void;
    removeResiduoLog: (id: number) => void;
    prepareSignatureInteraction?: () => void;
    onExportar?: () => Promise<void>;
}

export function AbaResiduos({
    residuosLogs,
    addResiduoLog,
    updateResiduoLog,
    removeResiduoLog,
    prepareSignatureInteraction,
    onExportar,
}: AbaResiduosProps) {

    // Filtra automaticamente os registros que estão com exceção (diferentes de "SIM" e não vazios)
    const registrosExcecoes = residuosLogs.flatMap((log) => {
        const excecoes = [];
        const periodo = log.dataPeriodo || "Período não informado";

        if (log.terca && log.terca !== "SIM") {
            excecoes.push({ key: `${log.id}-terca`, logId: log.id, dia: "TERÇA", campo: "terca" as const, valor: log.terca, periodo });
        }
        if (log.sexta && log.sexta !== "SIM") {
            excecoes.push({ key: `${log.id}-sexta`, logId: log.id, dia: "SEXTA", campo: "sexta" as const, valor: log.sexta, periodo });
        }
        return excecoes;
    });

    // Lógica de cliques: Vazio -> SIM -> EXCEÇÃO -> Vazio
    const handleToggleDia = (logId: number, campo: "terca" | "sexta", valorAtual: string) => {
        if (!valorAtual || valorAtual === "") {
            updateResiduoLog(logId, campo, "SIM"); // 1º Clique: Fica Verde (Conforme)
        } else if (valorAtual === "SIM") {
            updateResiduoLog(logId, campo, "EXCEÇÃO"); // 2º Clique: Fica Vermelho (Exceção) e abre a aba embaixo
        } else {
            updateResiduoLog(logId, campo, ""); // 3º Clique: Limpa a seleção e fecha a aba
        }
    };

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
                    <p className="text-xs text-amber-800 font-semibold mt-1 flex items-center gap-1">
                        <BiNote size={14} /> Clique 1 vez para marcar <strong>SIM</strong>. O 2º clique marca como Exceção/Feriado.
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
                                    <th className="py-3 px-4 text-center font-bold text-slate-600 text-xs uppercase tracking-wider w-[140px]">
                                        Terça
                                    </th>
                                    <th className="py-3 px-4 text-center font-bold text-slate-600 text-xs uppercase tracking-wider w-[140px]">
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
                                {residuosLogs.map((log) => {
                                    const tercaVal = log.terca || "";
                                    const sextaVal = log.sexta || "";

                                    const isTercaSim = tercaVal === "SIM";
                                    const isTercaObs = tercaVal && !isTercaSim;

                                    const isSextaSim = sextaVal === "SIM";
                                    const isSextaObs = sextaVal && !isSextaSim;

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                                            {/* Data Período */}
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

                                            {/* Terça */}
                                            <td className="py-2 px-4 text-center">
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleDia(log.id, "terca", tercaVal)}
                                                        className={`
                                                            min-w-[42px] h-10 px-2 rounded-xl flex items-center justify-center transition-all duration-200 text-xs font-black mx-auto shadow-sm
                                                            ${isTercaSim
                                                                ? "bg-emerald-500 text-white hover:bg-emerald-600 scale-105"
                                                                : isTercaObs
                                                                    ? "bg-rose-100 text-rose-600 border border-rose-300 hover:bg-rose-200 scale-105"
                                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:scale-105"
                                                            }
                                                        `}
                                                        title={isTercaSim ? "Realizado ✓ (Clique para mudar para Exceção)" : isTercaObs ? `Exceção: ${tercaVal}` : "Clique para marcar SIM"}
                                                    >
                                                        {isTercaSim ? <BiCheck size={22} /> : isTercaObs ? <BiX size={22} /> : <span className="text-xs font-black">—</span>}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Sexta */}
                                            <td className="py-2 px-4 text-center">
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleDia(log.id, "sexta", sextaVal)}
                                                        className={`
                                                            min-w-[42px] h-10 px-2 rounded-xl flex items-center justify-center transition-all duration-200 text-xs font-black mx-auto shadow-sm
                                                            ${isSextaSim
                                                                ? "bg-emerald-500 text-white hover:bg-emerald-600 scale-105"
                                                                : isSextaObs
                                                                    ? "bg-rose-100 text-rose-600 border border-rose-300 hover:bg-rose-200 scale-105"
                                                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:scale-105"
                                                            }
                                                        `}
                                                        title={isSextaSim ? "Realizado ✓ (Clique para mudar para Exceção)" : isSextaObs ? `Exceção: ${sextaVal}` : "Clique para marcar SIM"}
                                                    >
                                                        {isSextaSim ? <BiCheck size={22} /> : isSextaObs ? <BiX size={22} /> : <span className="text-xs font-black">—</span>}
                                                    </button>
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
                                                    type="button"
                                                    onClick={() => removeResiduoLog(log.id)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-50"
                                                    title="Remover registro"
                                                >
                                                    <BiTrash size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-xl">
                    <BiPackage size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-600 text-lg">Nenhum registro de resíduos criado.</p>
                    <p className="text-sm text-slate-500 mt-1">Clique em &quot;Nova Semana&quot; para começar.</p>
                </div>
            )}

            {/* 🔥 ABA DE REGISTROS DE EXCEÇÃO (IGUAL AO DE ÓCULOS) */}
            {registrosExcecoes.length > 0 && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 shadow-sm animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
                    <h3 className="font-black text-rose-900 text-base md:text-lg uppercase tracking-tight flex items-center gap-2 mb-4 mt-1">
                        <BiError size={22} className="text-rose-600" /> Registros de Exceção (Feriados / Incidentes)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {registrosExcecoes.map((item) => (
                            <div key={item.key} className="bg-white border border-rose-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-400 rounded-l" />
                                <div className="flex justify-between items-start pl-2">
                                    <div>
                                        <span className="font-black text-slate-800 uppercase text-[11px] block mb-1">{item.periodo}</span>
                                        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wider">
                                            {item.dia}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updateResiduoLog(item.logId, item.campo, "")}
                                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                        title="Remover exceção (Limpar célula)"
                                    >
                                        <BiTrash size={18} />
                                    </button>
                                </div>
                                <div className="pl-2">
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Motivo da Exceção</label>
                                    <input
                                        type="text"
                                        value={item.valor === "EXCEÇÃO" ? "" : item.valor}
                                        onChange={(e) => {
                                            const novoVal = e.target.value.toUpperCase();
                                            // Se o input ficar vazio, mantém a flag "EXCEÇÃO" para não sumir o card
                                            updateResiduoLog(item.logId, item.campo, novoVal === "" ? "EXCEÇÃO" : novoVal);
                                        }}
                                        placeholder="EX: FERIADO, CHUVA FORTE..."
                                        className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all uppercase placeholder:text-slate-400"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}