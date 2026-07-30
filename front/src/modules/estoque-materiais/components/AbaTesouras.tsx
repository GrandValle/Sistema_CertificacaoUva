"use client";

import { useState, useEffect } from "react";
import {
    BiPlus, BiEdit, BiX, BiUserPlus,
    BiCalendar, BiInfoCircle, BiSearch, BiError, BiTrash,
    BiNote, BiChevronDown, BiChevronUp, BiShow, BiHide // 🔥 Adicionados BiShow e BiHide
} from "react-icons/bi";

interface AbaTesourasProps {
    tesourasLogs: any[];
    colaboradoresAtivos: any[];
    colaboradoresCompletos?: any[];
    dataInicio: string;
    dataFim: string;
    frequenciaTesoura: string;
    updateTesoura: (id: string, field: string, value: any) => void;
    toggleDiaTesoura: (id: string, dia: string, tipo: 'e' | 'd') => void;
    toggleVisibilidade: (id: string) => void; // 🔥 Recebendo função de visibilidade
    removeTesouraRow?: (id: string) => void;
    setDataInicio: (val: string) => void;
    setDataFim: (val: string) => void;
    adicionarColaborador: (nome: string, tipo: "EFETIVO" | "CONTRATADO", numero: string) => Promise<void>;
    reativarColaborador: (id: string, tipo: "EFETIVO" | "CONTRATADO", numero: string) => Promise<void>;
    recarregarColaboradores?: (force?: boolean) => Promise<void>;
    statusMap: Record<string, { status: string; obsList: { idObs: string, tipo: string, texto: string }[] }>;
    handleUpdateStatusDropdown: (id: string, novoStatus: string) => void;
    handleUpdateObsText: (idUser: string, idObs: string, novoTexto: string) => void;
    handleDeleteObs: (idUser: string, idObs: string) => void;
    observacaoGeral?: string;
    setObservacaoGeral?: (val: string) => void;
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
    toggleVisibilidade, // 🔥
    setDataInicio,
    setDataFim,
    adicionarColaborador,
    reativarColaborador,
    recarregarColaboradores,
    statusMap,
    handleUpdateStatusDropdown,
    handleUpdateObsText,
    handleDeleteObs,
    observacaoGeral = "",
    setObservacaoGeral
}: AbaTesourasProps) {

    const colaboradoresCompletos = colaboradoresCompletosProp || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [colabParaReativar, setColabParaReativar] = useState<any>(null);
    const [novoColabNome, setNovoColabNome] = useState("");
    const [novoColabTipo, setNovoColabTipo] = useState<"EFETIVO" | "CONTRATADO">("CONTRATADO");
    const [novoColabNum, setNovoColabNum] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [busca, setBusca] = useState("");

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [dadosEdicao, setDadosEdicao] = useState({ id: "", nome: "", tipo: "CONTRATADO", numeroTesoura: "", statusTesoura: "EM_USO" });

    const [showObsGeral, setShowObsGeral] = useState(false);
    const [obsGeralLocal, setObsGeralLocal] = useState(observacaoGeral);

    useEffect(() => {
        setObsGeralLocal(observacaoGeral);
    }, [observacaoGeral]);

    const toggleObsGeral = () => setShowObsGeral(!showObsGeral);
    const handleObsGeralChange = (value: string) => {
        setObsGeralLocal(value);
        if (setObservacaoGeral) setObservacaoGeral(value);
    };
    const handleLimparObsGeral = () => {
        setObsGeralLocal("");
        if (setObservacaoGeral) setObservacaoGeral("");
    };

    const abrirModalEdicao = (log: any) => {
        setDadosEdicao({
            id: log.id,
            nome: log.funcionario,
            tipo: log.tipo,
            numeroTesoura: log.numeroTesoura || '',
            statusTesoura: log.statusTesoura || 'EM_USO'
        });
        setIsEditModalOpen(true);
    };

    const fecharModalEdicao = () => {
        setIsEditModalOpen(false);
        setDadosEdicao({ id: "", nome: "", tipo: "CONTRATADO", numeroTesoura: "", statusTesoura: "EM_USO" });
    };

    const salvarEdicaoCompleta = async () => {
        if (!dadosEdicao.nome.trim()) { alert("O nome não pode ficar vazio."); return; }

        const isDesligado = dadosEdicao.tipo === 'DESLIGADO' || dadosEdicao.tipo === 'DESLIGADA';
        const isDevolvida = dadosEdicao.statusTesoura === 'DEVOLVIDA';

        try {
            const logOriginal = tesourasLogs.find(l => l.id === dadosEdicao.id);
            if (!logOriginal) return;

            if (logOriginal.funcionario !== dadosEdicao.nome.toUpperCase()) {
                await updateTesoura(dadosEdicao.id, "funcionario", dadosEdicao.nome.toUpperCase());
            }

            if (logOriginal.tipo !== dadosEdicao.tipo) {
                await updateTesoura(dadosEdicao.id, "tipo", dadosEdicao.tipo);
            }

            if (isDesligado) {
                if (logOriginal.statusTesoura !== 'DEVOLVIDA') {
                    await updateTesoura(dadosEdicao.id, "statusTesoura", "DEVOLVIDA");
                }
            } else if (isDevolvida) {
                if (logOriginal.statusTesoura !== 'DEVOLVIDA') {
                    await updateTesoura(dadosEdicao.id, "statusTesoura", "DEVOLVIDA");
                }
            } else {
                const numero = dadosEdicao.numeroTesoura.trim();
                if (!numero) {
                    alert("O número da tesoura é obrigatório para colaboradores ativos.");
                    return;
                }
                const tesouraOcupada = colaboradoresAtivos.find(c =>
                    c.numeroTesoura === numero &&
                    c.id !== dadosEdicao.id &&
                    c.statusTesoura !== 'DEVOLVIDA'
                );
                if (tesouraOcupada) {
                    alert(`A tesoura ${numero} já está com ${tesouraOcupada.nome}!`);
                    return;
                }
                await updateTesoura(dadosEdicao.id, "numeroTesoura", numero);
                if (logOriginal.statusTesoura !== 'EM_USO') {
                    await updateTesoura(dadosEdicao.id, "statusTesoura", "EM_USO");
                }
            }

            await recarregarColaboradores?.();
            fecharModalEdicao();
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar edições.");
        }
    };

    const resetModal = () => {
        setNovoColabNome(""); setNovoColabNum(""); setNovoColabTipo("CONTRATADO");
        setErrorMsg(""); setColabParaReativar(null);
    };

    const handleSalvarColaborador = async () => {
        setErrorMsg("");
        if (!novoColabNome.trim()) { setErrorMsg("Por favor, preencha o nome completo."); return; }
        if (!novoColabNum.trim()) { setErrorMsg("Por favor, preencha o número da tesoura."); return; }
        if (isNaN(Number(novoColabNum))) { setErrorMsg("Número da tesoura deve conter apenas dígitos."); return; }

        const nomeUpper = novoColabNome.trim().toUpperCase();
        const numero = novoColabNum.trim();
        const ativos = colaboradoresCompletos.filter(c => c.tipo === 'EFETIVO' || c.tipo === 'CONTRATADO');

        const tesouraEmUso = ativos.find(c => c.numeroTesoura === numero && c.statusTesoura !== 'DEVOLVIDA');
        if (tesouraEmUso) { setErrorMsg(`O número ${numero} já pertence a ${tesouraEmUso.nome} (${tesouraEmUso.tipo}).`); return; }

        const colaboradorExistente = colaboradoresCompletos.find(c => c.nome?.trim().toUpperCase() === nomeUpper);
        if (colaboradorExistente) {
            const tipoAtual = colaboradorExistente.tipo?.toUpperCase();
            if (tipoAtual === 'DESLIGADO' || tipoAtual === 'DESLIGADA') {
                setColabParaReativar(colaboradorExistente);
                return;
            } else {
                setErrorMsg(`O nome "${nomeUpper}" já está cadastrado como ${colaboradorExistente.tipo}.`);
                return;
            }
        }

        try {
            await adicionarColaborador(nomeUpper, novoColabTipo, numero);
            resetModal(); setIsModalOpen(false);
        } catch (error: any) {
            setErrorMsg(error.message?.includes('já existe') ? "Este colaborador já está cadastrado. Tente reativar." : "Erro de conexão. Tente novamente.");
        }
    };

    const handleConfirmarReativacao = async () => {
        try {
            await reativarColaborador(colabParaReativar.id, novoColabTipo, novoColabNum.trim());
            alert("Colaboradora reativada com sucesso!");
            resetModal(); setIsModalOpen(false);
            await recarregarColaboradores?.();
        } catch (error: any) { setErrorMsg(error?.message || "Erro ao reativar. Tente novamente."); }
    };

    const logsFiltradosEOrdenados = tesourasLogs.filter(log =>
        log?.funcionario?.toLowerCase().includes(busca.toLowerCase())
    );

    const observacoesGerais = logsFiltradosEOrdenados.flatMap(log => {
        const current = statusMap?.[log.id];
        if (!current || !current.obsList || !Array.isArray(current.obsList) || current.obsList.length === 0) return [];
        return current.obsList.map(obs => ({
            idUser: log.id,
            idObs: obs.idObs || Math.random().toString(),
            nome: log.funcionario || "",
            tipo: obs.tipo || "",
            texto: obs.texto || ""
        }));
    });

    return (
        <div className="space-y-6 animate-fade-in relative">

            {/* MODAL DE EDIÇÃO */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 animate-fade-in">
                        <div className="flex justify-between items-center mb-6 border-b pb-3">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <BiEdit size={24} className="text-blue-600" /> Editar Colaboradora
                            </h3>
                            <button onClick={fecharModalEdicao} className="text-gray-400 hover:text-red-600 transition-colors">
                                <BiX size={28} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={dadosEdicao.nome}
                                    onChange={(e) => setDadosEdicao({ ...dadosEdicao, nome: e.target.value.toUpperCase() })}
                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-blue-500 uppercase transition-colors"
                                />
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Contrato</label>
                                    <select
                                        value={dadosEdicao.tipo}
                                        onChange={(e) => {
                                            const novoTipo = e.target.value as any;
                                            if (novoTipo === 'DESLIGADO' || novoTipo === 'DESLIGADA') {
                                                setDadosEdicao({ ...dadosEdicao, tipo: novoTipo, statusTesoura: 'DEVOLVIDA' });
                                            } else {
                                                setDadosEdicao({ ...dadosEdicao, tipo: novoTipo });
                                            }
                                        }}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer transition-colors"
                                    >
                                        <option value="CONTRATADO">Contratada</option>
                                        <option value="EFETIVO">Efetiva</option>
                                        <option value="DESLIGADA">Desligada</option>
                                        {dadosEdicao.tipo === 'DESLIGADO' && <option value="DESLIGADO">Desligado</option>}
                                    </select>
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nº Tesoura</label>
                                    <input
                                        type="text"
                                        value={dadosEdicao.tipo === 'DESLIGADO' || dadosEdicao.tipo === 'DESLIGADA' || dadosEdicao.statusTesoura === 'DEVOLVIDA' ? '' : dadosEdicao.numeroTesoura}
                                        disabled={dadosEdicao.tipo === 'DESLIGADO' || dadosEdicao.tipo === 'DESLIGADA' || dadosEdicao.statusTesoura === 'DEVOLVIDA'}
                                        onChange={(e) => setDadosEdicao({ ...dadosEdicao, numeroTesoura: e.target.value, statusTesoura: 'EM_USO' })}
                                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 font-black text-center text-blue-700 outline-none focus:border-blue-500 transition-colors disabled:bg-slate-100 disabled:text-slate-500 disabled:text-xs uppercase"
                                        placeholder="00"
                                    />
                                </div>
                            </div>

                            {dadosEdicao.tipo !== 'DESLIGADO' && dadosEdicao.tipo !== 'DESLIGADA' && (
                                dadosEdicao.statusTesoura !== 'DEVOLVIDA' ? (
                                    <button type="button" onClick={() => setDadosEdicao({ ...dadosEdicao, statusTesoura: 'DEVOLVIDA' })} className="w-full text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 py-2.5 rounded-lg transition-colors uppercase border border-amber-200 tracking-wider flex items-center justify-center gap-2">
                                        Marcar Tesoura como Devolvida
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => setDadosEdicao({ ...dadosEdicao, statusTesoura: 'EM_USO', numeroTesoura: '' })} className="w-full text-xs font-black text-blue-700 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-lg transition-colors uppercase border border-blue-200 tracking-wider flex items-center justify-center gap-2">
                                        Atribuir Nova Tesoura
                                    </button>
                                )
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={fecharModalEdicao} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancelar</button>
                            <button onClick={salvarEdicaoCompleta} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-all active:scale-95">Salvar Tudo</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE CADASTRO / REATIVAÇÃO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 animate-fade-in">
                        {colabParaReativar ? (
                            <div className="space-y-4 text-center py-2">
                                <div className="bg-amber-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-2"><BiInfoCircle size={36} className="text-amber-600" /></div>
                                <h4 className="text-xl font-black text-slate-800">Colaboradora Encontrada!</h4>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed px-2">A colaboradora <span className="font-black text-rose-600 uppercase">{colabParaReativar.nome}</span> já existe no sistema, mas está <strong>DESLIGADA</strong>.</p>
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
                            <>
                                <div className="flex justify-between items-center mb-6 border-b pb-3">
                                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><BiUserPlus size={24} className="text-rose-600" /> Nova Colaboradora</h3>
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
                                            <BiX size={20} className="text-red-500 shrink-0" /><span className="font-medium">{errorMsg}</span>
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

            {/* CABEÇALHO */}
            <div className="bg-slate-50 border-l-4 border-rose-600 rounded-r-lg p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="font-black text-slate-800 text-lg uppercase">Controle de Tesouras</h3>
                    <p className="text-slate-500 text-sm font-medium">Gestão de equipamentos e colaboradoras.</p>
                </div>
                <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg font-black text-xs uppercase flex items-center gap-2 shadow-md transition-colors whitespace-nowrap">
                    <BiPlus size={18} /> Nova Colaboradora
                </button>
            </div>

            {/* FILTROS */}
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
                    <div className="flex items-center gap-2 text-slate-500 italic font-medium"><BiInfoCircle size={16} className="text-slate-400" /><span>*Entrega no turno da manhã e recolhe no final do expediente.</span></div>
                    <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-2 rounded-lg border-2 border-slate-100 shadow-sm ml-auto">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Legenda:</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700"><span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-black">E</span> Entrega</div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700"><span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-black">D</span> Devolução</div>
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700 ml-2 border-l border-slate-200 pl-3"><span className="bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-black">F</span> Falta</div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-end gap-3 flex-wrap">
                    <div className="relative w-full md:w-80">
                        <BiSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar colaboradora..." className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder-slate-400 outline-none focus:border-rose-400 transition-colors shadow-sm uppercase" />
                    </div>
                    <button onClick={toggleObsGeral} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs md:text-sm uppercase transition-all shadow-md active:scale-95 ${showObsGeral ? 'bg-indigo-700 hover:bg-indigo-800 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                        <BiNote size={18} /> Observações Gerais
                        {observacaoGeral && observacaoGeral.trim() !== "" && <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>}
                        {showObsGeral ? <BiChevronUp size={18} /> : <BiChevronDown size={18} />}
                    </button>
                </div>

                {/* TABELA PRINCIPAL */}
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <table className="w-full text-sm min-w-[850px]">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 text-left min-w-[160px]">Nome da Colaboradora</th>
                                    <th className="p-3 text-center w-36">Contrato</th>
                                    <th className="p-3 text-center min-w-[80px]">Nº Tesoura</th>
                                    <th className="p-3 text-center min-w-[100px]">Situação</th>
                                    {DIAS_SEMANA.map(dia => <th key={dia} className="p-3 text-center w-20">{dia}</th>)}
                                    <th className="p-3 text-center w-24">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logsFiltradosEOrdenados.map((log) => {
                                    const isDesligado = log.tipo === 'DESLIGADO' || log.tipo === 'DESLIGADA';
                                    const currentStatus = statusMap[log.id]?.status || 'NORMAL';
                                    const isDevolvida = log.statusTesoura === 'DEVOLVIDA';
                                    const isInvisivel = log.visivel === false; // 🔥 Verificação de visibilidade

                                    const corLinha = currentStatus === 'FERIAS' ? 'bg-blue-50' :
                                        currentStatus === 'LICENCA' ? 'bg-amber-50' :
                                            currentStatus === 'AFASTADO' ? 'bg-slate-100' :
                                                currentStatus === 'CAMPO' ? 'bg-purple-50' : '';

                                    return (
                                        <tr key={log.id} className={`transition-colors ${isDesligado ? 'bg-slate-50 opacity-60 grayscale-[50%]' : isInvisivel ? 'bg-slate-100 opacity-40 grayscale' : `${corLinha} hover:bg-slate-50`}`}>
                                            <td className="p-3">
                                                <span className={`font-bold flex-1 ${isDesligado || isInvisivel ? 'text-slate-500' : 'text-slate-800'} ${isDesligado ? 'line-through' : ''} flex items-center gap-2 flex-wrap`}>
                                                    {log.funcionario}
                                                    {currentStatus !== 'NORMAL' && !isDesligado && (
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase
                                                            ${currentStatus === 'FERIAS' ? 'bg-blue-200 text-blue-800' :
                                                                currentStatus === 'LICENCA' ? 'bg-amber-200 text-amber-800' :
                                                                    currentStatus === 'AFASTADO' ? 'bg-slate-300 text-slate-700' :
                                                                        currentStatus === 'CAMPO' ? 'bg-purple-200 text-purple-800' :
                                                                            'bg-zinc-200 text-zinc-800'}`}
                                                        >
                                                            {currentStatus}
                                                        </span>
                                                    )}
                                                </span>
                                            </td>

                                            <td className="p-3 text-center">
                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 inline-block w-full text-center
                                                    ${log.tipo === 'EFETIVO' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                                        log.tipo === 'CONTRATADO' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                                            'bg-slate-200 border-slate-300 text-slate-600'}`}
                                                >
                                                    {log.tipo === 'EFETIVO' ? 'Efetiva' : log.tipo === 'CONTRATADO' ? 'Contratada' : 'Desligada'}
                                                </span>
                                            </td>

                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center">
                                                    {isDesligado || isDevolvida ? (
                                                        <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">
                                                            Devolvida
                                                        </span>
                                                    ) : (
                                                        <div className={`font-black text-lg w-8 text-center text-slate-700`}>
                                                            {log.numeroTesoura}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="p-3">
                                                <select
                                                    value={currentStatus}
                                                    onChange={async (e) => await handleUpdateStatusDropdown(log.id, e.target.value)}
                                                    disabled={isDesligado || isInvisivel}
                                                    className={`w-full p-1.5 rounded-md text-[10px] font-bold uppercase outline-none border cursor-pointer transition-colors disabled:opacity-50
                                                        ${currentStatus === 'NORMAL' || currentStatus === 'OUTROS' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-orange-100 border-orange-300 text-orange-800'}`}
                                                >
                                                    <option value="NORMAL">Normal</option>
                                                    <option value="CAMPO">Campo</option>
                                                    <option value="FERIAS">Férias</option>
                                                    <option value="LICENCA">Licença</option>
                                                    <option value="AFASTADO">Afastado</option>
                                                    <option value="OUTROS">Outros</option>
                                                </select>
                                            </td>

                                            {/* DIAS DA SEMANA */}
                                            {DIAS_SEMANA.map(dia => {
                                                const diaInfo = log.dias[dia] || { e: false, d: false, f: false };
                                                const isFalta = diaInfo.f;

                                                return (
                                                    <td key={dia} className="p-2 text-center">
                                                        <div className="flex justify-center gap-1">
                                                            <button
                                                                disabled={isDesligado || isInvisivel || (currentStatus !== 'NORMAL' && currentStatus !== 'OUTROS')}
                                                                onClick={() => toggleDiaTesoura(log.id, dia, 'e')}
                                                                className={`w-7 h-7 rounded-md text-[9px] font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                                                    ${isFalta ? 'bg-rose-600 text-white shadow-inner' : diaInfo.e ? 'bg-emerald-600 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                                title="Clique: Entrega (ciclo E -> F -> limpa)"
                                                            >
                                                                {isFalta ? 'F' : 'E'}
                                                            </button>
                                                            <button
                                                                disabled={isDesligado || isInvisivel || (currentStatus !== 'NORMAL' && currentStatus !== 'OUTROS')}
                                                                onClick={() => toggleDiaTesoura(log.id, dia, 'd')}
                                                                className={`w-7 h-7 rounded-md text-[9px] font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                                                    ${isFalta ? 'bg-rose-600 text-white shadow-inner' : diaInfo.d ? 'bg-blue-600 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                                title="Clique: Devolução (ciclo D -> F -> limpa)"
                                                            >
                                                                {isFalta ? 'F' : 'D'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                );
                                            })}

                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* 🔥 BOTÃO DO OLHINHO */}
                                                    <button
                                                        onClick={() => toggleVisibilidade(log.id)}
                                                        className={`p-2 rounded-lg shrink-0 shadow-sm transition-colors ${isInvisivel ? 'text-slate-400 bg-slate-200 hover:bg-slate-300' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}
                                                        title={isInvisivel ? "Mostrar no Relatório" : "Ocultar do Relatório de Hoje"}
                                                    >
                                                        {isInvisivel ? <BiHide size={18} /> : <BiShow size={18} />}
                                                    </button>

                                                    <button onClick={() => abrirModalEdicao(log)} className="text-slate-400 hover:text-blue-600 transition-colors bg-slate-100 hover:bg-blue-50 p-2 rounded-lg shrink-0 shadow-sm" title="Editar Dados da Colaboradora">
                                                        <BiEdit size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* OBSERVAÇÕES GERAIS */}
                {showObsGeral && (
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 md:p-6 shadow-sm animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-indigo-800 text-base md:text-lg uppercase tracking-tight flex items-center gap-2">
                                <BiNote size={20} className="md:text-2xl" /> Observações Gerais da Semana
                            </h3>
                            <div className="flex items-center gap-2">
                                {obsGeralLocal && obsGeralLocal.trim() !== "" && (
                                    <button onClick={handleLimparObsGeral} className="text-red-600 hover:text-red-800 font-bold text-xs flex items-center gap-1 transition-colors bg-red-50 px-3 py-1.5 rounded-lg border border-red-200" title="Apagar observação">
                                        <BiTrash size={14} /> Limpar
                                    </button>
                                )}
                                <button onClick={toggleObsGeral} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1 transition-colors">
                                    <BiX size={18} /> Fechar
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-indigo-600 mb-3">Utilize este campo para justificar a falta de preenchimento em dias específicos.</p>
                        <textarea value={obsGeralLocal} onChange={(e) => handleObsGeralChange(e.target.value)} placeholder="Ex: Feriado na quarta-feira..." className="w-full border-2 border-indigo-300 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-y bg-white" />
                    </div>
                )}

                {/* REGISTROS DE OBSERVAÇÃO (INDIVIDUAIS) */}
                {observacoesGerais.length > 0 && (
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-5 shadow-sm animate-fade-in relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-500" />
                        <h3 className="font-black text-orange-800 text-lg uppercase tracking-tight flex items-center gap-2 mb-4 mt-1">
                            <BiError size={24} /> Registros de Observação
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {observacoesGerais.map((obs) => (
                                <div key={obs.idObs} className="bg-white border border-orange-100 rounded-xl p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-400" />
                                    <div className="flex justify-between items-start pl-2">
                                        <div className="flex flex-col gap-1 overflow-hidden pr-2">
                                            <span className="font-black text-slate-800 uppercase text-sm truncate">{obs.nome}</span>
                                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-black text-[10px] tracking-widest uppercase w-fit">
                                                {obs.tipo === 'FERIAS' ? 'FÉRIAS' : obs.tipo}
                                            </span>
                                        </div>
                                        <button onClick={() => handleDeleteObs(obs.idUser, obs.idObs)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors shrink-0" title="Excluir Observação">
                                            <BiTrash size={20} />
                                        </button>
                                    </div>
                                    <div className="mt-1 pl-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Observação</label>
                                        <input
                                            type="text"
                                            value={obs.texto}
                                            onChange={(e) => handleUpdateObsText(obs.idUser, obs.idObs, e.target.value)}
                                            placeholder="Digite os detalhes e exceções..."
                                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}