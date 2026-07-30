"use client";

import { useState, useEffect, useMemo } from "react";
import {
    BiSearch, BiGlasses, BiPlus, BiUserPlus, BiX, BiUserX,
    BiLock, BiPen, BiError, BiTrash, BiNote, BiChevronDown, BiChevronUp
} from "react-icons/bi";
import { SignatureSelector } from "../../../components/SignatureSelector";

const DIAS_SEMANA = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

interface AbaOculosProps {
    isLoading?: boolean;
    oculosLogs: any[];
    colaboradoresOculos: any[];
    updateOculosRow: (colaboradorId: string, field: string, value: any) => void;
    toggleDiaOculos: (colaboradorId: string, dia: string) => void;
    prepareSignatureInteraction: () => void;
    adicionarColaboradorOculos: (nome: string, tipo: "EFETIVO" | "CONTRATADO") => Promise<void>;
    desativarColaboradorOculos: (id: string) => Promise<void>;
    atualizarTipoColaborador: (id: string, tipo: "EFETIVO" | "CONTRATADO") => Promise<void>;
    editarColaboradorOculos?: (id: string, nome: string, tipo: "EFETIVO" | "CONTRATADO") => Promise<void>;
    reativarColaboradorOculos?: (id: string, nome: string, tipo: "EFETIVO" | "CONTRATADO") => Promise<void>;
    dataInicio?: string;
    setDataInicio?: (val: string) => void;
    dataFim?: string;
    setDataFim?: (val: string) => void;
    observacaoGeral?: string;
    setObservacaoGeral?: (val: string) => void;
    // 🔥 Props do controller para status
    statusMap: Record<string, { status: string; obsList: { idObs: string, tipo: string, texto: string }[] }>;
    handleUpdateStatusDropdown: (id: string, novoStatus: string) => void;
    handleUpdateObsText: (idUser: string, idObs: string, novoTexto: string) => void;
    handleDeleteObs: (idUser: string, idObs: string) => void;
}

