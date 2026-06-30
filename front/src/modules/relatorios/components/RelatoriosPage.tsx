"use client";

import { useRelatoriosController } from "../controller/useRelatoriosController";
import { modulosConfig } from "../model/relatoriosModel";
import Link from "next/link";
import {
    FaArrowLeft,
    FaDatabase,
    FaMagnifyingGlass,
    FaXmark,
    FaFileExcel,
    FaLayerGroup,
} from "react-icons/fa6";

export default function RelatoriosPage() {
    const {
        dataInicio, setDataInicio,
        dataFim, setDataFim,
        loading, dados,
        moduloAtivo, setModuloAtivo,
        erro,
        handleBuscar,
        limparFiltros,
        handleExportarZip,
        handleDownloadRegistro,
    } = useRelatoriosController();

    const colunasOcultasNaTela = [
        "registrosDiarios", "dadosManutencao", "dadosConduta",
        "dadosQualidade", "dadosEstoque", "dadosInspecao",
        "respostas", "documentos",
        "criadoEm", "atualizadoEm", "procedimentoId", "frequencia",
        "colaboradorId"
    ];

    const renderCellData = (key: string, val: any) => {
        if (val === null || val === undefined) return "-";
        if (key === "id" && typeof val === "string") return val.substring(0, 8).toUpperCase();
        if (typeof val === "object") return "[Ver Planilha]";
        return String(val);
    };

    const gerarResumoGeral = (item: any) => {
        if (item._moduloKey === 'higienizacaoGeral') return `${item.setor || ''} • ${item.mes || ''}/${item.ano || ''} • ${item.status || ''}`;
        const infoParts = [];
        if (item.setor) infoParts.push(item.setor);
        if (item.mes) infoParts.push(item.mes);
        if (item.status) infoParts.push(item.status);
        return infoParts.length > 0 ? infoParts.join(' • ') : "Registro";
    };

    const moduloConfig = modulosConfig.find((m) => m.key === moduloAtivo);

    const todosRegistros = dados ? modulosConfig.flatMap(mod =>
        (dados[mod.key] || []).map((item: any) => ({
            ...item,
            _moduloNome: mod.titulo,
            _moduloKey: mod.key
        }))
    ) : [];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors text-sm font-medium">
                    <FaArrowLeft /> Voltar ao Painel
                </Link>

                <header className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl mb-8 border-l-4 border-indigo-500 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                            <FaDatabase size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Central de Relatórios</h1>
                            <p className="text-slate-400 text-sm mt-1">Auditoria e visualização unificada de registros</p>
                        </div>
                    </div>
                    {dados && (
                        <button onClick={limparFiltros} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition">
                            <FaXmark /> Limpar Filtros
                        </button>
                    )}
                </header>

                {/* Cards - sempre visíveis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    {modulosConfig.map((modulo) => {
                        const registros = dados?.[modulo.key] || [];
                        const isAtivo = moduloAtivo === modulo.key;
                        return (
                            <button
                                key={modulo.key}
                                onClick={() => setModuloAtivo(modulo.key)}
                                className={`p-5 rounded-2xl border text-left transition-all group ${isAtivo ? "bg-slate-900 border-slate-900 shadow-lg" : "bg-white border-slate-200 hover:border-indigo-300"}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${isAtivo ? "bg-slate-800 text-white" : modulo.bgClass + " " + modulo.colorClass}`}>
                                        <modulo.icon size={20} />
                                    </div>
                                    <span className={`text-2xl font-black ${isAtivo ? "text-white" : registros.length > 0 ? "text-slate-800" : "text-slate-300"}`}>
                                        {registros.length}
                                    </span>
                                </div>
                                <h4 className={`font-semibold text-sm ${isAtivo ? "text-slate-200" : "text-slate-600"}`}>
                                    {modulo.titulo}
                                </h4>
                            </button>
                        );
                    })}
                </div>

                {/* Mensagem de vazio (quando não há dados) */}
                {!loading && !dados && !erro && (
                    <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-2xl mb-8">
                        <FaDatabase className="mx-auto text-slate-300 text-4xl mb-4" />
                        <p className="text-slate-500 font-medium">Nenhum relatório gerado ainda.</p>
                        <p className="text-slate-400 text-sm mt-1">Selecione o período abaixo e clique em buscar para processar os dados.</p>
                    </div>
                )}

                {/* Filtros - abaixo dos cards */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row items-end gap-6">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Data Inicial</label>
                            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 outline-none" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Data Final</label>
                            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-slate-700 outline-none" />
                        </div>
                        <button onClick={handleBuscar} disabled={loading} className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition">
                            {loading ? "Processando..." : <><FaMagnifyingGlass /> Buscar</>}
                        </button>
                        <button
                            onClick={handleExportarZip}
                            disabled={loading || !dados || !moduloAtivo}
                            className={`bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition ${(!moduloAtivo) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}`}
                            title={!moduloAtivo ? "Selecione um módulo para exportar" : "Baixar documentos do módulo (ZIP)"}
                        >
                            <FaFileExcel /> Baixar Módulo (ZIP)
                        </button>
                    </div>
                    {erro && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {erro}
                        </div>
                    )}
                </div>

                {/* Tabela */}
                {dados && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden mb-12">
                        <div className="bg-slate-50 border-b p-5 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                                <FaLayerGroup className="text-indigo-500" />
                                {moduloAtivo ? `Detalhamento: ${moduloConfig?.titulo}` : "Visão Geral"}
                            </h3>
                            {moduloAtivo && (
                                <button onClick={() => setModuloAtivo(null)} className="text-slate-500 hover:text-red-600 font-bold text-sm flex items-center gap-1">
                                    <FaXmark size={18} /> Fechar
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto max-h-[700px]">
                            <table className="w-full text-base text-left">
                                <thead className="bg-white sticky top-0 shadow-sm">
                                    <tr className="text-slate-500 uppercase text-xs font-black">
                                        {!moduloAtivo ? (
                                            <>
                                                <th className="p-5">Módulo</th>
                                                <th className="p-5">ID</th>
                                                <th className="p-5">Resumo</th>
                                            </>
                                        ) : (
                                            Object.keys(dados[moduloAtivo][0] || {})
                                                .filter(k => !colunasOcultasNaTela.includes(k))
                                                .map(k => <th key={k} className="p-5">{k}</th>)
                                        )}
                                        <th className="p-5 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(!moduloAtivo ? todosRegistros : dados[moduloAtivo]).map((item: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            {!moduloAtivo ? (
                                                <>
                                                    <td className="p-5 font-bold text-indigo-700">{item._moduloNome}</td>
                                                    <td className="p-5 font-mono text-sm text-slate-400">{item.id?.toString().substring(0, 8).toUpperCase()}</td>
                                                    <td className="p-5 text-slate-600">{gerarResumoGeral(item)}</td>
                                                </>
                                            ) : (
                                                Object.entries(item)
                                                    .filter(([k]) => !colunasOcultasNaTela.includes(k))
                                                    .map(([k, v], i) => <td key={i} className="p-5">{renderCellData(k, v)}</td>)
                                            )}
                                            <td className="p-5 text-right">
                                                <button
                                                    onClick={() => handleDownloadRegistro(item)}
                                                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition shadow-sm"
                                                >
                                                    <FaFileExcel size={18} /> Baixar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}