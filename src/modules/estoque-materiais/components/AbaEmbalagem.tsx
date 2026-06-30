"use client";

import {
    BiTrash,
    BiPlus,
    BiPackage,
    BiMessageSquareDetail,
    BiWrench,
    BiCalendar,
    BiTimeFive,
    BiBox,
    BiCheckShield,
    BiCloud
} from "react-icons/bi";
import { EmbalagemEntry, CAMPOS_CONDICOES, VERIFICACOES_RAPIDAS_BASE } from "../model/estoqueModel";
import { SignatureSelector } from "../../../components/SignatureSelector";
import React from "react";

type StatusCondicao = "BOM" | "ACEITÁVEL" | "REPROVADO" | "";

interface AbaEmbalagemProps {
    embalagemLogs: EmbalagemEntry[];
    addEmbalagemRow: () => void;
    updateEmbalagem: <K extends keyof EmbalagemEntry>(
        id: string,
        field: K,
        value: EmbalagemEntry[K]
    ) => void;
    removeEmbalagemRow: (id: string) => void;
}

const ICONES_VERIFICACOES: Record<string, React.ReactNode> = {
    materialDanificado: <BiBox size={24} className="text-red-500" />,
    materialLimpo: <BiCheckShield size={24} className="text-emerald-600" />,
    comOdores: <BiCloud size={24} className="text-amber-600" />,
};

