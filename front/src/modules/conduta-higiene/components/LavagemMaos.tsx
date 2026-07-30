"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    BiInfoCircle,
    BiUserPlus,
    BiX,
    BiEdit,
    BiCheck,
    BiNote,
    BiTrash,
    BiError,
    BiChevronDown,
    BiChevronUp,
    BiSearch,
    BiCheckShield,
    BiTimeFive,
    BiGroup,
    BiCalendar,
    BiMapPin,
} from "react-icons/bi";
import { DAYS } from "../model/condutaModel";

interface LavagemMaosProps {
    weekLavagem: string;
    setWeekLavagem: (val: string) => void;
    weekDays: any[];
    lavagemHorarios: Record<string, { manha: string; tarde: string }>;
    setLavagemHorarios: React.Dispatch<React.SetStateAction<Record<string, { manha: string; tarde: string }>>>;
    lavagemLogs: any[];
    setLavagemLogs: React.Dispatch<React.SetStateAction<any[]>>;
    updateLavagemRow: (id: number, nome: string) => void;
    toggleLavagemCell: (id: number, day: string, turno: 'manha' | 'tarde') => void;
    removeLavagemRow: (id: number) => void;
    colaboradores: any[];
    carregarColaboradores: () => Promise<void>;
    salvarColaborador: (nome: string, tipo: "EFETIVO" | "CONTRATADO") => Promise<{ success: boolean; message: string }>;
    atualizarColaborador: (id: string, nome?: string, tipo?: "EFETIVO" | "CONTRATADO") => Promise<void>;
    desativarColaborador: (id: string) => Promise<void>;
    statusMapLavagem: Record<string, { status: string; obsList: { idObs: string; texto: string }[] }>;
    updateStatusLavagem: (id: string, status: string) => void;
    updateObsLavagem: (id: string, texto: string) => void;
    deleteObsLavagem: (id: string) => void;
    observacaoGeralLavagem: string;
    setObservacaoGeralLavagem: (obs: string) => void;
}

const BadgeContrato = ({ tipo, ativo, onClick, disabled }: { tipo: string; ativo?: boolean; onClick: () => void; disabled?: boolean }) => {
    if (ativo === false) {
        return (
            <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-xs bg-red-100 text-red-800 border border-red-300 whitespace-nowrap">
                DESLIGADO
            </span>
        );
    }
    const isEfetivo = tipo?.toUpperCase() === "EFETIVO";
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title="Clique para alternar o tipo de contrato"
            className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 whitespace-nowrap shadow-xs ${isEfetivo
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                : "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            {tipo || "CONTRATADO"}
        </button>
    );
};

