"use client";

import { useState } from "react";
import Link from "next/link";
import {
    BiHistory, BiPlus, BiCheckCircle,
    BiXCircle, BiShieldQuarter, BiMapAlt, BiTrash, BiInfoCircle, BiDownload
} from "react-icons/bi";
import { SignatureSelector } from "../../../components/SignatureSelector";
import { useControleAcessoController } from "../controller/useControleAcessoController";

export default function ControleAcessoPage() {
    const {
        registros, setor, setSetor, assinaturaResp, setAssinaturaResp,
        atualizarCampo, finalizarAcesso, adicionarLinha, removerLinha,
        emTransito, totalHoje,
        // 🟢 CORREÇÃO: Trocado o método antigo pela nova função assíncrona do controller
        exportarExcel
    } = useControleAcessoController();

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-sans text-gray-800 flex justify-center">

            {/* CONTAINER PRINCIPAL IGUAL AO PADRÃO (max-w-6xl) */}
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-xl flex flex-col overflow-hidden transition-all duration-300">

                {/* ================= HEADER ESCURO PADRÃO GV ================= */}
                <div className="bg-[#1a1c23] text-white">
                    <div className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500 flex items-center justify-center font-black rounded-lg text-white text-xl shadow-lg">GV</div>
                            {/* 🟢 CORREÇÃO: Transformado em Link do Next.js apontando para o módulo correto */}
                            <Link
                                href="/historico?modulo=acesso"
                                className="text-sm font-bold flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 border border-white/20 transition-all"
                            >
                                <BiHistory size={18} /> Histórico
                            </Link>
                        </div>
                        <div className="text-center">
                            <h1 className="text-2xl font-black uppercase tracking-wide">Controle de Segurança</h1>
                        </div>
                        <div className="text-right text-[10px] font-medium text-gray-400 hidden md:block">
                            <p>Rev: <span className="font-bold text-yellow-400">Clebitânia Carvalho</span></p>
                            <p>07/05/2026</p>
                        </div>
                    </div>
                </div>

                {/* ================= CORPO DA PÁGINA ================= */}
                <div className="p-4 sm:p-6 bg-gray-50 flex-1 overflow-auto space-y-6">

                    {/* CARD SUPERIOR DE INFORMAÇÕES */}
                    <div className="bg-cyan-50/70 p-5 rounded-xl border border-cyan-200 shadow-sm flex flex-col lg:flex-row gap-6 animate-fade-in">

                        <div className="flex-1 flex flex-col justify-between">
                            <div className="flex items-center gap-3 mb-5 lg:mb-0">
                                <div className="p-2.5 bg-cyan-100 text-cyan-700 rounded-lg shadow-sm border border-cyan-200/50">
                                    <BiShieldQuarter size={22} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Protocolo de Entrada por Setor</h2>
                                    <p className="text-xs text-gray-500">Controle diário de acesso de visitantes</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                                        <BiMapAlt size={14} /> Setor
                                    </label>
                                    <input
                                        type="text" value={setor} onChange={(e) => setSetor(e.target.value.toUpperCase())}
                                        className="w-full h-11 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none transition-all shadow-sm focus:ring-2 focus:ring-cyan-500"
                                        placeholder="QUAL O SETOR?"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                                        Responsável
                                    </label>
                                    <div className={`border border-gray-300 rounded-lg flex flex-col items-center justify-center shadow-sm px-2 py-2 transition-all ${assinaturaResp ? 'bg-white border-emerald-200' : 'bg-white'}`}>
                                        <SignatureSelector value={assinaturaResp} onChange={setAssinaturaResp} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RESUMO E BOTÃO (Lateral Direita do Card) */}
                        <div className="lg:w-64 flex flex-col gap-4">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-center flex-1">
                                <h3 className="text-sm font-bold text-center text-gray-800 mb-4 tracking-tighter">RESUMO DO DIA</h3>
                                <div className="space-y-2.5 text-sm">
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>Em Trânsito:</span> <span className="font-bold text-cyan-600 text-lg leading-none">{emTransito}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>Total Hoje:</span> <span className="font-bold text-gray-800 text-lg leading-none">{totalHoje}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={adicionarLinha}
                                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-all"
                            >
                                <BiPlus size={18} /> Novo Registro
                            </button>
                        </div>
                    </div>

                    {/* ================= TABELA DE REGISTROS ================= */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr className="text-[11px] uppercase tracking-wider text-gray-600 font-bold">
                                        <th className="p-4 text-left w-56">Data / Hora</th>
                                        <th className="p-4 text-left">Nome do Visitante</th>
                                        <th className="p-4 text-left">Objetivo da Visita</th>
                                        <th className="p-4 text-center w-48">Autorização</th>
                                        <th className="p-4 text-center w-28">Saída</th>
                                        <th className="p-4 text-center w-32">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {registros.map((r, idx) => (
                                        <tr key={r.id} className="hover:bg-cyan-50/30 transition-colors group">

                                            {/* DATA E HORA */}
                                            <td className="p-3">
                                                <div className="flex gap-1">
                                                    <div className="relative w-full">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                                                        </span>
                                                        <input type="date" value={r.data} onChange={(e) => atualizarCampo(r.id, 'data', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 text-xs focus:ring-cyan-500 outline-none shadow-sm" />
                                                    </div>
                                                    <div className="relative w-full">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                                        </span>
                                                        <input type="time" value={r.hora} onChange={(e) => atualizarCampo(r.id, 'hora', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 text-xs focus:ring-cyan-500 outline-none shadow-sm" />
                                                    </div>
                                                </div>
                                            </td>

                                            {/* NOME E OBJETIVO */}
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={r.nome}
                                                    onChange={(e) => atualizarCampo(r.id, 'nome', e.target.value.toUpperCase())}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-bold text-sm text-gray-800 outline-none placeholder:text-gray-300 shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
                                                    placeholder="NOME..."
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={r.objetivo}
                                                    onChange={(e) => atualizarCampo(r.id, 'objetivo', e.target.value.toUpperCase())}
                                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-medium text-xs text-gray-600 outline-none placeholder:text-gray-300 shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition-all"
                                                    placeholder="MOTIVO..."
                                                />
                                            </td>

                                            {/* ASSINATURA */}
                                            <td className="p-3 text-center">
                                                <div className={`border border-gray-300 rounded-lg flex flex-col items-center justify-center shadow-sm px-2 py-2 transition-all ${r.autorizacao ? 'bg-white border-emerald-200' : 'bg-white'}`}>
                                                    <SignatureSelector value={r.autorizacao} onChange={(val) => atualizarCampo(r.id, 'autorizacao', val)} />
                                                </div>
                                            </td>

                                            {/* SAÍDA MANUAL */}
                                            <td className="p-3 text-center">
                                                <div className="relative w-full flex items-center justify-center">
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                                    </span>
                                                    <input
                                                        type="time"
                                                        value={r.horaSaida}
                                                        onChange={(e) => atualizarCampo(r.id, 'horaSaida', e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-2 text-xs font-bold text-red-600 focus:ring-red-400 outline-none shadow-sm text-center"
                                                    />
                                                </div>
                                            </td>

                                            {/* AÇÕES (Finalizar e Lixeira) */}
                                            <td className="p-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    {r.status === 'andamento' ? (
                                                        <button onClick={() => finalizarAcesso(r.id)} className="bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm">Finalizar</button>
                                                    ) : (
                                                        <div className="text-green-600 font-bold text-[10px] uppercase flex items-center gap-1">
                                                            <BiCheckCircle size={16} /> OK
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (
                                                                r.nome ||
                                                                r.objetivo ||
                                                                r.data ||
                                                                r.hora ||
                                                                r.autorizacao ||
                                                                r.horaSaida
                                                            ) {
                                                                if (window.confirm("Deseja remover este registro?")) removerLinha(r.id);
                                                            } else {
                                                                removerLinha(r.id);
                                                            }
                                                        }}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Excluir"
                                                    >
                                                        <BiTrash size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Observação final */}
                    <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-300 rounded-xl p-4 flex flex-wrap items-center gap-3 shadow-sm">
                        <div className="flex items-center gap-2 min-w-[110px]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-yellow-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                            </svg>
                            <span className="text-[13px] font-bold text-yellow-800 uppercase">Observação:</span>
                        </div>
                        <span className="text-[13px] text-yellow-900 font-medium">
                            Qualquer ocorrência destinada ao descumprimento das regras da empresa, o visitor ou colaborador será advertido verbalmente para a correção imediata do ato ao entrar em áreas sensíveis.
                        </span>
                    </div>
                </div>

                {/* 🟢 CORREÇÃO: Substituição completa do ExcelExportButton pelo botão nativo assíncrono */}
                <div className="p-4 sm:p-6 bg-white border-t border-gray-200 flex justify-end">
                    <button
                        type="button"
                        onClick={async () => {
                            // Executa a exportação; a limpeza da tela já é controlada no controller
                            await exportarExcel();
                        }}
                        className="flex items-center gap-2 bg-[#00c853] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md active:scale-95 hover:brightness-110"
                    >
                        <BiDownload size={18} />
                        Exportar para Excel
                    </button>
                </div>

                {/* ================= RODAPÉ PROFISSIONAL ESCURO ================= */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="bg-[#1a1f2e] rounded-xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6 shadow-lg border border-gray-800">
                        <div>
                            <p className="text-[11px] text-gray-400 mb-1">Revisado por</p>
                            <p className="font-bold text-yellow-400 text-sm">Clebitânia Carvalho</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 mb-1">Última Revisão</p>
                            <p className="font-bold text-white text-sm">07/05/2026</p>
                        </div>
                    </div>

                    <div className="text-center text-[11px] text-gray-500 space-y-1.5">
                        <p>GrandValle © {new Date().getFullYear()} • Controle de Segurança</p>
                    </div>
                </div>

            </div>
        </div >
    );
}