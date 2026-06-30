"use client";

import React from "react";
import { SignatureSelector } from "../../../components/SignatureSelector";
import Link from "next/link";
import {
    BiHistory,
    BiShieldQuarter,
    BiClipboard,
    BiWater,
    BiDownload,
} from "react-icons/bi";
import { useCondutaController } from "../controller/useCondutaController";
import {
    COMPLIANCE,
    COMPLIANCE_LAVAGEM,
    generateWeekDays,
} from "../model/condutaModel";

import CondutaSaude from "./CondutaSaude";
import LavagemMaos from "./LavagemMaos";

export default function CondutaHigienePage() {
    const {
        activeTab,
        setActiveTab,
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
        lavagemLogs,
        setLavagemLogs,
        updateLavagemRow,
        toggleLavagemCell,
        removeLavagemRow,
        exportarExcel,
        // 🔥 NOVAS PROPS DO CONTROLLER
        colaboradores,
        carregarColaboradores,
        criarColaborador,
        atualizarColaborador,
        salvarColaborador,
        desativarColaborador,
    } = useCondutaController();

    const getDocInfo = () => {
        if (activeTab === "inspecao") {
            return {
                code: COMPLIANCE.popCode,
                title: "Monitoramento de Conduta e Saúde",
                area: COMPLIANCE.area,
                rev: COMPLIANCE.revisionDate,
                by: COMPLIANCE.revisedBy,
            };
        }
        return {
            code: COMPLIANCE_LAVAGEM.popCode,
            title: "Monitoramento de Lavagem de Mãos",
            area: COMPLIANCE_LAVAGEM.area,
            rev: COMPLIANCE_LAVAGEM.revisionDate,
            by: COMPLIANCE_LAVAGEM.revisedBy,
        };
    };

    const docInfo = getDocInfo();
    const weekDays = generateWeekDays(week);

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-indigo-50 p-4 md:p-6 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto">
                {/* HEADER DA PÁGINA (UNIFICADO) */}
                <header className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl mb-6 overflow-hidden border border-gray-200">
                    <div className="p-4 sm:p-6 bg-linear-to-r from-indigo-700 to-purple-700">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                                    <BiShieldQuarter size={32} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg sm:text-2xl font-bold text-white leading-tight uppercase tracking-tight">
                                        {docInfo.title}
                                    </h1>
                                    <p className="text-xs sm:text-sm text-indigo-100 mt-1 uppercase font-semibold">
                                        Sistema de Segurança Alimentar e BPF
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end md:block items-center gap-4">
                                <Link
                                    href="/historico?modulo=conduta"
                                    className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-white/30 mr-2"
                                >
                                    <BiHistory size={18} /> Histórico
                                </Link>
                                <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-lg text-right">
                                    <p className="text-white text-xs sm:text-sm">Código</p>
                                    <p className="text-white font-bold text-lg sm:text-xl">
                                        {docInfo.code}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CABEÇALHO CONDICIONAL (PHU-037) */}
                    {activeTab === "inspecao" && (
                        <div className="p-4 sm:p-5 bg-linear-to-r from-indigo-50 to-purple-50 border-t border-indigo-100 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                                <div>
                                    <label className="font-bold text-slate-700 text-xs sm:text-sm mb-2 flex items-center gap-2">
                                        📅 Período da Semana
                                    </label>
                                    <input
                                        type="text"
                                        value={week}
                                        onChange={(e) => setWeek(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 sm:py-3 sm:px-4 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 text-xs sm:text-sm mb-2 flex items-center gap-2">
                                        📍 Área de Monitoramento
                                    </label>
                                    <div className="bg-gray-100 p-1 rounded-lg flex relative">
                                        <span className="flex-1 py-2 px-3 rounded-md text-sm font-bold text-indigo-700 flex items-center justify-center gap-2 bg-white shadow-sm ring-1 ring-gray-200">
                                            {docInfo.area}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1.5 text-center">
                                        Área de Processamento Primário
                                    </p>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 text-xs sm:text-sm mb-2 flex items-center gap-2">
                                        ✍️ Auxiliar de Certificação
                                    </label>
                                    <div className="min-h-12 border border-gray-200 rounded-lg flex items-center justify-center p-1 transition-colors bg-white">
                                        <SignatureSelector
                                            value={signatures.coordinator}
                                            onChange={(v) =>
                                                setSignatures((prev) => ({ ...prev, coordinator: v }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* BOTÕES DAS ABAS */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex items-center overflow-x-auto mb-6 hide-scrollbar">
                    <button
                        onClick={() => setActiveTab("inspecao")}
                        className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "inspecao"
                            ? "text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-sm"
                            : "text-gray-500 hover:bg-gray-50"
                            }`}
                    >
                        <BiClipboard size={20} /> Checklist de Conduta e Saúde
                    </button>
                    <div className="w-px h-8 bg-gray-300 mx-2 shrink-0"></div>
                    <button
                        onClick={() => setActiveTab("lavagem")}
                        className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "lavagem"
                            ? "text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-sm"
                            : "text-gray-500 hover:bg-gray-50"
                            }`}
                    >
                        <BiWater size={20} /> Lavagem de Mãos
                    </button>
                </div>

                {/* RENDERIZAÇÃO DOS COMPONENTES */}
                {activeTab === "inspecao" && (
                    <CondutaSaude
                        week={week}
                        setWeek={setWeek}
                        signatures={signatures}
                        setSignatures={setSignatures}
                        checklist={checklist}
                        toggleStatus={toggleStatus}
                        actions={actions}
                        addActionRow={addActionRow}
                        updateAction={updateAction}
                        removeActionRow={removeActionRow}
                        showStats={showStats}
                        setShowStats={setShowStats}
                        showActionPlan={showActionPlan}
                        setShowActionPlan={setShowActionPlan}
                        stats={stats}
                        docInfo={docInfo}
                    />
                )}

                {activeTab === "lavagem" && (
                    <LavagemMaos
                        weekDays={weekDays}
                        lavagemLogs={lavagemLogs}
                        setLavagemLogs={setLavagemLogs}
                        updateLavagemRow={updateLavagemRow}
                        toggleLavagemCell={toggleLavagemCell}
                        removeLavagemRow={removeLavagemRow}
                        colaboradores={colaboradores}
                        carregarColaboradores={carregarColaboradores}
                        atualizarColaborador={atualizarColaborador}
                        desativarColaborador={desativarColaborador}
                        salvarColaborador={salvarColaborador}


                    />
                )}

                {/* BOTÃO DE EXPORTAÇÃO */}
                <button
                    type="button"
                    onClick={async () => await exportarExcel()}
                    className="ml-auto mt-6 flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95"
                >
                    <BiDownload size={18} />
                    Exportar para Excel
                </button>

                {/* FOOTER */}
                <footer className="bg-linear-to-r from-gray-900 to-black text-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden mt-6">
                    <div className="p-4 sm:p-5">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
                            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                                    <span className="font-bold text-base sm:text-lg">GV</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-base sm:text-lg">GrandValle</h3>
                                    <p className="text-gray-400 text-xs sm:text-sm">
                                        Monitoramento de Conduta e Saúde
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-6 gap-y-4 w-full md:w-auto">
                                <div className="text-center">
                                    <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">
                                        Revisado por
                                    </p>
                                    <p className="font-bold text-sm sm:text-base text-indigo-300">
                                        {docInfo.by}
                                    </p>
                                </div>
                                <div className="hidden md:block h-8 w-px bg-gray-700"></div>
                                <div className="text-center">
                                    <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider mb-0.5">
                                        Revisão
                                    </p>
                                    <p className="font-bold text-sm sm:text-base">
                                        {docInfo.rev}
                                    </p>
                                </div>
                                <div className="hidden md:block h-8 w-px bg-gray-700"></div>
                                <div className="text-center flex flex-col items-center">
                                    <p className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider mb-1">
                                        POP
                                    </p>
                                    <div className="px-3 py-1 bg-indigo-600/90 rounded-md border border-indigo-500/50">
                                        <span className="font-bold text-xs sm:text-sm">
                                            {docInfo.code}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 text-center md:text-left gap-2">
                            <p>© 2026 GrandValle. Segurança Alimentar.</p>
                            <p>Módulo 1.4.1 - Conduta</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}