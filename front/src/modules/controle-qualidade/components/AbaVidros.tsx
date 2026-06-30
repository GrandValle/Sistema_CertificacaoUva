"use client";

import { useState, useEffect } from "react"; // 🟢 Importamos os hooks necessários
import { SignatureSelector } from "../../../components/SignatureSelector";

export function AbaVidros({ controller }: { controller: any }) {
    // 🟢 ESTADO PARA CONTROLAR A HIDRATAÇÃO
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const {
        vidrosDate, setVidrosDate,
        vidrosMonitor, setVidrosMonitor,
        vidrosResp, setVidrosResp,
        vidrosObs, setVidrosObs,
        vidrosLogs, updateVidro
    } = controller;

    // 🟢 SE NÃO ESTIVER MONTADO, RETORNAMOS NULO (OU UM SKELETON) 
    // Isso evita que o servidor tente renderizar as assinaturas e falhe
    if (!mounted) return <div className="p-8 text-center text-gray-400">Carregando monitoramento...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* CABEÇALHO LIMPO - APENAS TÍTULO */}
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
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100 border-b border-gray-200">
                        <tr className="text-xs uppercase tracking-wider text-gray-600 font-black">
                            <th className="p-4 w-[35%] border-r border-gray-200 text-center">Verificar</th>
                            <th className="p-4 w-[15%] text-center border-r border-gray-200">Situação</th>
                            <th className="p-4 w-[25%] border-r border-gray-200 text-center">Ação Recomendada</th>
                            <th className="p-4 w-[25%] text-center">Tempo de Correção</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {vidrosLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-cyan-50/20 transition-colors">
                                <td className="p-4 font-bold text-gray-800 border-r border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] shrink-0"></span>
                                        {log.item === "Outros" || log.item.startsWith("Outros:") ? (
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="shrink-0">Outros:</span>
                                                <input
                                                    type="text"
                                                    value={log.item === "Outros" ? "" : log.item.replace("Outros: ", "")}
                                                    onChange={(e) => updateVidro(log.id, 'item', `Outros: ${e.target.value}`)}
                                                    placeholder="Especifique aqui..."
                                                    className="flex-1 bg-transparent border-b border-gray-200 outline-none focus:border-cyan-500 text-sm py-1 font-normal placeholder:text-gray-300 placeholder:italic"
                                                />
                                            </div>
                                        ) : (
                                            <span>{log.item}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 border-r border-gray-200 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => updateVidro(log.id, 'conforme', 'C')} className={`w-10 h-10 rounded-lg font-black text-sm transition-all border-2 ${log.conforme === 'C' ? 'bg-green-500 border-green-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-green-300'}`}>C</button>
                                        <button onClick={() => updateVidro(log.id, 'conforme', 'NC')} className={`w-10 h-10 rounded-lg font-black text-sm transition-all border-2 ${log.conforme === 'NC' ? 'bg-red-500 border-red-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-400 hover:border-red-300'}`}>NC</button>
                                    </div>
                                </td>
                                <td className="p-3 border-r border-gray-200 text-center">
                                    <textarea value={log.acaoRecomendada} onChange={(e) => updateVidro(log.id, 'acaoRecomendada', e.target.value)} placeholder="Se necessário..." className="w-full bg-transparent resize-none outline-none text-sm p-1 placeholder-gray-300" rows={2}></textarea>
                                </td>
                                <td className="p-3 text-center">
                                    <input type="text" value={log.tempoCorrecao} onChange={(e) => updateVidro(log.id, 'tempoCorrecao', e.target.value)} placeholder="Ex: Imediato" className="w-full bg-transparent outline-none text-sm p-1 placeholder-gray-300 text-center" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* BLOCO INFERIOR: OBSERVAÇÕES E ASSINATURAS */}
            <div className="flex flex-col lg:flex-row gap-6 pt-2">
                <div className="flex-2 bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm">
                    <label className="text-xs font-black text-amber-800 uppercase tracking-wide mb-2 block">
                        Observações (C=Conforme / NC=Não Conforme)
                    </label>
                    <p className="text-[11px] text-amber-600/80 mb-4 font-bold">
                        Descrever o número da janela, porta e lâmpadas que estiver com defeitos.
                    </p>
                    <textarea
                        value={vidrosObs}
                        onChange={(e) => setVidrosObs(e.target.value)}
                        className="w-full border border-amber-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-white min-h-40 shadow-inner"
                        placeholder="Digite suas observações aqui..."
                    ></textarea>
                </div>

                <div className="flex-1 flex flex-col gap-4 border-2 border-gray-100 rounded-2xl p-6 shadow-sm bg-gray-50/50">
                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Data da Verificação</label>
                        <div className="relative w-full">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                            </span>
                            <input
                                type="date"
                                value={vidrosDate}
                                onChange={(e) => setVidrosDate(e.target.value)}
                                className="w-full bg-white border border-gray-200 shadow-sm rounded-xl pl-10 pr-3 py-2.5 text-sm font-bold outline-none focus:border-cyan-400"
                            />
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border transition-colors duration-300 ${vidrosMonitor ? 'bg-white border-green-100' : 'bg-white border-gray-200'}`}>
                        <div className="text-center pb-2">
                            <label className="text-[11px] font-black text-gray-700 uppercase block">Monitor Responsável</label>
                        </div>
                        <div className="w-full">
                            <SignatureSelector value={vidrosMonitor} onChange={setVidrosMonitor} />
                        </div>
                    </div>

                    <div className={`p-4 rounded-xl border transition-colors duration-300 ${vidrosResp ? 'bg-white border-green-100' : 'bg-white border-gray-200'}`}>
                        <div className="text-center pb-2">
                            <label className="text-[11px] font-black text-gray-700 uppercase block">Responsável Packing</label>
                        </div>
                        <div className="w-full">
                            <SignatureSelector value={vidrosResp} onChange={setVidrosResp} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}