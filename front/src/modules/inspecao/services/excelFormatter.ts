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
    LEGENDA_OBJETOS_ESTRANHOS,
    COMPLIANCE_INSPECAO
} from "../model/inspecaoModel";

// --- HELPERS GERAIS ---
const formatName = (str: string) => {
    if (!str) return "";
    // Se for uma data:image, não tentamos formatar como nome
    if (str.startsWith("data:image")) return "";
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

const applyColorIfSimNao = (cell: ExcelJS.Cell) => {
    if (cell.value === "SIM") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } };
        cell.font = { bold: true, color: { argb: "FF137333" } };
    } else if (cell.value === "NÃO") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } };
        cell.font = { bold: true, color: { argb: "FFC5221F" } };
    }
};

// 🟢 CORREÇÃO: Função garante o texto e a imagem simultaneamente
const addTableSignature = async (workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet, val: string | null, rNum: number, cNum: number, cell: ExcelJS.Cell) => {
    if (!val) return;

    // Adiciona o texto (nome) sempre
    const nome = formatName(val);

    // Se for uma assinatura (data:image ou nome de arquivo), busca a imagem
    const imgFile = val.startsWith("data:image")
        ? { base64: val.split(",")[1], ext: "png" }
        : await fetchSignatureImage(val);

    if (imgFile) {
        const imgId = workbook.addImage(val.startsWith("data:image")
            ? { base64: (imgFile as any).base64, extension: "png" }
            : { buffer: (imgFile as any).buffer, extension: (imgFile as any).ext });

        // Adiciona a imagem acima do texto
        worksheet.addImage(imgId, { tl: { col: cNum - 1 + 0.15, row: rNum - 1 + 0.15 }, ext: { width: 150, height: 60 }, editAs: "oneCell" });

        // Usa quebra de linha para empurrar o nome para baixo da imagem
        cell.value = `\n\n\n\n${nome}`;
    } else {
        cell.value = nome;
    }

    cell.font = { size: 9, bold: true, color: { argb: "FF003366" } };
    cell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
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
    objetosEstranhosLogs: any[];
}

