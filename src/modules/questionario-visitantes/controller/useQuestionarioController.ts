import { useState, useEffect } from 'react';
import { VisitanteData } from '../model/questionarioModel';
import { gerarExcelVisitante } from '../services/gerarExcel';
import { salvarDocumento } from '@/services/api';

const STORAGE_KEY_DRAFT = 'gv_questionario_visitante_draft_v1';

// Tipo simples só para o histórico (sem a assinatura pesada)
export interface RegistroHistorico {
    id: string;
    data: string;
    nome: string;
    empresa: string;
    horaExportacao: string;
}

function gerarIdLocal(): string {
    const webCrypto = globalThis.crypto as Crypto | undefined;
    if (webCrypto && typeof webCrypto.randomUUID === 'function') {
        return webCrypto.randomUUID();
    }

    return `qv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function useQuestionarioController() {
    const estadoInicialVisitante = { data: '', nome: '', empresa: '', motivo: '' };

    const [visitante, setVisitante] = useState<VisitanteData>(estadoInicialVisitante);
    const [respostas, setRespostas] = useState<Record<string, string>>({});
    const [assinaturaRascunho, setAssinaturaRascunho] = useState<string>('');
    const [draftCarregado, setDraftCarregado] = useState(false);

    // Novo estado para a lista do Histórico
    const [historico, setHistorico] = useState<RegistroHistorico[]>([]);

    // Carrega o histórico salvo ao abrir a tela (protegido contra erro de SSR do Next.js)
    useEffect(() => {
        const historicoSalvo = localStorage.getItem('historico_visitantes');
        if (historicoSalvo) {
            setHistorico(JSON.parse(historicoSalvo));
        }

        const draftSalvo = localStorage.getItem(STORAGE_KEY_DRAFT);
        if (draftSalvo) {
            try {
                const parsed = JSON.parse(draftSalvo) as {
                    visitante?: VisitanteData;
                    respostas?: Record<string, string>;
                    assinaturaBase64?: string;
                };
                if (parsed.visitante) setVisitante(parsed.visitante);
                if (parsed.respostas) setRespostas(parsed.respostas);
                if (parsed.assinaturaBase64) setAssinaturaRascunho(parsed.assinaturaBase64);
            } catch {
                localStorage.removeItem(STORAGE_KEY_DRAFT);
            }
        }

        setDraftCarregado(true);
    }, []);

    useEffect(() => {
        if (!draftCarregado) return;

        localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify({
            visitante,
            respostas,
            assinaturaBase64: assinaturaRascunho
        }));
    }, [visitante, respostas, assinaturaRascunho, draftCarregado]);

    const lidarComMudancaVisitante = (campo: keyof VisitanteData, valor: string) => {
        setVisitante(prev => ({ ...prev, [campo]: valor }));
    };

    const handleResposta = (id: string, valor: 'sim' | 'nao') => {
        setRespostas(prev => {
            // 🟢 SE a pessoa clicar na opção que já está marcada, remove a resposta
            if (prev[id] === valor) {
                const novasRespostas = { ...prev };
                delete novasRespostas[id];
                return novasRespostas;
            }
            // CASO CONTRÁRIO, marca a nova opção
            return { ...prev, [id]: valor };
        });
    };

    const limparFormulario = () => {
        setVisitante(estadoInicialVisitante);
        setRespostas({});
        setAssinaturaRascunho('');
        localStorage.removeItem(STORAGE_KEY_DRAFT);
    };

    const atualizarAssinaturaRascunho = (assinaturaBase64: string | null) => {
        setAssinaturaRascunho(assinaturaBase64 || '');
    };

    const salvarQuestionario = async (assinaturaBase64: string) => {
        if (!navigator.onLine) {
            alert("Sem conexão de internet! Dê alguns passos para pegar sinal e tente novamente.");
            return false;
        }

        try {
            // 1. Gera o Excel em memória
            const { excelBlob, nomeArquivo } = await gerarExcelVisitante(visitante, respostas, assinaturaBase64);

            // 2. Envia para o backend (histórico oficial)
            const dadosDoBanco = {
                popCode: 'PHU-038',
                titulo: 'Questionario de Saude de Visitantes',
                aba: 'Questionario Visitantes',
                data: visitante.data,
                nome: visitante.nome,
                empresa: visitante.empresa,
                motivo: visitante.motivo,
                respostas,
            };

            await salvarDocumento('questionario_visitante', dadosDoBanco, excelBlob, nomeArquivo);

            // 3. Cria o registro leve para feedback local da tela
            const novoRegistro: RegistroHistorico = {
                id: gerarIdLocal(),
                data: visitante.data,
                nome: visitante.nome,
                empresa: visitante.empresa,
                horaExportacao: new Date().toLocaleTimeString('pt-BR')
            };

            // 4. Atualiza a lista na tela e salva no localStorage
            const novoHistorico = [novoRegistro, ...historico];
            setHistorico(novoHistorico);
            localStorage.setItem('historico_visitantes', JSON.stringify(novoHistorico));

            alert("Questionário exportado com sucesso!");
            limparFormulario();
            return true;

        } catch (erro) {
            console.error("Erro ao gerar/enviar o questionário:", erro);
            alert("Ocorreu um erro ao processar o questionário. Tente novamente.");
            return false;
        }
    };

    return {
        visitante,
        respostas,
        assinaturaRascunho,
        historico, // <-- Exportamos o histórico para a tela usar
        lidarComMudancaVisitante,
        handleResposta,
        atualizarAssinaturaRascunho,
        salvarQuestionario
    };
}