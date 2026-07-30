"use client";

import { useState, useEffect } from "react";
// 🟢 IMPORT: Aponta para o gerador assíncrono de acesso
import { exportControleAcessoToExcel } from "../services/excelFormatter";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import { salvarDocumento } from "../../../services/api";

export interface RegistroAcesso {
    id: number;
    data: string;
    hora: string;
    nome: string;
    objetivo: string;
    autorizacao: string | null;
    horaSaida: string;
    status: 'andamento' | 'concluido';
}

interface ControleAcessoPersistedState {
    registros?: RegistroAcesso[];
    setor?: string;
    assinaturaResp?: string | null;
}

const defaultRegistros = (): RegistroAcesso[] => ([
    { id: 1, data: "", hora: "", nome: "", objetivo: "", autorizacao: null, horaSaida: "", status: 'andamento' },
    { id: 2, data: "", hora: "", nome: "", objetivo: "", autorizacao: null, horaSaida: "", status: 'andamento' },
    { id: 3, data: "", hora: "", nome: "", objetivo: "", autorizacao: null, horaSaida: "", status: 'andamento' },
]);


export function useControleAcessoController() {
    const [registros, setRegistros] = useState<RegistroAcesso[]>(defaultRegistros());
    const [setor, setSetor] = useState("");
    const [assinaturaResp, setAssinaturaResp] = useState<string | null>(null);

    // Carrega o estado salvo do localStorage apenas no client
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem(STORAGE_KEYS.controleAcesso);
                if (saved) {
                    const parsed = JSON.parse(saved) as ControleAcessoPersistedState;
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    if (parsed.registros && parsed.registros.length > 0) setRegistros(parsed.registros);
                    if (parsed.setor) setSetor(parsed.setor);
                    if (parsed.assinaturaResp) setAssinaturaResp(parsed.assinaturaResp);
                }
            } catch { }
        }
    }, []);

    // Salvar automaticamente no localStorage sempre que houver mudanças nos estados
    useEffect(() => {
        if (registros.length > 0) {
            localStorage.setItem(STORAGE_KEYS.controleAcesso, JSON.stringify({ registros, setor, assinaturaResp }));
        }
    }, [registros, setor, assinaturaResp]);

    const atualizarCampo = <K extends keyof RegistroAcesso>(id: number, campo: K, valor: RegistroAcesso[K]) => {
        setRegistros(prev => prev.map(r => r.id === id ? { ...r, [campo]: valor } : r));
    };

    const adicionarLinha = () => {
        const novo: RegistroAcesso = {
            id: Date.now(), data: "", hora: "", nome: "", objetivo: "", autorizacao: null, horaSaida: "", status: 'andamento'
        };
        setRegistros(prev => [...prev, novo]);
    };

    const removerLinha = (id: number) => {
        setRegistros(prev => prev.filter(r => r.id !== id));
    };

    const finalizarAcesso = (id: number) => {
        atualizarCampo(id, 'status', 'concluido');
    };

    const emTransito = registros.filter(r => r.status === 'andamento' && r.nome !== "").length;
    const totalHoje = registros.filter(r => r.nome !== "").length;

    // 🟢 FUNÇÃO CORRIGIDA: Gera o Excel E salva com a chave exata que o histórico lê
    const exportarExcel = async () => {
        try {
            console.log("Gerando arquivo Excel...");

            // Passo 1: Gerar o Excel
            // ⚠️ ATENÇÃO: Para enviar pro banco, essa função precisa retornar o arquivo físico (um Blob)
            const excelBlob = await exportControleAcessoToExcel({
                registros,
                setor,
                assinaturaResp
            });

            // Passo 2: Preparar os dados para o Banco de Dados
            const agora = new Date();
            const mesAtualLocal = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
            const dadosDoBanco = {
                popCode: "PHU-041", // Código PHU específico do Controle de Acesso
                titulo: "Controle de Acesso", // Nome fixo da tela
                mes: mesAtualLocal,
                setor: setor || "Não informado",
                revisadoPor: "Sistema",
                registrosAcesso: registros
            };

            // Passo 3: Enviar tudo para o Back-end
            console.log("Enviando dados para o servidor...");

            const resposta = await salvarDocumento(
                "controle_acesso",      // Tem que ser o nome exato que o back-end espera
                dadosDoBanco,           // Os dados que montamos acima
                excelBlob,              // O arquivo Excel
                "Controle_Acesso.xlsx"  // Nome do arquivo
            );

            console.log("Sucesso! Salvo no banco com o ID:", resposta.id);

            // Passo 4: Limpeza da tela (Reset)
            setRegistros(defaultRegistros());
            setSetor("");
            setAssinaturaResp(null);

            alert("Planilha exportada e salva no Banco de Dados com sucesso! 🍇");

        } catch (error) {
            console.error("Erro ao exportar e salvar:", error);
            alert("Ocorreu um erro ao enviar para o servidor. Verifique o console.");
        }
    };

    return {
        registros, atualizarCampo, adicionarLinha, removerLinha, finalizarAcesso,
        emTransito, totalHoje,
        setor, setSetor, assinaturaResp, setAssinaturaResp,
        exportarExcel
    };
}