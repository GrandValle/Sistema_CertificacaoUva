// front/src/app/(modulos)/controller/useRelatoriosController.ts
import { useState, useEffect } from "react";
import { ChaveModulo } from "../model/relatoriosModel";
import { RelatoriosAPI, DocumentosAPI } from "@/services/api";

// 🟢 Funções auxiliares para lidar com o novo seletor de mês (YYYY-MM)
const getMesAtualYyyyMm = () => {
    const hoje = new Date();
    const mm = String(hoje.getMonth() + 1).padStart(2, '0');
    const yyyy = hoje.getFullYear();
    return `${yyyy}-${mm}`;
};

const getDatasDoMes = (yyyyMm: string) => {
    if (!yyyyMm) return { primeiroDia: "", ultimoDia: "" };
    const [ano, mes] = yyyyMm.split('-');
    const primeiroDia = new Date(Number(ano), Number(mes) - 1, 1).toISOString().split('T')[0];
    const ultimoDia = new Date(Number(ano), Number(mes), 0).toISOString().split('T')[0];
    return { primeiroDia, ultimoDia };
};

const getDatasMesAtual = () => getDatasDoMes(getMesAtualYyyyMm());

export function useRelatoriosController() {
    // Campos livres para o ZIP / Busca customizada
    const [dataInicio, setDataInicio] = useState("");
    const [dataFim, setDataFim] = useState("");

    // 🟢 Novo estado: O mês que a tabela está exibindo no momento
    const [mesTabela, setMesTabela] = useState(getMesAtualYyyyMm());

    const [loading, setLoading] = useState(false);
    const [dados, setDados] = useState<any | null>(null);
    const [moduloAtivo, setModuloAtivo] = useState<ChaveModulo | null>(null);
    const [erro, setErro] = useState<string | null>(null);

    const buscarDados = async (inicio?: string, fim?: string) => {
        setLoading(true);
        setErro(null);
        try {
            let queryInicio = inicio;
            let queryFim = fim;

            // Se não recebeu datas, puxa as datas baseadas no mês selecionado na tabela
            if (!queryInicio || !queryFim) {
                const { primeiroDia, ultimoDia } = mesTabela ? getDatasDoMes(mesTabela) : getDatasMesAtual();
                queryInicio = primeiroDia;
                queryFim = ultimoDia;
            }

            const resposta = await RelatoriosAPI.buscarDados(queryInicio, queryFim);

            if (resposta.dados) {
                setDados(resposta.dados);
            } else {
                setDados(resposta);
            }
        } catch (error: any) {
            console.error(error);
            setErro(error.message || "Erro de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    // Ao carregar a tela, puxa automaticamente os dados do mês atual
    useEffect(() => {
        buscarDados();
    }, []);

    // Botão de Buscar (Filtro Customizado Livre)
    const handleBuscarPersonalizado = async () => {
        if (dataInicio && dataFim) {
            setMesTabela(""); // Desativa o mês da tabela, pois agora estamos vendo um período customizado
            await buscarDados(dataInicio, dataFim);
        } else {
            alert("Preencha a data inicial e final para buscar um período customizado.");
        }
    };

    // 🟢 Quando o usuário altera apenas o mês lá na tabela
    const handleMesTabelaChange = (novoMes: string) => {
        setMesTabela(novoMes);
        setDataInicio(""); // Limpa os inputs de data lá de cima
        setDataFim("");
        if (novoMes) {
            const { primeiroDia, ultimoDia } = getDatasDoMes(novoMes);
            buscarDados(primeiroDia, ultimoDia);
        }
    };

    const limparFiltros = () => {
        setDataInicio("");
        setDataFim("");
        setMesTabela(getMesAtualYyyyMm());
        setModuloAtivo(null);
        setErro(null);
        const { primeiroDia, ultimoDia } = getDatasMesAtual();
        buscarDados(primeiroDia, ultimoDia);
    };

    const handleExportarZip = () => {
        if (!moduloAtivo) {
            alert("Selecione um módulo para exportar.");
            return;
        }
        // Se as datas livres estiverem preenchidas, usa elas. Se não, usa o mês da tabela.
        let inicioZip = dataInicio;
        let fimZip = dataFim;

        if (!inicioZip || !fimZip) {
            const { primeiroDia, ultimoDia } = mesTabela ? getDatasDoMes(mesTabela) : getDatasMesAtual();
            inicioZip = primeiroDia;
            fimZip = ultimoDia;
        }

        const url = RelatoriosAPI.getUrlZip(moduloAtivo, inicioZip, fimZip);
        window.open(url, "_blank");
    };

    const handleDownloadRegistro = (registro: any) => {
        const primeiroDoc = registro.documentos?.[0];
        if (!primeiroDoc) {
            alert("Este registro não possui documento salvo.");
            return;
        }
        const url = DocumentosAPI.getUrlDownload(primeiroDoc.id);
        window.open(url, "_blank");
    };

    return {
        dataInicio, setDataInicio,
        dataFim, setDataFim,
        mesTabela, handleMesTabelaChange, // Retornando as novas funções do Mês
        loading, dados,
        moduloAtivo, setModuloAtivo,
        erro,
        handleBuscarPersonalizado,
        limparFiltros,
        handleExportarZip,
        handleDownloadRegistro,
    };
}