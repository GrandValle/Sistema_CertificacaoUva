"use client";

import React from "react";
import { SignatureSelector } from "../../../components/SignatureSelector";
import {
    BiTrash,
    BiPlus,
    BiCalendar,
} from "react-icons/bi";
import { QUESTIONS, DAYS, ActionPlan } from "../model/condutaModel";

interface CondutaSaudeProps {
    week: string;
    setWeek: (v: string) => void;
    signatures: { coordinator: string | null };
    setSignatures: (v: any) => void;
    checklist: any[];
    toggleStatus: (rowIndex: number, day: string) => void;
    actions: any[];
    addActionRow: () => void;
    // 🔥 CORREÇÃO: usar keyof ActionPlan para compatibilidade com o controller
    updateAction: (index: number, field: keyof ActionPlan, value: string) => void;
    removeActionRow: (id: number) => void;
    showStats: boolean;
    setShowStats: (v: boolean) => void;
    showActionPlan: boolean;
    setShowActionPlan: (v: boolean) => void;
    stats: any;
    docInfo: any;
}

export default function CondutaSaude({
    week,
    setWeek,
    signatures,
    setSignatures,
    checklist,
    toggleStatus,
    actions,
    addActionRow,
    updateAction,
    removeActionRow,
    showStats,
    setShowStats,
    showActionPlan,
    setShowActionPlan,
    stats,
    docInfo,
}: CondutaSaudeProps) {
    return (
        <div className="space-y-6 animate-fade-in">
            {showStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Conformidade</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {stats.complianceRate}%
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {stats.okCount} de {stats.totalCells}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 text-2xl">
                                ✅
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Não Conformidades</p>
                                <p className="text-3xl font-bold text-red-600">
                                    {stats.noCount}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {stats.ncRate}% das verificações
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 text-2xl">
                                ⚠️
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Preenchimento</p>
                                <p className="text-3xl font-bold text-indigo-600">
                                    {stats.completionRate}%
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {stats.pendingCount} pendentes
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl">
                                📊
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Ações Pendentes</p>
                                <p className="text-3xl font-bold text-amber-600">
                                    {stats.ncItems}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    no plano de ação
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 text-2xl">
                                📋
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CHECKLIST */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="p-5 bg-linear-to-r from-gray-50 to-white border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">
                            Checklist de Conduta e Saúde
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {QUESTIONS.length} itens • {DAYS.length} dias da semana
                        </p>
                    </div>
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        {showStats ? "Ocultar" : "Mostrar"} Estatísticas
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-linear-to-r from-gray-100 to-gray-50 border-b border-gray-200">
                                <th className="py-4 px-4 font-bold text-gray-700 text-sm uppercase sticky left-0 bg-gray-100 z-10 w-20">
                                    Item
                                </th>
                                <th className="py-4 px-4 font-bold text-gray-700 text-sm uppercase min-w-96">
                                    Inspeção - Itens Observados
                                </th>
                                {DAYS.map((day) => (
                                    <th
                                        key={day}
                                        className="py-4 px-2 text-center font-bold text-gray-700 text-xs uppercase w-20"
                                    >
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {checklist.map((row, index) => (
                                <tr
                                    key={row.questionId}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="py-3 px-4 text-center font-bold text-gray-700 sticky left-0 bg-white z-10 border-r border-gray-200">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center mx-auto text-indigo-800">
                                            {String(row.questionId).padStart(2, "0")}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-700 text-sm font-medium leading-relaxed border-r border-gray-200">
                                        {QUESTIONS[index]}
                                    </td>
                                    {DAYS.map((day) => {
                                        //@ts-ignore
                                        const status = row[day];
                                        return (
                                            <td
                                                key={day}
                                                onClick={() => toggleStatus(index, day)}
                                                className="py-3 px-2 text-center border-r border-gray-200"
                                            >
                                                <div
                                                    className={`w-12 h-12 mx-auto rounded-lg flex items-center justify-center cursor-pointer transition-all ${status === "ok"
                                                            ? "bg-green-100 border-2 border-green-500 text-green-800"
                                                            : status === "no"
                                                                ? "bg-red-100 border-2 border-red-500 text-red-800"
                                                                : "bg-gray-50 border-2 border-gray-200 text-gray-400"
                                                        }`}
                                                >
                                                    <span className="font-bold text-sm">
                                                        {status === "ok"
                                                            ? "SIM"
                                                            : status === "no"
                                                                ? "NÃO"
                                                                : "—"}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PLANO DE AÇÃO (SEM STATUS) */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="p-5 bg-linear-to-r from-indigo-50 to-purple-50 border-b border-indigo-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            🛠️ Plano de Ação Corretiva
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Obrigatório para não conformidades
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowActionPlan(!showActionPlan)}
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200"
                        >
                            {showActionPlan ? "Recolher" : "Expandir"}
                        </button>
                        <button
                            onClick={addActionRow}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
                        >
                            + Nova Ação
                        </button>
                    </div>
                </div>
                {showActionPlan && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-linear-to-r from-indigo-100 to-indigo-50 border-b border-indigo-200 text-indigo-950 uppercase text-[11px] tracking-widest font-black">
                                    <th className="py-4 px-4 min-w-37.5">📅 Data</th>
                                    <th className="py-4 px-4 w-32 text-center">Nº</th>
                                    <th className="py-4 px-4 min-w-50">Não Conformidade</th>
                                    <th className="py-4 px-4 min-w-50">Causa Raiz</th>
                                    <th className="py-4 px-4 min-w-50">Ação Corretiva</th>
                                    <th className="py-4 px-4 min-w-50">Responsável</th>
                                    {/* 🔥 REMOVIDA a coluna Status */}
                                    <th className="py-4 px-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-100">
                                {actions.map((action, index) => (
                                    <tr
                                        key={action.id}
                                        className="hover:bg-blue-50/50 transition-colors"
                                    >
                                        <td className="p-3">
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={action.date}
                                                    onChange={(e) =>
                                                        updateAction(index, "date", e.target.value)
                                                    }
                                                    className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-sm font-bold text-gray-900 outline-none focus:border-indigo-600 appearance-none"
                                                    placeholder="DD/MM/AAAA"
                                                />
                                                <BiCalendar
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                                    size={20}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-3 min-w-32">
                                            <input
                                                type="text"
                                                placeholder="#"
                                                value={action.item}
                                                onChange={(e) =>
                                                    updateAction(index, "item", e.target.value)
                                                }
                                                className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-sm font-black text-center text-indigo-800 outline-none focus:border-indigo-600 placeholder:text-gray-500"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <textarea
                                                placeholder="Descreva..."
                                                value={action.nonConformity}
                                                onChange={(e) =>
                                                    updateAction(
                                                        index,
                                                        "nonConformity",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-sm font-normal text-gray-900 outline-none focus:border-indigo-600 min-h-12.5 placeholder:text-gray-600"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <textarea
                                                placeholder="Identifique..."
                                                value={action.rootCause}
                                                onChange={(e) =>
                                                    updateAction(
                                                        index,
                                                        "rootCause",
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-sm font-normal text-gray-900 outline-none focus:border-indigo-600 min-h-12.5 placeholder:text-gray-600"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <textarea
                                                placeholder="O que será feito..."
                                                value={action.action}
                                                onChange={(e) =>
                                                    updateAction(index, "action", e.target.value)
                                                }
                                                className="w-full bg-white border-2 border-gray-300 rounded-lg p-2.5 text-sm font-normal text-gray-900 outline-none focus:border-indigo-600 min-h-12.5 placeholder:text-gray-600"
                                            />
                                        </td>
                                        <td className="p-3">
                                            <div className="border border-gray-200 rounded-lg p-1 min-h-12.5 bg-white">
                                                <SignatureSelector
                                                    value={action.responsible}
                                                    onChange={(v) =>
                                                        updateAction(index, "responsible", v || "")
                                                    }
                                                />
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => removeActionRow(action.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                            >
                                                <BiTrash size={22} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}