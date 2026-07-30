"use client";

import { useState } from "react";
import { useRelatoriosController } from "../controller/useRelatoriosController";
import { modulosConfig } from "../model/relatoriosModel";
import Link from "next/link";
import {
    FaArrowLeft,
    FaDatabase,
    FaXmark,
    FaLayerGroup,
    FaRotateRight,
    FaDownload,
    FaMagnifyingGlass,
    FaCalendarDay
} from "react-icons/fa6";

export default function RelatoriosPage() {
    const {
        dataInicio, setDataInicio,
        dataFim, setDataFim,
        mesTabela, handleMesTabelaChange,
        loading, dados,
        moduloAtivo, setModuloAtivo,
        erro,
        handleBuscarPersonalizado,
        limparFiltros,
        handleExportarZip,
        handleDownloadRegistro,
    } = useRelatoriosController();

    const [filtroArea, setFiltroArea] = useState<string>("TODAS");
    const moduloConfig = modulosConfig.find((m) => m.key === moduloAtivo);

    const formatarMesBadge = (yyyyMm: string) => {
        if (!yyyyMm) return "PERÍODO PERSONALIZADO";
        const [ano, mes] = yyyyMm.split('-');
        const meses = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        return `${meses[Number(mes) - 1]}/${ano}`;
    };

    const renderCellData = (key: string, val: any) => {
        if (val === null || val === undefined) return "-";
        if (key === "id" && typeof val === "string") return val.substring(0, 8).toUpperCase();
        if (typeof val === "object") return "[Ver Planilha]";
        return String(val);
    };

    const formatarDataRegistro = (item: any) => {
        const fonteData = item?.atualizadoEm || item?.criadoEm || item?.dataRegistro;
        if (fonteData) {
            const data = new Date(fonteData);
            if (!Number.isNaN(data.getTime())) {
                return data.toLocaleDateString("pt-BR");
            }
        }
        if (item?.mes && item?.ano) {
            const [ano, mes] = String(item.mes).split("-");
            if (ano && mes) return `01/${mes}/${ano}`;
            return `${item.mes}/${item.ano}`;
        }
        return "-";
    };

    const obterNomeIdentificador = (item: any): string => {
        const val = item?.tipo || item?.categoria || item?.subtipo || item?.setor || item?.area || item?.empresa || item?.nomeEmpresa || item?.titulo || item?.aba;
        return val ? String(val).toUpperCase() : "-";
    };

    const obterAreaRegistro = (item: any): string => obterNomeIdentificador(item);
    const obterSetorParaFiltro = (item: any): string => obterNomeIdentificador(item);

    const gerarResumoGeral = (item: any) => {
        const identificador = obterNomeIdentificador(item);
        const isManutencao = item._moduloKey === 'manutencao' || item._moduloKey === 'manutencaoGeral' || (item._moduloNome || "").toLowerCase().includes('manuten');

        if (isManutencao) {
            const subAba = identificador !== "-" ? identificador : "Registro";
            const periodoOuMes = item.mes || item.periodo || item.dataRegistro || formatarDataRegistro(item);
            return `${subAba} • ${periodoOuMes}`;
        }

        if (item._moduloKey === 'higienizacaoGeral') {
            return `${identificador !== "-" ? identificador : "Registro"} • ${item.mes || ''}/${item.ano || ''} • ${item.status || ''}`;
        }

        const infoParts = [];
        if (identificador !== "-") infoParts.push(identificador);
        if (item.mes) infoParts.push(item.mes);
        if (item.status) infoParts.push(item.status);
        return infoParts.length > 0 ? infoParts.join(' • ') : "Registro";
    };

    const todosRegistros = dados ? modulosConfig.flatMap(mod =>
        (dados[mod.key] || []).map((item: any) => ({
            ...item,
            _moduloNome: mod.titulo,
            _moduloKey: mod.key
        }))
    ) : [];

    const registrosAtuais: any[] = !moduloAtivo ? todosRegistros : (dados?.[moduloAtivo] || []);

    const areasDisponiveis: string[] = Array.from(
        new Set(
            registrosAtuais
                .map((item: any) => obterSetorParaFiltro(item))
                .filter((area: string) => area && area !== "-")
        )
    ).sort();

    const registrosFiltrados = registrosAtuais.filter((item: any) => {
        if (filtroArea === "TODAS") return true;
        return obterAreaRegistro(item) === filtroArea;
    }).sort((a: any, b: any) => {
        const dataA = new Date(a?.atualizadoEm || a?.criadoEm || a?.dataRegistro || 0).getTime();
        const dataB = new Date(b?.atualizadoEm || b?.criadoEm || b?.dataRegistro || 0).getTime();
        return dataB - dataA;
    });

    const totalRegistros = todosRegistros.length;

    const handleLimparGeral = () => {
        limparFiltros();
        setFiltroArea("TODAS");
    };

    const getTituloCurto = (titulo: string) => {
        if (titulo.toLowerCase().startsWith('controle de')) {
            return titulo.replace('Controle de ', '');
        }
        return titulo.split(' ')[0];
    };

    const getTemaModulo = (key: string | null) => {
        if (!key) return { cor: 'text-indigo-600', bg: 'bg-indigo-50/60', border: 'border-indigo-500' };
        const map: Record<string, any> = {
            'higienizacao': { cor: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-500' },
            'inspecao': { cor: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-400' },
            'gestao': { cor: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-400' },
            'qualidade': { cor: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-400' },
            'conduta': { cor: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-400' },
            'manutencao': { cor: 'text-red-500', bg: 'bg-red-50', border: 'border-red-400' },
            'acesso': { cor: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-400' },
            'questionario': { cor: 'text-teal-500', bg: 'bg-teal-50', border: 'border-teal-400' },
        };
        for (const k in map) {
            if (key.toLowerCase().includes(k)) return map[k];
        }
        return { cor: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-500' };
    };

    const temaAtivo = getTemaModulo(moduloAtivo);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans flex flex-col">
            <div className="max-w-7xl mx-auto w-full flex-1">

                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 transition-colors text-sm font-bold">
                    <FaArrowLeft /> Voltar ao Painel
                </Link>

                <header className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm mb-6 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${temaAtivo.bg} ${temaAtivo.cor} transition-colors`}>
                                <FaDatabase size={24} />
                            </div>
                            <div>
                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                                    <h1 className="text-2xl font-bold text-slate-800">Histórico de Registros</h1>
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-emerald-200 uppercase w-max">
                                        <FaCalendarDay /> {formatarMesBadge(mesTabela)}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm mt-1">Visualização unificada dos registros do sistema</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full overflow-x-auto gap-3 pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                        <button
                            onClick={() => { setModuloAtivo(null); setFiltroArea("TODAS"); }}
                            className={`flex-1 flex flex-col items-center justify-center min-w-[110px] p-4 rounded-xl border-2 transition-all ${!moduloAtivo
                                ? "bg-indigo-50/60 border-indigo-500 shadow-sm scale-[1.02]"
                                : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                                }`}
                        >
                            <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-indigo-600">
                                <FaLayerGroup size={14} /> Todos
                            </div>
                            <span className="text-2xl font-black text-indigo-600">
                                {totalRegistros}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">registros</span>
                        </button>

                        {modulosConfig.map((modulo) => {
                            const isAtivo = moduloAtivo === modulo.key;
                            const tituloCurto = getTituloCurto(modulo.titulo);
                            const qtdRegistros = dados?.[modulo.key]?.length || 0;
                            const tema = getTemaModulo(modulo.key);

                            return (
                                <button
                                    key={modulo.key}
                                    onClick={() => { setModuloAtivo(modulo.key); setFiltroArea("TODAS"); }}
                                    className={`flex-1 flex flex-col items-center justify-center min-w-[110px] p-4 rounded-xl border-2 transition-all ${isAtivo
                                        ? `${tema.bg} ${tema.border} shadow-sm scale-[1.02]`
                                        : `bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 shadow-sm opacity-90 hover:opacity-100`
                                        }`}
                                >
                                    <div className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${tema.cor}`}>
                                        <FaLayerGroup size={14} /> <span className="whitespace-nowrap">{tituloCurto}</span>
                                    </div>
                                    <span className={`text-2xl font-black ${tema.cor}`}>
                                        {qtdRegistros}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5">registros</span>
                                </button>
                            );
                        })}
                    </div>
                </header>

                {/* FILTROS LIVRES (ZIP & CUSTOM RANGE) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-8 flex flex-col xl:flex-row xl:items-end justify-between gap-5">
                    <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto flex-1">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">Data inicial livre</label>
                            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">Data final livre</label>
                            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">Área / Setor</label>
                            <select
                                value={filtroArea}
                                onChange={(e) => setFiltroArea(e.target.value)}
                                disabled={!dados || areasDisponiveis.length === 0}
                                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer uppercase appearance-none"
                            >
                                <option value="TODAS">TODAS AS ÁREAS</option>
                                {areasDisponiveis.map((area: string) => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="hidden xl:block w-px h-12 bg-slate-200 mx-2 self-end mb-1"></div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto mt-4 xl:mt-0">
                        <button onClick={handleBuscarPersonalizado} disabled={loading} className="flex-1 sm:flex-none bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-70">
                            <FaMagnifyingGlass size={14} /> Buscar
                        </button>

                        <button onClick={handleLimparGeral} className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                            <FaRotateRight size={14} /> Limpar
                        </button>

                        <button onClick={handleExportarZip} disabled={loading || !dados || !moduloAtivo} className={`flex-1 sm:flex-none text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${(!moduloAtivo || !dados) ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                            <FaDownload size={14} /> Baixar ZIP
                        </button>
                    </div>
                </div>

                {/* TABELA COM SELETOR DE MÊS INDEPENDENTE */}
                {dados && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                        <div className="bg-slate-50/50 border-b border-slate-200 p-4 md:p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <FaLayerGroup className={temaAtivo.cor} />
                                {moduloAtivo ? `Detalhamento: ${moduloConfig?.titulo}` : "Visão Geral dos Registros"}
                            </h3>

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Mês:</span>
                                    <input
                                        type="month"
                                        value={mesTabela}
                                        onChange={(e) => handleMesTabelaChange(e.target.value)}
                                        className="text-sm font-semibold text-slate-700 outline-none bg-transparent cursor-pointer w-[125px]"
                                    />
                                </div>

                                {moduloAtivo && (
                                    <button onClick={() => { setModuloAtivo(null); setFiltroArea("TODAS"); }} className="text-slate-400 hover:text-red-500 font-bold text-sm flex items-center gap-1 transition-colors px-2">
                                        <FaXmark size={18} /> Fechar
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full text-sm md:text-base text-left">
                                <thead className="bg-white sticky top-0 shadow-sm z-10">
                                    <tr className="text-slate-500 uppercase text-xs font-black border-b border-slate-200">
                                        {!moduloAtivo ? (
                                            <>
                                                <th className="p-3 md:p-5">TELAS</th>
                                                <th className="p-3 md:p-5">Data</th>
                                                <th className="p-3 md:p-5">Resumo</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="p-3 md:p-5">ID</th>
                                                <th className="p-3 md:p-5">
                                                    {moduloAtivo === 'questionarioVisitante' ? 'Empresa' : 'Área'}
                                                </th>
                                                <th className="p-3 md:p-5">Data</th>
                                            </>
                                        )}
                                        <th className="p-3 md:p-5 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrosFiltrados.map((item: any, idx: number) => {
                                        const temaLinha = !moduloAtivo ? getTemaModulo(item._moduloKey) : temaAtivo;

                                        return (
                                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                                                {!moduloAtivo ? (
                                                    <>
                                                        <td className={`p-3 md:p-5 font-bold ${temaLinha.cor}`}>{item._moduloNome}</td>
                                                        <td className="p-3 md:p-5 text-slate-500 font-medium">{formatarDataRegistro(item)}</td>
                                                        <td className="p-3 md:p-5 text-slate-700">{gerarResumoGeral(item)}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="p-3 md:p-5 text-slate-500">{renderCellData("id", item.id)}</td>
                                                        <td className="p-3 md:p-5 font-semibold text-slate-700">{obterAreaRegistro(item)}</td>
                                                        <td className="p-3 md:p-5 text-slate-500">{formatarDataRegistro(item)}</td>
                                                    </>
                                                )}
                                                <td className="p-3 md:p-5 text-center">
                                                    <button onClick={() => handleDownloadRegistro(item)} className={`${temaLinha.bg} ${temaLinha.cor} border ${temaLinha.border.replace('border-', 'border-').replace('400', '200').replace('500', '200')} px-4 py-2 rounded-lg font-bold hover:brightness-95 transition-all text-sm`}>
                                                        Baixar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {registrosFiltrados.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-500">
                                                Nenhum registro encontrado para este período.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <footer className="mt-8 bg-white border border-slate-200 rounded-2xl p-4 md:p-5 text-slate-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 border border-indigo-100">
                            GV
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800">GrandValle - Histórico de Registros</p>
                            <p className="text-xs text-slate-400">© 2026 - Todos os direitos reservados</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}