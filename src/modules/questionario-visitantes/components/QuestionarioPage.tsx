"use client";
import React from 'react';
import Link from 'next/link';
import SignaturePad from '@/components/SignaturePad';
import { PERGUNTAS_VISITANTE, GRUPOS_VISITANTE } from '../model/questionarioModel';
import { useQuestionarioController } from '../controller/useQuestionarioController';
import { BiUser, BiBuildings, BiCalendar, BiNote, BiShieldAlt2, BiHistory, BiX } from 'react-icons/bi';
import { FaHeartbeat, FaBrain, FaAllergies } from 'react-icons/fa';

const CONFIGURACAO_VISUAL_GRUPOS: Record<number, any> = {
    1: {
        icon: <FaHeartbeat className="text-red-500" size={18} />,
        accentColor: 'border-red-400 bg-red-50',
        titleColor: 'text-red-700',
        badgeColor: 'bg-red-100 text-red-700 border-red-200',
    },
    2: {
        icon: <FaBrain className="text-amber-500" size={18} />,
        accentColor: 'border-amber-400 bg-amber-50',
        titleColor: 'text-amber-700',
        badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    3: {
        icon: <FaAllergies className="text-purple-500" size={18} />,
        accentColor: 'border-purple-400 bg-purple-50',
        titleColor: 'text-purple-700',
        badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    }
};

export default function QuestionarioPage() {
    const {
        visitante,
        respostas,
        assinaturaRascunho,
        lidarComMudancaVisitante,
        handleResposta,
        atualizarAssinaturaRascunho,
        salvarQuestionario,
    } = useQuestionarioController();

    const totalPerguntas = PERGUNTAS_VISITANTE.length;
    const totalRespondidas = Object.keys(respostas).length;
    const percentual = Math.round((totalRespondidas / totalPerguntas) * 100);

    // 🟢 LÓGICA DE BLOQUEIO: Verifica se existe alguma resposta marcada como 'sim'
    const temSintomas = Object.values(respostas).includes('sim');

    const renderizarPerguntas = (grupoId: number) => {
        const visual = CONFIGURACAO_VISUAL_GRUPOS[grupoId];

        return PERGUNTAS_VISITANTE.filter(p => p.grupo === grupoId).map((pergunta) => {
            const resposta = respostas[pergunta.id];
            return (
                <div
                    key={pergunta.id}
                    className={`flex flex-row justify-between items-center py-1.5 px-3 rounded-lg mb-1 gap-2 transition-colors duration-200 ${resposta === 'sim' ? 'bg-red-50 border border-red-200' : resposta === 'nao' ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-100'}`}
                >
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 leading-snug">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black border mr-1.5 ${visual.badgeColor}`}>
                                {pergunta.id}
                            </span>
                            {pergunta.en}
                        </p>
                        <p className="text-[10px] text-gray-400 ml-6 italic">{pergunta.pt}</p>
                    </div>
                    {/* BOTÕES YES/NO */}
                    <div className="flex gap-1.5 shrink-0">
                        <button
                            onClick={() => handleResposta(pergunta.id, 'sim')}
                            className={`w-14 py-1 flex flex-col items-center justify-center rounded-lg transition-all active:scale-95 border ${resposta === 'sim' ? 'bg-red-600 text-white shadow-sm shadow-red-200 border-red-600' : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-700 border-gray-200'}`}
                        >
                            <span className="text-[11px] font-black uppercase tracking-wider leading-none mt-0.5">YES</span>
                            <span className="text-[8px] font-semibold tracking-wide leading-none mt-0.5 opacity-90 capitalize">(Sim)</span>
                        </button>
                        <button
                            onClick={() => handleResposta(pergunta.id, 'nao')}
                            className={`w-14 py-1 flex flex-col items-center justify-center rounded-lg transition-all active:scale-95 border ${resposta === 'nao' ? 'bg-green-600 text-white shadow-sm shadow-green-200 border-green-600' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700 border-gray-200'}`}
                        >
                            <span className="text-[11px] font-black uppercase tracking-wider leading-none mt-0.5">NO</span>
                            <span className="text-[8px] font-semibold tracking-wide leading-none mt-0.5 opacity-90 capitalize">(Não)</span>
                        </button>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="min-h-screen bg-gray-100 p-3 font-sans flex justify-center">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-xl flex flex-col overflow-hidden relative">

                {/* ===== HEADER ESCURO PADRÃO GV ===== */}
                <div className="bg-[#1a1c23] text-white">
                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-green-500 flex items-center justify-center font-black rounded-lg text-white text-sm shadow-lg">GV</div>

                            <Link
                                href="/historico?modulo=visitantes"
                                className="text-xs font-bold flex items-center gap-1.5 bg-blue-500/20 text-blue-100 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/30 border border-blue-500/30 transition-all"
                            >
                                <BiHistory size={14} /> Histórico
                            </Link>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none">PHU-038</p>
                            <h1 className="text-base font-black uppercase tracking-wide leading-tight">Visitor's Health Questionnaire</h1>
                            <p className="text-gray-400 text-[10px]">Questionário de Saúde de Visitas</p>
                        </div>
                        <div className="text-right text-[10px] font-medium text-gray-400 hidden sm:block">
                            <p>GrandValle</p>
                            <p className="text-yellow-400 font-bold">Certifications</p>
                        </div>
                    </div>

                    {/* Barra de progresso */}
                    <div className="px-4 pb-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Progresso</span>
                            <span className="text-[11px] font-black text-green-400">{totalRespondidas}/{totalPerguntas} respondidas</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${percentual}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ===== CORPO ===== */}
                <div className="p-3 bg-gray-50 flex-1 space-y-3">

                    {/* Dados do Visitante */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                        <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <BiUser className="text-green-600" size={14} /> Dados do Visitante
                        </h2>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <BiCalendar size={11} /> Date / Data
                                </label>
                                <input
                                    type="date"
                                    value={visitante.data}
                                    onChange={e => lidarComMudancaVisitante('data', e.target.value)}
                                    className="w-full h-9 border-2 border-gray-200 rounded-lg px-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <BiUser size={11} /> Full Name / Nome
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nome completo..."
                                    value={visitante.nome}
                                    onChange={e => lidarComMudancaVisitante('nome', e.target.value.toUpperCase())}
                                    className="w-full h-9 border-2 border-gray-200 rounded-lg px-2.5 text-xs font-bold text-gray-800 placeholder-gray-300 focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <BiBuildings size={11} /> Company / Empresa
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nome da empresa..."
                                    value={visitante.empresa}
                                    onChange={e => lidarComMudancaVisitante('empresa', e.target.value.toUpperCase())}
                                    className="w-full h-9 border-2 border-gray-200 rounded-lg px-2.5 text-xs font-bold text-gray-800 placeholder-gray-300 focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <BiNote size={11} /> Reason / Motivo
                                </label>
                                <input
                                    type="text"
                                    placeholder="Motivo da visita..."
                                    value={visitante.motivo}
                                    onChange={e => lidarComMudancaVisitante('motivo', e.target.value.toUpperCase())}
                                    className="w-full h-9 border-2 border-gray-200 rounded-lg px-2.5 text-xs font-bold text-gray-800 placeholder-gray-300 focus:outline-none focus:border-green-500 bg-gray-50 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Seções de perguntas */}
                    {GRUPOS_VISITANTE.map((grupo) => {
                        const visual = CONFIGURACAO_VISUAL_GRUPOS[grupo.id];
                        return (
                            <div key={grupo.id} className={`bg-white rounded-xl border-l-4 ${visual.accentColor} shadow-sm overflow-hidden`}>
                                <div className="px-3 py-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        {visual.icon}
                                        <div>
                                            <p className={`text-xs font-black ${visual.titleColor} leading-snug`}>{grupo.en}</p>
                                            <p className="text-[10px] text-gray-500 italic">{grupo.pt}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2 space-y-1">
                                    {renderizarPerguntas(grupo.id)}
                                </div>
                            </div>
                        );
                    })}

                    {/* 🟢 Aviso de Bloqueio ou Área de Assinatura */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
                        {temSintomas ? (
                            <div className="bg-red-50 border-2 border-red-200 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                                <BiX size={32} className="text-red-600 shrink-0" />
                                <div>
                                    <h4 className="font-black text-red-800 uppercase text-xs">Acesso Restrito / Restricted Access</h4>
                                    <p className="text-[11px] text-red-700 font-medium mt-1 leading-relaxed">
                                        Por questões de segurança e saúde, o acesso não pode ser liberado neste momento. Entre em contato com um membro da nossa equipe operacional..
                                        <br />
                                        <span className="italic opacity-80">For health and safety reasons, access cannot be granted. Please contact a member of our operational team.</span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg px-3 py-2 flex items-center gap-2 mb-3">
                                    <BiShieldAlt2 className="text-amber-500 shrink-0" size={16} />
                                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                                        By signing, I declare all information is true. • Ao assinar, declaro que as informações são verdadeiras.
                                    </p>
                                </div>
                                <SignaturePad
                                    onSave={salvarQuestionario}
                                    initialSignature={assinaturaRascunho}
                                    onSignatureChange={atualizarAssinaturaRascunho}
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* ===== RODAPÉ ===== */}
                <div className="px-4 py-2.5 bg-[#1a1f2e] border-t border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-green-600 flex items-center justify-center font-black text-white text-[10px]">GV</div>
                        <p className="text-[10px] font-bold text-gray-400">GrandValle Industries</p>
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">PHU-038</p>
                </div>

            </div>
        </div>
    );
}