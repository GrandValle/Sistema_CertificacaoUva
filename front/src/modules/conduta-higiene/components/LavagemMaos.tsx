"use client";

import React, { useState, useEffect } from "react";
import {
    BiInfoCircle,
    BiUserPlus,
    BiX,
    BiEdit,
    BiCheck,
} from "react-icons/bi";
import { DAYS } from "../model/condutaModel";

interface LavagemMaosProps {
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
}

// ========== COMPONENTE DE BADGE ATUALIZADO ==========
const BadgeContrato = ({ tipo, ativo, onClick, disabled }: { tipo: string; ativo?: boolean; onClick: () => void; disabled?: boolean }) => {
    // 🔥 Se não estiver ativo, mostra a tag vermelha estática
    if (ativo === false) {
        return (
            <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm bg-red-100 text-red-800 border border-red-300">
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
            className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 whitespace-nowrap shadow-sm ${isEfetivo
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                : "bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            {tipo || "CONTRATADO"}
        </button>
    );
};

export default function LavagemMaos({
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
}: LavagemMaosProps) {
    const [loading, setLoading] = useState(false);

    // Modal de novo colaborador
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novoNome, setNovoNome] = useState("");
    const [novoTipo, setNovoTipo] = useState<"EFETIVO" | "CONTRATADO">("CONTRATADO");

    // Edição inline (🔥 Adicionado o tipo DESLIGADO)
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [editNome, setEditNome] = useState("");
    const [editTipo, setEditTipo] = useState<"EFETIVO" | "CONTRATADO" | "DESLIGADO">("CONTRATADO");

    // 🔥 NOVA LÓGICA: Sincroniza sem apagar quem foi desligado na semana
    useEffect(() => {
        setLavagemLogs(prev => {
            const ativos = colaboradores.filter(c => c.ativo === true);
            const nomesExistentes = new Set(prev.map(log => log.colaborador.toUpperCase()));

            // Adiciona apenas quem é novo e ativo
            const novosLogs = ativos
                .filter(c => !nomesExistentes.has(c.nome.toUpperCase()))
                .map(c => ({
                    id: Date.now() + Math.random(),
                    colaborador: c.nome,
                    dias: DAYS.reduce((acc, day) => { acc[day] = { manha: null, tarde: null }; return acc; }, {} as any),
                }));

            if (novosLogs.length > 0) {
                return [...prev, ...novosLogs];
            }
            return prev;
        });
    }, [colaboradores, setLavagemLogs]);

    useEffect(() => {
        carregarColaboradores();
    }, []);

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
            } else {
                alert(result.message);
            }
        } catch (error: any) {
            alert("Erro inesperado ao salvar colaborador.");
            console.error(error);
        } finally {
            setLoading(false);
        }
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
            if (editTipo === "DESLIGADO") {
                await desativarColaborador(id);
            } else {
                await atualizarColaborador(id, editNome.trim(), editTipo as "EFETIVO" | "CONTRATADO");
            }
            await carregarColaboradores();
            cancelarEdicao();
        } catch (error) {
            alert("Erro ao atualizar colaborador.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleContratoRapido = async (colab: any) => {
        if (!colab.ativo) return; // Não deixa trocar contrato de desligado
        const novoTipo = colab.tipo === "EFETIVO" ? "CONTRATADO" : "EFETIVO";
        setLoading(true);
        try {
            await atualizarColaborador(colab.id, colab.nome, novoTipo);
            await carregarColaboradores();
        } catch (error) {
            alert("Erro ao alterar o contrato.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Modal de Novo Colaborador (MANTIDO IGUAL) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200">
                        <div className="flex justify-between items-center mb-6 border-b pb-3">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <BiUserPlus size={24} className="text-indigo-600" /> Novo Colaborador
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
                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 uppercase transition-all"
                                    placeholder="EX: MARIA DA SILVA"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Contrato</label>
                                <select
                                    value={novoTipo}
                                    onChange={(e) => setNovoTipo(e.target.value as "EFETIVO" | "CONTRATADO")}
                                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 font-bold text-slate-800 bg-white outline-none focus:border-indigo-500 cursor-pointer"
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
                            <button onClick={handleSalvarNovo} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-lg shadow-md transition-all active:scale-95" disabled={loading}>
                                {loading ? "Salvando..." : "Salvar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cabeçalho */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200">
                <div className="px-6 py-4 bg-linear-to-r from-indigo-600 to-indigo-500 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-black text-white uppercase tracking-widest">
                            Registro Diário de Lavagem
                        </h2>
                        <p className="text-indigo-200 text-[11px] mt-0.5">
                            Horário Packing: 09:00h e 14:00h de segunda a sexta, sábados até as 13h
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
                    >
                        <BiUserPlus size={18} /> Novo Colaborador
                    </button>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Local:</span>
                        <span className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm uppercase tracking-wider shadow-md">
                            Packing House
                        </span>
                    </div>
                </div>

                {/* Tabela */}
                <div className="overflow-auto max-h-125">
                    <table className="w-full text-left text-sm relative border-collapse border border-slate-300">
                        <thead className="sticky top-0 z-20 shadow-sm bg-slate-100">
                            <tr className="border-b border-slate-200">
                                <th rowSpan={2} className="py-4 px-4 font-bold text-slate-700 text-xs uppercase tracking-widest sticky left-0 top-0 bg-slate-100 z-30 w-96 min-w-84 border-r border-slate-300 align-middle">
                                    Colaborador
                                </th>
                                {weekDays.map((day) => (
                                    <th colSpan={2} key={day.short} className="border-r border-b border-slate-300 bg-slate-50">
                                        <div className="flex flex-col items-center py-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{day.short}</span>
                                            <span className="text-[13px] font-black text-slate-800 mt-1">{day.label?.match(/\((.*?)\)/)?.[1] || ""}</span>
                                        </div>
                                    </th>
                                ))}
                                <th rowSpan={2} className="py-4 px-4 font-bold text-slate-700 text-xs uppercase tracking-widest w-20 text-center border-r border-slate-300 align-middle bg-slate-100">
                                    Ações
                                </th>
                            </tr>
                            <tr className="bg-slate-50 border-b border-slate-300">
                                {DAYS.map((day) => (
                                    <React.Fragment key={`sub-${day}`}>
                                        <th className="py-2 px-1 text-center border-r border-slate-300 min-w-20 bg-slate-50">
                                            <input
                                                type="time"
                                                value={lavagemHorarios?.[day]?.manha || "09:00"}
                                                onChange={(e) =>
                                                    setLavagemHorarios((prev) => ({
                                                        ...prev,
                                                        [day]: { ...(prev?.[day] || { manha: "09:00", tarde: "14:00" }), manha: e.target.value },
                                                    }))
                                                }
                                                className="w-full h-7 border border-indigo-200 rounded px-1 text-[10px] font-bold text-indigo-700 bg-white outline-none focus:border-indigo-500"
                                            />
                                        </th>
                                        <th className="py-2 px-1 text-center border-r border-slate-300 min-w-20 bg-slate-50">
                                            <input
                                                type="time"
                                                value={lavagemHorarios?.[day]?.tarde || "14:00"}
                                                onChange={(e) =>
                                                    setLavagemHorarios((prev) => ({
                                                        ...prev,
                                                        [day]: { ...(prev?.[day] || { manha: "09:00", tarde: "14:00" }), tarde: e.target.value },
                                                    }))
                                                }
                                                className="w-full h-7 border border-indigo-200 rounded px-1 text-[10px] font-bold text-indigo-700 bg-white outline-none focus:border-indigo-500"
                                            />
                                        </th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {lavagemLogs
                                .filter(row => {
                                    // 🔥 BARREIRA ANTI-FANTASMA:
                                    // Só deixa passar para a tela se o nome existir na lista oficial do banco
                                    // ou se for uma linha vazia (para evitar bugar novas inserções)
                                    return colaboradores.some(c => c.nome === row.colaborador) || row.colaborador === "";
                                })
                                .map((row, rowIndex) => {
                                    const colab = colaboradores.find(c => c.nome === row.colaborador);
                                    const isEditing = editandoId === colab?.id;
                                    const rowBg = rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50";
                                    return (
                                        <tr key={row.id} className={`hover:bg-indigo-50/70 transition-colors ${rowBg}`}>
                                            <td className={`p-2 sticky left-0 z-10 border-r border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] ${rowBg}`}>
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            type="text"
                                                            value={editNome}
                                                            onChange={(e) => setEditNome(e.target.value.toUpperCase())}
                                                            className="w-full border-2 border-indigo-300 rounded-lg px-2 py-1.5 text-sm font-bold uppercase outline-none focus:border-indigo-500"
                                                            autoFocus
                                                        />
                                                        <select
                                                            value={editTipo}
                                                            onChange={(e) => setEditTipo(e.target.value as "EFETIVO" | "CONTRATADO" | "DESLIGADO")}
                                                            className="w-full text-[10px] font-black uppercase px-2 py-1.5 rounded-lg border-2 border-indigo-300 bg-white outline-none focus:border-indigo-500"
                                                        >
                                                            <option value="CONTRATADO">Contratado</option>
                                                            <option value="EFETIVO">Efetivo</option>
                                                            {/* 🔥 NOVA OPÇÃO AQUI */}
                                                            <option value="DESLIGADO" className="text-red-600 font-bold">Desligar Colaborador</option>
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between gap-2 w-full p-2 text-sm bg-white rounded-lg border border-slate-300">
                                                        <span title={row.colaborador || "NOME NÃO CADASTRADO"} className={`font-bold uppercase flex-1 leading-tight ${colab?.ativo === false ? 'text-gray-400 line-through' : 'text-slate-800'}`}>
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

                                            {DAYS.map((day) => {
                                                const m = row.dias[day].manha;
                                                const t = row.dias[day].tarde;
                                                return (
                                                    <React.Fragment key={`cell-${row.id}-${day}`}>
                                                        <td
                                                            onClick={() => toggleLavagemCell(row.id, day, "manha")}
                                                            className="p-1 border-r border-slate-300 cursor-pointer text-center hover:bg-slate-100"
                                                        >
                                                            <div className={`w-9 h-9 mx-auto rounded-md flex items-center justify-center transition-all ${m === "C"
                                                                ? "bg-green-500 text-white shadow-sm scale-110"
                                                                : m === "NC"
                                                                    ? "bg-red-500 text-white shadow-sm scale-110"
                                                                    : "bg-slate-200 text-slate-500 border border-slate-300"
                                                                }`}>
                                                                <span className="font-black text-xs">{m || "—"}</span>
                                                            </div>
                                                        </td>
                                                        <td
                                                            onClick={() => toggleLavagemCell(row.id, day, "tarde")}
                                                            className="p-1 border-r border-slate-300 cursor-pointer text-center hover:bg-slate-100"
                                                        >
                                                            <div className={`w-9 h-9 mx-auto rounded-md flex items-center justify-center transition-all ${t === "C"
                                                                ? "bg-green-500 text-white shadow-sm scale-110"
                                                                : t === "NC"
                                                                    ? "bg-red-500 text-white shadow-sm scale-110"
                                                                    : "bg-slate-200 text-slate-500 border border-slate-300"
                                                                }`}>
                                                                <span className="font-black text-xs">{t || "—"}</span>
                                                            </div>
                                                        </td>
                                                    </React.Fragment>
                                                );
                                            })}
                                            <td className={`p-2 text-center align-middle border-r border-slate-300 ${rowBg}`}>
                                                {colab && (
                                                    isEditing ? (
                                                        <div className="flex justify-center items-center gap-2 flex-wrap">
                                                            <button
                                                                onClick={() => salvarEdicao(colab.id)}
                                                                className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-md transition-colors border border-emerald-200"
                                                                title="Salvar alterações"
                                                                disabled={loading}
                                                            >
                                                                <BiCheck size={18} />
                                                            </button>
                                                            <button
                                                                onClick={cancelarEdicao}
                                                                className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-colors border border-red-200"
                                                                title="Cancelar edição"
                                                            >
                                                                <BiX size={18} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center items-center gap-2 flex-wrap">
                                                            <button
                                                                onClick={() => iniciarEdicao(colab)}
                                                                className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors border border-blue-200"
                                                                title="Editar nome e contrato"
                                                            >
                                                                <BiEdit size={18} />
                                                            </button>
                                                            {/* A LIXEIRA FOI REMOVIDA DAQUI! */}
                                                        </div>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            {lavagemLogs.length === 0 && (
                                <tr>
                                    <td colSpan={2 + DAYS.length * 2} className="p-4 text-center text-slate-500">
                                        Nenhum colaborador cadastrado. Clique em "Novo Colaborador" para adicionar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 items-start shadow-sm">
                <BiInfoCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                    <h3 className="text-rose-900 font-black text-xs uppercase mb-1.5 tracking-widest">É Proibido:</h3>
                    <p className="text-rose-800 text-xs font-semibold leading-relaxed uppercase">
                        Fumar • Unhas grandes • Unhas c/ esmaltes • Unhas postiças •
                        Anel • Relógio • Pulseiras • Colar • Brincos • Perfume / Maquiagem •
                        Barba / Bigode • Sem touca • Uniforme incompleto • Uniforme sujo • Conversas paralelas.
                    </p>
                </div>
            </div>
        </div>
    );
}