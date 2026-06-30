"use client";

import { useState } from "react";
import { BiPlus, BiEdit, BiCheck, BiX, BiUserPlus, BiCalendar, BiInfoCircle, BiSearch } from "react-icons/bi";

interface AbaTesourasProps {
    tesourasLogs: any[];
    colaboradoresAtivos: any[];
    colaboradoresCompletos?: any[];
    dataInicio: string;
    dataFim: string;
    frequenciaTesoura: string;
    updateTesoura: (id: string, field: string, value: any) => void;
    toggleDiaTesoura: (id: string, dia: string, tipo: 'e' | 'd') => void;
    removeTesouraRow: (id: string) => void;
    setDataInicio: (val: string) => void;
    setDataFim: (val: string) => void;
    adicionarColaborador: (nome: string, tipo: "EFETIVO" | "CONTRATADO", numero: string) => Promise<void>;
    reativarColaborador: (id: string, tipo: "EFETIVO" | "CONTRATADO", numero: string) => Promise<void>;
    recarregarColaboradores?: () => Promise<void>;
}

const DIAS_SEMANA = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

export function AbaTesouras({
    tesourasLogs,
    colaboradoresAtivos,
    colaboradoresCompletos: colaboradoresCompletosProp,
    dataInicio,
    dataFim,
    frequenciaTesoura,
    updateTesoura,
    toggleDiaTesoura,
    setDataInicio,
    setDataFim,
    adicionarColaborador,
    reativarColaborador,
    recarregarColaboradores,
}: AbaTesourasProps) {

    const colaboradoresCompletos = colaboradoresCompletosProp || [];

    const [idEditandoTesoura, setIdEditandoTesoura] = useState<string | null>(null);
    const [novoNumeroTemp, setNovoNumeroTemp] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [colabParaReativar, setColabParaReativar] = useState<any>(null);

    const [novoColabNome, setNovoColabNome] = useState("");
    const [novoColabTipo, setNovoColabTipo] = useState<"EFETIVO" | "CONTRATADO">("CONTRATADO");
    const [novoColabNum, setNovoColabNum] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [busca, setBusca] = useState("");

    const iniciarTroca = (id: string, numeroAtual: string) => {
        setIdEditandoTesoura(id);
        setNovoNumeroTemp(numeroAtual);
    };

    const salvarTroca = (id: string) => {
        const tesouraOcupada = colaboradoresAtivos.find(c => c.numeroTesoura === novoNumeroTemp && c.tipo !== 'DESLIGADO' && c.tipo !== 'DESLIGADA' && c.id !== id);
        if (tesouraOcupada) {
            alert(`A tesoura ${novoNumeroTemp} já está com ${tesouraOcupada.nome}!`);
            return;
        }
        updateTesoura(id, "numeroTesoura", novoNumeroTemp);
        setIdEditandoTesoura(null);
    };

    const cancelarTroca = () => {
        setIdEditandoTesoura(null);
        setNovoNumeroTemp("");
    };

    const resetModal = () => {
        setNovoColabNome("");
        setNovoColabNum("");
        setNovoColabTipo("CONTRATADO");
        setErrorMsg("");
        setColabParaReativar(null);
    };

    const handleSalvarColaborador = async () => {
        setErrorMsg("");

        if (!novoColabNome.trim()) {
            setErrorMsg("Por favor, preencha o nome completo.");
            return;
        }
        if (!novoColabNum.trim()) {
            setErrorMsg("Por favor, preencha o número da tesoura.");
            return;
        }
        if (isNaN(Number(novoColabNum))) {
            setErrorMsg("Número da tesoura deve conter apenas dígitos.");
            return;
        }

        const nomeUpper = novoColabNome.trim().toUpperCase();
        const numero = novoColabNum.trim();

        // 1. Verificar conflito de tesoura (apenas ativos)
        const ativos = colaboradoresCompletos.filter(c => c.tipo === 'EFETIVO' || c.tipo === 'CONTRATADO');
        const tesouraEmUso = ativos.find(c => c.numeroTesoura === numero);
        if (tesouraEmUso) {
            setErrorMsg(`O número ${numero} já pertence a ${tesouraEmUso.nome} (${tesouraEmUso.tipo}).`);
            return;
        }

        // 2. Verificar duplicidade de nome
        const colaboradorExistente = colaboradoresCompletos.find(c => c.nome?.trim().toUpperCase() === nomeUpper);
        if (colaboradorExistente) {
            const tipoAtual = colaboradorExistente.tipo?.toUpperCase();
            if (tipoAtual === 'DESLIGADO' || tipoAtual === 'DESLIGADA') {
                // 🔥 Abre a tela de reativação
                setColabParaReativar(colaboradorExistente);
                return;
            } else {
                setErrorMsg(`O nome "${nomeUpper}" já está cadastrado como ${colaboradorExistente.tipo}.`);
                return;
            }
        }

        // 3. Cadastrar novo colaborador
        try {
            await adicionarColaborador(nomeUpper, novoColabTipo, numero);
            resetModal();
            setIsModalOpen(false);
        } catch (error: any) {
            if (error.message?.includes('já existe') || error.message?.includes('duplicate')) {
                setErrorMsg("Este colaborador já está cadastrado no sistema. Tente reativar em vez de criar.");
            } else {
                setErrorMsg(error.message || "Erro de conexão com o servidor. Tente novamente.");
            }
        }
    };

    const handleConfirmarReativacao = async () => {
        try {
            await reativarColaborador(colabParaReativar.id, novoColabTipo, novoColabNum.trim());
            alert("Colaboradora reativada com sucesso!");
            resetModal();
            setIsModalOpen(false);
            await recarregarColaboradores?.();
        } catch (error: any) {
            const msg = error?.message || "Erro ao reativar. Tente novamente.";
            setErrorMsg(msg);
            console.error("Erro na reativação:", error);
        }
    };

    const logsFiltradosEOrdenados = tesourasLogs
        .filter(log => log.funcionario.toLowerCase().includes(busca.toLowerCase()))
        .sort((a, b) => {
            const ordemTipo: Record<string, number> = { 'EFETIVO': 1, 'CONTRATADO': 2, 'DESLIGADO': 3, 'DESLIGADA': 3 };
            const pesoA = ordemTipo[a.tipo] || 4;
            const pesoB = ordemTipo[b.tipo] || 4;
            if (pesoA !== pesoB) return pesoA - pesoB;
            return a.funcionario.localeCompare(b.funcionario);
        });

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* MODAL (mesmo conteúdo) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 animate-fade-in">
                        {colabParaReativar ? (
                            // tela de reativação
                            <div className="space-y-4 text-center py-2">
                                <div className="bg-amber-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-2">
                                    <BiInfoCircle size={36} className="text-amber-600" />
                                </div>
                                <h4 className="text-xl font-black text-slate-800">Colaboradora Encontrada!</h4>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed px-2">
                                    A colaboradora <span className="font-black text-rose-600 uppercase">{colabParaReativar.nome}</span> já existe no sistema, mas está <strong>DESLIGADA</strong>.
                                </p>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 my-4">
                                    <p className="text-xs text-slate-500 mb-1">Deseja reativá-la com os novos dados?</p>
                                    <p className="text-sm font-bold text-slate-700">Contrato: <span className="text-emerald-600">{novoColabTipo}</span></p>
                                    <p className="text-sm font-bold text-slate-700">Tesoura: <span className="text-blue-600 text-lg">{novoColabNum}</span></p>
                                </div>
                                {errorMsg && <p className="text-sm text-red-600 font-bold">{errorMsg}</p>}
                                <div className="flex justify-center gap-3 mt-6">
                                    <button onClick={() => setColabParaReativar(null)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Voltar e Editar</button>
                                    <button onClick={handleConfirmarReativacao} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95">Reativar Agora</button>
                                </div>
                            </div>
                        ) : (
                            // tela de cadastro
                            <>
                                <div className="flex justify-between items-center mb-6 border-b pb-3">
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                        <BiUserPlus size={24} className="text-rose-600" /> Nova Colaboradora
                                    </h3>
                                    <button onClick={() => { resetModal(); setIsModalOpen(false); }} className="text-gray-400 hover:text-red-600 transition-colors"><BiX size={28} /></button>
                                </div>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                                        <input type="text" value={novoColabNome} onChange={e => setNovoColabNome(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-rose-500 uppercase transition-colors" placeholder="EX: MARIA DA SILVA" autoFocus />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Contrato</label>
                                            <select value={novoColabTipo} onChange={e => setNovoColabTipo(e.target.value as "EFETIVO" | "CONTRATADO")} className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 font-bold text-slate-800 bg-white outline-none focus:border-rose-500 cursor-pointer transition-colors">
                                                <option value="CONTRATADO">Contratada</option>
                                                <option value="EFETIVO">Efetiva</option>
                                            </select>
                                        </div>
                                        <div className="w-1/3">
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Nº Tesoura</label>
                                            <input type="text" value={novoColabNum} onChange={e => setNovoColabNum(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 font-black text-center text-blue-700 placeholder-blue-300 outline-none focus:border-blue-500 transition-colors" placeholder="00" />
                                        </div>
                                    </div>
                                    {errorMsg && (
                                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                                            <BiX size={20} className="text-red-500 shrink-0" />
                                            <span className="font-medium">{errorMsg}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-3 mt-8">
                                    <button onClick={() => { resetModal(); setIsModalOpen(false); }} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                                    <button onClick={handleSalvarColaborador} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95">Cadastrar</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* CABEÇALHO E BARRA DE PERÍODO */}
            <div className="bg-slate-50 border-l-4 border-rose-600 rounded-r-lg p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="font-black text-slate-800 text-lg uppercase">Controle de Tesouras</h3>
                    <p className="text-slate-500 text-sm font-medium">Gestão de equipamentos e colaboradoras.</p>
                </div>
                <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg font-black text-xs uppercase flex items-center gap-2 shadow-md transition-colors whitespace-nowrap">
                    <BiPlus size={18} /> Nova Colaboradora
                </button>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-100 text-rose-600 p-2 rounded-lg"><BiCalendar size={20} /></div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Período:</label>
                            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="border-2 border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-rose-400 transition-colors" />
                            <span className="text-xs font-black text-slate-400">ATÉ</span>
                            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="border-2 border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 outline-none focus:border-rose-400 transition-colors" />
                        </div>
                    </div>
                    <div className="hidden md:block w-px h-8 bg-slate-200"></div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-black text-slate-800 uppercase tracking-wider">Frequência:</label>
                        <input type="text" value={frequenciaTesoura} readOnly className="border-2 border-slate-200 bg-slate-50 rounded-lg p-2 text-xs font-bold text-slate-800 text-center w-24 outline-none cursor-not-allowed" />
                    </div>
                </div>
                <div className="border-t border-slate-100 pt-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs w-full">
                    <div className="flex items-center gap-2 text-slate-500 italic font-medium">
                        <BiInfoCircle size={16} className="text-slate-400" />
                        <span>*Entrega no turno da manhã e recolhe no final do expediente.</span>
                    </div>
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border-2 border-slate-100 shadow-sm ml-auto">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Legenda:</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-black">E</span> Entrega
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                            <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-black">D</span> Devolução
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-end">
                    <div className="relative w-full md:w-80">
                        <BiSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar colaboradora..." className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 outline-none focus:border-rose-400 transition-colors shadow-sm uppercase" />
                    </div>
                </div>
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <table className="w-full text-sm min-w-[750px]">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 text-left min-w-[200px]">Nome da Colaboradora</th>
                                    <th className="p-4 text-center w-40">Contrato</th>
                                    <th className="p-4 text-center min-w-[150px]">Nº Tesoura</th>
                                    {DIAS_SEMANA.map(dia => <th key={dia} className="p-4 text-center">{dia}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logsFiltradosEOrdenados.map((log) => {
                                    const isEditing = idEditandoTesoura === log.id;
                                    const isDesligado = log.tipo === 'DESLIGADO' || log.tipo === 'DESLIGADA';

                                    return (
                                        <tr key={log.id} className={`transition-colors ${isDesligado ? 'bg-slate-50 opacity-60 grayscale-[50%]' : 'hover:bg-slate-50'}`}>
                                            <td className="p-3">
                                                <input type="text" value={log.funcionario} onChange={(e) => updateTesoura(log.id, "funcionario", e.target.value.toUpperCase())} className={`w-full bg-transparent border-b-2 border-transparent focus:border-slate-300 rounded-none p-1 font-bold outline-none transition-colors ${isDesligado ? 'text-slate-500 line-through' : 'text-slate-800'}`} placeholder="Nome..." />
                                            </td>
                                            <td className="p-3">
                                                <select
                                                    value={log.tipo}
                                                    onChange={async (e) => {
                                                        await updateTesoura(log.id, "tipo", e.target.value);
                                                        await recarregarColaboradores?.();
                                                    }}
                                                    className={`w-full p-2 rounded-lg text-[10px] font-black uppercase outline-none border-2 cursor-pointer transition-colors
                                                        ${log.tipo === 'EFETIVO' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                                            log.tipo === 'CONTRATADO' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                                                'bg-slate-200 border-slate-300 text-slate-600'}`}
                                                >
                                                    <option value="CONTRATADO">Contratada</option>
                                                    <option value="EFETIVO">Efetiva</option>
                                                    <option value="DESLIGADA">Desligada</option>
                                                    {log.tipo === 'DESLIGADO' && <option value="DESLIGADO">Desligado</option>}
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-2 bg-blue-50 py-1.5 px-3 rounded-lg border border-blue-200 animate-fade-in shadow-inner w-fit mx-auto">
                                                        <input type="text" value={novoNumeroTemp} onChange={(e) => setNovoNumeroTemp(e.target.value)} className="w-12 text-center font-black text-blue-700 p-1 rounded border border-blue-300 outline-none focus:ring-2 focus:ring-blue-400" placeholder="Nº" autoFocus />
                                                        <div className="flex gap-1 ml-2 border-l border-blue-200 pl-2">
                                                            <button onClick={cancelarTroca} className="p-1 text-slate-400 hover:text-red-500 bg-white rounded shadow-sm transition-colors"><BiX size={16} /></button>
                                                            <button onClick={() => salvarTroca(log.id)} className="p-1 text-emerald-600 hover:text-emerald-800 bg-white rounded shadow-sm transition-colors"><BiCheck size={16} /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className={`font-black text-lg w-10 text-center ${isDesligado ? 'text-slate-400' : 'text-slate-700'}`}>{log.numeroTesoura}</div>
                                                        <button onClick={() => iniciarTroca(log.id, log.numeroTesoura)} className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 p-1.5 rounded-md"><BiEdit size={16} /></button>
                                                    </div>
                                                )}
                                            </td>
                                            {DIAS_SEMANA.map(dia => (
                                                <td key={dia} className="p-3 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        <button disabled={isDesligado} onClick={() => toggleDiaTesoura(log.id, dia, 'e')} className={`w-7 h-7 rounded-md text-[9px] font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed ${log.dias[dia].e ? 'bg-emerald-600 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>E</button>
                                                        <button disabled={isDesligado} onClick={() => toggleDiaTesoura(log.id, dia, 'd')} className={`w-7 h-7 rounded-md text-[9px] font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed ${log.dias[dia].d ? 'bg-blue-600 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>D</button>
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}