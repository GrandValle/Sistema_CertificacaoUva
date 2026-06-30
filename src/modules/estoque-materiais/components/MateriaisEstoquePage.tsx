"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BiHistory, BiDownload, BiPackage, BiCut, BiGlasses, BiBox } from "react-icons/bi";
import { useEstoqueController } from "../controller/useEstoqueController";
import { AbaEstoque } from "./AbaEstoque";
import { AbaTesouras } from "./AbaTesouras";
import { AbaOculos } from "./AbaOculos";
import { AbaEmbalagem } from "./AbaEmbalagem";

export function MateriaisEstoquePage() {
    const [isMounted, setIsMounted] = useState(false);

    const controller = useEstoqueController();
    const { activeTab, setActiveTab, exportarExcel } = controller;

    const suppressTabChangeUntilRef = useRef(0);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const prepareSignatureInteraction = () => {
        const activeElement = document.activeElement as HTMLElement | null;
        if (activeElement && ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName)) activeElement.blur();
        suppressTabChangeUntilRef.current = Date.now() + 450;
    };

    const getDocInfo = () => {
        if (activeTab === "estoque") return { code: "PHU-029", title: "Controle de Estoque", icon: <BiPackage size={20} /> };
        if (activeTab === "tesouras") return { code: "PHU-043", title: "Entrega e Devolução de Tesouras", icon: <BiCut size={20} /> };
        if (activeTab === "oculos") return { code: "PHU-027", title: "Controle de Óculos", icon: <BiGlasses size={20} /> };
        return { code: "PHU-032", title: "Controle de Material de Embalagem", icon: <BiBox size={20} /> };
    };

    const docInfo = getDocInfo();

    if (!isMounted) return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-black text-slate-400">Carregando Sistema...</div>;

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6 font-sans flex justify-center">
            <div className="w-full max-w-7xl flex flex-col gap-4">
                {/* Header principal */}
                <div className="bg-slate-900 rounded-xl shadow-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
                    <div className="text-center sm:text-left">
                        <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-cyan-400">
                            {docInfo.title}
                        </h1>
                        <p className="text-sm font-medium text-gray-400 mt-1">Gestão de Materiais e Equipamentos</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <Link href="/historico?modulo=estoque" className="text-sm font-bold flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-lg hover:bg-white/20 transition-all">
                            <BiHistory size={18} /> Histórico
                        </Link>
                        <div className="text-sm font-bold flex items-center gap-2 bg-gray-700 px-4 py-2.5 rounded-lg text-gray-300">
                            {docInfo.code}
                        </div>
                    </div>
                </div>

                {/* Menu de abas */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex items-center overflow-x-auto hide-scrollbar">
                    <button onClick={() => setActiveTab("estoque")} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "estoque" ? "text-blue-600 bg-blue-50 border border-blue-100 shadow-sm scale-[1.02]" : "text-slate-500 hover:bg-slate-50"}`}>
                        <BiPackage size={18} /> Estoque
                    </button>
                    <div className="w-px h-8 bg-slate-300 mx-1 shrink-0 rounded-full"></div>
                    <button onClick={() => setActiveTab("tesouras")} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "tesouras" ? "text-rose-600 bg-rose-50 border border-rose-100 shadow-sm scale-[1.02]" : "text-slate-500 hover:bg-slate-50"}`}>
                        <BiCut size={18} /> Tesouras
                    </button>
                    <div className="w-px h-8 bg-slate-300 mx-1 shrink-0 rounded-full"></div>
                    <button onClick={() => setActiveTab("oculos")} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "oculos" ? "text-emerald-600 bg-emerald-50 border border-emerald-100 shadow-sm scale-[1.02]" : "text-slate-500 hover:bg-slate-50"}`}>
                        <BiGlasses size={18} /> Óculos
                    </button>
                    <div className="w-px h-8 bg-slate-300 mx-1 shrink-0 rounded-full"></div>
                    <button onClick={() => setActiveTab("embalagem")} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "embalagem" ? "text-amber-600 bg-amber-50 border border-amber-100 shadow-sm scale-[1.02]" : "text-slate-500 hover:bg-slate-50"}`}>
                        <BiBox size={18} /> Embalagem
                    </button>
                </div>

                {/* Conteúdo da aba ativa */}
                <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="flex-1 p-4 sm:p-6 overflow-auto">
                        {activeTab === "estoque" && (
                            <AbaEstoque
                                produtos={controller.produtos}
                                estoqueLogs={controller.estoqueLogs}
                                addEstoqueRow={controller.addEstoqueRow}
                                updateEstoque={controller.updateEstoque}
                                removeEstoqueRow={controller.removeEstoqueRow}
                                adicionarProdutoCatalogo={controller.adicionarProdutoCatalogo}
                                prepareSignatureInteraction={prepareSignatureInteraction}
                            />
                        )}
                        {activeTab === "tesouras" && (
                            <AbaTesouras
                                tesourasLogs={controller.tesourasLogs}
                                dataInicio={controller.dataInicio}
                                dataFim={controller.dataFim}
                                frequenciaTesoura={controller.frequenciaTesoura}
                                updateTesoura={controller.updateTesoura}
                                toggleDiaTesoura={controller.toggleDiaTesoura}
                                removeTesouraRow={controller.removeTesouraRow}
                                setDataInicio={controller.setDataInicio}
                                setDataFim={controller.setDataFim}
                                adicionarColaborador={controller.adicionarColaborador}
                                reativarColaborador={controller.reativarColaborador}
                                colaboradoresAtivos={controller.colaboradoresAtivos}
                            />
                        )}
                        {activeTab === "oculos" && (
                            <AbaOculos
                                oculosLogs={controller.oculosLogs}
                                colaboradoresOculos={controller.colaboradoresOculos}
                                updateOculosRow={controller.updateOculosRow as any}
                                prepareSignatureInteraction={prepareSignatureInteraction}
                                adicionarColaboradorOculos={controller.adicionarColaboradorOculos}
                                desativarColaboradorOculos={controller.desativarColaboradorOculos}
                                atualizarTipoColaborador={controller.atualizarTipoColaborador as any}
                            />
                        )}
                        {activeTab === "embalagem" && (
                            <AbaEmbalagem
                                embalagemLogs={controller.embalagemLogs}
                                addEmbalagemRow={controller.addEmbalagemRow}
                                updateEmbalagem={controller.updateEmbalagem}
                                removeEmbalagemRow={controller.removeEmbalagemRow}
                            />
                        )}
                    </div>

                    <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <button
                            onClick={exportarExcel}
                            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
                        >
                            <BiDownload size={22} /> Exportar para Excel
                        </button>
                    </div>
                </div>

                {/* Rodapé */}
                <div className="bg-[#1a1f2e] rounded-xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg border border-gray-800 text-white">
                    <div><p className="text-[11px] text-gray-400 uppercase tracking-widest">Revisado por</p><p className="font-bold text-yellow-400 text-sm">Clebitânia Carvalho</p></div>
                    <div><p className="text-[11px] text-gray-400 uppercase tracking-widest">Última Revisão</p><p className="font-bold text-sm">02/01/2026</p></div>
                    <div><p className="text-[11px] text-gray-400 uppercase tracking-widest">Código Oficial</p><p className="font-bold text-sm">{docInfo.code}</p></div>
                </div>
            </div>
        </div>
    );
}