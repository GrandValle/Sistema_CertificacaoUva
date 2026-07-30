"use client";

import { useSearchParams } from "next/navigation";
import { HistoricTable } from "../../../components/HistoricTable";
import { Suspense, useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { BiArrowBack } from "react-icons/bi";
import { AREAS_DATA } from "../../../modules/higienizacao-geral/model/higienizacaoGeral";
import { obterHistorico, getUrlDownload, deletarRegistro } from "../../../services/api";

interface HistoricColumn {
    key: string;
    label: string;
    render?: (value: any, record?: any) => React.ReactNode;
}

interface FilterOption {
    name: string;
    key: string;
    values: string[];
}

const BACKEND_ROUTES_MAP: Record<string, string> = {
    higienizacao: "higienizacao_geral",
    acesso: "controle_acesso",
    manutencao: "manutencao_calibracao",
    conduta: "conduta_higiene",
    qualidade: "controle_qualidade",
    estoque: "estoque_material",
    inspecao: "inspecao_operacional",
    visitantes: "questionario_visitante",
};

function HistoricoPageContent() {
    const searchParams = useSearchParams();
    const moduleType = searchParams.get("modulo") || "higienizacao";

    const [historico, setHistorico] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // 🔥 Trava de segurança para impedir o Loop da API
    const fetchLock = useRef<string | null>(null);

    const backendTipoTela = BACKEND_ROUTES_MAP[moduleType] || moduleType;

    const renderIdShort = (val: string | number) => {
        const strVal = String(val);
        return (
            <span title={strVal} className="font-mono text-xs">
                {strVal.includes('-') ? strVal.split('-')[0] + '-' + strVal.split('-')[1].slice(-4) : strVal}
            </span>
        );
    };

    const renderDateTime = (val: string) => {
        const date = new Date(val);
        if (Number.isNaN(date.getTime())) return "-";

        return date.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    useEffect(() => {
        // Gera uma chave única baseada no estado atual
        const currentLock = `${backendTipoTela}-${refreshKey}`;

        // Se já buscamos ESTA mesma configuração, nós bloqueamos a execução e matamos o loop!
        if (fetchLock.current === currentLock) return;
        fetchLock.current = currentLock;

        const carregarHistorico = async () => {
            setLoading(true);
            try {
                const data = await obterHistorico(backendTipoTela);

                const normalized = data.map((record: any) => {
                    const arquivo = record.documentos?.[0];
                    const aba = String(record.aba || "").trim();
                    const setor = String(record.setor || "").trim();
                    const areaBase = record.setor || record.area || record.tipo || record.aba || "-";

                    const areaFormatada = moduleType === "inspecao"
                        ? (aba && setor && aba.toLowerCase() !== setor.toLowerCase()
                            ? `${aba} - ${setor}`
                            : areaBase)
                        : areaBase;

                    return {
                        id: record.id,
                        nome: record.nome || "",
                        empresa: record.empresa || "",
                        mes: record.mes || record.semana || "-",
                        area: areaFormatada,
                        frequencia: record.frequencia || "-",
                        status: String(record.status || "completo").toLowerCase(),
                        exportedAt: arquivo?.criadoEm || record.createdAt || new Date().toISOString(),
                        arquivoId: arquivo?.id,
                        fileName: arquivo?.nomeArquivo
                    };
                });

                setHistorico(normalized);
            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
                // Em caso de erro grave, limpamos a trava para permitir que o usuário tente de novo
                fetchLock.current = null;
            } finally {
                setLoading(false);
            }
        };

        carregarHistorico();
    }, [backendTipoTela, moduleType, refreshKey]);

    // 🔥 MEMOIZANDO AS CONFIGURAÇÕES (Evita que o React recrie esse objeto gigante à toa)
    const config = useMemo(() => {
        const higienizacaoAreas = AREAS_DATA.map((area) => area.nome);

        const configMap: Record<string, any> = {
            higienizacao: {
                title: "Histórico de Higienização Geral",
                description: "Consulte as exportações individuais por área e baixe as planilhas geradas.",
                backLink: "/higienizacao-geral",
                backText: "Voltar para Higienização",
                customFilter: { name: "Áreas", key: "area", values: higienizacaoAreas },
                columns: [
                    { key: "id", label: "ID", render: renderIdShort },
                    { key: "mes", label: "Mês / Ano" },
                    { key: "area", label: "Área (Setor)" },
                    { key: "exportedAt", label: "Exportado em", render: renderDateTime },
                    {
                        key: "status", label: "Status",
                        render: (val: string) => (
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black ${val === "completo"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : val === "incompleto"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}>
                                {val === "completo" ? "Completo" : "Incompleto"}
                            </span>
                        ),
                    },
                ] as HistoricColumn[],
            },
            acesso: {
                title: "Histórico de Acesso",
                description: "Consulte o histórico diário da portaria e controle de segurança.",
                backLink: "/controle-acesso",
                backText: "Voltar para Acesso",
                customFilter: null,
                columns: [
                    { key: "id", label: "ID", render: renderIdShort },
                    { key: "mes", label: "Mês / Ano" },
                    { key: "area", label: "Setor" },
                    { key: "exportedAt", label: "Exportado em", render: renderDateTime }
                ] as HistoricColumn[],
            },
            manutencao: {
                title: "Histórico de Manutenção",
                description: "Consulte todos os registros de manutenção realizados.",
                backLink: "/manutencao-calibracao",
                backText: "Voltar para Manutenção",
                customFilter: {
                    name: "Área",
                    key: "area",
                    values: ["Checklist Semanal", "Checklist Mensal", "Reparos e Manutenções", "Aferição de Balanças"],
                },
                columns: [
                    { key: "id", label: "ID", render: renderIdShort },
                    { key: "mes", label: "Mês / Ano" },
                    { key: "area", label: "Área" },
                    { key: "frequencia", label: "Frequência" },
                    { key: "exportedAt", label: "Exportado em", render: renderDateTime },
                ] as HistoricColumn[],
            },
            conduta: {
                title: "Histórico de Conduta e Higiene",
                description: "Consulte o histórico de registros de conduta e lavagem.",
                backLink: "/conduta-higiene",
                backText: "Voltar para Conduta",
                customFilter: { name: "Áreas", key: "area", values: ["Checklist", "Lavagem"] },
                columns: [
                    { key: "id", label: "ID", render: renderIdShort },
                    { key: "mes", label: "Semana" },
                    { key: "area", label: "Aba" },
                    { key: "exportedAt", label: "Exportado em", render: renderDateTime },
                ] as HistoricColumn[],
            },
            qualidade: {
                title: "Histórico de Controle de Qualidade",
                description: "Consulte os registros de qualidade e rejeitos.",
                backLink: "/controle-qualidade",
                backText: "Voltar para Qualidade",
                customFilter: { name: "Áreas", key: "area", values: ["Vidros", "Pragas", "Inusuais", "Rejeitos"] },
                columns: [
                    { key: "id", label: "ID", render: renderIdShort },
                    { key: "mes", label: "Mês / Ano" },
                    { key: "area", label: "Aba" },
                    { key: "exportedAt", label: "Exportado em", render: renderDateTime },
                    {
                        key: "status", label: "Status",
                        render: (val: string) => (
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest font-black ${val === "completo"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : val === "parcial"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}>
                                {val === "completo" ? "Completo" : val === "parcial" ? "Parcial" : "Pendente"}
                            </span>
                        ),
                    },
                ] as HistoricColumn[],
            },
            estoque: {
                title: "Histórico do Estoque e Materiais",
                description: "Consulte o histórico de movimentações de tesouras, óculos e materiais de limpeza.",
                backLink: "/estoque-materiais",
                backText: "Voltar para Estoque e Materiais",
                customFilter: {
                    name: "Áreas",
                    key: "area",
                    values: [
                        "Tesouras",
                        "Óculos",
                        "Estoque de Material de Limpeza",
                        "Inspeção de Material de Limpeza"
                    ]
                },
                columns: [
                    { key: "id", label: "ID", render: renderIdShort },
                    { key: "mes", label: "Mês / Ano" },
                    { key: "area", label: "Área" },
                    { key: "exportedAt", label: "Exportado em", render: renderDateTime },
                ] as HistoricColumn[],
            },
            inspecao: {
                title: "Histórico de Inspeção",
                description: "Consulte os registros de inspeção realizados.",
                backLink: "/inspecao",
                backText: "Voltar para Inspeção",
                customFilter: {
                    name: "Áreas",
                    key: "area",
                    values: [
                        "Pré-Inspeção",
                        "Objetos Estranhos",
                        "Objetos Estranhos - Recepção da fruta",
                        "Objetos Estranhos - Área de embalagem"
                    ]
                },
                columns: [
                    { key: "id", label: "ID", render: renderIdShort },
                    { key: "mes", label: "Mês / Ano" },
                    { key: "area", label: "Área" },
                    { key: "exportedAt", label: "Exportado em", render: renderDateTime },
                ] as HistoricColumn[],
            },
            visitantes: {
                title: "Histórico de Visitantes (PHU-038)",
                description: "Consulte os questionários de saúde assinados pelos visitantes.",
                backLink: "/questionario-visitantes",
                backText: "Voltar para o Questionário",
                customFilter: null,
                columns: [
                    { key: "id", label: "ID", render: renderIdShort },
                    { key: "exportedAt", label: "Data e horário de cadastro", render: renderDateTime },
                    { key: "nome", label: "Nome do Visitante", render: (val: string) => val || "Não informado" },
                    { key: "empresa", label: "Empresa", render: (val: string) => val || "-" }
                ] as HistoricColumn[],
            },
        };

        return configMap[moduleType] || configMap.higienizacao;
    }, [moduleType]);

    const handleExport = async (record: any) => {
        if (!record.arquivoId) {
            alert("Este registro não possui planilha vinculada no banco de dados.");
            return;
        }

        try {
            const urlDownload = getUrlDownload(record.arquivoId);
            const response = await fetch(urlDownload);

            if (!response.ok) throw new Error("Erro ao baixar arquivo");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = record.fileName || `documento_${backendTipoTela}.xlsx`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Erro ao realizar o download:", error);
            alert("Erro ao baixar a planilha do servidor.");
        }
    };

    const handleDelete = async (id: string) => {
        const confirmar = window.confirm("Tem certeza que deseja apagar este registro do sistema?");
        if (!confirmar) return;

        try {
            await deletarRegistro(backendTipoTela, id);
            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error("Erro ao deletar registro:", error);
            alert("Erro ao deletar o registro.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6 font-sans">
            <div className="max-w-6xl mx-auto">
                <Link
                    href={config.backLink}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-bold text-sm transition-colors"
                >
                    <BiArrowBack size={20} /> {config.backText}
                </Link>

                {loading ? (
                    <div className="flex justify-center p-10"><p className="text-slate-500 font-bold">Carregando histórico do servidor...</p></div>
                ) : (
                    <HistoricTable
                        title={config.title}
                        description={config.description}
                        columns={config.columns}
                        data={historico}
                        customFilter={config.customFilter as FilterOption}
                        onExport={handleExport}
                        onDelete={handleDelete}
                        searchPlaceholder="Buscar por ID ou termo..."
                    />
                )}
            </div>
        </div>
    );
}

export default function HistoricoRoutePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-100 p-4 md:p-6 font-sans flex items-center justify-center"><p className="text-slate-500 font-bold">Aguardando roteamento...</p></div>}>
            <HistoricoPageContent />
        </Suspense>
    );
}