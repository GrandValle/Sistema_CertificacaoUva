// front/src/app/(modulos)/controller/useRelatoriosController.ts
import { useState, useEffect } from "react";
import { ChaveModulo } from "../model/relatoriosModel";

// 🟢 Importamos a API centralizada (ajuste o caminho conforme a sua pasta)
import { RelatoriosAPI, DocumentosAPI } from "@/services/api";

export function useRelatoriosController() {
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");
    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState<any | null>(null);
    const [moduloAtivo, setModuloAtivo] = useState<ChaveModulo | null>(null);
    const [erro, setErro] = useState<string | null>(null);

    const buscarDados = async (inicio?: string, fim?: string) => {
        setLoading(true);
        setErro(null);
        try {
            // 🟢 Chamada super simples, sem 'fetch' ou 'API_BASE' soltos
            const resposta = await RelatoriosAPI.buscarDados(inicio, fim);

            // Verifica o formato da sua resposta (se tiver a tag "sucesso")
            if (resposta.sucesso) {
                setDados(resposta.dados);
            } else if (resposta.dados) {
                // Caso a API retorne os dados direto, sem a flag "sucesso"
                setDados(resposta.dados);
            } else {
                setDados(resposta); // Fallback caso seja o objeto cru
            }
        } catch (error: any) {
            console.error(error);
            setErro(error.message || "Erro de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        buscarDados();
    }, []);

    const handleBuscar = async () => {
        if (dataInicio && dataFim) {
            await buscarDados(dataInicio, dataFim);
        } else {
            await buscarDados();
        }
    };

    const limparFiltros = () => {
        setDataInicio("");
        setDataFim("");
        setModuloAtivo(null);
        setErro(null);
        buscarDados();
    };

    // 📥 Download do ZIP (Otimizado)
    const handleExportarZip = () => {
        if (!moduloAtivo) {
            alert("Selecione um módulo para exportar.");
            return;
        }

        // 🟢 Em vez de baixar como Blob e gastar RAM, 
        // apenas abrimos a URL. O navegador faz o download nativamente!
        const url = RelatoriosAPI.getUrlZip(moduloAtivo, dataInicio, dataFim);
        window.open(url, "_blank");
    };

    // 📥 Download de um registro individual (Otimizado)
    const handleDownloadRegistro = (registro: any) => {
        const primeiroDoc = registro.documentos?.[0];
        if (!primeiroDoc) {
            alert("Este registro não possui documento salvo.");
            return;
        }

        // 🟢 Reaproveitamos a função que já existia na DocumentosAPI
        const url = DocumentosAPI.getUrlDownload(primeiroDoc.id);
        window.open(url, "_blank");
    };

    return {
        dataInicio, setDataInicio,
        dataFim, setDataFim,
        loading, dados,
        moduloAtivo, setModuloAtivo,
        erro,
        handleBuscar,
        limparFiltros,
        handleExportarZip,
        handleDownloadRegistro,
    };
}