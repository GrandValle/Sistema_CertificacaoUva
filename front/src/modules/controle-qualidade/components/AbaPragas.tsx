import { useEffect } from "react";
import { SignatureSelector } from "../../../components/SignatureSelector";
import { BiTrash, BiPlus, BiCheckShield, BiInfoCircle } from "react-icons/bi";

export function AbaPragas({ controller }: { controller: any }) {
    const {
        pragasLogs,
        addPragaLog,
        updatePragaLog,
        updatePragaGrid,
        activeTab,
        colunasPragas,
        setoresPragas,
        adicionarPraga,
        removerPraga,
        adicionarSetor,
        removerSetor,
    } = controller;

    useEffect(() => {
        if (activeTab === "pragas" && pragasLogs.length === 0) {
            addPragaLog();
        }
    }, [activeTab, pragasLogs.length, addPragaLog]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* CABEÇALHO */}
            <div className="flex items-center gap-4 mb-4">
                <div className="w-1.5 h-12 bg-rose-500 rounded-full"></div>
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight uppercase">
                        Controle Integrado de Pragas
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monitoramento e gestão semanal por setor</p>
                </div>
            </div>

            <div className="space-y-8">
                {pragasLogs.slice(0, 1).map((log: any) => (
                    <div key={log.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden relative">

                        {/* TABELA - ÚNICA PARTE MODIFICADA */}
                        <div className="overflow-x-auto w-full custom-scrollbar pb-2">
                            <table className="w-full text-sm border-collapse min-w-[900px] text-left">
                                <thead className="bg-gray-50 border-b-2 border-gray-200 text-gray-600">
                                    <tr>
                                        {/* Coluna Setor Blindada com Z-30 */}
                                        <th className="p-4 text-[11px] font-black uppercase border-r-2 border-gray-200 sticky left-0 bg-gray-50 z-30 w-48 shadow-[3px_0_10px_-3px_rgba(0,0,0,0.1)]">
                                            Setor
                                        </th>
                                        {colunasPragas.map((col: string) => {
                                            const colUpper = col.toUpperCase();
                                            const isInput = colUpper.includes("ARMADILHA") || colUpper.includes("QUANTIDADE");
                                            return (
                                                <th key={col} className="p-3 border-r border-gray-200 text-center min-w-[110px] relative group bg-gray-50 z-10">
                                                    {!isInput && (
                                                        <button
                                                            onClick={() => removerPraga(col)}
                                                            className="absolute top-1 right-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                                                        >
                                                            <BiTrash size={14} />
                                                        </button>
                                                    )}
                                                    <div className="flex flex-col items-center justify-center gap-0.5 mt-1">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                                            {isInput ? "REGISTRO" : "TIPO"}
                                                        </span>
                                                        <span className="text-[11px] font-black uppercase tracking-tight">{col}</span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {setoresPragas.map((setor: string) => (
                                        <tr key={setor} className="hover:bg-slate-50 transition-colors group">
                                            {/* Célula Setor Blindada com Z-20 e Fundo Branco */}
                                            <td className="p-4 font-bold text-xs text-gray-700 uppercase border-r-2 border-gray-200 sticky left-0 bg-white group-hover:bg-slate-50 z-20 shadow-[3px_0_10px_-3px_rgba(0,0,0,0.1)] whitespace-nowrap">
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="truncate pr-2">{setor}</span>
                                                    <button
                                                        onClick={() => removerSetor(setor)}
                                                        className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <BiTrash size={15} />
                                                    </button>
                                                </div>
                                            </td>

                                            {colunasPragas.map((col: string) => {
                                                const colUpper = col.toUpperCase();
                                                const isArm = colUpper.includes("ARMADILHA");
                                                const isQtde = colUpper.includes("QUANTIDADE");
                                                const rawValue = log.grid[`${setor}_${col}`];

                                                // Lógica ajustada: O padrão é NÃO.
                                                const displayValue = rawValue === 'SIM' ? 'SIM' : 'NÃO';
                                                return (
                                                    <td key={col} className="p-2 border-r border-gray-100 text-center bg-transparent z-0">
                                                        {isQtde ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={rawValue || ""}
                                                                onChange={(e) => updatePragaGrid(log.id, setor, col, e.target.value)}
                                                                className="w-full text-center outline-none py-2 text-xs font-black rounded border border-gray-200 focus:border-red-300 focus:ring-1 focus:ring-red-100 shadow-sm transition-all"
                                                                placeholder="0"
                                                            />
                                                        ) : isArm ? (
                                                            <input
                                                                type="text"
                                                                value={rawValue || ""}
                                                                onChange={(e) => updatePragaGrid(log.id, setor, col, e.target.value.toUpperCase())}
                                                                className="w-full text-center outline-none py-2 text-xs font-black rounded border border-gray-200 focus:border-red-300 focus:ring-1 focus:ring-red-100 shadow-sm transition-all"
                                                                placeholder="Ex: 01"
                                                            />
                                                        ) : (
                                                            <button
                                                                onClick={() => {
                                                                    const novoValor = displayValue === 'NÃO' ? 'SIM' : 'NÃO';
                                                                    updatePragaGrid(log.id, setor, col, novoValor);
                                                                }}
                                                                className={`w-16 h-8 mx-auto rounded-md font-black text-[11px] transition-all border shadow-sm flex items-center justify-center ${displayValue === 'SIM'
                                                                    ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
                                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                                                    }`}
                                                            >
                                                                {displayValue}
                                                            </button>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* FIM DA TABELA */}

                        {/* AÇÃO CORRETIVA + RESPONSÁVEL */}
                        <div className="flex flex-col lg:flex-row gap-6 bg-white border-t border-gray-200 p-6">
                            <div className="flex-2">
                                <label className="text-xs font-black text-rose-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <BiCheckShield size={18} className="text-rose-500" /> Ação Corretiva Geral
                                </label>
                                <textarea
                                    value={log.grid['GERAL_AcaoCorretiva'] || ""}
                                    onChange={(e) => updatePragaGrid(log.id, 'GERAL', 'AcaoCorretiva', e.target.value)}
                                    className="w-full bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all min-h-36 placeholder:text-gray-400 text-rose-900 shadow-inner"
                                    placeholder="Caso haja pragas constatadas (SIM), descreva aqui as ações corretivas tomadas..."
                                />
                            </div>

                            <div className="flex-1 border-2 border-gray-100 rounded-2xl p-6 shadow-sm transition-colors duration-300 bg-gray-50/50">
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-black text-gray-800">Responsável</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Assinatura digital do Monitor </p>
                                </div>
                                <div className="w-full">
                                    <SignatureSelector value={log.monitor} onChange={(v: any) => updatePragaLog(log.id, 'monitor', v)} />
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-200/60 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Data Registro:</span>
                                    {/* 🔥 DATA EDITÁVEL SUBSTITUINDO O TEXTO FIXO */}
                                    <input
                                        type="date"
                                        value={log.data || ""}
                                        onChange={(e) => updatePragaLog(log.id, 'data', e.target.value)}
                                        className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-black text-slate-700 outline-none focus:border-rose-400 transition-all shadow-xs cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* BOTÕES DE GERENCIAMENTO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-5">
                    <h3 className="text-[11px] font-black text-rose-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BiPlus size={18} /> Gerenciar Pragas e Setores
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => {
                                const praga = prompt("Digite o nome da nova praga (Ex: ESCORPIÃO):");
                                if (praga) adicionarPraga(praga);
                            }}
                            className="flex-1 bg-rose-600 text-white px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-md hover:bg-rose-700 active:scale-95 transition-all text-center"
                        >
                            + Adicionar Praga
                        </button>
                        <button
                            onClick={() => {
                                const setor = prompt("Digite o nome do novo setor (Ex: ESCRITÓRIO):");
                                if (setor) adicionarSetor(setor);
                            }}
                            className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-md hover:bg-slate-800 active:scale-95 transition-all text-center"
                        >
                            + Adicionar Setor
                        </button>
                    </div>
                </div>

                <div className="bg-cyan-50/40 border border-cyan-100 rounded-xl p-5">
                    <h3 className="text-[11px] font-black text-cyan-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BiInfoCircle size={18} /> Instruções e Dicas Rápidas
                    </h3>
                    <ul className="text-[11px] text-cyan-700 space-y-2 font-bold list-disc pl-5">
                        <li>Clique nos botões coloridos para alternar entre <span className="text-rose-600 uppercase">NÃO</span> e <span className="text-emerald-600 uppercase">SIM</span>.</li>
                        <li>A <strong>Ação Corretiva</strong> deve detalhar o que foi feito nos setores com problemas.</li>
                        <li>Passe o mouse sobre o nome de um setor ou praga para ver o ícone de <BiTrash className="inline" /> exclusão.</li>
                        <li>Todas as pragas novas começam como <span className="text-rose-600 uppercase">NÃO</span>.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}