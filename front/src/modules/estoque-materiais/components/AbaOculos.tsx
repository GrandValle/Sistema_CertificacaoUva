"use client";

import { useState } from "react";
import { BiSearch, BiGlasses, BiPlus, BiUserPlus, BiX, BiTrash, BiPen } from "react-icons/bi";
import { SignatureSelector } from "../../../components/SignatureSelector";

interface AbaOculosProps {
    oculosLogs: any[];
    colaboradoresOculos: any[];
    updateOculosRow: (colaboradorId: string, field: string, value: any) => void;
    prepareSignatureInteraction: () => void;
    adicionarColaboradorOculos: (nome: string, tipo: "EFETIVO" | "CONTRATADO") => Promise<void>;
    desativarColaboradorOculos: (id: string) => Promise<void>;
    atualizarTipoColaborador: (id: string, tipo: "EFETIVO" | "CONTRATADO") => Promise<void>;
    editarColaboradorOculos?: (id: string, nome: string, tipo: "EFETIVO" | "CONTRATADO") => Promise<void>;
    reativarColaboradorOculos?: (id: string, nome: string, tipo: "EFETIVO" | "CONTRATADO") => Promise<void>;
}

export function AbaOculos({
    oculosLogs,
    colaboradoresOculos,
    updateOculosRow,
    prepareSignatureInteraction,
    adicionarColaboradorOculos,
    desativarColaboradorOculos,
    atualizarTipoColaborador,
    editarColaboradorOculos,
    reativarColaboradorOculos,
}: AbaOculosProps) {
    const [busca, setBusca] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [colabEditando, setColabEditando] = useState<any>(null);

    const [novoColabNome, setNovoColabNome] = useState("");
    const [novoColabTipo, setNovoColabTipo] = useState<"EFETIVO" | "CONTRATADO">("CONTRATADO");
    const [errorMsg, setErrorMsg] = useState("");

    // 🔥 CORREÇÃO: filtrar corretamente os inativos (status 'INATIVO')
    const funcionariosFiltrados = (colaboradoresOculos || [])
        .filter(c => c.status !== 'INATIVO') // <-- mudança aqui
        .filter(c => c.nome?.toLowerCase().includes(busca.toLowerCase()))
        .sort((a, b) => a.nome?.localeCompare(b.nome));

    const hoje = new Date().toISOString().split('T')[0];

    const resetModal = () => {
        setNovoColabNome("");
        setNovoColabTipo("CONTRATADO");
        setColabEditando(null);
        setErrorMsg("");
    };

    const abrirModalEdicao = (colab: any) => {
        setColabEditando(colab);
        setNovoColabNome(colab.nome);
        setNovoColabTipo(colab.tipo);
        setErrorMsg("");
        setIsModalOpen(true);
    };

    const handleSalvarColaborador = async () => {
        setErrorMsg("");
        if (!novoColabNome.trim()) {
            setErrorMsg("Por favor, preencha o nome completo.");
            return;
        }

        const nomeUpper = novoColabNome.trim().toUpperCase();

        try {
            if (colabEditando && editarColaboradorOculos) {
                await editarColaboradorOculos(colabEditando.id, nomeUpper, novoColabTipo);
            } else {
                await adicionarColaboradorOculos(nomeUpper, novoColabTipo);
            }
            resetModal();
            setIsModalOpen(false);
        } catch (error: any) {
            setErrorMsg(error.message || "Erro ao salvar. Verifique o console.");
        }
    };

    const handleTipoChange = async (colabId: string, novoTipo: "EFETIVO" | "CONTRATADO") => {
        try {
            await atualizarTipoColaborador(colabId, novoTipo);
        } catch (error) {
            console.error("Erro ao atualizar tipo:", error);
            alert("Erro ao atualizar tipo. Verifique o console.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 animate-fade-in">
                        <div className="flex justify-between items-center mb-6 border-b pb-3">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                {colabEditando ? <BiPen size={24} className="text-blue-600" /> : <BiUserPlus size={24} className="text-emerald-600" />}
                                {colabEditando ? "Editar Colaborador" : "Novo Colaborador"}
                            </h3>
                            <button onClick={() => { resetModal(); setIsModalOpen(false); }} className="text-gray-400 hover:text-red-600 transition-colors"><BiX size={28} /></button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                                <input type="text" value={novoColabNome} onChange={e => setNovoColabNome(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 uppercase transition-all" placeholder="EX: JOÃO DA SILVA" autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Status / Contrato</label>
                                <select value={novoColabTipo} onChange={e => setNovoColabTipo(e.target.value as "EFETIVO" | "CONTRATADO")} className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 font-bold text-slate-800 bg-white outline-none focus:border-emerald-500 cursor-pointer transition-all">
                                    <option value="CONTRATADO">Contratado</option>
                                    <option value="EFETIVO">Efetivo</option>
                                </select>
                            </div>
                            {errorMsg && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                                    <BiX size={20} className="text-red-500 shrink-0" />
                                    <span className="font-medium">{errorMsg}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => { resetModal(); setIsModalOpen(false); }} className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                            <button onClick={handleSalvarColaborador} className={`px-6 py-2.5 text-white font-black rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 ${colabEditando ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CABEÇALHO */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                        <BiGlasses className="text-blue-600" size={28} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Controle de Óculos</h3>
                        <p className="text-sm text-slate-500 font-medium">Acompanhamento de uso e registro de incidentes</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <BiSearch size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar funcionário..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all uppercase" />
                    </div>
                    <button onClick={() => { resetModal(); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-black text-sm uppercase flex items-center gap-2 shadow-sm hover:shadow transition-all active:scale-95 whitespace-nowrap">
                        <BiPlus size={20} /> Cadastrar
                    </button>
                </div>
            </div>

            {/* TABELA */}
            <div className="rounded-xl shadow-sm bg-white overflow-hidden">
                <div className="overflow-x-auto overflow-y-auto max-h-[65vh] custom-scrollbar">
                    <table className="w-full text-sm min-w-[950px] border-collapse border border-slate-300">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[11px] sticky top-0 z-10">
                            <tr>
                                <th className="p-3 border border-slate-300 text-left w-36">Data</th>
                                <th className="p-3 border border-slate-300 text-left min-w-[220px]">Colaborador</th>
                                <th className="p-3 border border-slate-300 text-center w-48">Óculos Intacto?</th>
                                <th className="p-3 border border-slate-300 text-center min-w-[240px]">Assinatura Responsável</th>
                                <th className="p-3 border border-slate-300 text-left min-w-[200px]">Observações</th>
                                <th className="p-3 border border-slate-300 text-center w-24">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {funcionariosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-10 border border-slate-300 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <BiSearch size={32} className="text-slate-300" />
                                            <p>Nenhum colaborador encontrado na busca.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                funcionariosFiltrados.map((colab) => {
                                    const log = oculosLogs.find(l => String(l.colaboradorId) === String(colab.id)) || {
                                        id: colab.id,
                                        colaboradorId: colab.id,
                                        data: hoje,
                                        intacto: null,
                                        assinatura: "",
                                        observacao: ""
                                    };

                                    return (
                                        <tr key={colab.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-2 border border-slate-300">
                                                <input
                                                    type="date"
                                                    value={log.data || ''}
                                                    onChange={(e) => updateOculosRow(colab.id, "data", e.target.value)}
                                                    className="w-full bg-transparent p-2 font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-lg transition-all"
                                                />
                                            </td>

                                            <td className="p-2 border border-slate-300">
                                                <div className={`p-2.5 rounded-lg border font-bold uppercase text-xs flex flex-col justify-center items-start shadow-sm transition-all duration-200 ${colab.tipo === 'EFETIVO'
                                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                    : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                    }`}>
                                                    <span className="text-[13px]">{colab.nome}</span>
                                                    <select
                                                        value={colab.tipo}
                                                        onChange={(e) => {
                                                            const novoTipo = e.target.value as "EFETIVO" | "CONTRATADO";
                                                            handleTipoChange(colab.id, novoTipo);
                                                        }}
                                                        className="text-[9px] font-black tracking-widest bg-transparent border-none outline-none cursor-pointer mt-0.5 p-0 w-full hover:opacity-75 transition-opacity appearance-none uppercase"
                                                    >
                                                        <option value="CONTRATADO" className="text-slate-800 bg-white font-bold">CONTRATADO</option>
                                                        <option value="EFETIVO" className="text-slate-800 bg-white font-bold">EFETIVO</option>
                                                    </select>
                                                </div>
                                            </td>

                                            <td className="p-2 border border-slate-300 text-center">
                                                <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                                    <button
                                                        onClick={() => updateOculosRow(colab.id, 'intacto', true)}
                                                        className={`px-3 py-1.5 rounded-md text-[11px] uppercase font-black transition-all ${log.intacto === true ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        SIM
                                                    </button>
                                                    <button
                                                        onClick={() => updateOculosRow(colab.id, 'intacto', false)}
                                                        className={`px-3 py-1.5 rounded-md text-[11px] uppercase font-black transition-all ${log.intacto === false ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        NÃO
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="p-2 border border-slate-300 align-middle">
                                                <div onPointerDownCapture={prepareSignatureInteraction} className="w-full border border-slate-300 rounded-lg bg-white min-h-[42px] flex items-center p-1 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                                                    <SignatureSelector
                                                        value={log.assinatura}
                                                        onChange={(val) => updateOculosRow(colab.id, "assinatura", val)}
                                                    />
                                                </div>
                                            </td>

                                            <td className="p-2 border border-slate-300">
                                                <input
                                                    type="text"
                                                    value={log.observacao || ''}
                                                    onChange={(e) => updateOculosRow(colab.id, "observacao", e.target.value)}
                                                    className="w-full bg-transparent p-2 font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-lg transition-all text-sm"
                                                    placeholder={log.intacto === false ? "Descreva o que ocorreu..." : "Adicionar nota..."}
                                                />
                                            </td>

                                            <td className="p-2 border border-slate-300 text-center align-middle">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => abrirModalEdicao(colab)}
                                                        className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors inline-flex justify-center items-center"
                                                        title="Editar Colaborador"
                                                    >
                                                        <BiPen size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => desativarColaboradorOculos(colab.id)}
                                                        className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors inline-flex justify-center items-center"
                                                        title="Desativar Colaborador"
                                                    >
                                                        <BiTrash size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}