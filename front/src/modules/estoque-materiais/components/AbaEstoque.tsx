"use client";

import { useState } from "react";
import { SignatureSelector } from "../../../components/SignatureSelector";
import { BiPlus, BiTrash, BiCalendar } from "react-icons/bi";
import { UNIDADES_MEDIDA, ProdutoCatalogo, EstoqueLog } from "../model/estoqueModel";

interface AbaEstoqueProps {
    produtos: ProdutoCatalogo[];
    estoqueLogs: EstoqueLog[];
    addEstoqueRow: () => void;
    updateEstoque: (id: number, field: keyof EstoqueLog, value: any) => void;
    removeEstoqueRow: (id: number) => void;
    adicionarProdutoCatalogo: (nome: string, unidade: string, quantidade?: string) => Promise<void>;
    prepareSignatureInteraction: () => void;
}

export function AbaEstoque({
    produtos,
    estoqueLogs,
    addEstoqueRow,
    updateEstoque,
    removeEstoqueRow,
    adicionarProdutoCatalogo,
    prepareSignatureInteraction,
}: AbaEstoqueProps) {
    // 🟢 Trazendo o estado do Modal para cá
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="bg-slate-50 border-l-4 border-blue-600 rounded-r-lg p-5 shadow-sm">
                <h3 className="font-black text-slate-800 text-lg uppercase">Controle de Estoque - Material de Limpeza</h3>
                <p className="text-slate-500 text-sm font-medium">Controle de entradas e saídas de Material de limpeza.</p>
            </div>

            <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-300">
                        <thead className="bg-slate-100 border-b-2 border-slate-200 uppercase text-[11px] text-slate-700 font-black">
                            <tr>
                                <th className="py-4 px-3 text-left w-36">Data</th>
                                <th className="py-4 px-3 text-left min-w-50">Produto</th>
                                <th className="py-4 px-2 text-center w-27.5">Entrada</th>
                                <th className="py-4 px-2 text-center w-27.5">Saída</th>
                                <th className="py-4 px-3 text-left min-w-40">Setor</th>
                                <th className="py-4 px-3 text-center min-w-50">Quem Pegou?</th>
                                <th className="py-4 px-3 text-center w-36">Saldo</th>
                                <th className="py-4 px-3 text-center min-w-50">Responsável</th>
                                <th className="py-4 px-3 text-center w-16">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-50">
                            {estoqueLogs.map((log) => {
                                const hasProduct = Boolean(log.product);
                                return (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-3 px-2">
                                            <div className="relative flex items-center">
                                                <BiCalendar className="absolute left-2.5 text-slate-400 pointer-events-none" size={15} />
                                                <input type="date" value={log.date} onChange={(e) => updateEstoque(log.id, "date", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg pl-8 pr-2 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500" />
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <select value={log.product} onChange={(e) => updateEstoque(log.id, "product", e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-2 py-2 text-xs font-bold text-slate-900 outline-none">
                                                <option value="" className="text-slate-400">Selecione...</option>
                                                {produtos.map(p => <option key={p.nome} value={p.nome} className="text-slate-900">{p.nome}</option>)}
                                            </select>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className={`flex items-center w-full border-2 rounded-lg overflow-hidden ${hasProduct ? 'bg-white border-slate-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                                                <input type="number" disabled={!hasProduct} value={log.entry} onChange={(e) => updateEstoque(log.id, "entry", e.target.value)} className="w-14 px-2 py-2 text-xs text-slate-900 placeholder:text-slate-400 text-center outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:text-slate-700 disabled:opacity-100" placeholder="0" />
                                                <select disabled={!hasProduct} value={log.entryUnit} onChange={(e) => updateEstoque(log.id, "entryUnit", e.target.value)} className="flex-1 bg-transparent text-[10px] font-semibold text-slate-900 outline-none cursor-pointer disabled:text-slate-700 disabled:opacity-100">
                                                    <option value="" className="text-slate-400">-</option><option value="L" className="text-slate-900">L</option><option value="ml" className="text-slate-900">ml</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <div className={`flex items-center w-full border-2 rounded-lg overflow-hidden ${hasProduct ? 'bg-white border-slate-200 shadow-sm' : 'bg-white border-slate-200'}`}>
                                                <input type="number" disabled={!hasProduct} value={log.exit} onChange={(e) => updateEstoque(log.id, "exit", e.target.value)} className="w-14 px-2 py-2 text-xs text-slate-900 placeholder:text-slate-400 text-center outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:text-slate-700 disabled:opacity-100" placeholder="0" />
                                                <select disabled={!hasProduct} value={log.exitUnit} onChange={(e) => updateEstoque(log.id, "exitUnit", e.target.value)} className="flex-1 bg-transparent text-[10px] font-semibold text-slate-900 outline-none cursor-pointer disabled:text-slate-700 disabled:opacity-100">
                                                    <option value="" className="text-slate-400">-</option><option value="L" className="text-slate-900">L</option><option value="ml" className="text-slate-900">ml</option>
                                                </select>
                                            </div>
                                        </td>
                                        <td className="py-3 px-2">
                                            <input type="text" value={log.sector} onChange={(e) => updateEstoque(log.id, "sector", e.target.value.toUpperCase())} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400" placeholder="SETOR..." />
                                        </td>
                                        <td className="py-3 px-2 transition-colors duration-300"><div onPointerDownCapture={prepareSignatureInteraction} className="w-full"><SignatureSelector value={log.whoTook} onChange={(val) => updateEstoque(log.id, "whoTook", val)} /></div></td>
                                        <td className="py-3 px-3"><input type="text" value={log.balance} readOnly className="w-36 bg-rose-50 border-2 border-rose-200 text-rose-900 font-black rounded-lg px-3 py-2 text-sm text-center outline-none shadow-inner cursor-default" placeholder="Saldo" /></td>
                                        <td className="py-3 px-2 transition-colors duration-300"><div onPointerDownCapture={prepareSignatureInteraction} className="w-full"><SignatureSelector value={log.responsible} onChange={(val) => updateEstoque(log.id, "responsible", val)} /></div></td>
                                        <td className="py-3 px-2 text-center"><button onClick={() => removeEstoqueRow(log.id)} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><BiTrash size={20} /></button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-xl font-black text-xs uppercase shadow-sm active:scale-95 transition-all"> + Cadastrar Produto</button>
                <button onClick={addEstoqueRow} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase shadow-md active:scale-95 transition-all"> + Nova Linha</button>
            </div>

            {/* 🟢 MODAL MOVIDO PARA CÁ COM AS CORES CORRIGIDAS */}
            {isModalOpen && (
                <CadastroProdutoModal
                    adicionarProdutoCatalogo={adicionarProdutoCatalogo}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}

// 🟢 COMPONENTE MODAL COM AS CLASSES text-slate-900 e placeholder:text-slate-400
function CadastroProdutoModal({ adicionarProdutoCatalogo, onClose }: any) {
    const [nome, setNome] = useState("");
    const [unidade, setUnidade] = useState("");
    const [quantidade, setQuantidade] = useState("");

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200">
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h3 className="text-xl font-black text-slate-900">Cadastrar Novo Material</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-red-600 transition-colors">✕</button>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Nome do Produto</label>
                        <input
                            type="text"
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            className="w-full border-2 border-slate-300 rounded-lg px-4 py-2.5 font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none"
                            placeholder="Ex: Sabão Líquido"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-800 mb-1">Unidade</label>
                        <select
                            value={unidade}
                            onChange={e => setUnidade(e.target.value)}
                            className="w-full border-2 border-slate-300 rounded-lg px-4 py-2.5 font-bold text-slate-900 focus:border-blue-500 outline-none"
                        >
                            <option value="" className="text-slate-400">Selecione...</option>
                            {UNIDADES_MEDIDA.map((um: string) => <option key={um} value={um} className="text-slate-900">{um}</option>)}
                        </select>
                    </div>
                    {unidade && (
                        <div>
                            <label className="block text-sm font-bold text-slate-800 mb-1">Estoque Inicial ({unidade})</label>
                            <input
                                type="text"
                                value={quantidade}
                                onChange={e => setQuantidade(e.target.value)}
                                className="w-full border-2 border-slate-300 rounded-lg px-4 py-2.5 font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 outline-none"
                                placeholder="Ex: 10"
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-700 font-bold hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={() => { adicionarProdutoCatalogo(nome, unidade, quantidade); onClose(); }} className="px-5 py-2.5 bg-blue-600 text-white font-black rounded-lg shadow-md hover:bg-blue-700 transition-colors">Salvar</button>
                </div>
            </div>
        </div>
    );
}