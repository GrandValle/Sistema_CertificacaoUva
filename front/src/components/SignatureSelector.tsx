/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useRef, useState, useId, useEffect } from "react";
import { BiUser, BiTrash, BiUpload } from "react-icons/bi";

const USERS = [
    "Anny Kethylen Mourão de Araujo",
    "BRENDON PEREIRA DA SILVA NASCIMENTO",
    "ELIANA AMORIM DE SANTANA",
    "JOANA DARCK",
    "NEILMA ALDENORA DA CONCEIÇÃO OLIVEIRA",
    "EDINALDO CERQUEIRA AMORIM",
    "JOÃO VITOR SANTOS SILVA",
    "ALEX SANDRO RIBEIRO DE SOUZA",
    "DANIELA DA SILVA PEREIRA DOS SANTOS",
    "FRANCISCO ROMERIO DA SILVA",
    "Vitor Emanuel Freire de Souza",
    "DEBORA TATIANE MOREIRA DOS SANTOS",
];

const normalizeCompare = (str: string) =>
    str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
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
    const listId = useId();

    // 🔥 NOVO: controle de montagem para evitar hidratação
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Se não estiver montado, renderiza um placeholder vazio (ou null)
    if (!isMounted) {
        return <div className="w-full h-10 bg-gray-100 rounded-lg animate-pulse" />;
    }

    // Restante do código (igual, mas com a garantia de que só roda no cliente)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 400;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL("image/webp", 0.7);
                    onChange(dataUrl);
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    if (value) {
        const isUpload = value.startsWith("blob:") || value.startsWith("data:");

        const matchedUser = isUpload ? null : USERS.find(u => normalizeCompare(u) === normalizeCompare(value));
        const displayName = isUpload ? "Assinatura Importada" : (matchedUser ? formatName(matchedUser) : formatName(value.replace(/_/g, " ")));

        let imgSrc: string | undefined;
        if (!isUpload && matchedUser) {
            imgSrc = `/assinaturas/${matchedUser}.png`;
        } else if (!isUpload && value) {
            imgSrc = `/assinaturas/${value}.png`;
        } else if (isUpload) {
            imgSrc = value;
        }

        const finalSrc = imgSrc || '';

        return (
            <div className="flex items-center gap-2 w-full">
                <div className="flex flex-col items-center flex-1">
                    <div className="w-full h-14 border border-green-300 rounded-lg flex items-center justify-center bg-green-50 overflow-hidden px-2">
                        {imgStage < 3 && finalSrc ? (
                            <img
                                src={finalSrc}
                                alt="Assinatura"
                                className="h-full w-auto object-contain max-h-11"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).onerror = null;
                                    setImgStage(prev => prev + 1);
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                        const fallback = document.createElement('span');
                                        fallback.className = 'text-xl text-slate-800 -rotate-2 select-none';
                                        fallback.style.fontFamily = 'cursive';
                                        fallback.textContent = displayName.split(' ')[0];
                                        parent.innerHTML = '';
                                        parent.appendChild(fallback);
                                    }
                                }}
                            />
                        ) : (
                            <span className="text-xl text-slate-800 -rotate-2 select-none" style={{ fontFamily: "cursive" }}>
                                {displayName.split(' ')[0]}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 mt-0.5 uppercase tracking-tight text-center w-full truncate">
                        {displayName}
                    </span>
                </div>
                <button type="button" onClick={() => { onChange(null); setImgStage(0); }} className="text-gray-400 hover:text-red-500 transition-colors">
                    <BiTrash size={18} />
                </button>
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
                    <datalist id={listId}>
                        {USERS.map((user) => <option key={user} value={user} />)}
                    </datalist>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="h-10 px-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 hover:text-blue-600 transition-all flex items-center justify-center">
                    <BiUpload size={18} />
                </button>
            </div>
        </div>
    );
};