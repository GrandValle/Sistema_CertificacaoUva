"use client";

import { useState, useEffect } from "react";
import { SignatureSelector } from "../../../components/SignatureSelector";

export function AbaVidros({ controller }: { controller: any }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const {
        vidrosDate, setVidrosDate,
        vidrosMonitor, setVidrosMonitor,
        vidrosResp, setVidrosResp,
        vidrosLogs, updateVidro
    } = controller;

    if (!mounted) return <div className="p-8 text-center text-gray-400">Carregando monitoramento...</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* CABEÇALHO */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-1.5 h-12 bg-cyan-500 rounded-full"></div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight leading-tight uppercase">
                        Monitoramento de Vidro e Plástico Rígido
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Frequência: Semanal
                        </span>
                    </div>
                </div>
            </div>

            {/* TABELA DE VERIFICAÇÃO */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100 border-b border-gray-200">
                        <tr className="text-xs uppercase tracking-wider text-gray-600 font-black">
                            <th className="p-4 w-[28%] border-r border-gray-200 text-center">Verificar</th>
                            <th className="p-4 w-[12%] text-center border-r border-gray-200">Situação</th>
                            <th className="p-4 w-[23%] border-r border-gray-200 text-center">
                                Observação
                                <span className="block text-[10px] font-normal text-gray-400 normal-case">Nº de janela, porta, lâmpada, etc.</span>
                            </th>
                            <th className="p-4 w-[22%] border-r border-gray-200 text-center">Ação Recomendada</th>
                            <th className="p-4 w-[15%] text-center">Tempo de Correção</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {vidrosLogs.filter((log: any) => !log.item.startsWith("Outros")).map((log: any) => {
                            const isLampada = log.item.includes("Lâmpadas");

                            const corNaoAtivo = isLampada ? 'bg-red-500 border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-green-500 border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
                            const hoverNao = isLampada ? 'hover:border-red-300 hover:text-red-500' : 'hover:border-green-300 hover:text-green-500';

                            const corSimAtivo = isLampada ? 'bg-green-500 border-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-red-500 border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
                            const hoverSim = isLampada ? 'hover:border-green-300 hover:text-green-500' : 'hover:border-red-300 hover:text-red-500';

                            return (
                                <tr key={log.id} className="hover:bg-cyan-50/20 transition-colors">
                                    <td className="p-4 font-bold text-gray-800 border-r border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] shrink-0"></span>
                                            <span>{log.item}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 border-r border-gray-200 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateVidro(log.id, 'conforme', 'SIM')}
                                                className={`w-10 h-10 rounded-lg font-black text-sm transition-all duration-300 border-2 ${log.conforme === 'SIM'
                                                    ? `${corSimAtivo} text-white`
                                                    : `bg-white border-gray-200 text-gray-400 ${hoverSim}`
                                                    }`}
                                            >
                                                SIM
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateVidro(log.id, 'conforme', 'NÃO')}
                                                className={`w-10 h-10 rounded-lg font-black text-sm transition-all duration-300 border-2 ${log.conforme === 'NÃO'
                                                    ? `${corNaoAtivo} text-white`
                                                    : `bg-white border-gray-200 text-gray-400 ${hoverNao}`
                                                    }`}
                                            >
                                                NÃO
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-3 border-r border-gray-200 text-center">
                                        <textarea
                                            value={log.observacao || ""}
                                            onChange={(e) => updateVidro(log.id, 'observacao', e.target.value)}
                                            placeholder="Ex: Janela 02, porta lateral..."
                                            className="w-full bg-transparent resize-none outline-none text-sm p-1 placeholder-gray-300"
                                            rows={2}
                                        ></textarea>
                                    </td>
                                    <td className="p-3 border-r border-gray-200 text-center">
                                        <textarea
                                            value={log.acaoRecomendada}
                                            onChange={(e) => updateVidro(log.id, 'acaoRecomendada', e.target.value)}
                                            placeholder="Se necessário..."
                                            className="w-full bg-transparent resize-none outline-none text-sm p-1 placeholder-gray-300"
                                            rows={2}
                                        ></textarea>
                                    </td>
                                    <td className="p-3 text-center">
                                        <input
                                            type="text"
                                            value={log.tempoCorrecao}
                                            onChange={(e) => updateVidro(log.id, 'tempoCorrecao', e.target.value)}
                                            placeholder="Ex: Imediato"
                                            className="w-full bg-transparent outline-none text-sm p-1 placeholder-gray-300 text-center"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* AVISO / OBSERVAÇÃO LOGO ABAIXO DA TABELA */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs font-bold text-amber-900 shadow-sm flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse"></span>
                <span>
                    <strong>OBS:</strong> Descrever o número da janela, porta e lâmpadas que estiver com defeitos (vidro quebrado ou proteção das lâmpadas danificadas).
                </span>
            </div>

            {/* BLOCO INFERIOR: DATA E ASSINATURAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm items-center">
                <div>
                    <label className="text-[11px] font-black text-gray-700 uppercase mb-2 block">Data da Verificação</label>
                    <input
                        type="date"
                        value={vidrosDate}
                        onChange={(e) => setVidrosDate(e.target.value)}
                        className="w-full bg-white border border-gray-200 shadow-sm rounded-xl px-3 py-3 text-sm font-bold outline-none focus:border-cyan-400"
                    />
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="text-[11px] font-black text-gray-700 uppercase block text-center pb-2">Monitor Responsável</label>
                    <SignatureSelector value={vidrosMonitor} onChange={setVidrosMonitor} />
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="text-[11px] font-black text-gray-700 uppercase block text-center pb-2">Responsável Packing</label>
                    <SignatureSelector value={vidrosResp} onChange={setVidrosResp} />
                </div>
            </div>
        </div>
    );
}