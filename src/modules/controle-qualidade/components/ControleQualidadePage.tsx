"use client";

import Link from "next/link";
import { BiHistory, BiSearchAlt, BiBug, BiError, BiRecycle } from "react-icons/bi"; // BiRecycle para rejeitos
import { useControleQualidadeController } from "../controller/useControleQualidadeController";
import { AbaVidros } from "./AbaVidros";
import { AbaPragas } from "./AbaPragas";
import { AbaInusuais } from "./AbaInusuais";
import { AbaRejeitos } from "./AbaRejeitos"; // NOVO COMPONENTE

export function ControleQualidadePage() {
    const controller = useControleQualidadeController();
    const { activeTab, setActiveTab, getHistoryRecord, exportarExcel } = controller;

    const getDocInfo = () => {
        if (activeTab === "vidros") return { code: "PHU-035", name: "Monitoramento de Vidro e Plástico Rígido" };
        if (activeTab === "pragas") return { code: "PHU-042", name: "Controle Integrado de Vetores e Pragas Urbanas" };
        if (activeTab === "rejeitos") return { code: "PHU-034", name: "Produtos Retidos e Rejeitos" };
        return { code: "PHU-041", name: "Acontecimentos Inusuais e Ações Corretivas" };
    };

    const docInfo = getDocInfo();

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans text-gray-800 flex justify-center">
            <div className="w-full max-w-7xl flex flex-col gap-4"> {/* Ajustei max-w-350 que era inválido no tailwind, para max-w-7xl para ter largura total */}

                <div className="bg-[#1a1c23] text-white rounded-xl shadow-lg p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                        <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-cyan-400">{docInfo.name}</h1>
                        <p className="text-sm font-medium text-gray-400 mt-1">Sistema integrado de controle de qualidade</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <Link href="/historico?modulo=qualidade" className="text-sm font-bold flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-lg hover:bg-white/20 transition-all">
                            <BiHistory size={18} /> Histórico
                        </Link>
                        <div className="text-sm font-bold flex items-center gap-2 bg-gray-700 px-4 py-2.5 rounded-lg text-gray-300">
                            {docInfo.code}
                        </div>
                    </div>
                </div>

                {/* MENU DE ABAS COM 4 OPÇÕES */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex items-center overflow-x-auto hide-scrollbar">

                    <button onClick={() => setActiveTab("vidros")} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "vidros" ? "text-cyan-600 bg-cyan-50 border border-cyan-100 shadow-sm scale-[1.02]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                        <BiSearchAlt size={18} /> Vidros e Plásticos
                    </button>

                    <div className="w-px h-8 bg-gray-300 mx-1 shrink-0 rounded-full"></div>

                    <button onClick={() => setActiveTab("pragas")} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "pragas" ? "text-rose-600 bg-rose-50 border border-rose-100 shadow-sm scale-[1.02]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                        <BiBug size={18} /> Vetores e Pragas
                    </button>

                    <div className="w-px h-8 bg-gray-300 mx-1 shrink-0 rounded-full"></div>

                    {/* NOVA ABA: REJEITOS */}
                    <button onClick={() => setActiveTab("rejeitos")} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "rejeitos" ? "text-blue-600 bg-blue-50 border border-blue-100 shadow-sm scale-[1.02]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                        <BiRecycle size={18} /> Produtos Retidos
                    </button>

                    <div className="w-px h-8 bg-gray-300 mx-1 shrink-0 rounded-full"></div>

                    <button onClick={() => setActiveTab("inusuais")} className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === "inusuais" ? "text-orange-600 bg-orange-50 border border-orange-100 shadow-sm scale-[1.02]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                        <BiError size={18} /> Acont. Inusuais
                    </button>
                </div>

                {/* CORPO DA ABA SELECIONADA */}
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden flex flex-col min-h-150">
                    <div className="flex-1 p-4 sm:p-6 overflow-auto">
                        {activeTab === "vidros" && <AbaVidros controller={controller} />}
                        {activeTab === "pragas" && <AbaPragas controller={controller} />}
                        {activeTab === "inusuais" && <AbaInusuais controller={controller} />}

                        {/* RENDERIZA O NOVO COMPONENTE */}
                        {activeTab === "rejeitos" && <AbaRejeitos controller={controller} />}
                    </div>

                    <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                        {/* Temporariamente desativado para não limpar a tela após exportar */}
                        <button
                            type="button"
                            onClick={exportarExcel} // ou controller.exportarExcel (depende de como você importou o hook aí em cima)
                            className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
                        >
                            Exportar para Excel
                        </button>

                    </div>
                </div>

                <div className="bg-[#1a1f2e] rounded-xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg border border-gray-800 mt-2 text-white">
                    <div><p className="text-[11px] text-gray-400 uppercase tracking-widest">Revisado por</p><p className="font-bold text-yellow-400 text-sm">Clebitânia Carvalho</p></div>
                    <div><p className="text-[11px] text-gray-400 uppercase tracking-widest">Última Revisão</p><p className="font-bold text-sm">02/01/2026</p></div>
                    <div><p className="text-[11px] text-gray-400 uppercase tracking-widest">Código Oficial</p><p className="font-bold text-sm">{docInfo.code}</p></div>
                </div>
            </div>
        </div>
    );
}