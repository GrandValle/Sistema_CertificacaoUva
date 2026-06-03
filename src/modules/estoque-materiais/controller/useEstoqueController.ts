"use client";

import { useState, useEffect } from "react";
import { TabType, ProdutoCatalogo, EstoqueLog, RegistroTesoura, RegistroOculos } from "../model/estoqueModel";
import { STORAGE_KEYS } from "../../../constants/storageKeys";
import { exportEstoqueToExcel } from "../services/excelFormatter";
import { salvarDocumento } from "../../../services/api";

interface EstoquePersistedState {
    estoqueLogs?: EstoqueLog[];
    tesourasLogs?: RegistroTesoura[];
    oculosLogs?: RegistroOculos[];
    dataInicio?: string;
    dataFim?: string;
    activeTab?: TabType;
}

export function useEstoqueController() {
    const getSavedState = (): EstoquePersistedState | null => {
        if (typeof window === "undefined") return null;
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.estoque);
            return saved ? (JSON.parse(saved) as EstoquePersistedState) : null;
        } catch {
            return null;
        }
    };

    const savedState = getSavedState();

    const [activeTab, setActiveTab] = useState<TabType>(() => savedState?.activeTab || "estoque");
    const [frequenciaTesoura] = useState("Diária");

    // 🟢 ESTADO DOS PRODUTOS VEM DO BANCO DE DADOS
    const [produtos, setProdutos] = useState<ProdutoCatalogo[]>([]);

    const gerarLinhaVaziaTesoura = () => ({
        id: Date.now() + Math.random(),
        funcionario: "",
        numeroTesoura: "",
        dias: {
            "SEG": { e: false, d: false }, "TER": { e: false, d: false },
            "QUA": { e: false, d: false }, "QUI": { e: false, d: false },
            "SEX": { e: false, d: false }, "SAB": { e: false, d: false }
        }
    });

    const gerarLinhaVaziaOculos = (): RegistroOculos => ({
        id: Date.now() + Math.random(),
        data: "",
        colaborador: "",
        intacto: null,
        assinatura: null,
        observacao: ""
    });

    const toNumber = (value: string | number | null | undefined): number => {
        if (value === null || value === undefined) return 0;
        const normalized = String(value).replace(",", ".").trim();
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatBalanceNumber = (value: number): string => {
        return Number(value.toFixed(3)).toString();
    };

    const normalizeUnit = (unit: string | undefined): string => (unit || "").trim().toLowerCase();

    const convertToBaseUnit = (amount: number, fromUnit: string, baseUnit: string): number | null => {
        if (!amount) return 0;
        const from = normalizeUnit(fromUnit);
        const base = normalizeUnit(baseUnit);

        if (!base) return amount;
        if (!from || from === base) return amount;

        if (from === "l" && base === "ml") return amount * 1000;
        if (from === "ml" && base === "l") return amount / 1000;
        if (from === "kg" && base === "g") return amount * 1000;
        if (from === "g" && base === "kg") return amount / 1000;

        return null;
    };

    const recalculateEstoqueBalances = (logs: EstoqueLog[], catalog: ProdutoCatalogo[]): EstoqueLog[] => {
        const productState = new Map<string, { balance: number; unit: string }>();

        return logs.map((log) => {
            const productName = (log.product || "").trim();
            if (!productName) return { ...log, balance: "" };

            const catalogProduct = catalog.find((p) => p.nome === productName);
            const baseUnit = catalogProduct?.unidade || log.entryUnit || log.exitUnit || "";

            if (!productState.has(productName)) {
                productState.set(productName, {
                    balance: toNumber(catalogProduct?.quantidade),
                    unit: baseUnit,
                });
            }

            const state = productState.get(productName)!;
            const unit = state.unit || baseUnit;

            const entryValue = toNumber(log.entry);
            const exitValue = toNumber(log.exit);

            const entryConverted = convertToBaseUnit(entryValue, log.entryUnit || unit, unit);
            const exitConverted = convertToBaseUnit(exitValue, log.exitUnit || unit, unit);

            if (entryConverted !== null) state.balance += entryConverted;
            if (exitConverted !== null) state.balance -= exitConverted;

            const balanceText = unit
                ? `${formatBalanceNumber(state.balance)} ${catalogProduct?.unidade || unit}`
                : formatBalanceNumber(state.balance);

            return {
                ...log,
                balance: balanceText,
            };
        });
    };

    const getUpdatedCatalog = (): ProdutoCatalogo[] => {
        const productState = new Map<string, number>();

        estoqueLogs.forEach(log => {
            const productName = (log.product || "").trim();
            if (!productName) return;

            const catalogProduct = produtos.find((p) => p.nome === productName);
            const baseUnit = catalogProduct?.unidade || log.entryUnit || log.exitUnit || "";

            if (!productState.has(productName)) {
                productState.set(productName, toNumber(catalogProduct?.quantidade));
            }

            let currentBalance = productState.get(productName)!;
            const unit = baseUnit;

            const entryConverted = convertToBaseUnit(toNumber(log.entry), log.entryUnit || unit, unit);
            const exitConverted = convertToBaseUnit(toNumber(log.exit), log.exitUnit || unit, unit);

            if (entryConverted !== null) currentBalance += entryConverted;
            if (exitConverted !== null) currentBalance -= exitConverted;

            productState.set(productName, currentBalance);
        });

        return produtos.map(p => {
            if (productState.has(p.nome)) {
                return { ...p, quantidade: String(productState.get(p.nome)) };
            }
            return p;
        });
    };

    const todayDate = new Date().toISOString().split("T")[0];

    // 🟢 1. BUSCA OS PRODUTOS DO BANCO DE DADOS (GET)
    useEffect(() => {
        const fetchProdutosBanco = async () => {
            try {
                const res = await fetch('http://192.168.250.237:3333/api/produtos?tipo=LIMPEZA');
                if (res.ok) {
                    const data = await res.json();
                    setProdutos(data);
                }
            } catch (error) {
                console.error("Erro ao carregar produtos:", error);
            }
        };
        fetchProdutosBanco();
    }, []);

    const [estoqueLogs, setEstoqueLogs] = useState<EstoqueLog[]>(() => {
        const baseLogs = savedState?.estoqueLogs?.length
            ? savedState.estoqueLogs.map((log) => ({ ...log, date: todayDate }))
            : [{ id: 1, date: todayDate, product: "", entry: "", entryUnit: "", exit: "", exitUnit: "", sector: "", whoTook: null, balance: "", responsible: null }];
        return baseLogs;
    });

    // Atualiza os logs sempre que a lista de produtos (do banco) carregar
    useEffect(() => {
        if (produtos.length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEstoqueLogs(prevLogs => recalculateEstoqueBalances(prevLogs, produtos));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [produtos]);

    const [tesourasLogs, setTesourasLogs] = useState<RegistroTesoura[]>(
        () => savedState?.tesourasLogs?.length
            ? savedState.tesourasLogs
            : [gerarLinhaVaziaTesoura(), gerarLinhaVaziaTesoura(), gerarLinhaVaziaTesoura(), gerarLinhaVaziaTesoura()]
    );
    const [oculosLogs, setOculosLogs] = useState<RegistroOculos[]>(
        () => savedState?.oculosLogs?.length
            ? savedState.oculosLogs
            : [gerarLinhaVaziaOculos(), gerarLinhaVaziaOculos(), gerarLinhaVaziaOculos()]
    );
    const [dataInicio, setDataInicio] = useState(() => savedState?.dataInicio || "");
    const [dataFim, setDataFim] = useState(() => savedState?.dataFim || "");

    useEffect(() => {
        localStorage.setItem(STORAGE_KEYS.estoque, JSON.stringify({
            estoqueLogs, tesourasLogs, oculosLogs, activeTab, dataInicio, dataFim
        }));
    }, [estoqueLogs, tesourasLogs, oculosLogs, activeTab, dataInicio, dataFim]);

    // 🟢 2. SALVA O PRODUTO NOVO NO BANCO DE DADOS (POST)
    const adicionarProdutoCatalogo = async (nome: string, unidade: string, quantidade: string = "") => {
        try {
            const res = await fetch('http://192.168.250.237:3333/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, tipo: "LIMPEZA", unidade, quantidade: quantidade || "0" })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Erro ao adicionar produto.");
            }

            const novoProdutoSalvo = await res.json();

            setProdutos((prev) => {
                const nextProducts = [...prev, novoProdutoSalvo];
                setEstoqueLogs((currentLogs) => recalculateEstoqueBalances(currentLogs, nextProducts));
                return nextProducts;
            });

        } catch (error: any) {
            alert(error.message);
        }
    };

    const addEstoqueRow = () => setEstoqueLogs(prev => {
        const nextLogs = [...prev, { id: Date.now(), date: new Date().toISOString().split("T")[0], product: "", entry: "", entryUnit: "", exit: "", exitUnit: "", sector: "", whoTook: null, balance: "", responsible: null }];
        return recalculateEstoqueBalances(nextLogs, produtos);
    });

    const updateEstoque = <K extends keyof EstoqueLog>(id: number, field: K, value: EstoqueLog[K]) => {
        setEstoqueLogs((prev) => {
            const nextLogs = prev.map((log) => {
                if (log.id !== id) return log;

                const updatedLog = { ...log, [field]: value };

                if (field === "product") {
                    const selectedProduct = produtos.find((p) => p.nome === String(value));
                    if (selectedProduct) {
                        updatedLog.entryUnit = selectedProduct.unidade;
                        updatedLog.exitUnit = selectedProduct.unidade;
                    }
                }

                return updatedLog;
            });

            return recalculateEstoqueBalances(nextLogs, produtos);
        });
    };

    const removeEstoqueRow = (id: number) => setEstoqueLogs(prev => {
        const filtered = prev.length > 1 ? prev.filter(log => log.id !== id) : prev;
        return recalculateEstoqueBalances(filtered, produtos);
    });

    const addTesouraRow = () => setTesourasLogs(prev => [...prev, gerarLinhaVaziaTesoura()]);
    const updateTesoura = <K extends keyof RegistroTesoura>(id: number, field: K, value: RegistroTesoura[K]) => setTesourasLogs(prev => prev.map(log => log.id === id ? { ...log, [field]: value } : log));
    const toggleDiaTesoura = (id: number, dia: string, tipo: 'e' | 'd') => {
        setTesourasLogs(prev => prev.map(log => {
            if (log.id === id) { return { ...log, dias: { ...log.dias, [dia]: { ...log.dias[dia], [tipo]: !log.dias[dia][tipo] } } }; }
            return log;
        }));
    };
    const removeTesouraRow = (id: number) => setTesourasLogs(prev => prev.length > 4 ? prev.filter(log => log.id !== id) : prev);

    const addOculosRow = () => setOculosLogs(prev => [...prev, gerarLinhaVaziaOculos()]);
    const updateOculosRow = <K extends keyof RegistroOculos>(id: number, field: K, value: RegistroOculos[K]) => setOculosLogs(prev => prev.map(log => log.id === id ? { ...log, [field]: value } : log));
    const removeOculosRow = (id: number) => setOculosLogs(prev => prev.filter(log => log.id !== id));

    const exportarExcel = async () => {
        try {
            console.log("Gerando arquivo Excel de Estoque...");
            const now = new Date();

            const excelBlob = await exportEstoqueToExcel({
                activeTab,
                estoqueLogs,
                tesourasLogs,
                oculosLogs,
                dataInicio,
                dataFim,
                frequenciaTesoura
            });

            const mesAtual = now.toISOString().slice(0, 7);
            const tabNameMap: Record<TabType, string> = {
                estoque: "Estoque",
                tesouras: "Tesouras",
                oculos: "Óculos"
            };

            const docCodeMap: Record<TabType, string> = {
                estoque: "PHU-029",
                tesouras: "PHU-043",
                oculos: "PHU-027"
            };

            const produtosAtualizados = getUpdatedCatalog();

            let dadosEstoque = {};
            if (activeTab === "estoque") {
                dadosEstoque = { produtos: produtosAtualizados, estoqueLogs };
            }
            if (activeTab === "tesouras") dadosEstoque = { tesourasLogs, dataInicio, dataFim, frequenciaTesoura };
            if (activeTab === "oculos") dadosEstoque = { oculosLogs };

            const dadosDoBanco = {
                popCode: docCodeMap[activeTab],
                titulo: `Estoque/Materiais - ${tabNameMap[activeTab]}`,
                mes: mesAtual,
                aba: tabNameMap[activeTab],
                dadosEstoque: dadosEstoque
            };

            console.log("Enviando dados para o servidor...");

            const resposta = await salvarDocumento(
                "estoque_material",
                dadosDoBanco,
                excelBlob as Blob,
                `Estoque_${activeTab}_${now.getTime()}.xlsx`
            );

            console.log("Sucesso! Salvo no banco com o ID:", resposta.id);

            switch (activeTab) {
                case "estoque":
                    // 🟢 3. ATUALIZA OS SALDOS NO BANCO (PUT) E LIMPA A TELA
                    await fetch('http://192.168.250.237:3333/api/produtos/saldos', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ produtosAtualizados })
                    });

                    setProdutos(produtosAtualizados);

                    const logsVazios = [{
                        id: Date.now(),
                        date: new Date().toISOString().split("T")[0],
                        product: "", entry: "", entryUnit: "", exit: "", exitUnit: "", sector: "", whoTook: null, balance: "", responsible: null
                    }];
                    setEstoqueLogs(recalculateEstoqueBalances(logsVazios, produtosAtualizados));
                    break;
                case "tesouras":
                    setTesourasLogs([gerarLinhaVaziaTesoura(), gerarLinhaVaziaTesoura(), gerarLinhaVaziaTesoura(), gerarLinhaVaziaTesoura()]);
                    setDataInicio("");
                    setDataFim("");
                    break;
                case "oculos":
                    setOculosLogs([gerarLinhaVaziaOculos(), gerarLinhaVaziaOculos(), gerarLinhaVaziaOculos()]);
                    break;
            }

            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new Event("historicoAtualizado"));

            alert(`Registro de ${tabNameMap[activeTab]} salvo no banco de dados com sucesso!`);
        } catch (error) {
            console.error("Erro ao salvar histórico:", error);
            alert("Ocorreu um erro ao salvar o registro no banco de dados.");
        }
    };

    return {
        activeTab, setActiveTab, produtos, adicionarProdutoCatalogo,
        estoqueLogs, addEstoqueRow, updateEstoque, removeEstoqueRow,
        tesourasLogs, addTesouraRow, updateTesoura, toggleDiaTesoura, removeTesouraRow,
        dataInicio, setDataInicio, dataFim, setDataFim, frequenciaTesoura,
        oculosLogs, addOculosRow, updateOculosRow, removeOculosRow,
        exportarExcel
    };
}