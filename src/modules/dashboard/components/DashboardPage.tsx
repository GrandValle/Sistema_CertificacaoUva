"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    FaDroplet,
    FaClipboardCheck,
    FaBoxesStacked,
    FaFlaskVial,
    FaUserShield,
    FaScrewdriverWrench,
    FaQuestion,
    FaIndustry,
    FaRegCalendar,
    FaDatabase,
} from "react-icons/fa6";
import { ShieldCheck, Stethoscope } from "lucide-react";
import { useDashboardController } from "@/modules/dashboard/controller/useDashboardController";

// Mapeamento de ícones (agora com todos os ícones importados)
const IconMap: Record<string, React.ElementType> = {
    droplet: FaDroplet,
    clipboard: FaClipboardCheck,
    boxes: FaBoxesStacked,
    flask: FaFlaskVial,
    shield: FaUserShield,
    wrench: FaScrewdriverWrench,
    "shield-check": ShieldCheck,
    stethoscope: Stethoscope,
    database: FaDatabase,
};

export function DashboardPage() {
    const {
        systems,
        systemCategories,
        selectedCategory,
        filteredSystems,
        setSelectedCategory,
    } = useDashboardController();

    const totalSystems = systems.length;
    const activeSystems = systems.length;

    // Estado para armazenar a data atual (apenas no cliente)
    const [currentDate, setCurrentDate] = useState<string>("");

    useEffect(() => {
        // Define a data apenas no cliente, após a montagem
        setCurrentDate(new Date().toLocaleDateString("pt-BR"));
    }, []);

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-100 to-slate-200 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <header className="bg-gradient-to-r from-[#1e1b4b] via-[#312e81] to-[#4338ca] rounded-3xl shadow-[0_20px_50px_-12px_rgba(49,46,129,0.5)] mb-8 overflow-hidden border border-indigo-800 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
                                <FaIndustry className="text-white text-3xl" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-2xl md:text-3xl font-black text-white truncate tracking-tight">
                                    GrandValle Certifications
                                </h1>
                                <p className="text-indigo-200 text-sm md:text-base truncate font-medium">
                                    Sistema Integrado de Controle e Monitoramento Industrial
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="rounded-2xl bg-white px-6 py-4 flex items-center gap-4 shadow-xl border border-indigo-50">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <FaClipboardCheck className="text-indigo-600 text-xl" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Sistemas Disponíveis</span>
                                    <span className="text-[#4338ca] text-2xl font-black leading-none">{activeSystems}/{totalSystems}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* FILTROS */}
                <div className="flex items-center sm:justify-center gap-2 mb-12 overflow-x-auto hide-scrollbar w-full px-2 py-2">
                    {systemCategories.map((cat) => {
                        const isSelected = selectedCategory === cat.id;

                        let activeClass = "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] border-transparent transform -translate-y-1";
                        let inactiveClass = "bg-white text-gray-600 hover:text-indigo-600 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5";
                        let badgeClass = isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500";

                        if (cat.id === "Higienizacao") {
                            activeClass = "bg-emerald-500 text-white shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)] border-transparent transform -translate-y-1";
                            inactiveClass = "bg-white text-emerald-700 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5";
                            badgeClass = isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600";
                        } else if (cat.id === "Inspecao") {
                            activeClass = "bg-orange-500 text-white shadow-[0_10px_20px_-5px_rgba(249,115,22,0.4)] border-transparent transform -translate-y-1";
                            inactiveClass = "bg-white text-orange-700 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5";
                            badgeClass = isSelected ? "bg-white/20 text-white" : "bg-orange-50 text-orange-600";
                        } else if (cat.id === "Estoque") {
                            activeClass = "bg-purple-500 text-white shadow-[0_10px_20px_-5px_rgba(168,85,247,0.4)] border-transparent transform -translate-y-1";
                            inactiveClass = "bg-white text-purple-700 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5";
                            badgeClass = isSelected ? "bg-white/20 text-white" : "bg-purple-50 text-purple-600";
                        } else if (cat.id === "Seguranca") {
                            activeClass = "bg-pink-500 text-white shadow-[0_10px_20px_-5px_rgba(236,72,153,0.4)] border-transparent transform -translate-y-1";
                            inactiveClass = "bg-white text-pink-700 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5";
                            badgeClass = isSelected ? "bg-white/20 text-white" : "bg-pink-50 text-pink-600";
                        } else if (cat.id === "Manutencao") {
                            activeClass = "bg-slate-700 text-white shadow-[0_10px_20px_-5px_rgba(51,65,85,0.4)] border-transparent transform -translate-y-1";
                            inactiveClass = "bg-white text-slate-700 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5";
                            badgeClass = isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600";
                        } else if (cat.id === "Qualidade") {
                            activeClass = "bg-blue-500 text-white shadow-[0_10px_20px_-5px_rgba(59,130,246,0.4)] border-transparent transform -translate-y-1";
                            inactiveClass = "bg-white text-blue-700 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5";
                            badgeClass = isSelected ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600";
                        }

                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
                                className={`px-4 py-2 rounded-full font-bold text-[11px] uppercase tracking-wider whitespace-nowrap shrink-0 transition-all duration-300 active:scale-95 flex items-center gap-1.5 ${isSelected ? activeClass : inactiveClass}`}
                            >
                                {cat.name}
                                {cat.id !== "all" && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${badgeClass}`}>
                                        {systems.filter((s) => s.category === cat.id).length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Grid de sistemas */}
                <div className="mb-8 relative z-0">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        Painel de Acesso
                        <span className="text-sm font-normal text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                            {filteredSystems.length} sistemas encontrados
                        </span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {filteredSystems.map((system) => {
                            const Icon = IconMap[system.icon] || FaQuestion;
                            return (
                                <Link
                                    key={system.id}
                                    href={system.href}
                                    className="bg-white rounded-3xl shadow-[0_8px_20px_-6px_rgba(0,0,0,0.05)] overflow-hidden border border-white hover:border-blue-100 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] transition-all duration-300 group transform hover:-translate-y-1"
                                >
                                    <div className={`h-2.5 bg-linear-to-r ${system.accentClass}`}></div>
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white bg-linear-to-r ${system.accentClass} shadow-md`}>
                                                <Icon />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs font-bold bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1 rounded-full">
                                                    {system.primaryCode}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                                            {system.title}
                                        </h3>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                            {system.description}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                            <div className="flex items-center gap-1">
                                                <span className="font-semibold">Categoria:</span>
                                                <span className={
                                                    system.category === "Higienizacao" ? "bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-100"
                                                        : system.category === "Inspecao" ? "bg-orange-50 text-orange-700 px-2.5 py-0.5 rounded-full font-bold border border-orange-100"
                                                            : system.category === "Estoque" ? "bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-bold border border-purple-100"
                                                                : system.category === "Seguranca" ? "bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full font-bold border border-pink-100"
                                                                    : system.category === "Manutencao" ? "bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold border border-slate-200"
                                                                        : system.category === "Qualidade" ? "bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold border border-blue-100"
                                                                            : "bg-gray-50 text-gray-700 px-2.5 py-0.5 rounded-full font-bold border border-gray-200"
                                                }>
                                                    {system.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <FaRegCalendar />
                                                    {/* Data agora usando o estado, que só é preenchido no cliente */}
                                                    <span suppressHydrationWarning>
                                                        {currentDate || "Carregando..."}
                                                    </span>
                                                </div>
                                                <button className="text-blue-600 font-bold hover:text-blue-800 transition-colors group-hover:translate-x-1 transform duration-200 flex items-center gap-1">
                                                    Acessar
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Rodapé */}
                <footer className="mt-8 bg-white rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] p-6 border-2 border-white">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-gray-800 to-black flex items-center justify-center shadow-md">
                                <span className="font-black text-white text-lg">GV</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 tracking-tight">
                                    GrandValle Industries
                                </h3>
                                <p className="text-gray-500 text-sm font-medium">
                                    Sistema de Certificações e Controle de Qualidade
                                </p>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Versão do Sistema</p>
                            <p className="font-bold text-gray-800 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                                v3.2.1 • Atualizado em{" "}
                                <span suppressHydrationWarning>
                                    {currentDate || "Carregando..."}
                                </span>
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}