export default function LavagemMaos({
    weekLavagem,
    setWeekLavagem,
    weekDays,
    lavagemHorarios,
    setLavagemHorarios,
    lavagemLogs,
    setLavagemLogs,
    toggleLavagemCell,
    colaboradores,
    carregarColaboradores,
    salvarColaborador,
    atualizarColaborador,
    desativarColaborador,
    statusMapLavagem = {},
    updateStatusLavagem = () => { },
    updateObsLavagem = () => { },
    deleteObsLavagem = () => { },
    observacaoGeralLavagem = "",
    setObservacaoGeralLavagem = () => { },
}: LavagemMaosProps) {
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoNome, setNovoNome] = useState("");
    const [novoTipo, setNovoTipo] = useState<"EFETIVO" | "CONTRATADO">("CONTRATADO");
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [editNome, setEditNome] = useState("");
    const [editTipo, setEditTipo] = useState<"EFETIVO" | "CONTRATADO" | "DESLIGADO">("CONTRATADO");

    const [showObsGeral, setShowObsGeral] = useState(false);
    const [busca, setBusca] = useState("");
    const [hiddenCards, setHiddenCards] = useState<Set<string>>(new Set());

    useEffect(() => {
        setLavagemLogs(prev => {
            const nomesValidosNoBanco = new Set(colaboradores.map(c => c.nome.toUpperCase()));
            const logsFiltrados = prev.filter(log =>
                log.colaborador && nomesValidosNoBanco.has(log.colaborador.trim().toUpperCase())
            );

            const ativos = colaboradores.filter(c => c.ativo === true);
            const nomesExistentesNosLogs = new Set(logsFiltrados.map(log => log.colaborador.toUpperCase()));

            const novosLogs = ativos
                .filter(c => !nomesExistentesNosLogs.has(c.nome.toUpperCase()))
                .map(c => ({
                    id: c.id,
                    colaborador: c.nome,
                    dias: DAYS.reduce((acc, day) => { acc[day] = { manha: null, tarde: null }; return acc; }, {} as any),
                }));

            if (novosLogs.length > 0 || logsFiltrados.length !== prev.length) {
                return [...logsFiltrados, ...novosLogs];
            }
            return prev;
        });
    }, [colaboradores, setLavagemLogs]);

    useEffect(() => { carregarColaboradores(); }, [carregarColaboradores]);

    useEffect(() => {
        if (!observacaoGeralLavagem || observacaoGeralLavagem.trim() === "") {
            setShowObsGeral(false);
        }
    }, [observacaoGeralLavagem]);

    useEffect(() => {
        const hideAllCards = () => {
            setHiddenCards(new Set(colaboradores.map(c => c.id)));
        };
        window.addEventListener("limparAbasObservacao", hideAllCards);
        return () => window.removeEventListener("limparAbasObservacao", hideAllCards);
    }, [colaboradores]);

    const handleSalvarNovo = async () => {
        if (!novoNome.trim()) return;
        setLoading(true);
        try {
            const result = await salvarColaborador(novoNome.trim(), novoTipo);
            if (result.success) {
                alert(result.message);
                setIsModalOpen(false);
                setNovoNome("");
                setNovoTipo("CONTRATADO");
            } else { alert(result.message); }
        } catch (error: any) { alert("Erro inesperado ao salvar colaborador."); }
        finally { setLoading(false); }
    };

    const iniciarEdicao = (colab: any) => {
        setEditandoId(colab.id);
        setEditNome(colab.nome);
        setEditTipo(colab.ativo ? colab.tipo : "DESLIGADO");
    };

    const cancelarEdicao = () => {
        setEditandoId(null);
        setEditNome("");
        setEditTipo("CONTRATADO");
    };

    const salvarEdicao = async (id: string) => {
        if (!editNome.trim()) return;
        setLoading(true);
        try {
            if (editTipo === "DESLIGADO") { await desativarColaborador(id); }
            else { await atualizarColaborador(id, editNome.trim(), editTipo as "EFETIVO" | "CONTRATADO"); }
            await carregarColaboradores();
            cancelarEdicao();
        } catch (error) { alert("Erro ao atualizar colaborador."); }
        finally { setLoading(false); }
    };

    const toggleContratoRapido = async (colab: any) => {
        if (!colab.ativo) return;
        const novoTipo = colab.tipo === "EFETIVO" ? "CONTRATADO" : "EFETIVO";
        setLoading(true);
        try {
            await atualizarColaborador(colab.id, colab.nome, novoTipo);
            await carregarColaboradores();
        } catch (error) { alert("Erro ao alterar o contrato."); }
        finally { setLoading(false); }
    };

    const logsOrdenados = useMemo(() => {
        return [...lavagemLogs].filter(row => {
            if (!row.colaborador || row.colaborador.trim() === "") return false;
            const existeNoBanco = colaboradores.find(c => c.nome.toUpperCase() === row.colaborador.toUpperCase());
            if (!existeNoBanco) return false;

            if (busca && !row.colaborador.toLowerCase().includes(busca.toLowerCase())) {
                return false;
            }

            return true;
        }).sort((a, b) => {
            const colabA = colaboradores.find(c => c.nome === a.colaborador);
            const colabB = colaboradores.find(c => c.nome === b.colaborador);
            const statusA = colabA ? statusMapLavagem[colabA.id]?.status || 'NORMAL' : 'NORMAL';
            const statusB = colabB ? statusMapLavagem[colabB.id]?.status || 'NORMAL' : 'NORMAL';

            const isTopA = (statusA === 'NORMAL' || statusA === 'OUTROS');
            const isTopB = (statusB === 'NORMAL' || statusB === 'OUTROS');

            if (isTopA && !isTopB) return -1;
            if (!isTopA && isTopB) return 1;

            return a.colaborador.localeCompare(b.colaborador);
        });
    }, [lavagemLogs, colaboradores, statusMapLavagem, busca]);

    const estatisticas = useMemo(() => {
        let totalCelulas = 0;
        let conformes = 0;
        let naoConformes = 0;

        logsOrdenados.forEach(row => {
            const colab = colaboradores.find(c => c.nome === row.colaborador);
            const status = colab ? statusMapLavagem[colab.id]?.status || 'NORMAL' : 'NORMAL';
            if (colab?.ativo !== false && (status === 'NORMAL' || status === 'OUTROS')) {
                DAYS.forEach(day => {
                    const m = row.dias[day]?.manha;
                    const t = row.dias[day]?.tarde;
                    if (m) { totalCelulas++; if (m === 'C') conformes++; if (m === 'NC' || m === 'F') naoConformes++; }
                    if (t) { totalCelulas++; if (t === 'C') conformes++; if (t === 'NC' || t === 'F') naoConformes++; }
                });
            }
        });

        const percConformidade = totalCelulas > 0 ? Math.round((conformes / totalCelulas) * 100) : 0;
        return { totalColab: logsOrdenados.length, percConformidade, conformes, naoConformes };
    }, [logsOrdenados, colaboradores, statusMapLavagem]);

    const observacoesIndividuais = useMemo(() => {
        const result: any[] = [];
        logsOrdenados.forEach(row => {
            const colab = colaboradores.find(c => c.nome === row.colaborador);
            if (colab) {
                const data = statusMapLavagem[colab.id];
                const status = data?.status || 'NORMAL';

                if (status !== 'NORMAL' && !hiddenCards.has(colab.id)) {
                    const obsList = data?.obsList || [];
                    const obsText = obsList[0]?.texto || '';
                    result.push({
                        idUser: colab.id,
                        nome: colab.nome,
                        status: status,
                        texto: obsText,
                        idObs: obsList[0]?.idObs || null
                    });
                }
            }
        });
        return result;
    }, [logsOrdenados, colaboradores, statusMapLavagem, hiddenCards]);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Modal de Novo Colaborador */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
                        <div className="flex justify-between items-center mb-6 border-b pb-3">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <BiUserPlus size={24} className="text-sky-600" /> Novo Colaborador
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-600 transition-colors">
                                <BiX size={28} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={novoNome}
                                    onChange={(e) => setNovoNome(e.target.value.toUpperCase())}
                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 uppercase transition-all"
                                    placeholder="EX: MARIA DA SILVA"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Contrato</label>
                                <select
                                    value={novoTipo}
                                    onChange={(e) => setNovoTipo(e.target.value as "EFETIVO" | "CONTRATADO")}
                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 font-bold text-slate-800 bg-white outline-none focus:border-sky-500 cursor-pointer"
                                >
                                    <option value="CONTRATADO">Contratado</option>
                                    <option value="EFETIVO">Efetivo</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSalvarNovo} className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-lg shadow-md transition-all active:scale-95" disabled={loading}>
                                {loading ? "Salvando..." : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 CABEÇALHO GLOBAL (Visual Diferenciado e Exclusivo) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row gap-4 lg:gap-6">
                <div className="flex-1 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                        <BiCalendar size={18} className="text-sky-500" /> Período da Semana
                    </label>
                    <input
                        type="text"
                        value={weekLavagem}
                        onChange={(e) => setWeekLavagem(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all shadow-xs"
                        placeholder="Ex: 27 de Julho a 01 de Agosto"
                    />
                </div>

                <div className="flex-1 bg-sky-50/50 p-4 rounded-xl border border-sky-100 flex flex-col justify-center">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
                        <BiMapPin size={18} className="text-rose-500" /> Área de Monitoramento
                    </label>
                    <div className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-black text-sky-700 text-center shadow-xs">
                        Packing House
                    </div>
                </div>
            </div>

            {/* CARDS DE ESTATÍSTICAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-emerald-300 transition-colors">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conformidade</p>
                        <h4 className="text-2xl font-black text-slate-800 mt-1">{estatisticas.percConformidade}%</h4>
                        <span className="text-[10px] font-bold text-emerald-600 mt-0.5 inline-block">Registros conformes</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <BiCheckShield size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-rose-300 transition-colors">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Não Conformidades</p>
                        <h4 className="text-2xl font-black text-slate-800 mt-1">{estatisticas.naoConformes}</h4>
                        <span className="text-[10px] font-bold text-rose-600 mt-0.5 inline-block">Apontamentos registrados</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                        <BiError size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-sky-300 transition-colors">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Colaboradores</p>
                        <h4 className="text-2xl font-black text-slate-800 mt-1">{estatisticas.totalColab}</h4>
                        <span className="text-[10px] font-bold text-sky-600 mt-0.5 inline-block">Listados na semana</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <BiGroup size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-amber-300 transition-colors">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Horários Padrão</p>
                        <h4 className="text-xl font-black text-slate-800 mt-1">09h / 14h</h4>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5 inline-block">Manhã e Tarde</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <BiTimeFive size={24} />
                    </div>
                </div>
            </div>

            {/* SEÇÃO PRINCIPAL DA TABELA (TEMA AZUL CELESTE) */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200">
                {/* CABEÇALHO DA TABELA */}
                <div className="px-6 py-4 bg-linear-to-r from-sky-600 to-sky-500 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-black text-white uppercase tracking-widest">
                            Controle de Lavagem de Mãos
                        </h2>
                        <p className="text-sky-100 text-[11px] mt-0.5">
                            Horários de verificação: 09:00h (Manhã) e 14:00h (Tarde)
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setShowObsGeral(!showObsGeral)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs md:text-sm uppercase transition-all shadow-md active:scale-95 ${showObsGeral ? 'bg-sky-700 text-white' : 'bg-sky-700/50 hover:bg-sky-700 text-white'}`}
                        >
                            <BiNote size={18} />
                            Observações Gerais
                            {observacaoGeralLavagem && observacaoGeralLavagem.trim() !== "" && (
                                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                            )}
                            {showObsGeral ? <BiChevronUp size={18} /> : <BiChevronDown size={18} />}
                        </button>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-sky-50 text-sky-700 rounded-xl text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
                        >
                            <BiUserPlus size={18} /> Novo Colaborador
                        </button>
                    </div>
                </div>

                {/* BARRA DE BUSCA E INFORMAÇÕES DA TABELA */}
                <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                        Relação de Colaboradores e Turnos
                    </span>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <BiSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Buscar colaborador..."
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs md:text-sm font-bold text-slate-700 outline-none focus:border-sky-500 uppercase shadow-xs transition-all"
                            />
                        </div>
                        <span className="text-xs font-bold text-slate-500 shrink-0 bg-slate-200/60 px-3 py-2 rounded-xl">
                            Total: {logsOrdenados.length}
                        </span>
                    </div>
                </div>

                {/* TABELA DE REGISTROS */}
                <div className="overflow-x-auto overflow-y-auto max-h-[550px] custom-scrollbar bg-slate-50">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="sticky top-0 z-20 bg-slate-100 shadow-xs">
                            <tr className="border-b border-slate-300">
                                <th rowSpan={2} className="py-3 px-4 font-black text-slate-700 text-xs uppercase tracking-widest sticky left-0 top-0 bg-slate-100 z-30 min-w-[300px] max-w-[340px] border-r border-slate-300">
                                    Colaborador
                                </th>
                                <th rowSpan={2} className="py-3 px-3 font-black text-slate-700 text-xs uppercase tracking-widest min-w-[130px] border-r border-slate-300 bg-slate-100 text-center">
                                    Situação
                                </th>
                                {weekDays.map((day) => (
                                    <th colSpan={2} key={day.short} className="border-r border-b border-slate-300 bg-slate-50 min-w-[100px]">
                                        <div className="flex flex-col items-center py-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{day.short}</span>
                                            <span className="text-[12px] font-black text-slate-800 mt-0.5">{day.label?.match(/\((.*?)\)?\)/)?.[1] || ""}</span>
                                        </div>
                                    </th>
                                ))}
                                <th rowSpan={2} className="py-3 px-3 font-black text-slate-700 text-xs uppercase tracking-widest min-w-[80px] text-center border-l border-slate-300 bg-slate-100">
                                    Ações
                                </th>
                            </tr>
                            <tr className="bg-slate-50 border-b border-slate-300">
                                {DAYS.map((day) => (
                                    <React.Fragment key={`sub-${day}`}>
                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 bg-slate-50">
                                            <input
                                                type="time"
                                                value={lavagemHorarios?.[day]?.manha || "09:00"}
                                                onChange={(e) => setLavagemHorarios((prev) => ({
                                                    ...prev,
                                                    [day]: { ...(prev?.[day] || { manha: "09:00", tarde: "14:00" }), manha: e.target.value },
                                                }))}
                                                className="w-16 h-7 border border-sky-200 rounded px-0 text-center text-[10px] font-bold text-sky-700 bg-white outline-none focus:border-sky-500 mx-auto block cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-1.5 px-1 text-center border-r border-slate-300 bg-slate-50">
                                            <input
                                                type="time"
                                                value={lavagemHorarios?.[day]?.tarde || "14:00"}
                                                onChange={(e) => setLavagemHorarios((prev) => ({
                                                    ...prev,
                                                    [day]: { ...(prev?.[day] || { manha: "09:00", tarde: "14:00" }), tarde: e.target.value },
                                                }))}
                                                className="w-16 h-7 border border-sky-200 rounded px-0 text-center text-[10px] font-bold text-sky-700 bg-white outline-none focus:border-sky-500 mx-auto block cursor-pointer"
                                            />
                                        </th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {logsOrdenados.map((row, rowIndex) => {
                                const colab = colaboradores.find(c => c.nome === row.colaborador);
                                const isEditing = editandoId === colab?.id;
                                const rowBg = rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60";
                                const currentStatus = colab ? statusMapLavagem[colab.id]?.status || 'NORMAL' : 'NORMAL';

                                return (
                                    <tr key={colab?.id || row.id} className={`hover:bg-sky-50/60 transition-colors ${rowBg}`}>
                                        <td className={`p-2.5 sticky left-0 z-10 border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] ${rowBg}`}>
                                            {isEditing ? (
                                                <div className="flex flex-col gap-1.5">
                                                    <input
                                                        type="text"
                                                        value={editNome}
                                                        onChange={(e) => setEditNome(e.target.value.toUpperCase())}
                                                        className="w-full border border-sky-300 rounded-md px-2 py-1 text-[11px] font-bold uppercase outline-none focus:border-sky-500"
                                                        autoFocus
                                                    />
                                                    <select
                                                        value={editTipo}
                                                        onChange={(e) => setEditTipo(e.target.value as "EFETIVO" | "CONTRATADO" | "DESLIGADO")}
                                                        className="w-full text-[10px] font-black uppercase px-1 py-1 rounded-md border border-sky-300 bg-white outline-none"
                                                    >
                                                        <option value="CONTRATADO">Contratado</option>
                                                        <option value="EFETIVO">Efetivo</option>
                                                        <option value="DESLIGADO" className="text-red-600 font-bold">Desligar Colaborador</option>
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-2 w-full px-2 text-sm">
                                                    <span title={row.colaborador || "NOME NÃO CADASTRADO"} className={`font-bold uppercase truncate flex-1 text-[11px] leading-tight ${colab?.ativo === false ? 'text-gray-400 line-through' : 'text-slate-800'}`}>
                                                        {row.colaborador || "NOME NÃO CADASTRADO"}
                                                    </span>
                                                    {colab && (
                                                        <BadgeContrato
                                                            tipo={colab.tipo}
                                                            ativo={colab.ativo}
                                                            onClick={() => toggleContratoRapido(colab)}
                                                            disabled={loading || !colab.ativo}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-1.5 border-r border-slate-300 text-center align-middle">
                                            <select
                                                value={currentStatus}
                                                onChange={(e) => {
                                                    if (colab) {
                                                        updateStatusLavagem(colab.id, e.target.value);
                                                        setHiddenCards(prev => {
                                                            const newSet = new Set(prev);
                                                            newSet.delete(colab.id);
                                                            return newSet;
                                                        });
                                                    }
                                                }}
                                                disabled={colab?.ativo === false}
                                                className={`w-full p-1.5 rounded-md text-[9px] md:text-[10px] font-black uppercase outline-none border cursor-pointer transition-colors disabled:opacity-50
                                                    ${currentStatus === 'NORMAL' || currentStatus === 'OUTROS' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-orange-100 border-orange-300 text-orange-800 shadow-xs'}`}
                                            >
                                                <option value="NORMAL">Normal</option>
                                                <option value="CAMPO">Campo</option>
                                                <option value="FERIAS">Férias</option>
                                                <option value="LICENCA">Licença</option>
                                                <option value="AFASTADO">Afastado</option>
                                                <option value="OUTROS">Outros</option>
                                            </select>
                                        </td>

                                        {DAYS.map((day) => {
                                            const m = row.dias[day].manha;
                                            const t = row.dias[day].tarde;
                                            const bloqueiaClick = colab?.ativo === false || (currentStatus !== 'NORMAL' && currentStatus !== 'OUTROS');

                                            return (
                                                <React.Fragment key={`cell-${row.id}-${day}`}>
                                                    <td
                                                        onClick={() => !bloqueiaClick && toggleLavagemCell(row.id, day, "manha")}
                                                        className={`p-1 border-r border-slate-300 text-center ${!bloqueiaClick ? 'cursor-pointer hover:bg-slate-200/70' : 'cursor-not-allowed opacity-40 bg-slate-100'}`}
                                                    >
                                                        <div className={`w-7 h-7 md:w-8 md:h-8 mx-auto rounded-lg flex items-center justify-center transition-all shadow-2xs ${m === "C"
                                                            ? "bg-emerald-500 text-white scale-105 font-bold"
                                                            : m === "NC"
                                                                ? "bg-rose-500 text-white scale-105 font-bold"
                                                                : m === "F"
                                                                    ? "bg-red-700 text-white scale-105 font-black"
                                                                    : "bg-slate-200/80 text-slate-400 border-b-2 border-slate-300"
                                                            }`}>
                                                            <span className="text-[10px] md:text-xs">{m || "—"}</span>
                                                        </div>
                                                    </td>
                                                    <td
                                                        onClick={() => !bloqueiaClick && toggleLavagemCell(row.id, day, "tarde")}
                                                        className={`p-1 border-r border-slate-300 text-center ${!bloqueiaClick ? 'cursor-pointer hover:bg-slate-200/70' : 'cursor-not-allowed opacity-40 bg-slate-100'}`}
                                                    >
                                                        <div className={`w-7 h-7 md:w-8 md:h-8 mx-auto rounded-lg flex items-center justify-center transition-all shadow-2xs ${t === "C"
                                                            ? "bg-emerald-500 text-white scale-105 font-bold"
                                                            : t === "NC"
                                                                ? "bg-rose-500 text-white scale-105 font-bold"
                                                                : t === "F"
                                                                    ? "bg-red-700 text-white scale-105 font-black"
                                                                    : "bg-slate-200/80 text-slate-400 border-b-2 border-slate-300"
                                                            }`}>
                                                            <span className="text-[10px] md:text-xs">{t || "—"}</span>
                                                        </div>
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}

                                        <td className={`p-1.5 text-center align-middle border-l border-slate-300 ${rowBg}`}>
                                            {colab && (
                                                isEditing ? (
                                                    <div className="flex justify-center items-center gap-1">
                                                        <button
                                                            onClick={() => salvarEdicao(colab.id)}
                                                            className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-md transition-colors border border-emerald-200"
                                                            disabled={loading}
                                                        ><BiCheck size={16} /></button>
                                                        <button
                                                            onClick={cancelarEdicao}
                                                            className="text-rose-500 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-md transition-colors border border-rose-200"
                                                        ><BiX size={16} /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center items-center">
                                                        <button
                                                            onClick={() => iniciarEdicao(colab)}
                                                            className="text-sky-500 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 p-1.5 rounded-lg transition-colors border border-sky-200 shadow-2xs"
                                                            title="Editar nome ou contrato"
                                                        ><BiEdit size={16} /></button>
                                                    </div>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {logsOrdenados.length === 0 && (
                                <tr>
                                    <td colSpan={14} className="p-10 text-center">
                                        <div className="text-slate-500 font-bold bg-white rounded-xl p-4 inline-block shadow-xs border border-slate-200">
                                            Nenhum colaborador encontrado.
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SEÇÕES DE OBSERVAÇÃO INDIVIDUAL E GERAL */}
            {observacoesIndividuais.length > 0 && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 md:p-6 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-500" />
                    <h3 className="font-black text-orange-800 text-base md:text-lg uppercase tracking-tight flex items-center gap-2 mb-4">
                        <BiError size={20} /> Registros de Observação
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {observacoesIndividuais.map((obs, idx) => (
                            <div key={idx} className="bg-white border border-orange-100 rounded-xl p-4 shadow-2xs flex flex-col gap-3 relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-400" />
                                <div className="flex justify-between items-center pl-2">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-black text-slate-800 uppercase text-xs md:text-sm">{obs.nome}</span>
                                        <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-md font-black text-[9px] tracking-widest uppercase w-fit">
                                            {obs.status === 'FERIAS' ? 'FÉRIAS' : obs.status}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            deleteObsLavagem(obs.idUser);
                                            setHiddenCards(prev => new Set(prev).add(obs.idUser));
                                        }}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        title="Ocultar observação"
                                    >
                                        <BiTrash size={18} />
                                    </button>
                                </div>
                                <div className="mt-1 pl-2">
                                    <input
                                        type="text"
                                        value={obs.texto || ''}
                                        onChange={(e) => updateObsLavagem(obs.idUser, e.target.value)}
                                        placeholder="Digite os detalhes e exceções..."
                                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-orange-400 transition-all"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showObsGeral && (
                <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 md:p-6 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-sky-500" />
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-black text-sky-800 text-base uppercase tracking-tight flex items-center gap-2">
                            <BiNote size={20} /> Observação Geral da Semana (Lavagem)
                        </h3>
                        <button onClick={() => setShowObsGeral(false)} className="text-sky-600 hover:text-sky-800 font-bold text-xs">
                            <BiX size={20} />
                        </button>
                    </div>
                    <textarea
                        value={observacaoGeralLavagem}
                        onChange={(e) => setObservacaoGeralLavagem(e.target.value)}
                        placeholder="Ex: Feriado na quarta-feira, não houve verificação."
                        className="w-full border-2 border-sky-300 rounded-xl p-4 text-sm font-medium text-slate-700 outline-none focus:border-sky-500 transition-all min-h-[90px] bg-white"
                    />
                </div>
            )}

            {/* FOOTER DE PROIBIÇÕES */}
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3 items-start shadow-2xs">
                <BiInfoCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-rose-900 font-black text-xs uppercase mb-1 tracking-widest">É Proibido:</h3>
                    <p className="text-rose-800 text-[11px] font-semibold leading-relaxed uppercase">
                        Fumar • Unhas grandes • Unhas c/ esmaltes • Unhas postiças •
                        Anel • Relógio • Pulseiras • Colar • Brincos • Perfume / Maquiagem •
                        Barba / Bigode • Sem touca • Uniforme incompleto • Uniforme sujo • Conversas paralelas.
                    </p>
                </div>
            </div>
        </div>
    );
}