export function AbaOculos({
    isLoading = false,
    oculosLogs,
    colaboradoresOculos,
    updateOculosRow,
    toggleDiaOculos,
    prepareSignatureInteraction,
    adicionarColaboradorOculos,
    desativarColaboradorOculos,
    atualizarTipoColaborador,
    editarColaboradorOculos,
    reativarColaboradorOculos,
    dataInicio,
    setDataInicio,
    dataFim,
    setDataFim,
    observacaoGeral = "",
    setObservacaoGeral,
    statusMap,
    handleUpdateStatusDropdown,
    handleUpdateObsText,
    handleDeleteObs
}: AbaOculosProps) {
    const [busca, setBusca] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showObsGeral, setShowObsGeral] = useState(false);

    // 🔥 Estado local para o textarea, sincronizado com a prop
    const [obsGeralLocal, setObsGeralLocal] = useState(observacaoGeral);

    useEffect(() => {
        setObsGeralLocal(observacaoGeral);
    }, [observacaoGeral]);

    const handleObsGeralChange = (value: string) => {
        setObsGeralLocal(value);
        if (setObservacaoGeral) {
            setObservacaoGeral(value);
        }
    };

    const handleLimparObsGeral = () => {
        setObsGeralLocal("");
        if (setObservacaoGeral) {
            setObservacaoGeral("");
        }
    };

    const [colabEditando, setColabEditando] = useState<any>(null);
    const [novoColabNome, setNovoColabNome] = useState("");
    const [novoColabTipo, setNovoColabTipo] = useState<"EFETIVO" | "CONTRATADO">("CONTRATADO");
    const [errorMsg, setErrorMsg] = useState("");

    const [assinaturasSemanais, setAssinaturasSemanais] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        oculosLogs.forEach(log => {
            if (log.assinaturaSemanal) {
                initial[log.colaboradorId] = log.assinaturaSemanal;
            }
        });
        return initial;
    });

    useEffect(() => {
        const novasAssinaturas: Record<string, string> = {};
        oculosLogs.forEach(log => {
            if (log.assinaturaSemanal) {
                novasAssinaturas[log.colaboradorId] = log.assinaturaSemanal;
            }
        });
        setAssinaturasSemanais(novasAssinaturas);
    }, [oculosLogs]);

    // ------------------------------------------------------------
    // ORDENAÇÃO DINÂMICA (usa o statusMap do controller)
    // ------------------------------------------------------------
    const funcionariosOrdenados = useMemo(() => {
        const filtrados = (colaboradoresOculos || [])
            .filter(c => c.nome?.toLowerCase().includes(busca.toLowerCase()));

        return [...filtrados].sort((a, b) => {
            const statusA = statusMap[a.id]?.status || 'NORMAL';
            const statusB = statusMap[b.id]?.status || 'NORMAL';

            const isTopA = (statusA === 'NORMAL' || statusA === 'OUTROS');
            const isTopB = (statusB === 'NORMAL' || statusB === 'OUTROS');

            if (isTopA && !isTopB) return -1;
            if (!isTopA && isTopB) return 1;

            return a.nome.localeCompare(b.nome);
        });
    }, [colaboradoresOculos, busca, statusMap]);
    // Observações e incidentes
    const observacoesGerais = funcionariosOrdenados.flatMap(colab => {
        const current = statusMap[colab.id];
        if (!current || !current.obsList || current.obsList.length === 0) return [];
        return current.obsList.map(obs => ({
            idUser: colab.id,
            idObs: obs.idObs,
            nome: colab.nome,
            tipo: obs.tipo,
            texto: obs.texto
        }));
    });

    const incidentesGerais = oculosLogs.flatMap(log => {
        const colab = colaboradoresOculos.find(c => String(c.id) === String(log.colaboradorId));
        return DIAS_SEMANA
            .filter(dia => log.dias?.[dia] === false)
            .map(dia => ({
                colabId: log.colaboradorId,
                nome: colab?.nome || "Desconhecido",
                dia,
                dados: log.incidentes?.[dia] || { observacao: "", assinatura: "" }
            }));
    });

    const handleAssinaturaChange = (colaboradorId: string, val: string) => {
        setAssinaturasSemanais(prev => ({ ...prev, [colaboradorId]: val }));
        updateOculosRow(colaboradorId, 'assinaturaSemanal', val);
    };

    const handleDeleteIncidente = (colaboradorId: string, dia: string) => {
        const log = oculosLogs.find(l => String(l.colaboradorId) === String(colaboradorId));
        if (!log) return;

        const novosIncidentes = { ...log.incidentes };
        delete novosIncidentes[dia];

        const novosDias = { ...log.dias };
        novosDias[dia] = null;

        updateOculosRow(colaboradorId, 'incidentes', novosIncidentes);
        updateOculosRow(colaboradorId, 'dias', novosDias);
    };

    // Modal de colaborador
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

    const toggleObsGeral = () => {
        setShowObsGeral(!showObsGeral);
    };

    // ---------- RENDER ----------
    return (
        <div className="space-y-6 animate-fade-in relative">

            {/* MODAL DE CADASTRO/EDIÇÃO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 animate-fade-in">
                        <div className="flex justify-between items-center mb-6 border-b pb-3">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                {colabEditando ? <BiPen size={24} className="text-blue-600" /> : <BiUserPlus size={24} className="text-emerald-600" />}
                                {colabEditando ? "Editar Colaborador" : "Novo Colaborador"}
                            </h3>
                            <button onClick={() => { resetModal(); setIsModalOpen(false); }} className="text-slate-400 hover:text-red-600 transition-colors">
                                <BiX size={28} />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={novoColabNome}
                                    onChange={e => setNovoColabNome(e.target.value)}
                                    className="w-full border-2 border-slate-300 rounded-lg px-4 py-2.5 font-bold text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 uppercase transition-all"
                                    placeholder="EX: JOÃO DA SILVA"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Status / Contrato</label>
                                <select
                                    value={novoColabTipo}
                                    onChange={e => setNovoColabTipo(e.target.value as "EFETIVO" | "CONTRATADO")}
                                    className="w-full border-2 border-slate-300 rounded-lg px-4 py-2.5 font-bold text-slate-800 bg-white outline-none focus:border-blue-500 cursor-pointer transition-all"
                                >
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
                            <button onClick={() => { resetModal(); setIsModalOpen(false); }} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                            <button onClick={handleSalvarColaborador} className={`px-6 py-2.5 text-white font-black rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 ${colabEditando ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CABEÇALHO COM LEGENDA */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col lg:flex-row gap-4 lg:gap-6 justify-between">
                <div className="flex gap-3 md:gap-4 items-start">
                    <div className="bg-blue-100 p-3 rounded-xl border border-blue-200 shadow-inner shrink-0">
                        <BiGlasses className="text-blue-600" size={28} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-black text-slate-800 text-base md:text-xl uppercase tracking-tight">Controle de Óculos</h3>
                        <p className="text-xs md:text-sm text-slate-500 font-medium mb-2">Acompanhamento de uso e registros de incidentes.</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="date"
                                value={dataInicio || ""}
                                onChange={(e) => setDataInicio && setDataInicio(e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs md:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 w-auto max-w-[130px] md:max-w-[150px]"
                            />
                            <span className="font-bold text-slate-400 text-xs md:text-sm">até</span>
                            <input
                                type="date"
                                value={dataFim || ""}
                                onChange={(e) => setDataFim && setDataFim(e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs md:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 w-auto max-w-[130px] md:max-w-[150px]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-slate-200">
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-4 h-4 md:w-5 md:h-5 bg-emerald-100 border-2 border-emerald-400 rounded text-emerald-600 text-center leading-4 md:leading-5 text-xs md:text-sm">✓</span>
                            CONFORME
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-4 h-4 md:w-5 md:h-5 bg-rose-100 border-2 border-rose-400 rounded text-rose-600 text-center leading-4 md:leading-5 text-xs md:text-sm">✗</span>
                            NÃO CONFORME
                        </span>
                        {/* 🔥 Legenda da Falta */}
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-4 h-4 md:w-5 md:h-5 bg-red-600 border-2 border-red-700 rounded text-white text-center leading-4 md:leading-5 text-[10px] md:text-xs font-black">F</span>
                            FALTA
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="inline-block w-4 h-4 md:w-5 md:h-5 bg-slate-50 border-2 border-slate-300 rounded text-slate-400 text-center leading-4 md:leading-5 text-xs md:text-sm">-</span>
                            Não marcado
                        </span>
                    </div>
                </div>
            </div>

            {/* BARRA DE BUSCA E BOTÕES */}
            <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="relative flex-1 max-w-full sm:max-w-md">
                    <BiSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar colaborador..."
                        className="w-full pl-9 pr-3 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs md:text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all uppercase"
                    />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={toggleObsGeral}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs md:text-sm uppercase transition-all shadow-md active:scale-95 ${showObsGeral ? 'bg-indigo-700 hover:bg-indigo-800 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                    >
                        <BiNote size={18} />
                        Observações Gerais
                        {observacaoGeral && observacaoGeral.trim() !== "" && (
                            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                        )}
                        {showObsGeral ? <BiChevronUp size={18} /> : <BiChevronDown size={18} />}
                    </button>

                    <button
                        onClick={() => { resetModal(); setIsModalOpen(true); }}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-black text-xs md:text-sm uppercase flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 whitespace-nowrap"
                    >
                        <BiPlus size={18} /> Cadastrar
                    </button>
                </div>
            </div>

            {/* LEGENDA RÁPIDA */}
            <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50/80 border border-blue-200 rounded-lg flex-wrap">
                <BiGlasses className="text-blue-600 shrink-0" size={18} />
                <span className="text-sm md:text-base font-black text-slate-800">Óculos intacto?</span>
                <span className="text-xs text-slate-500">(Clique nos botões para marcar)</span>
            </div>

            {/* TABELA */}
            <div className="rounded-2xl shadow-sm bg-white overflow-hidden border-2 border-slate-200">
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <table className="w-full text-xs md:text-sm text-left min-w-[900px] md:min-w-[1000px]">
                        <thead className="bg-slate-100 text-slate-600 uppercase font-black text-[10px] md:text-[11px] tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="p-2 md:p-4 border-b-2 border-slate-300 text-left">Colaborador</th>
                                {DIAS_SEMANA.map(dia => (
                                    <th key={dia} className="p-2 md:p-4 border-b-2 border-slate-300 text-center w-12 md:w-16">{dia}</th>
                                ))}
                                <th className="p-2 md:p-4 border-b-2 border-slate-300 text-center w-28 md:w-32">Situação</th>
                                <th className="p-2 md:p-4 border-b-2 border-slate-300 text-center w-36 md:w-48">Responsável</th>
                                <th className="p-2 md:p-4 border-b-2 border-slate-300 text-center w-20 md:w-24">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-500 font-bold">Carregando colaboradores... ⏳</td>
                                </tr>
                            ) : funcionariosOrdenados.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-500 font-bold">Nenhum colaborador encontrado.</td>
                                </tr>
                            ) : (
                                funcionariosOrdenados.map((colab, index) => {
                                    const log = oculosLogs.find(l => String(l.colaboradorId) === String(colab.id)) || { dias: {} };
                                    const isInativo = colab.status === 'INATIVO';
                                    const bgColor = index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70';
                                    const currentStatusObj = statusMap[colab.id] || { status: 'NORMAL', obsList: [] };
                                    const currentStatus = currentStatusObj.status;

                                    const corLinha =
                                        currentStatus === 'FERIAS' ? 'bg-blue-50' :
                                            currentStatus === 'LICENCA' ? 'bg-amber-50' :
                                                currentStatus === 'AFASTADO' ? 'bg-slate-100' :
                                                    currentStatus === 'CAMPO' ? 'bg-purple-50' :
                                                        '';

                                    return (
                                        <tr key={colab.id} className={`${bgColor} ${corLinha} hover:bg-slate-100 transition-colors group border-b border-slate-200 ${isInativo ? 'opacity-60 grayscale-[50%]' : ''}`}>
                                            <td className="p-2 md:p-4 border-r border-slate-200">
                                                <div className="font-bold text-slate-800 text-[11px] md:text-[13px] uppercase flex items-center gap-2 flex-wrap">
                                                    {colab.nome}
                                                    {currentStatus !== 'NORMAL' && (
                                                        <span className={`text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded-full uppercase
                                                            ${currentStatus === 'FERIAS' ? 'bg-blue-200 text-blue-800' :
                                                                currentStatus === 'LICENCA' ? 'bg-amber-200 text-amber-800' :
                                                                    currentStatus === 'AFASTADO' ? 'bg-slate-300 text-slate-700' :
                                                                        currentStatus === 'CAMPO' ? 'bg-purple-200 text-purple-800' :
                                                                            'bg-zinc-200 text-zinc-800' // Cor padrão para 'OUTROS'
                                                            }`}
                                                        >
                                                            {currentStatus}
                                                        </span>
                                                    )}
                                                </div>
                                                <select
                                                    value={colab.tipo}
                                                    onChange={(e) => handleTipoChange(colab.id, e.target.value as "EFETIVO" | "CONTRATADO")}
                                                    className={`text-[8px] md:text-[10px] font-black tracking-widest mt-0.5 bg-transparent border-none outline-none cursor-pointer p-0 hover:opacity-75 transition-opacity appearance-none uppercase ${colab.tipo === 'EFETIVO' ? 'text-emerald-600' : 'text-amber-600'}`}
                                                >
                                                    <option value="CONTRATADO" className="text-slate-800 font-bold">CONTRATADO</option>
                                                    <option value="EFETIVO" className="text-slate-800 font-bold">EFETIVO</option>
                                                </select>
                                            </td>

                                            {DIAS_SEMANA.map(dia => {
                                                const status = log.dias?.[dia];
                                                const isFalta = status === "F";
                                                const isConforme = status === true;
                                                const isNaoConforme = status === false;

                                                return (
                                                    <td key={dia} className="p-1 md:p-2 text-center border-r border-slate-200">
                                                        <button
                                                            onClick={() => toggleDiaOculos(colab.id, dia)}
                                                            disabled={isInativo || (currentStatus !== 'NORMAL' && currentStatus !== 'OUTROS')}
                                                            className={`w-8 h-8 md:w-10 md:h-10 mx-auto rounded-xl flex items-center justify-center font-black text-xs md:text-sm transition-all duration-200 border-2 active:scale-90 
                                                            ${isConforme
                                                                    ? 'bg-emerald-100 border-emerald-400 text-emerald-600 shadow-sm'
                                                                    : isNaoConforme
                                                                        ? 'bg-rose-100 border-rose-400 text-rose-600 shadow-sm animate-pulse'
                                                                        : isFalta
                                                                            ? 'bg-red-600 border-red-700 text-white shadow-sm' // 🔥 Estilo para a Falta
                                                                            : 'bg-slate-50 border-slate-200 text-slate-300 hover:bg-slate-100'
                                                                } ${isInativo || (currentStatus !== 'NORMAL' && currentStatus !== 'OUTROS') ? 'cursor-not-allowed opacity-60' : ''}`}
                                                            title={isConforme ? "CONFORME" : isNaoConforme ? "NÃO CONFORME" : isFalta ? "FALTA" : "Clique para marcar"}
                                                        >
                                                            {isConforme ? '✓' : isNaoConforme ? '✗' : isFalta ? 'F' : '-'}
                                                        </button>
                                                    </td>
                                                );
                                            })}

                                            <td className="p-1 md:p-2 text-center border-r border-slate-200">
                                                <select
                                                    value={currentStatus}
                                                    onChange={(e) => handleUpdateStatusDropdown(colab.id, e.target.value)}
                                                    disabled={isInativo}
                                                    className={`w-full p-1.5 rounded-md text-[10px] md:text-[11px] font-bold uppercase outline-none border cursor-pointer transition-colors disabled:opacity-50
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

                                            <td className="p-1 md:p-2 text-center border-r border-slate-200">
                                                <div className={`border border-slate-200 rounded-lg bg-slate-50 min-h-[40px] md:min-h-[52px] focus-within:border-blue-500 transition-all overflow-hidden ${isInativo ? 'pointer-events-none opacity-50' : ''}`}>
                                                    <SignatureSelector
                                                        value={assinaturasSemanais[colab.id] || ""}
                                                        onChange={(val) => handleAssinaturaChange(colab.id, val || "")}
                                                    />
                                                </div>
                                            </td>

                                            <td className="p-2 md:p-4 text-center align-middle opacity-60 group-hover:opacity-100 transition-opacity">
                                                <div className="flex items-center justify-center gap-0.5 md:gap-1">
                                                    <button onClick={() => abrirModalEdicao(colab)} className="text-slate-400 hover:text-blue-600 p-1.5 md:p-2 rounded-lg hover:bg-blue-50 transition-colors">
                                                        <BiPen size={15} className="md:text-base" />
                                                    </button>
                                                    {!isInativo ? (
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`Tem certeza que deseja desativar ${colab.nome}?`)) {
                                                                    desativarColaboradorOculos(colab.id);
                                                                }
                                                            }}
                                                            className="text-slate-400 hover:text-rose-600 p-1.5 md:p-2 rounded-lg hover:bg-rose-50 transition-colors"
                                                            title="Desativar colaborador"
                                                        >
                                                            <BiUserX size={15} className="md:text-base" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300 p-1.5 md:p-2" title="Colaborador inativo">
                                                            <BiLock size={15} className="md:text-base" />
                                                        </span>
                                                    )}
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

            {/* 🔥 SEÇÃO EXPANSÍVEL DE OBSERVAÇÕES GERAIS */}
            {showObsGeral && (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 md:p-6 shadow-sm animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-indigo-800 text-base md:text-lg uppercase tracking-tight flex items-center gap-2">
                            <BiNote size={20} className="md:text-2xl" /> Observações Gerais da Semana
                        </h3>
                        <div className="flex items-center gap-2">
                            {obsGeralLocal && obsGeralLocal.trim() !== "" && (
                                <button
                                    onClick={handleLimparObsGeral}
                                    className="text-red-600 hover:text-red-800 font-bold text-xs flex items-center gap-1 transition-colors bg-red-50 px-3 py-1.5 rounded-lg border border-red-200"
                                    title="Apagar observação"
                                >
                                    <BiTrash size={14} /> Limpar
                                </button>
                            )}
                            <button
                                onClick={toggleObsGeral}
                                className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1 transition-colors"
                            >
                                <BiX size={18} /> Fechar
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-indigo-600 mb-3">
                        Utilize este campo para justificar a falta de preenchimento em dias específicos (ex: feriado, manutenção, intercorrência).
                    </p>
                    <textarea
                        value={obsGeralLocal}
                        onChange={(e) => handleObsGeralChange(e.target.value)}
                        placeholder="Ex: Feriado na quarta-feira, não houve verificação."
                        className="w-full border-2 border-indigo-300 rounded-lg px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-y bg-white"
                    />
                </div>
            )}

            {/* RODAPÉ DE OBSERVAÇÕES (SITUAÇÃO) */}
            {observacoesGerais.length > 0 && (
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 md:p-6 shadow-sm animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-500" />
                    <h3 className="font-black text-orange-800 text-base md:text-lg uppercase tracking-tight flex items-center gap-2 mb-4 md:mb-6 mt-1">
                        <BiError size={20} className="md:text-2xl" /> Registros de Observação
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {observacoesGerais.map((obs) => (
                            <div key={obs.idObs} className="bg-white border border-orange-100 rounded-xl p-4 md:p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-400" />
                                <div className="flex justify-between items-center pl-2">
                                    <div className="flex flex-col gap-1 overflow-hidden pr-2">
                                        <span className="font-black text-slate-800 uppercase text-xs md:text-sm truncate">{obs.nome}</span>
                                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 md:px-3 md:py-1 rounded-lg font-black text-[8px] md:text-[10px] tracking-widest uppercase w-fit">
                                            {obs.tipo === 'FERIAS' ? 'FÉRIAS' : obs.tipo}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteObs(obs.idUser, obs.idObs)}
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 md:p-2 rounded-lg transition-colors shrink-0"
                                        title="Excluir Observação"
                                    >
                                        <BiTrash size={18} className="md:text-xl" />
                                    </button>
                                </div>
                                <div className="mt-1 pl-2">
                                    <label className="block text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Observação</label>
                                    <input
                                        type="text"
                                        value={obs.texto}
                                        onChange={(e) => handleUpdateObsText(obs.idUser, obs.idObs, e.target.value)}
                                        placeholder="Digite os detalhes e exceções..."
                                        className="w-full bg-slate-50 border border-slate-200 p-2 md:p-3 rounded-lg text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-all"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* RODAPÉ DE INCIDENTES (AÇÃO CORRETIVA) */}
            {incidentesGerais.length > 0 && (
                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 md:p-6 shadow-sm animate-fade-in mt-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
                    <h3 className="font-black text-rose-800 text-base md:text-lg uppercase tracking-tight flex items-center gap-2 mb-4 md:mb-6 mt-1">
                        <BiError size={20} className="md:text-2xl" /> Registros de Ação Corretiva
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {incidentesGerais.map((inc, idx) => (
                            <div key={idx} className="bg-white border border-rose-100 rounded-xl p-4 md:p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-400" />
                                <div className="flex justify-between items-start pl-2">
                                    <div className="flex-1 min-w-0">
                                        <span className="font-black text-slate-800 uppercase text-xs md:text-sm truncate block">{inc.nome}</span>
                                        <span className="bg-rose-100 text-rose-700 px-2 py-0.5 md:px-3 md:py-1 rounded-lg font-black text-[8px] md:text-[10px] tracking-widest uppercase inline-block mt-1">Incidente: {inc.dia}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteIncidente(inc.colabId, inc.dia)}
                                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors shrink-0 ml-2"
                                        title="Remover incidente e limpar observação"
                                    >
                                        <BiTrash size={18} className="md:text-xl" />
                                    </button>
                                </div>
                                <div className="mt-1 pl-2">
                                    <label className="block text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Observação</label>
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            value={inc.dados.observacao}
                                            onChange={(e) => {
                                                const log = oculosLogs.find(l => String(l.colaboradorId) === String(inc.colabId));
                                                const novosIncidentes = { ...log.incidentes, [inc.dia]: { ...log.incidentes[inc.dia], observacao: e.target.value } };
                                                updateOculosRow(inc.colabId, 'incidentes', novosIncidentes);
                                            }}
                                            placeholder="Ex: Lente quebrada, armação danificada..."
                                            className="flex-1 bg-slate-50 border border-slate-200 p-2 md:p-3 rounded-lg text-xs md:text-sm font-medium text-slate-700 outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                                        />
                                        <button
                                            onClick={() => {
                                                const log = oculosLogs.find(l => String(l.colaboradorId) === String(inc.colabId));
                                                const novosIncidentes = { ...log.incidentes, [inc.dia]: { ...log.incidentes[inc.dia], observacao: "" } };
                                                updateOculosRow(inc.colabId, 'incidentes', novosIncidentes);
                                            }}
                                            className="text-slate-400 hover:text-orange-600 p-1.5 rounded-lg hover:bg-orange-50 transition-colors shrink-0"
                                            title="Limpar observação"
                                        >
                                            <BiX size={18} className="md:text-xl" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}