export const exportInspecaoToExcel = async ({ activeTabParam, preOpInfo, preOpData, actionPlans, transportLogs, packagingLogs, currentCleaningLogs, selectedCleaningProduct, objetosEstranhosLogs }: ExportInspecaoParams) => {
    const workbook = new ExcelJS.Workbook();

    const hasObjetoEncontrado = objetosEstranhosLogs.some((log) => !!String(log.foundObject || "").trim());
    const hasAcaoCorretiva = objetosEstranhosLogs.some((log) => !!String(log.correctiveAction || "").trim());
    const objetosEstranhosMaxCol = 6 + (hasObjetoEncontrado ? 1 : 0) + (hasAcaoCorretiva ? 1 : 0);

    const docMap: Record<TabType, { code: string; title: string; maxCol: number }> = {
        pre_inspecao: { code: "2.11.7", title: "PRÉ-INSPEÇÃO OPERACIONAL", maxCol: 2 + WEEK_DAYS.length },
        transporte: { code: "PHU-031", title: "INSPEÇÃO DE TRANSPORTE DE COLHEITA", maxCol: 6 },
        embalagem: { code: "PHU-032", title: "INSPEÇÃO DE MATERIAL DE EMBALAGEM", maxCol: 10 },
        limpeza: { code: "PHU-036", title: "RECEBIMENTO DE MATERIAL DE LIMPEZA", maxCol: 8 },
        objetos_estranhos: { code: "PHU-033", title: "CONTROLE DE INSPEÇÃO OBJETOS ESTRANHOS", maxCol: objetosEstranhosMaxCol },
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
        ws.getColumn(1).width = 18;
        ws.getColumn(2).width = 60;
        WEEK_DAYS.forEach((_, i) => ws.getColumn(3 + i).width = 12);
    } else if (activeTabParam === "transporte") {
        ws.columns = [{ width: 18 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 16 }, { width: 30 }];
    } else if (activeTabParam === "embalagem") {
        ws.columns = [{ width: 18 }, { width: 22 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 18 }, { width: 18 }, { width: 25 }, { width: 28 }];
    } else if (activeTabParam === "objetos_estranhos") {
        const baseCols = [{ width: 14 }, { width: 12 }, { width: 22 }, { width: 8 }, { width: 8 }];
        const optionalCols: Array<{ width: number }> = [];
        if (hasObjetoEncontrado) optionalCols.push({ width: 28 });
        if (hasAcaoCorretiva) optionalCols.push({ width: 30 });
        ws.columns = [...baseCols, ...optionalCols, { width: 28 }];
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

    const selectedSetores = Array.from(
        new Set(
            objetosEstranhosLogs
                .map((log) => String(log.location || "").trim())
                .filter(Boolean)
        )
    );

    const metaRows: string[] = activeTabParam === "objetos_estranhos"
        ? [`Setor: ${selectedSetores.length > 0 ? selectedSetores.join(" / ") : "-"}`]
        : [`Área: ${preOpInfo?.area || "Packing Uva"}`];
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

    // ASSINATURA DO COORDENADOR
    if (activeTabParam === "pre_inspecao" && preOpInfo?.coordinator) {
        const coordRow = ws.addRow(["Coordenador:", ""]);
        coordRow.height = 75; // Altura ajustada
        coordRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };
        coordRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

        await addTableSignature(workbook, ws, preOpInfo.coordinator, coordRow.number, 2, coordRow.getCell(2));
        ws.addRow([]);
    } else if (activeTabParam !== "pre_inspecao" && preOpInfo?.coordinator) {
        const labelRow = ws.addRow(["Coordenador:"]);
        labelRow.getCell(1).font = { bold: true, size: 10 };
        const sigRow = ws.addRow([""]);
        sigRow.height = 75; // Altura ajustada
        await addTableSignature(workbook, ws, preOpInfo.coordinator, sigRow.number, 1, sigRow.getCell(1));
        ws.addRow([]);
    }

    // --- 4. RENDERIZAÇÃO DAS TABELAS ---
    if (activeTabParam === "pre_inspecao") {
        const headers = ["Categoria", "Item", ...WEEK_DAYS.map(d => d.short)];
        const headerRow = ws.addRow(headers);
        headerRow.height = 24; headerRow.eachCell(applyHeaderStyle);

        preOpData.filter(x => x.item).forEach((row, index) => {
            const numeroItem = row.id || (index + 1);
            const dataRow = ws.addRow([
                row.category || "",
                `${numeroItem}. ${row.item}`,
                ...WEEK_DAYS.map(d => row.checks?.[d.short] === "C" ? "SIM" : row.checks?.[d.short] === "NC" ? "NÃO" : "")
            ]);
            dataRow.height = 45;
            dataRow.eachCell((c, i) => {
                applyDataStyle(c, i > 2);
                applyColorIfSimNao(c);
            });
        });

        // PLANO DE AÇÃO CORRETIVA
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
            headerArr[6] = "Responsável";

            const aHeader = ws.addRow(headerArr);
            ws.mergeCells(aHeader.number, 3, aHeader.number, 4);
            ws.mergeCells(aHeader.number, 5, aHeader.number, 6);
            ws.mergeCells(aHeader.number, 7, aHeader.number, 8);
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
                ws.mergeCells(dataRow.number, 7, dataRow.number, 8);
                dataRow.height = 75; // Altura maior para assinatura
                dataRow.eachCell((c, i) => applyDataStyle(c, i === 1 || i >= 7));

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
            dataRow.height = 75; // Altura maior
            dataRow.eachCell(c => {
                applyDataStyle(c, true);
                applyColorIfSimNao(c);
            });
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
            dataRow.height = 75; // Altura maior
            dataRow.eachCell((c, i) => {
                applyDataStyle(c, i !== 2 && i !== 9);
                applyColorIfSimNao(c);
            });
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
            dataRow.height = 75; // Altura maior
            dataRow.eachCell((c, i) => {
                applyDataStyle(c, i !== 2);
                applyColorIfSimNao(c);
            });
            await addTableSignature(workbook, ws, log.responsavel || null, dataRow.number, 8, dataRow.getCell(8));
        }
    }
    else if (activeTabParam === "objetos_estranhos") {
        const headers = [
            "Data",
            "Horário",
            "Setor",
            "C",
            "NC",
            ...(hasObjetoEncontrado ? ["Objeto Encontrado"] : []),
            ...(hasAcaoCorretiva ? ["Ação Corretiva"] : []),
            "Responsável"
        ];
        const oHeader = ws.addRow(headers);
        oHeader.height = 24;
        oHeader.eachCell(applyHeaderStyle);

        const responsibleColIndex = headers.length;

        const filledRows = objetosEstranhosLogs.filter(log =>
            !!String(log.date || "").trim()
            || !!String(log.time || "").trim()
            || !!String(log.foundObject || "").trim()
            || !!String(log.correctiveAction || "").trim()
            || !!String(log.responsible || "").trim()
            || !!String(log.status || "").trim()
        );

        for (const log of filledRows) {
            const rowData = [
                log.date ? log.date.split('-').reverse().join('/') : "",
                log.time || "",
                log.location || "",
                log.status === "C" ? "SIM" : "",
                log.status === "NC" ? "NÃO" : "",
                ...(hasObjetoEncontrado ? [log.foundObject || ""] : []),
                ...(hasAcaoCorretiva ? [log.correctiveAction || ""] : []),
                ""
            ];
            const dataRow = ws.addRow(rowData);
            dataRow.height = 75;
            dataRow.eachCell((c, i) => {
                const leftAlignedCols = [3];
                if (hasObjetoEncontrado) leftAlignedCols.push(6);
                if (hasAcaoCorretiva) leftAlignedCols.push(hasObjetoEncontrado ? 7 : 6);
                applyDataStyle(c, !leftAlignedCols.includes(i));
                applyColorIfSimNao(c);
            });
            await addTableSignature(workbook, ws, log.responsible || null, dataRow.number, responsibleColIndex, dataRow.getCell(responsibleColIndex));
        }
    }

    // --- 5. LEGENDAS ---
    ws.addRow([]);
    const legendTitle = ws.addRow(["LEGENDA E OBSERVAÇÕES"]);
    ws.mergeCells(legendTitle.number, 1, legendTitle.number, maxCol);
    legendTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    legendTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    legendTitle.height = 24;

    const legendLines = activeTabParam === "pre_inspecao"
        ? LEGENDA_PRE_INSPECAO
        : activeTabParam === "transporte"
            ? LEGENDA_TRANSPORTE
            : activeTabParam === "embalagem"
                ? LEGENDA_EMBALAGEM
                : activeTabParam === "objetos_estranhos"
                    ? LEGENDA_OBJETOS_ESTRANHOS
                    : LEGENDA_LIMPEZA;
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
    return blob;
};