"use client";

import * as ExcelJS from "exceljs";
import {
    LEGENDA_VIDROS,
    LEGENDA_PRAGAS,
    LEGENDA_INUSUAIS,
    LEGENDA_REJEITOS,
    PRAGAS_SETORES,
    PRAGAS_COLUNAS
} from "../model/controleQualidadeModel";

const formatName = (str: string) => {
    if (!str) return "";
    if (str.startsWith("data:image")) return "[ASSINATURA DIGITAL]";
    return str.replace(/_/g, " ").toUpperCase();
};

const normalizeFileName = (str: string) => {
    if (!str) return "";
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "_")
        .toLowerCase();
};

// 🟢 FUNÇÃO SEGURA PARA DATAS
const formatSafeDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) {
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    }
    return dateStr;
};

const fetchSignatureImage = async (baseName: string) => {
    const baseUrl = window.location.origin;
    const withSpaces = baseName.replace(/_/g, " ");
    const normalized = normalizeFileName(baseName);
    const tentativas = [`${baseName}.png`, `${withSpaces}.png`, `${normalized}.png`, `${normalized}.jpg`];

    for (const fileName of tentativas) {
        try {
            const res = await fetch(`${baseUrl}/assinaturas/${fileName}`);
            if (res.ok) {
                const blob = await res.blob();
                return { buffer: await blob.arrayBuffer(), ext: fileName.endsWith('.jpg') ? 'jpeg' : 'png' };
            }
        } catch (e) { }
    }
    return null;
};

interface ExportExcelParams {
    activeTab: string;
    vidrosDate?: string;
    vidrosMonitor?: string | null;
    vidrosResp?: string | null;
    vidrosObs?: string;
    vidrosLogs?: any[];
    pragasLogs?: any[];
    inusuaisLogs?: any[];
    rejeitosLogs?: any[];
}

