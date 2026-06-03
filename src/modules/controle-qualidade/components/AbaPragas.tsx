import { useState, useEffect } from "react";
import { SignatureSelector } from "../../../components/SignatureSelector";
import { PRAGAS_COLUNAS, PRAGAS_SETORES } from "../model/controleQualidadeModel";
import { BiTrash, BiPlus, BiCheckShield, BiInfoCircle } from "react-icons/bi";

export function AbaPragas({ controller }: { controller: any }) {
    const { pragasLogs, addPragaLog, updatePragaLog, updatePragaGrid, activeTab } = controller;

    // Filtra colunas: remove "Outros" e garante que tenhamos as colunas de registro
    const [colunasPragas, setColunasPragas] = useState(() => {
        const base = PRAGAS_COLUNAS.filter((col: string) => col.toUpperCase() !== "OUTROS");
        if (!base.some(c => c.toUpperCase().includes("QUANTIDADE"))) {
            base.push("Quantidade Encontrada");
        }
        return base;
    });

    const [setoresPragas, setSetoresPragas] = useState(PRAGAS_SETORES);

    // Inicia a tabela automaticamente
    useEffect(() => {
        if (activeTab === "pragas" && pragasLogs.length === 0) {
            addPragaLog();
        }
    }, [activeTab, pragasLogs.length, addPragaLog]);

    const handleAddPraga = () => {
        const praga = prompt("Digite o nome da nova praga (Ex: ESCORPIÃO):");
        if (praga && !colunasPragas.some((c: string) => c.toUpperCase() === praga.toUpperCase())) {
            const novasColunas = [...colunasPragas];
            const insertIndex = novasColunas.findIndex((c: string) =>
                c.toUpperCase().includes("ARMADILHA") || c.toUpperCase().includes("QUANTIDADE")
            );
            if (insertIndex !== -1) novasColunas.splice(insertIndex, 0, praga.toUpperCase());
            else novasColunas.push(praga.toUpperCase());
            setColunasPragas(novasColunas);
        }
    };

    const handleAddSetor = () => {
        const setor = prompt("Digite o nome do novo setor (Ex: ESCRITÓRIO):");
        if (setor && !setoresPragas.includes(setor)) setSetoresPragas([...setoresPragas, setor]);
    };

    const handleRemovePraga = (pragaToRemove: string) => {
        if (window.confirm(`Remover "${pragaToRemove}"?`)) setColunasPragas(colunasPragas.filter((p: string) => p !== pragaToRemove));
    };

    const handleRemoveSetor = (setorToRemove: string) => {
        if (window.confirm(`Remover setor "${setorToRemove}"?`)) setSetoresPragas(setoresPragas.filter((s: string) => s !== setorToRemove));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* CABEÇALHO DA TELA */}
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

                        {/* TABELA DE REGISTROS */}
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-sm border-collapse min-w-300">
                                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                    <tr>
                                        <th className="p-4 text-left text-[11px] font-black uppercase border-r border-gray-200 sticky left-0 bg-gray-50 z-60 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Setor</th>
                                        {colunasPragas.map((col: string) => {
                                            const colUpper = col.toUpperCase();
                                            const isInput = colUpper.includes("ARMADILHA") || colUpper.includes("QUANTIDADE");
                                            return (
                                                <th key={col} className="p-3 border-r border-gray-200 text-center min-w-28 relative group">
                                                    {!isInput && (
                                                        <button onClick={() => handleRemovePraga(col)} className="absolute top-1 right-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all z-10"><BiTrash size={14} /></button>
                                                    )}
                                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{isInput ? "REGISTRO" : "TIPO"}</span>
                                                        <span className="text-[11px] font-black uppercase tracking-tight">{col}</span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {setoresPragas.map((setor: string) => (
                                        <tr key={setor} className="hover:bg-rose-50 transition-colors group">
                                            <td className="p-4 font-bold text-xs text-gray-700 uppercase border-r border-gray-200 sticky left-0 bg-white group-hover:bg-rose-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-50 whitespace-nowrap flex items-center justify-between">
                                                <span>{setor}</span>
                                                <button onClick={() => handleRemoveSetor(setor)} className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><BiTrash size={15} /></button>
                                            </td>
                                            {colunasPragas.map(col => {
                                                const colUpper = col.toUpperCase();
                                                const isArm = colUpper.includes("ARMADILHA");
                                                const isQtde = colUpper.includes("QUANTIDADE");
                                                const rawValue = log.grid[`${setor}_${col}`];

                                                // Lógica para garantir apenas SIM ou NÃO nos botões
                                                let displayValue = "SIM";
                                                if (rawValue === 'NC' || rawValue === 'NÃO') displayValue = 'NÃO';

                                                return (
                                                    <td key={col} className="p-2 border-r border-gray-100 text-center">
                                                        {isQtde ? (
                                                            <input type="number" min="0"
                                                                value={rawValue || ""}
                                                                onChange={(e) =>
                                                                    updatePragaGrid(log.id, setor, col, e.target.value)}
                                                                className="w-full text-center outline-none py-2 text-xs font-black rounded-md bg-gray-50 border border-gray-200 focus:bg-white focus:border-rose-400" placeholder="0" />
                                                        ) : isArm ? (
                                                            <input type="text"
                                                                value={rawValue || ""}
                                                                onChange={(e) =>
                                                                    updatePragaGrid(log.id, setor, col, e.target.value.toUpperCase())}
                                                                className="w-full text-center outline-none py-2 text-xs font-black rounded-md bg-gray-50 border border-gray-200 focus:bg-white focus:border-rose-400" placeholder="Ex: 01" />
                                                        ) : (
                                                            <button
                                                                onClick={() => updatePragaGrid(log.id, setor, col, displayValue === 'NÃO' ? 'SIM' : 'NÃO')}
                                                                className={`w-16 h-8 mx-auto rounded-md font-black text-[11px] transition-all border shadow-sm ${displayValue === 'NÃO' ? 'bg-rose-500 text-white border-rose-600 shadow-rose-200' : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'}`}
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

                        {/* BLOCO INFERIOR: AÇÃO CORRETIVA + RESPONSÁVEL (ESTILO MANGA) */}
                        <div className="flex flex-col lg:flex-row gap-6 bg-white border-t border-gray-200 p-6">

                            {/* AÇÃO CORRETIVA - DESTACADO COM VERMELHO CLARINHO */}
                            <div className="flex-2">
                                <label className="text-xs font-black text-rose-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <BiCheckShield size={18} className="text-rose-500" /> Ação Corretiva Geral
                                </label>
                                <textarea
                                    value={log.grid['GERAL_AcaoCorretiva'] || ""}
                                    onChange={(e) => updatePragaGrid(log.id, 'GERAL', 'AcaoCorretiva', e.target.value)}
                                    className="w-full bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all min-h-36 placeholder:text-gray-400 text-rose-900 shadow-inner"
                                    placeholder="Caso haja pragas constatadas (NÃO), descreva aqui as ações corretivas tomadas..."
                                ></textarea>
                            </div>

                            {/* CARD DE RESPONSÁVEL (ESTILO MANGA) */}
                            <div className="flex-1 border-2 border-gray-100 rounded-2xl p-6 shadow-sm transition-colors duration-300 bg-gray-50/50">
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-black text-gray-800">Responsável</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Assinatura digital</p>
                                </div>

                                <div className="w-full">
                                    <SignatureSelector value={log.monitor} onChange={(v: any) => updatePragaLog(log.id, 'monitor', v)} />
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-200/60 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Data Registro:</span>
                                    <span className="text-sm font-black">{new Date().toLocaleDateString('pt-BR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* BOTÕES DE CONFIGURAÇÃO + DICAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-rose-50/40 border border-rose-100 rounded-xl p-5">
                    <h3 className="text-[11px] font-black text-rose-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <BiPlus size={18} /> Gerenciar Pragas e Setores
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handleAddPraga} className="flex-1 bg-[#e11d48] text-white px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-md hover:bg-rose-700 active:scale-95 transition-all text-center">
                            + Adicionar Praga
                        </button>
                        <button onClick={handleAddSetor} className="flex-1 bg-[#1e293b] text-white px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-md hover:bg-slate-800 active:scale-95 transition-all text-center">
                            + Adicionar Setor
                        </button>
                    </div>
                </div>

                <div className="bg-cyan-50/40 border border-cyan-100 rounded-xl p-5">
                    <h3 className="text-[11px] font-black text-cyan-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BiInfoCircle size={18} /> Instruções e Dicas Rápidas
                    </h3>
                    <ul className="text-[11px] text-cyan-700 space-y-2 font-bold list-disc pl-5">
                        <li>Clique nos botões coloridos para alternar entre <span className="text-rose-600 uppercase">Sim</span> e <span className="text-rose-600 uppercase">Não</span>.</li>
                        <li>A <strong>Ação Corretiva</strong> deve detalhar o que foi feito nos setores com problemas.</li>
                        <li>Passe o mouse sobre o nome de um setor ou praga para ver o ícone de <BiTrash className="inline" /> exclusão.</li>
                        <li>Todas as pragas novas começam como &quot;SIM&quot;</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}