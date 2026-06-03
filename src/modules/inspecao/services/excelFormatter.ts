"use client";

import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
    WEEK_DAYS,
    PreOpItem,
    ActionPlan,
    TabType,
    LEGENDA_PRE_INSPECAO,
    LEGENDA_TRANSPORTE,
    LEGENDA_EMBALAGEM,
    LEGENDA_LIMPEZA,
    COMPLIANCE_INSPECAO
} from "../model/inspecaoModel";

// --- HELPERS GERAIS ---
const formatName = (str: string) => {
    if (!str) return "";
    if (str.startsWith("data:image")) return "[ASSINATURA DIGITAL]";
    return str.replace(/_/g, " ").toUpperCase();
};

const normalizeFileName = (str: string) => (!str ? "" : str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").toLowerCase());

const fetchSignatureImage = async (baseName: string) => {
    const baseUrl = window.location.origin;
    const withSpaces = baseName.replace(/_/g, " ");
    const tentativas = [`${baseName}.png`, `${withSpaces}.png`, `${withSpaces.toUpperCase()}.png`, `${baseName}.jpg`];

    for (const fileName of tentativas) {
        try {
            const res = await fetch(`${baseUrl}/assinaturas/${fileName}`);
            if (res.ok) return { buffer: await res.blob().then(b => b.arrayBuffer()), ext: fileName.endsWith('.jpg') ? 'jpeg' : 'png' };
        } catch (e) { }
    }
    return null;
};

// --- HELPERS DE ESTILO ---
const applyHeaderStyle = (cell: ExcelJS.Cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
};

const applyDataStyle = (cell: ExcelJS.Cell, isCenter = true) => {
    cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
    cell.alignment = { horizontal: isCenter ? "center" : "left", vertical: "middle", wrapText: true };
};

const addTableSignature = async (workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet, val: string | null, rNum: number, cNum: number, cell: ExcelJS.Cell) => {
    if (!val) return;
    const imgFile = val.startsWith("data:image") ? { base64: val.split(",")[1], ext: "png" } : await fetchSignatureImage(val);

    cell.value = formatName(val);
    cell.font = { size: 8, bold: true, color: { argb: "FF003366" } };
    cell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

    if (imgFile) {
        const imgId = workbook.addImage(val.startsWith("data:image") ? { base64: (imgFile as any).base64, extension: "png" } : { buffer: (imgFile as any).buffer, extension: (imgFile as any).ext });
        worksheet.addImage(imgId, { tl: { col: cNum - 1 + 0.1, row: rNum - 1 + 0.1 }, ext: { width: 110, height: 35 }, editAs: "oneCell" });
        cell.value = `\n\n\n${formatName(val)}`;
    }
};

interface ExportInspecaoParams {
    activeTabParam: TabType;
    preOpInfo: { week: string; coordinator: string | null; area: string };
    preOpData: PreOpItem[];
    actionPlans: ActionPlan[];
    transportLogs: any[];
    packagingLogs: any[];
    currentCleaningLogs: any[];
    selectedCleaningProduct: string;
}

export const exportInspecaoToExcel = async ({ activeTabParam, preOpInfo, preOpData, actionPlans, transportLogs, packagingLogs, currentCleaningLogs, selectedCleaningProduct }: ExportInspecaoParams) => {
    const workbook = new ExcelJS.Workbook();
    const dateLabel = new Date().toISOString().split("T")[0];

    const docMap: Record<TabType, { code: string; title: string; maxCol: number }> = {
        pre_inspecao: { code: "2.11.7", title: "PRÉ-INSPEÇÃO OPERACIONAL", maxCol: 2 + WEEK_DAYS.length }, // maxCol = 8
        transporte: { code: "PHU-031", title: "INSPEÇÃO DE TRANSPORTE DE COLHEITA", maxCol: 6 },
        embalagem: { code: "PHU-032", title: "INSPEÇÃO DE MATERIAL DE EMBALAGEM", maxCol: 10 },
        limpeza: { code: "PHU-036", title: "RECEBIMENTO DE MATERIAL DE LIMPEZA", maxCol: 8 },
    };

    const { code, title, maxCol } = docMap[activeTabParam];
    const ws = workbook.addWorksheet(activeTabParam === "pre_inspecao" ? "Checklist" : activeTabParam.toUpperCase());
    const baseUrl = window.location.origin;

    // --- 1. CONFIGURAÇÃO DE COLUNAS ---
    ws.pageSetup = {
        paperSize: 9,
        orientation: activeTabParam === "transporte" ? "portrait" : "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    if (activeTabParam === "pre_inspecao") {
        ws.getColumn(1).width = 15; // 🟢 DIMINUÍDO de 24 para 15 (Mais justo)
        ws.getColumn(2).width = 45;
        WEEK_DAYS.forEach((_, i) => ws.getColumn(3 + i).width = 12);
    } else if (activeTabParam === "transporte") {
        ws.columns = [{ width: 18 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 16 }, { width: 30 }];
    } else if (activeTabParam === "embalagem") {
        ws.columns = [{ width: 18 }, { width: 22 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 18 }, { width: 18 }, { width: 25 }, { width: 28 }];
    } else {
        ws.columns = [{ width: 18 }, { width: 25 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 28 }];
    }

    // --- 2. LOGO ---
    ws.addRow([]).height = 70;
    try {
        const logoRes = await fetch(`${baseUrl}/logo.png`);
        if (logoRes.ok) ws.addImage(workbook.addImage({ buffer: await logoRes.arrayBuffer(), extension: 'png' }), { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 60 }, editAs: 'oneCell' });
    } catch (e) { }
    ws.addRow([]);

    // --- 3. CABEÇALHO EM CASCATA ---
    const titleRow = ws.addRow([title]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };

    const metaRows: string[] = [`Área: ${preOpInfo?.area || "Packing Uva"}`];
    if (activeTabParam === "pre_inspecao") metaRows.push(`Semana: ${preOpInfo.week || "-"}`);
    if (activeTabParam === "limpeza") metaRows.push(`Produto: ${selectedCleaningProduct || "Todos"}`);
    metaRows.push(`Código do documento: ${code}`);
    metaRows.push(`Exportado em: ${new Date().toLocaleString("pt-BR")}`);

    metaRows.forEach(meta => {
        const row = ws.addRow([meta]);
        ws.mergeCells(row.number, 1, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    });
    ws.addRow([]);

    // 🟢 ASSINATURA DO COORDENADOR
    if (activeTabParam === "pre_inspecao" && preOpInfo?.coordinator) {
        // Texto reduzido para não espremer na coluna 1
        const coordRow = ws.addRow(["Coordenador:", ""]);
        coordRow.height = 55;
        coordRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };
        coordRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

        await addTableSignature(workbook, ws, preOpInfo.coordinator, coordRow.number, 2, coordRow.getCell(2));
        ws.addRow([]);
    } else if (activeTabParam !== "pre_inspecao" && preOpInfo?.coordinator) {
        const labelRow = ws.addRow(["Coordenador:"]);
        labelRow.getCell(1).font = { bold: true, size: 10 };
        const sigRow = ws.addRow([""]);
        sigRow.height = 55;
        await addTableSignature(workbook, ws, preOpInfo.coordinator, sigRow.number, 1, sigRow.getCell(1));
        ws.addRow([]);
    }

    // --- 4. RENDERIZAÇÃO DAS TABELAS ---
    if (activeTabParam === "pre_inspecao") {
        const headers = ["Categoria", "Item", ...WEEK_DAYS.map(d => d.short)];
        const headerRow = ws.addRow(headers);
        headerRow.height = 24; headerRow.eachCell(applyHeaderStyle);

        // 🟢 NÚMERO DO ITEM ADICIONADO AQUI
        preOpData.filter(x => x.item).forEach((row, index) => {
            const numeroItem = row.id || (index + 1); // Pega o ID ou cria uma sequência visual
            const dataRow = ws.addRow([
                row.category || "",
                `${numeroItem}. ${row.item}`, // Une o número com o texto
                ...WEEK_DAYS.map(d => row.checks?.[d.short] === "C" ? "SIM" : row.checks?.[d.short] === "NC" ? "NÃO" : "")
            ]);
            dataRow.height = 24;
            dataRow.eachCell((c, i) => applyDataStyle(c, i > 2));
        });

        // 🟢 PLANO DE AÇÃO CORRETIVA COM MESCLAGEM CORRIGIDA
        const filledActions = actionPlans.filter(row => !!String(row.item || "").trim() || !!String(row.naoConformidade || "").trim());
        if (filledActions.length > 0) {
            ws.addRow([]); ws.addRow([]);
            const actTitle = ws.addRow(["PLANO DE AÇÃO CORRETIVA"]);
            ws.mergeCells(actTitle.number, 1, actTitle.number, maxCol);
            actTitle.getCell(1).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
            actTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };

            const headerArr = new Array(maxCol).fill("");
            headerArr[0] = "Data";
            headerArr[1] = "Item";
            headerArr[2] = "Não Conformidade";
            headerArr[4] = "Ação Corretiva";
            headerArr[6] = "Responsável"; // Fica na coluna 7 (índice 6)

            const aHeader = ws.addRow(headerArr);
            ws.mergeCells(aHeader.number, 3, aHeader.number, 4); // Não Conformidade usa as colunas 3 e 4
            ws.mergeCells(aHeader.number, 5, aHeader.number, 6); // Ação usa as colunas 5 e 6
            ws.mergeCells(aHeader.number, 7, aHeader.number, 8); // Responsável agora é LARGO, usa colunas 7 e 8!
            aHeader.eachCell(c => { applyHeaderStyle(c); c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } }; });

            for (const row of filledActions) {
                const rowArr = new Array(maxCol).fill("");
                rowArr[0] = row.date ? row.date.split('-').reverse().join('/') : "";
                rowArr[1] = row.item || "";
                rowArr[2] = row.naoConformidade || "";
                rowArr[4] = row.acaoCorretiva || "";

                const dataRow = ws.addRow(rowArr);
                ws.mergeCells(dataRow.number, 3, dataRow.number, 4);
                ws.mergeCells(dataRow.number, 5, dataRow.number, 6);
                ws.mergeCells(dataRow.number, 7, dataRow.number, 8); // Mescla também nos dados
                dataRow.height = 55;
                dataRow.eachCell((c, i) => applyDataStyle(c, i === 1 || i >= 7));

                // Assinatura inserida na coluna 7 (que está mesclada com a 8)
                await addTableSignature(workbook, ws, row.responsavel || null, dataRow.number, 7, dataRow.getCell(7));
            }
        }
    }
    else if (activeTabParam === "transporte") {
        const tHeader = ws.addRow(["Data", "Baú limpo", "Sem odor", "Livre de animais", "Contentor limpo", "Monitor"]);
        tHeader.height = 24; tHeader.eachCell(applyHeaderStyle);

        const filledTransport = transportLogs.filter(log => !!String(log.date || "").trim());
        for (const log of filledTransport) {
            const dataRow = ws.addRow([
                log.date ? log.date.split('-').reverse().join('/') : "",
                log.bauLimpo === "C" ? "SIM" : log.bauLimpo === "NC" ? "NÃO" : "",
                log.semOdor === "C" ? "SIM" : log.semOdor === "NC" ? "NÃO" : "",
                log.livreAnimais === "C" ? "SIM" : log.livreAnimais === "NC" ? "NÃO" : "",
                log.contentorLimpo === "C" ? "SIM" : log.contentorLimpo === "NC" ? "NÃO" : "",
                ""
            ]);
            dataRow.height = 55; dataRow.eachCell(c => applyDataStyle(c, true));
            await addTableSignature(workbook, ws, log.monitor || null, dataRow.number, 6, dataRow.getCell(6));
        }
    }
    else if (activeTabParam === "embalagem") {
        const eHeader = ws.addRow(["Data", "Material", "Quantidade", "Lote", "Validade", "Livre de pragas", "Embalagem fechada", "Qualidade conforme", "Observações", "Responsável"]);
        eHeader.height = 24; eHeader.eachCell(applyHeaderStyle);

        const filledPackaging = packagingLogs.filter(log => !!String(log.materialType || "").trim() || !!String(log.date || "").trim());
        for (const log of filledPackaging) {
            const dataRow = ws.addRow([
                log.date ? log.date.split('-').reverse().join('/') : "",
                log.materialType || "",
                log.quantity || "",
                log.lote || "",
                log.validity ? log.validity.split('-').reverse().join('/') : "",
                log.livrePragas === "C" ? "SIM" : log.livrePragas === "NC" ? "NÃO" : "",
                log.embalagemFechada === "C" ? "SIM" : log.embalagemFechada === "NC" ? "NÃO" : "",
                log.qualidadeConforme === "C" ? "SIM" : log.qualidadeConforme === "NC" ? "NÃO" : "",
                log.obs || "",
                ""
            ]);
            dataRow.height = 55;
            dataRow.eachCell((c, i) => applyDataStyle(c, i !== 2 && i !== 9));
            await addTableSignature(workbook, ws, log.responsavel || null, dataRow.number, 10, dataRow.getCell(10));
        }
    }
    else if (activeTabParam === "limpeza") {
        const lHeader = ws.addRow(["Data", "Produto", "Produto correto", "Composição OK", "Embalagem OK", "Padrão exigido", "Cumpre pedido", "Responsável"]);
        lHeader.height = 24; lHeader.eachCell(applyHeaderStyle);

        const filledCleaning = currentCleaningLogs.filter(log => !!String(log.product || "").trim() || !!String(log.date || "").trim());
        for (const log of filledCleaning) {
            const dataRow = ws.addRow([
                log.date ? log.date.split('-').reverse().join('/') : "",
                log.product || "",
                log.produtoCorreto ? log.produtoCorreto.toUpperCase() : "",
                log.composicaoOk ? log.composicaoOk.toUpperCase() : "",
                log.embalagemOk ? log.embalagemOk.toUpperCase() : "",
                log.padraoExigido ? log.padraoExigido.toUpperCase() : "",
                log.cumprePedido ? log.cumprePedido.toUpperCase() : "",
                ""
            ]);
            dataRow.height = 55;
            dataRow.eachCell((c, i) => applyDataStyle(c, i !== 2));
            await addTableSignature(workbook, ws, log.responsavel || null, dataRow.number, 8, dataRow.getCell(8));
        }
    }

    // --- 5. LEGENDAS ---
    ws.addRow([]);
    const legendTitle = ws.addRow(["LEGENDA E OBSERVAÇÕES"]);
    ws.mergeCells(legendTitle.number, 1, legendTitle.number, maxCol);
    legendTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    legendTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    legendTitle.height = 24;

    const legendLines = activeTabParam === "pre_inspecao" ? LEGENDA_PRE_INSPECAO : activeTabParam === "transporte" ? LEGENDA_TRANSPORTE : activeTabParam === "embalagem" ? LEGENDA_EMBALAGEM : LEGENDA_LIMPEZA;
    legendLines.forEach((line) => {
        const obsRow = ws.addRow([line]);
        ws.mergeCells(obsRow.number, 1, obsRow.number, maxCol);
        obsRow.getCell(1).font = { size: 9 };
        obsRow.height = 20;
    });

    // --- 6. CONTROLE DE REVISÃO DO DOCUMENTO ---
    ws.addRow([]);
    const revTitleRow = ws.addRow(["CONTROLE DE REVISÃO DO DOCUMENTO"]);
    ws.mergeCells(revTitleRow.number, 1, revTitleRow.number, maxCol);
    revTitleRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };
    revTitleRow.height = 18;

    const reviewInfo = [
        ["Revisado por:", COMPLIANCE_INSPECAO.revisedBy],
        ["Data da Última Revisão:", COMPLIANCE_INSPECAO.revisionDate],
        ["Código do Documento:", code]
    ];
    for (const [label, value] of reviewInfo) {
        const row = ws.addRow([label, value]);
        ws.mergeCells(row.number, 2, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 9, color: { argb: "FF374151" } };
        row.getCell(2).font = { size: 9, color: { argb: "FF1F2937" } };
        row.height = 16;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer]);
    saveAs(blob, `inspecao_${activeTabParam}_${dateLabel}.xlsx`);
    return blob;
};