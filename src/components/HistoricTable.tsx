"use client";

import React, { useEffect, useState } from "react";
import { BiSearch, BiDownload, BiTrash, BiArchive } from "react-icons/bi";

interface HistoricColumn {
    key: string;
    label: string;
    render?: (value: any) => React.ReactNode;
}

interface FilterOption {
    name: string;
    key: string;
    values: string[];
}

interface HistoricTableProps {
    title: string;
    description: string;
    columns: HistoricColumn[];
    data: any[];
    onExport?: (record: any) => void;
    onDelete?: (id: string) => void;
    searchPlaceholder?: string;
    monthFilter?: boolean;
    customFilter?: FilterOption;
}

export function HistoricTable({
    title,
    description,
    columns,
    data,
    onExport,
    onDelete,
    searchPlaceholder = "Buscar...",
    monthFilter = true,
    customFilter,
}: HistoricTableProps) {
    const [search, setSearch] = useState("");

    // 🟢 VOLTAMOS A INICIAR COM O MÊS ATUAL PREENCHIDO
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [selectedCustom, setSelectedCustom] = useState<string>("");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    const normalizeFilterValue = (value: unknown) =>
        String(value ?? "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    if (!isMounted) return null;

    const filteredData = data.filter((item) => {
        // 1. Filtro de Busca por Texto
        const searchMatch = search === "" || Object.values(item).some((val) =>
            val && typeof val !== "object" && String(val).toLowerCase().includes(search.toLowerCase())
        );

        // 2. Filtro de Mês Inteligente (Resolve a Incompatibilidade)
        let monthMatch = false;
        if (!monthFilter || !selectedMonth) {
            monthMatch = true; // Se não tem mês selecionado, mostra tudo
        } else {
            // selectedMonth chega como "2026-05"
            const [year, month] = selectedMonth.split("-");
            const brDateStr = `${month}/${year}`; // Formato BR: "05/2026"

            // Tenta achar "2026-05" direto no campo 'mes' (Padrão original)
            if (item.mes && String(item.mes).includes(selectedMonth)) {
                monthMatch = true;
            }
            // Tenta achar na Data de Exportação (Ex: "20/05/2026" ou "2026-05-20T...")
            else if (item.exportedAt && (String(item.exportedAt).includes(selectedMonth) || String(item.exportedAt).includes(brDateStr))) {
                monthMatch = true;
            }
            // Usa o ID (que é a data real em milissegundos) para extrair o mês matematicamente
            else if (item.id && !isNaN(Number(item.id))) {
                const dateFromId = new Date(Number(item.id));
                if (dateFromId.getFullYear() === Number(year) && (dateFromId.getMonth() + 1) === Number(month)) {
                    monthMatch = true;
                }
            }
        }

        // 3. Filtro Customizado (Abas/Áreas)
        const customMatch = (() => {
            if (!customFilter || !selectedCustom) return true;

            const itemValue = normalizeFilterValue(item[customFilter.key]);
            const selectedValue = normalizeFilterValue(selectedCustom);

            return (
                itemValue === selectedValue ||
                itemValue.includes(selectedValue) ||
                selectedValue.includes(itemValue)
            );
        })();

        return searchMatch && monthMatch && customMatch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
                <div className="p-5 md:p-6">
                    <div className="text-white">
                        <h1 className="text-xl md:text-2xl font-black mb-1 flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-slate-800 rounded-lg border border-slate-600 text-amber-400">
                                <BiArchive size={24} />
                            </div>
                            {title}
                        </h1>
                        <p className="text-slate-400 text-xs md:text-sm font-bold tracking-widest uppercase ml-14">{description}</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border-2 border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                            🔍 Buscar
                        </label>
                        <div className="relative">
                            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-all bg-slate-50 focus:bg-white"
                            />
                        </div>
                    </div>

                    {monthFilter && (
                        <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                📅 Período
                            </label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-500 transition-all bg-slate-50 focus:bg-white"
                            />
                        </div>
                    )}

                    {customFilter && (
                        <div>
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                📌 {customFilter.name}
                            </label>
                            <select
                                value={selectedCustom}
                                onChange={(e) => setSelectedCustom(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-500 transition-all appearance-none bg-slate-50 focus:bg-white cursor-pointer"
                            >
                                <option value="">Todos ({customFilter.name})</option>
                                {customFilter.values.map((val) => (
                                    <option key={val} value={val}>
                                        {val}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-100 border-b-2 border-slate-200">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className="px-5 py-4 font-black text-slate-700 text-[10px] uppercase tracking-widest border-r border-slate-200 last:border-0"
                                    >
                                        {col.label}
                                    </th>
                                ))}
                                <th className="px-5 py-4 text-center font-black text-slate-700 text-[10px] uppercase tracking-widest">
                                    ⚡ Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.length > 0 ? (
                                filteredData.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="hover:bg-slate-50 transition-colors duration-200 group"
                                    >
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className="px-5 py-4 text-slate-800 font-medium border-r border-slate-100 last:border-0"
                                            >
                                                {col.render ? col.render(row[col.key]) : row[col.key] || "-"}
                                            </td>
                                        ))}
                                        <td className="px-5 py-3 text-center">
                                            <div className="flex gap-2 justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                                                {onExport && (
                                                    <button
                                                        onClick={() => onExport(row)}
                                                        className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-lg transition-all duration-200 shadow-sm border border-slate-200 hover:border-slate-800"
                                                        title="Exportar"
                                                    >
                                                        <BiDownload size={18} />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        onClick={() => onDelete(row.id)}
                                                        className="p-2.5 text-slate-400 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 shadow-sm border border-slate-200"
                                                        title="Deletar"
                                                    >
                                                        <BiTrash size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200">
                                                <BiArchive size={32} className="text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-slate-800 font-black text-lg uppercase tracking-tight">
                                                    Nenhum registro encontrado
                                                </p>
                                                <p className="text-slate-500 text-sm font-medium mt-1">
                                                    Tente ajustar os filtros ou busque por outro termo.
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Rodapé informativo */}
            {filteredData.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 shadow-inner flex justify-center sm:justify-start">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Exibindo <span className="text-amber-400 font-black text-sm">{filteredData.length}</span> de <span className="text-white font-black text-sm">{data.length}</span> registros totais
                    </p>
                </div>
            )}
        </div>
    );
}