export function AbaEmbalagem({
    embalagemLogs,
    addEmbalagemRow,
    updateEmbalagem,
    removeEmbalagemRow,
}: AbaEmbalagemProps) {

    const handleRadioChange = (
        log: EmbalagemEntry,
        field: keyof EmbalagemEntry,
        clickedValue: StatusCondicao
    ) => {
        const currentValue = log[field];
        const newValue = currentValue === clickedValue ? "" : clickedValue;
        updateEmbalagem(log.id, field, newValue as any);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ========== CABEÇALHO COM BOTÃO DENTRO ========== */}
            <div className="bg-emerald-50 border-l-4 border-emerald-700 rounded-r-xl p-4 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 p-2 rounded-full">
                        <BiPackage size={24} className="text-emerald-700" />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">
                            Controle de Transporte de Embalagens
                        </h3>
                        <p className="text-slate-600 text-xs font-medium">
                            Registro diário de conformidade do transporte de embalagens.
                        </p>
                    </div>
                </div>
                {/* Botão pequeno e organizado à direita */}
                <button
                    onClick={addEmbalagemRow}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                    <BiPlus size={16} /> Adicionar Registro
                </button>
            </div>

            {/* ========== LISTA DE REGISTROS ========== */}
            <div className="space-y-8">
                {embalagemLogs.map((log, index) => (
                    <div
                        key={log.id}
                        className="bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden relative"
                    >
                        <button
                            onClick={() => removeEmbalagemRow(log.id)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-red-600 transition-colors z-10"
                            aria-label="Excluir registro"
                        >
                            <BiTrash size={22} />
                        </button>

                        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200">
                            <h4 className="font-black text-slate-800 text-md uppercase tracking-wide">
                                Registro de Carga #{index + 1}
                            </h4>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* ----- DADOS BÁSICOS (com ícones e assinatura digital) ----- */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Data */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">DATA</label>
                                        <div className="relative">
                                            <BiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={15} />
                                            <input
                                                type="date"
                                                value={log.data}
                                                onChange={(e) => updateEmbalagem(log.id, "data", e.target.value as any)}
                                                className="w-full border-2 border-slate-200 rounded-xl pl-9 pr-2 py-1.5 text-sm font-bold text-slate-800 focus:border-emerald-600 outline-none"
                                            />
                                        </div>
                                    </div>
                                    {/* Hora */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">HORA CHEGADA</label>
                                        <div className="relative">
                                            <BiTimeFive className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={15} />
                                            <input
                                                type="time"
                                                value={log.horaChegada}
                                                onChange={(e) => updateEmbalagem(log.id, "horaChegada", e.target.value as any)}
                                                className="w-full border-2 border-slate-200 rounded-xl pl-9 pr-2 py-1.5 text-sm font-bold text-slate-800 focus:border-emerald-600 outline-none"
                                            />
                                        </div>
                                    </div>
                                    {/* Assinatura */}
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">RESPONSÁVEL (ASSINATURA)</label>
                                        <div className="w-full border-2 border-slate-200 rounded-xl bg-white min-h-[44px]">
                                            <SignatureSelector
                                                value={log.responsavel}
                                                onChange={(val) => updateEmbalagem(log.id, "responsavel", val as any)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">TIPO DE TRANSPORTE</label>
                                        <input
                                            type="text"
                                            value={log.tipoTransporte}
                                            onChange={(e) => updateEmbalagem(log.id, "tipoTransporte", e.target.value as any)}
                                            placeholder="Ex: Caminhão Baú"
                                            className="w-full border-2 border-slate-200 rounded-xl p-1.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1">TIPO DE MATERIAL</label>
                                        <input
                                            type="text"
                                            value={log.tipoMaterial || ""}
                                            onChange={(e) => updateEmbalagem(log.id, "tipoMaterial", e.target.value as any)}
                                            placeholder="Ex: Plástico, Papelão, Caixas..."
                                            className="w-full border-2 border-slate-200 rounded-xl p-1.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ----- TABELA DE CONDIÇÕES ----- (sem mudanças visuais significativas, apenas mantido) */}
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="bg-emerald-100 p-1.5 rounded-full">
                                        <BiCheckShield size={20} className="text-emerald-700" />
                                    </div>
                                    <h5 className="text-md font-black uppercase tracking-wide text-slate-800">
                                        Condições de Acondicionamento da Carga
                                    </h5>
                                </div>
                                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                                    <table className="w-full border-collapse bg-white">
                                        <thead className="bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-black text-slate-700 border-r border-slate-200 w-[40%]">Item Verificado</th>
                                                <th className="px-2 py-3 text-center text-sm font-black text-emerald-700 border-r border-slate-200 w-[20%]">✓ Bom</th>
                                                <th className="px-2 py-3 text-center text-sm font-black text-amber-600 border-r border-slate-200 w-[20%]">● Aceitável</th>
                                                <th className="px-2 py-3 text-center text-sm font-black text-red-600 w-[20%]">✗ Reprovado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {CAMPOS_CONDICOES.map((campo, idx) => {
                                                const valorAtual = (log[campo.field] as StatusCondicao) || "";
                                                const isEven = idx % 2 === 0;
                                                return (
                                                    <tr key={campo.field} className={`${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-emerald-50/40 transition-colors ${idx !== CAMPOS_CONDICOES.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                                        <td className="px-6 py-3 text-sm font-semibold text-slate-800 border-r border-slate-100">{campo.label}</td>
                                                        {["BOM", "ACEITÁVEL", "REPROVADO"].map((opcao) => {
                                                            const isSelected = valorAtual === opcao;
                                                            let btnClass = "w-8 h-8 rounded-full flex items-center justify-center text-base font-black transition-all mx-auto border-2 ";
                                                            if (!isSelected) btnClass += "border-slate-200 bg-slate-100 text-slate-300 hover:bg-slate-200 hover:border-slate-300";
                                                            else if (opcao === "BOM") btnClass += "bg-emerald-600 border-emerald-600 text-white shadow-md scale-105";
                                                            else if (opcao === "ACEITÁVEL") btnClass += "bg-amber-500 border-amber-500 text-white shadow-md scale-105";
                                                            else btnClass += "bg-red-600 border-red-600 text-white shadow-md scale-105";
                                                            return (
                                                                <td key={opcao} className="p-2 text-center border-r border-slate-100 last:border-0 align-middle">
                                                                    <button onClick={() => handleRadioChange(log, campo.field, opcao as StatusCondicao)} className={btnClass}>
                                                                        {isSelected ? (opcao === "BOM" ? "✓" : opcao === "ACEITÁVEL" ? "●" : "✗") : "○"}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* ========== VERIFICAÇÕES COMPLEMENTARES ========== */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {VERIFICACOES_RAPIDAS_BASE.map((item) => {
                                    const isTrue = log[item.id as keyof EmbalagemEntry] === true;
                                    const isFalse = log[item.id as keyof EmbalagemEntry] === false;
                                    const corSim = item.invertColor ? 'bg-red-600 border-red-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white';
                                    const corNao = item.invertColor ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-red-600 border-red-600 text-white';
                                    const desmarcadoClass = "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200";
                                    return (
                                        <div key={item.id} className="bg-white border-2 border-slate-200 rounded-xl p-3 shadow-sm flex flex-col items-start gap-2">
                                            <div className="flex items-center gap-2 w-full">
                                                <div className="text-slate-500">{ICONES_VERIFICACOES[item.id]}</div>
                                                <span className="text-sm font-black text-slate-800">{item.label}</span>
                                            </div>
                                            <div className="flex gap-3 w-full">
                                                <button onClick={() => updateEmbalagem(log.id, item.id as keyof EmbalagemEntry, isTrue ? null : true)} className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all border-2 flex items-center justify-center gap-1 ${isTrue ? corSim : desmarcadoClass}`}>✓ SIM</button>
                                                <button onClick={() => updateEmbalagem(log.id, item.id as keyof EmbalagemEntry, isFalse ? null : false)} className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all border-2 flex items-center justify-center gap-1 ${isFalse ? corNao : desmarcadoClass}`}>✗ NÃO</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ----- OBSERVAÇÕES E AÇÕES CORRETIVAS (compactadas) ----- */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div className="bg-emerald-50/40 border-2 border-emerald-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 text-emerald-800">
                                        <BiMessageSquareDetail size={18} className="text-emerald-600" />
                                        <span className="text-xs font-black uppercase tracking-wide">Observações Adicionais</span>
                                    </div>
                                    <textarea
                                        value={log.observacoes || ""}
                                        onChange={(e) => updateEmbalagem(log.id, "observacoes", e.target.value.slice(0, 500) as any)}
                                        maxLength={500}
                                        rows={3}
                                        placeholder="Descreva aqui quaisquer observações relevantes..."
                                        className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-sm font-medium text-slate-700 focus:border-emerald-500 outline-none resize-none"
                                    />
                                    <div className="flex justify-between items-center mt-1 text-xs font-bold">
                                        <span className="text-emerald-700">Máx. 500</span>
                                        <span className="bg-white px-2 py-0.5 rounded-full border border-emerald-200 text-emerald-800">{log.observacoes?.length || 0}/500</span>
                                    </div>
                                </div>
                                <div className="bg-amber-50/40 border-2 border-amber-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 text-amber-800">
                                        <BiWrench size={18} className="text-amber-600" />
                                        <span className="text-xs font-black uppercase tracking-wide">Ações Corretivas</span>
                                    </div>
                                    <textarea
                                        value={log.acoesCorretivas || ""}
                                        onChange={(e) => updateEmbalagem(log.id, "acoesCorretivas", e.target.value.slice(0, 500) as any)}
                                        maxLength={500}
                                        rows={3}
                                        placeholder="Registre as medidas tomadas para corrigir não conformidades..."
                                        className="w-full bg-white border border-amber-300 rounded-lg p-2 text-sm font-medium text-slate-700 focus:border-amber-500 outline-none resize-none"
                                    />
                                    <div className="flex justify-between items-center mt-1 text-xs font-bold">
                                        <span className="text-amber-700">Máx. 500</span>
                                        <span className="bg-white px-2 py-0.5 rounded-full border border-amber-200 text-amber-800">{log.acoesCorretivas?.length || 0}/500</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}