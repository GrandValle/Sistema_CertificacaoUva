/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState, useId, useEffect } from "react";
import { BiUser, BiTrash, BiUpload } from "react-icons/bi";

const USERS = [
    "Leandro Dias", "ADRIEL DOS S.SILVA", "Cesar frank", "ANTONIO JHEYSON SILVA ALVES",
    "CARLIENE F DA SILVA", "CLEISON NUNES DE SOUZA", "CRISTIANE MARIA", "EDUARDO S. SILVA",
    "ELIANE CRUZ SOUZA", "ELLEN VITORIA", "ERIC MARTINS ARAUJO", "EXPEDITO CARLOS",
    "FABIOLA DOS S BARROS", "FABRICIA", "FABRICIO CASTRO", "FABRICIO SILVA RODRIGUES",
    "FRANCINALDO F COELHO", "HIGO JULLYS", "JOSAPHA NUNES", "JOSE NEUTON",
    "LAECIO DE SOUZA SOARES", "LEANDRO CASTRO", "LEIDIANE PASSOS", "LIDIA AMORIM BRITO",
    "MARCIA MARIA DE MOURA SANTOS", "MARCIANA BRITO", "MATEUS CASTOR",
    "MATEUS SILVA PEREIRA", "PEDRO GOMES", "PERLA NAIANE", "RAFAEL S OLIVEIRA",
    "RONIER GUIMARAES SANTOS", "RONIERISON FERREIRA", "WAGNER DIAS ARAÚJO",
    "Mailson Carvalho Santos", "Raivan Santos da Cruz",
];

// Normaliza para comparação: minúsculo, sem acento, sem underline, sem espaços extras
const normalizeCompare = (str: string) =>
    str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acentos
        .replace(/_/g, " ") // underline vira espaço
        .replace(/\s+/g, " ") // espaços múltiplos viram um só
        .trim()
        .toLowerCase();
const formatName = (str: string) => str.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());

interface Props {
    value: string | null;
    onChange: (val: string | null) => void;
}

export const SignatureSelector = ({ value, onChange }: Props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [search, setSearch] = useState("");
    const [imgStage, setImgStage] = useState(0);
    const [isMounted, setIsMounted] = useState(false);
    const listId = useId();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setIsMounted(true); }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onChange(URL.createObjectURL(file));
    };


    if (!isMounted) return <div className="h-16 w-full bg-gray-50 rounded-lg animate-pulse" />;

    if (value) {
        const isUpload = value.startsWith("blob:") || value.startsWith("data:");
        // Busca flexível pelo nome do usuário
        const matchedUser = isUpload ? null : USERS.find(u => normalizeCompare(u) === normalizeCompare(value));
        const displayName = isUpload ? "Assinatura Importada" : (matchedUser ? formatName(matchedUser) : formatName(value.replace(/_/g, " ")));

        let imgSrc = value;
        if (!isUpload && matchedUser) {
            imgSrc = `/assinaturas/${matchedUser}.png`;
        } else if (!isUpload) {
            imgSrc = `/assinaturas/${value}.png`;
        }

        return (
            <div className="flex items-start gap-2 w-full">
                <div className="flex flex-col items-center flex-1">
                    {/* Caixa da Assinatura */}
                    <div className="w-full h-12 border border-green-300 rounded-lg flex items-center justify-center bg-green-50 overflow-hidden px-2">
                        {imgStage < 3 ? (
                            <img
                                src={imgSrc}
                                alt="Assinatura"
                                className="h-full w-auto object-contain max-h-10"
                                onError={(e) => { (e.target as HTMLImageElement).onerror = null; setImgStage(prev => prev + 1); }}
                            />
                        ) : (
                            <span className="text-lg text-slate-800 -rotate-2 select-none" style={{ fontFamily: "cursive" }}>
                                {displayName.split(' ')[0]}
                            </span>
                        )}
                    </div>
                    {/* NOME EM TEXTO (O QUE ESTAVA SUMIDO) */}
                    <span className="text-[11px] font-bold text-gray-700 mt-1 uppercase tracking-tight text-center w-full truncate">
                        {displayName}
                    </span>
                </div>
                <button onClick={() => { onChange(null); setImgStage(0); }} className="mt-2 text-gray-400 hover:text-red-500 transition-colors"><BiTrash size={18} /></button>
            </div>
        );
    }
    return (
        <div className="relative w-full flex flex-col gap-1">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            <div className="flex gap-1.5 w-full">
                <div className="relative flex-1">
                    <BiUser className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        list={listId}
                        type="text"
                        placeholder="Nome do colaborador..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            const matchedUser = USERS.find(u => normalizeCompare(u) === normalizeCompare(e.target.value));
                            if (matchedUser) { onChange(matchedUser); setSearch(""); }
                        }}
                        className="w-full h-10 bg-white border border-gray-300 rounded-lg py-2 pl-8 pr-2 text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    <datalist id={listId}>{USERS.map((user) => <option key={user} value={user} />)}</datalist>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="h-10 px-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 transition-all flex items-center justify-center">
                    <BiUpload size={18} />
                </button>
            </div>
        </div>
    );
};