export const exportControleQualidadeToExcel = async ({
    activeTab,
    vidrosDate,
    vidrosMonitor,
    vidrosResp,
    vidrosObs,
    vidrosLogs = [],
    pragasLogs = [],
    inusuaisLogs = [],
    rejeitosLogs = []
}: ExportExcelParams) => {

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Qualidade");
    const baseUrl = window.location.origin;

    // --- 1. DEFINIÇÃO DINÂMICA DE HEADERS (Para calcular o maxCol) ---
    let headers: string[] = [];
    if (activeTab === "vidros") {
        headers = ["Verificar (Item)", "Status", "Ação Recomendada", "Observação", "Tempo de Correção"];
    } else if (activeTab === "pragas") {
        headers = ["Setor", ...PRAGAS_COLUNAS, "Ação Corretiva"];
    } else if (activeTab === "inusuais") {
        headers = ["Data", "Descrição do Acontecimento", "Ação Corretiva", "Status", "Resp. Correção", "Resp. Packing"];
    } else if (activeTab === "rejeitos") {
        headers = ["Data de Retenção", "Quantidade/Kg", "Data de Saída", "Local de Destino", "Resp. Retenção", "Resp. Rejeitados"];
    }

    const maxCol = headers.length || 5;

    // --- 2. CONFIGURAÇÃO DE PÁGINA ---
    worksheet.pageSetup = {
        paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    // --- 3. LOGO ---
    const logoRow = worksheet.addRow([]);
    logoRow.height = 70;
    try {
        const logoRes = await fetch(`${baseUrl}/logo.png`);
        if (logoRes.ok) {
            const buffer = await logoRes.arrayBuffer();
            const imgId = workbook.addImage({ buffer: buffer, extension: 'png' });
            worksheet.addImage(imgId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 60 }, editAs: 'oneCell' });
        }
    } catch (e) { }

    worksheet.addRow([]);

    // --- 4. TÍTULO ---
    const titulosMap: any = {
        vidros: "MONITORAMENTO DE VIDRO E PLÁSTICO RÍGIDO",
        pragas: "MONITORAMENTO DE VETORES E PRAGAS URBANAS",
        inusuais: "REGISTRO DE ACONTECIMENTOS INUSUAIS",
        rejeitos: "REGISTRO DE PRODUTOS RETIDOS / REJEITOS"
    };

    const titleRow = worksheet.addRow([titulosMap[activeTab] || "CONTROLE DE QUALIDADE"]);
    worksheet.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };
    titleRow.height = 50;

    worksheet.addRow([`Exportado em: ${new Date().toLocaleString("pt-BR")}`]).getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    if (activeTab === "vidros") {
        worksheet.addRow([`Frequência: Semanal`]).getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
        worksheet.addRow([`Data da verificação: ${formatSafeDate(vidrosDate || new Date().toISOString().split("T")[0])}`]).getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    }

    worksheet.addRow([]);

    // --- 5. ASSINATURAS (No Cabeçalho) ---
    const processSignature = async (label: string, value: string | null | undefined) => {
        const row = worksheet.addRow([label, value ? formatName(value) : "_________________________________"]);
        row.height = 60;
        row.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1F2937" } };
        row.getCell(2).alignment = { horizontal: "left", vertical: "bottom" };

        if (value) {
            if (value.startsWith("data:image")) {
                const imgId = workbook.addImage({ base64: value.split(",")[1], extension: "png" });
                worksheet.addImage(imgId, { tl: { col: 1.1, row: row.number - 1 }, ext: { width: 120, height: 35 }, editAs: "oneCell" });
            } else {
                const imgFile = await fetchSignatureImage(value);
                if (imgFile) {
                    const imgId = workbook.addImage({ buffer: imgFile.buffer, extension: imgFile.ext as any });
                    worksheet.addImage(imgId, { tl: { col: 1.1, row: row.number - 1 }, ext: { width: 120, height: 35 }, editAs: "oneCell" });
                }
            }
        }
    };

    if (activeTab === "vidros") {
        await processSignature("Assinatura do Monitor:", vidrosMonitor);
        await processSignature("Assinatura do Resp. Packing:", vidrosResp);
        worksheet.addRow([]);
    }

    // --- 6. TABELA (ESTILOS E CABEÇALHOS) ---
    if (activeTab === "vidros") {
        worksheet.columns = [{ width: 30 }, { width: 12 }, { width: 35 }, { width: 35 }, { width: 20 }];
    } else if (activeTab === "pragas") {
        worksheet.getColumn(1).width = 25;
        for (let i = 2; i <= PRAGAS_COLUNAS.length + 1; i++) worksheet.getColumn(i).width = 12;
        worksheet.getColumn(PRAGAS_COLUNAS.length + 2).width = 30;
    } else if (activeTab === "inusuais") {
        worksheet.columns = [{ width: 15 }, { width: 40 }, { width: 35 }, { width: 15 }, { width: 20 }, { width: 20 }];
    } else if (activeTab === "rejeitos") {
        worksheet.columns = [{ width: 18 }, { width: 15 }, { width: 18 }, { width: 30 }, { width: 25 }, { width: 25 }];
    }

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    const addTableSignature = async (value: string | null | undefined, rowNum: number, colNum: number) => {
        if (!value) return;
        const imgFile = value.startsWith("data:image") ? { base64: value.split(",")[1], ext: "png" } : await fetchSignatureImage(value);
        if (imgFile) {
            const imgId = workbook.addImage(value.startsWith("data:image") ? { base64: (imgFile as any).base64, extension: "png" } : { buffer: (imgFile as any).buffer, extension: (imgFile as any).ext });
            worksheet.addImage(imgId, {
                tl: { col: colNum - 1 + 0.1, row: rowNum - 1 + 0.1 },
                ext: { width: 100, height: 35 },
                editAs: "oneCell"
            });
        }
    };

    const applyRowStyle = (row: ExcelJS.Row, isSignatureRow = false) => {
        row.height = isSignatureRow ? 55 : 28;
        row.eachCell((cell) => {
            cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        });
    };

    // --- 7. DADOS ---
    if (activeTab === "vidros") {
        const filteredRows = vidrosLogs.filter(r => r.item !== "Outros" && !(r.item?.startsWith("Outros:") && r.item.replace("Outros:", "").trim() === ""));
        for (let i = 0; i < filteredRows.length; i++) {
            const row = filteredRows[i];
            const itemSemPrefixoOutros = String(row.item || "").replace(/^Outros\s*:\s*/i, "").trim();
            const dataRow = worksheet.addRow([
                itemSemPrefixoOutros || row.item || "", row.conforme === "C" ? "SIM" : (row.conforme === "NC" ? "NÃO" : ""),
                row.acaoRecomendada || "", i === 0 ? vidrosObs : "", row.tempoCorrecao || ""
            ]);
            applyRowStyle(dataRow);
        }
    } else if (activeTab === "pragas") {
        for (let i = 0; i < pragasLogs.length; i++) {
            const log = pragasLogs[i];
            PRAGAS_SETORES.forEach((setor, index) => {
                const rowData = [setor];
                PRAGAS_COLUNAS.forEach(coluna => {
                    rowData.push(log.grid[`${setor}_${coluna}`] || "");
                });
                rowData.push(index === 0 ? (log.acaoCorretiva || "") : "");
                const dataRow = worksheet.addRow(rowData);
                applyRowStyle(dataRow);
            });
        }
    } else if (activeTab === "inusuais") {
        for (let i = 0; i < inusuaisLogs.length; i++) {
            const row = inusuaisLogs[i];
            const dataRow = worksheet.addRow([
                formatSafeDate(row.data), // 🟢 DATA SEGURA AQUI
                row.descricao || "", row.acaoCorretiva || "",
                row.status ? row.status.toUpperCase() : "",
                formatName(row.respCorrecao), formatName(row.respPacking)
            ]);

            applyRowStyle(dataRow, true);
            dataRow.getCell(5).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
            dataRow.getCell(6).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

            await addTableSignature(row.respCorrecao, dataRow.number, 5);
            await addTableSignature(row.respPacking, dataRow.number, 6);
        }
    } else if (activeTab === "rejeitos") {
        for (let i = 0; i < rejeitosLogs.length; i++) {
            const row = rejeitosLogs[i];
            const dataRow = worksheet.addRow([
                formatSafeDate(row.dataRetencao), // 🟢 DATA SEGURA AQUI
                row.quantidade || "",
                formatSafeDate(row.dataSaida),    // 🟢 E AQUI
                row.localDestino || "",
                formatName(row.responsavelRetencao), formatName(row.responsavelRejeitados)
            ]);

            applyRowStyle(dataRow, true);
            dataRow.getCell(5).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
            dataRow.getCell(6).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

            await addTableSignature(row.responsavelRetencao, dataRow.number, 5);
            await addTableSignature(row.responsavelRejeitados, dataRow.number, 6);
        }
    }

    // --- 8. LEGENDA E CONTROLE DE REVISÃO ---
    worksheet.addRow([]);

    const legendasMap: Record<string, string[]> = {
        vidros: LEGENDA_VIDROS, pragas: LEGENDA_PRAGAS, inusuais: LEGENDA_INUSUAIS, rejeitos: LEGENDA_REJEITOS
    };

    const legendaSelecionada = legendasMap[activeTab] || [];

    if (activeTab === "inusuais") {
        const inusuaisTitulo = legendaSelecionada[0] || "Exemplos de ocorrências para registro:";
        const inusuaisTitleRow = worksheet.addRow([inusuaisTitulo]);
        worksheet.mergeCells(inusuaisTitleRow.number, 1, inusuaisTitleRow.number, maxCol);
        inusuaisTitleRow.getCell(1).font = { bold: true, color: { argb: "FF1F2937" }, size: 10 };

        legendaSelecionada.slice(1).forEach((texto) => {
            const legRow = worksheet.addRow([texto]);
            worksheet.mergeCells(legRow.number, 1, legRow.number, maxCol);
            legRow.getCell(1).font = { size: 9, color: { argb: "FF1F2937" } };
        });
    } else {
        const legendTitle = worksheet.addRow(["LEGENDA E OBSERVAÇÕES"]);
        worksheet.mergeCells(legendTitle.number, 1, legendTitle.number, maxCol);
        legendTitle.getCell(1).font = { bold: true, color: { argb: "FF1F2937" }, size: 10 };

        legendaSelecionada.forEach((texto) => {
            const legRow = worksheet.addRow([texto]);
            worksheet.mergeCells(legRow.number, 1, legRow.number, maxCol);
            legRow.getCell(1).font = { size: 9, color: { argb: "FF1F2937" } };
        });
    }

    worksheet.addRow([]);
    const revTitleRow = worksheet.addRow(["CONTROLE DE REVISÃO DO DOCUMENTO"]);
    worksheet.mergeCells(revTitleRow.number, 1, revTitleRow.number, maxCol);
    revTitleRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };

    const codeMap: any = { vidros: "PHU-035", pragas: "PHU-042", inusuais: "PHU-041", rejeitos: "PHU-034" };

    const reviewInfo = [
        ["Aprovado/Revisador:", "Clebitania Carvalho"],
        ["Data da última revisão:", "02/01/2026"],
        ["Código do documento:", codeMap[activeTab] || "GERAL"]
    ];

    reviewInfo.forEach(([label, value]) => {
        const row = worksheet.addRow([label, value]);
        worksheet.mergeCells(row.number, 2, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 9 };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    // 🟢 DEVOLVE COMO BLOB EM VEZ DE BAIXAR O ARQUIVO!
    return new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
};