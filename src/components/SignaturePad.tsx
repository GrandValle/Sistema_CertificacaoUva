"use client";

import React, { useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
    onSave: (assinaturaBase64: string) => boolean | Promise<boolean>;
    initialSignature?: string;
    onSignatureChange?: (assinaturaBase64: string | null) => void;
}

export default function SignaturePad({ onSave, initialSignature, onSignatureChange }: SignaturePadProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);

    // EFEITO DE CARREGAMENTO:
    // Só desenha se tiver assinatura inicial E o canvas estiver vazio.
    // Isso impede que ele tente desenhar várias vezes e causa o esticamento.
    useEffect(() => {
        if (sigCanvas.current && initialSignature && sigCanvas.current.isEmpty()) {
            const timer = setTimeout(() => {
                sigCanvas.current?.fromDataURL(initialSignature, {
                    width: 500,
                    height: 192
                });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [initialSignature]); // Só dispara se a assinatura inicial mudar (ou carregar do LocalStorage)

    const limparQuadro = () => {
        sigCanvas.current?.clear();
        onSignatureChange?.(null); // Avisa o pai que limpou (isso vai limpar o LocalStorage)
    };

    const atualizarRascunhoAssinatura = () => {
        if (sigCanvas.current?.isEmpty()) {
            onSignatureChange?.(null);
            return;
        }
        // 🟢 CORREÇÃO: Usar getCanvas() em vez de getTrimmedCanvas() para não cortar e esticar depois
        const base64 = sigCanvas.current?.getCanvas().toDataURL('image/png');
        if (base64) {
            onSignatureChange?.(base64);
        }
    };

    const finalizarAssinatura = async () => {
        if (sigCanvas.current?.isEmpty()) {
            alert("Por favor, assine no quadro antes de continuar.");
            return;
        }

        const base64 = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
        if (base64) {
            const salvouComSucesso = await onSave(base64);
            if (salvouComSucesso) {
                // SÓ LIMPA AQUI, APÓS O SUCESSO DO BANCO!
                sigCanvas.current?.clear();
            }
        }
    };

    return (
        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Assinatura do Visitante</h3>

            <div className="relative w-full max-w-lg border-2 border-dashed border-gray-400 bg-white rounded-lg overflow-hidden shadow-inner h-48">
                <div className="absolute inset-x-6 bottom-12 border-b border-dashed border-gray-300 pointer-events-none z-0"></div>
                <div className="absolute bottom-4 left-6 text-[10px] text-gray-300 font-bold pointer-events-none z-0">
                    Assine sobre a linha
                </div>

                <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    minWidth={0.8}
                    maxWidth={1.5}
                    onEnd={atualizarRascunhoAssinatura}
                    backgroundColor="rgba(255,255,255,0)"
                    canvasProps={{
                        width: 500,
                        height: 192,
                        className: "absolute inset-0 w-full h-full cursor-crosshair touch-none z-10",
                    }}
                />
            </div>

            <div className="flex gap-4 w-full max-w-lg mt-6">
                <button
                    type="button"
                    onClick={limparQuadro}
                    className="flex-1 py-3 px-4 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition"
                >
                    Limpar
                </button>
                <button
                    type="button"
                    onClick={finalizarAssinatura}
                    className="flex-1 py-3 px-4 bg-green-700 text-white font-bold rounded-lg hover:bg-green-800 transition"
                >
                    Finalizar
                </button>
            </div>
        </div>
    );
}