"use client";

import * as ExcelJS from "exceljs";
import {
    WEEK_DAYS,
    PreOpItem,
    ActionPlan,
    TabType,
    LEGENDA_PRE_INSPECAO,
    LEGENDA_TRANSPORTE,
    LEGENDA_OBJETOS_ESTRANHOS,
    COMPLIANCE_INSPECAO,
    ITENS_SEGURANCA_TRANSPORTE
} from "../model/inspecaoModel";

// --- HELPERS GERAIS ---
const formatName = (str: string) => {
    if (!str) return "";
    if (str.startsWith("data:image")) return "";
    return str.replace(/_/g, " ").toUpperCase();
};

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
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
};

const applyDataStyle = (cell: ExcelJS.Cell, isCenter = true) => {
    cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
    cell.alignment = { horizontal: isCenter ? "center" : "left", vertical: "middle", wrapText: true };
};

const applyColorIfSimNao = (cell: ExcelJS.Cell) => {
    if (cell.value === "SIM" || cell.value === "C") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } };
        cell.font = { bold: true, color: { argb: "FF137333" } };
    } else if (cell.value === "NÃO" || cell.value === "NC") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } };
        cell.font = { bold: true, color: { argb: "FFC5221F" } };
    }
};

const addTableSignature = async (workbook: ExcelJS.Workbook, worksheet: ExcelJS.Worksheet, val: string | null, rNum: number, cNum: number, cell: ExcelJS.Cell, imgW = 140, imgH = 50) => {
    if (!val) return;
    const nome = formatName(val);
    const isBase64 = val.startsWith("data:image");

    const imgFile = isBase64 ? { base64: val.split(",")[1], ext: "png" } : await fetchSignatureImage(val);

    if (imgFile) {
        try {
            const imgId = workbook.addImage(isBase64
                ? { base64: (imgFile as any).base64, extension: "png" }
                : { buffer: (imgFile as any).buffer, extension: (imgFile as any).ext });
            worksheet.addImage(imgId, { tl: { col: cNum - 1 + 0.15, row: rNum - 1 + 0.15 }, ext: { width: imgW, height: imgH }, editAs: "oneCell" });
        } catch (e) { }
        cell.value = `\n\n\n\n${nome}`;
    } else {
        cell.value = nome;
    }

    cell.font = { size: 8, bold: true, color: { argb: "FF003366" } };
    cell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
};

// --- INTERFACE ---
interface ExportInspecaoParams {
    activeTabParam: TabType;
    subTabTransporte?: "seguranca";
    preOpInfo: { week: string; coordinator: string | null; area: string };
    preOpData: PreOpItem[];
    actionPlans: ActionPlan[];
    currentCleaningLogs: any[];
    selectedCleaningProduct: string;
    objetosEstranhosLogs: any[];
    observacaoGeral?: string;
    observacoesGerais?: string[];
    todasColunasTransporte?: any[];
}

export const exportInspecaoToExcel = async ({
    activeTabParam,
    subTabTransporte = "seguranca",
    preOpInfo,
    preOpData,
    actionPlans,
    objetosEstranhosLogs,
    observacaoGeral = "",
    observacoesGerais = [],
    todasColunasTransporte = []
}: ExportInspecaoParams) => {
    const workbook = new ExcelJS.Workbook();
    const hasObjetoEncontrado = objetosEstranhosLogs.some((log) => !!String(log.foundObject || "").trim());
    const hasAcaoCorretiva = objetosEstranhosLogs.some((log) => !!String(log.correctiveAction || "").trim());
    const objetosEstranhosMaxCol = 6 + (hasObjetoEncontrado ? 1 : 0) + (hasAcaoCorretiva ? 1 : 0);

    const docMap: Record<TabType, { code: string; title: string; maxCol: number }> = {
        pre_inspecao: { code: "2.11.7", title: "PRÉ-INSPEÇÃO OPERACIONAL", maxCol: 2 + WEEK_DAYS.length },
        transporte: { code: "PHU-031", title: "INSPEÇÃO DE SEGURANÇA NO TRANSPORTE DA FRUTA", maxCol: 2 + (todasColunasTransporte.length || 1) },
        objetos_estranhos: { code: "PHU-033", title: "CONTROLE DE INSPEÇÃO OBJETOS ESTRANHOS", maxCol: objetosEstranhosMaxCol },
    };

    let { code, title, maxCol } = docMap[activeTabParam];

    const ws = workbook.addWorksheet(activeTabParam === "pre_inspecao" ? "Checklist" : activeTabParam.toUpperCase());
    const baseUrl = window.location.origin;

    // --- 1. CONFIGURAÇÃO DE COLUNAS POR TELA ---
    ws.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true, fitToWidth: 1, fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    if (activeTabParam === "pre_inspecao") {
        ws.getColumn(1).width = 18;
        ws.getColumn(2).width = 60;
        WEEK_DAYS.forEach((_, i) => ws.getColumn(3 + i).width = 12);
    } else if (activeTabParam === "objetos_estranhos") {
        const baseCols = [{ width: 14 }, { width: 12 }, { width: 24 }, { width: 8 }, { width: 8 }];
        const optionalCols: Array<{ width: number }> = [];
        if (hasObjetoEncontrado) optionalCols.push({ width: 28 });
        if (hasAcaoCorretiva) optionalCols.push({ width: 30 });
        ws.columns = [...baseCols, ...optionalCols, { width: 28 }];
    } else if (activeTabParam === "transporte") {
        const transportCols = [{ width: 6 }, { width: 45 }];
        for (let i = 0; i < (todasColunasTransporte.length || 1); i++) {
            transportCols.push({ width: 15 });
        }
        ws.columns = transportCols;
    }

    // --- 2. LOGO ---
    ws.addRow([]).height = 70;
    try {
        const logoRes = await fetch(`${baseUrl}/logo.png`);
        if (logoRes.ok) ws.addImage(workbook.addImage({ buffer: await logoRes.arrayBuffer(), extension: 'png' }), { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 60 }, editAs: 'oneCell' });
    } catch (e) { }
    ws.addRow([]);

    // --- 3. CABEÇALHO ESTRUTURADO ---
    const titleRow = ws.addRow([title]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };

    if (activeTabParam !== "transporte") {
        const metaRows: string[] = [];
        if (activeTabParam === "pre_inspecao") metaRows.push(`Semana: ${preOpInfo.week || "-"}`);

        metaRows.forEach(meta => {
            const row = ws.addRow([meta]);
            ws.mergeCells(row.number, 1, row.number, maxCol);
            row.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
        });
        ws.addRow([]);

        if (activeTabParam === "pre_inspecao" && preOpInfo?.coordinator) {
            const coordRow = ws.addRow(["Coordenador:", ""]);
            coordRow.height = 75;
            coordRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };
            coordRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
            await addTableSignature(workbook, ws, preOpInfo.coordinator, coordRow.number, 2, coordRow.getCell(2));
            ws.addRow([]);
        }
    }

    // --- 4. RENDERIZAÇÃO DAS TABELAS ---
    if (activeTabParam === "pre_inspecao") {
        const headers = ["Categoria", "Item", ...WEEK_DAYS.map(d => d.short)];
        const headerRow = ws.addRow(headers);
        headerRow.height = 28;
        headerRow.eachCell(applyHeaderStyle);

        preOpData.filter(x => x.item).forEach((row, index) => {
            const numeroItem = row.id || (index + 1);
            const dataRow = ws.addRow([
                row.category || "",
                `${numeroItem}. ${row.item}`,
                ...WEEK_DAYS.map(d => row.checks?.[d.short] === "C" ? "SIM" : row.checks?.[d.short] === "NC" ? "NÃO" : "")
            ]);
            dataRow.height = 45;
            dataRow.eachCell((c, i) => { applyDataStyle(c, i > 2); applyColorIfSimNao(c); });
        });

        const observacoesValidas = observacoesGerais.filter(o => o && o.trim() !== "");
        const textoObservacao = observacoesValidas.length > 0 ? observacoesValidas.join("; ") : (observacaoGeral && observacaoGeral.trim() !== "" ? observacaoGeral : "");

        if (textoObservacao) {
            ws.addRow([]);
            const obsTitle = ws.addRow(["OBSERVAÇÕES GERAIS DA SEMANA"]);
            ws.mergeCells(obsTitle.number, 1, obsTitle.number, maxCol);
            obsTitle.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1E3A8A" } };
            obsTitle.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
            obsTitle.height = 22;

            const obsRow = ws.addRow([textoObservacao]);
            ws.mergeCells(obsRow.number, 1, obsRow.number, maxCol);
            obsRow.getCell(1).font = { size: 10 };
            obsRow.getCell(1).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
            obsRow.height = 30;
            ws.addRow([]);
        }

        const filledActions = actionPlans.filter(row => !!String(row.item || "").trim() || !!String(row.naoConformidade || "").trim());
        if (filledActions.length > 0) {
            ws.addRow([]); ws.addRow([]);
            const actTitle = ws.addRow(["PLANO DE AÇÃO CORRETIVA"]);
            ws.mergeCells(actTitle.number, 1, actTitle.number, maxCol);
            actTitle.getCell(1).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
            actTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };

            const headerArr = new Array(maxCol).fill("");
            headerArr[0] = "Data"; headerArr[1] = "Item"; headerArr[2] = "Não Conformidade"; headerArr[4] = "Ação Corretiva"; headerArr[6] = "Responsável";

            const aHeader = ws.addRow(headerArr);
            aHeader.height = 28;
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
                dataRow.height = 75;
                dataRow.eachCell((c, i) => applyDataStyle(c, i === 1 || i >= 7));
                await addTableSignature(workbook, ws, row.responsavel || null, dataRow.number, 7, dataRow.getCell(7));
            }
        }
    }
    else if (activeTabParam === "transporte") {
        ws.addRow([]);

        const cabecalhos = ["Nº", "Itens Avaliados"];
        todasColunasTransporte.forEach((c, i) => {
            const dt = c.dataInspecao ? c.dataInspecao.split('-').reverse().join('/') : "--/--/----";
            const placa = c.placa ? `Placa: ${c.placa}` : `Caminhão #${i + 1}`;
            cabecalhos.push(`${dt}\n${placa}`);
        });

        const sHeader = ws.addRow(cabecalhos);
        sHeader.height = 38;
        sHeader.eachCell(applyHeaderStyle);

        // Corpo da tabela com os 13 Itens
        ITENS_SEGURANCA_TRANSPORTE.forEach((txt, idxItem) => {
            const strItem = typeof txt === 'string' ? txt : (txt as any).item;
            const linhaDados = [idxItem + 1, strItem];

            // Pega o SIM / NÃO de cada coluna
            todasColunasTransporte.forEach(c => {
                const conf = c.itens[idxItem]?.conforme;
                linhaDados.push(conf === true ? "SIM" : (conf === false ? "NÃO" : "-"));
            });

            const dataRow = ws.addRow(linhaDados);
            dataRow.height = 40;
            dataRow.eachCell((c, i) => {
                applyDataStyle(c, i !== 2);
                applyColorIfSimNao(c);
            });
        });

        // Rodapé 1: Observação Geral
        const obsValues = ["", "OBSERVAÇÃO"];
        todasColunasTransporte.forEach(c => obsValues.push(c.observacaoGeral || "-"));
        const rowObs = ws.addRow(obsValues);
        rowObs.height = 45;
        rowObs.eachCell((c, i) => applyDataStyle(c, i !== 2));
        rowObs.getCell(2).font = { bold: true, color: { argb: "FFB45309" }, size: 9 };
        rowObs.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEB" } };

        // Rodapé 2: Ação Corretiva
        const acaoValues = ["", "AÇÃO CORRETIVA"];
        todasColunasTransporte.forEach(c => acaoValues.push(c.acaoCorretivaGeral || "-"));
        const rowAcao = ws.addRow(acaoValues);
        rowAcao.height = 45;
        rowAcao.eachCell((c, i) => applyDataStyle(c, i !== 2));
        rowAcao.getCell(2).font = { bold: true, color: { argb: "FFE11D48" }, size: 9 };
        rowAcao.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF1F2" } };

        // Rodapé 3: Assinatura do Responsável
        const assValues = ["", "RESPONSÁVEL"];
        todasColunasTransporte.forEach(c => assValues.push(""));
        const rowAss = ws.addRow(assValues);
        rowAss.height = 65;
        rowAss.eachCell((c, i) => applyDataStyle(c, true));
        rowAss.getCell(2).font = { bold: true, size: 9 };

        // Renderiza as imagens de assinatura
        for (let i = 0; i < todasColunasTransporte.length; i++) {
            await addTableSignature(workbook, ws, todasColunasTransporte[i].responsavel, rowAss.number, 3 + i, rowAss.getCell(3 + i), 95, 35);
        }
    }
    else if (activeTabParam === "objetos_estranhos") {
        const headers = [
            "Data", "Horário", "Setor", "C", "NC",
            ...(hasObjetoEncontrado ? ["Objeto Encontrado"] : []),
            ...(hasAcaoCorretiva ? ["Ação Corretiva"] : []),
            "Responsável"
        ];
        const oHeader = ws.addRow(headers);
        oHeader.height = 28;
        oHeader.eachCell(applyHeaderStyle);

        const responsibleColIndex = headers.length;
        const filledRows = objetosEstranhosLogs.filter(log =>
            !!String(log.date || "").trim() || !!String(log.time || "").trim() || !!String(log.foundObject || "").trim() || !!String(log.correctiveAction || "").trim() || !!String(log.responsible || "").trim() || !!String(log.status || "").trim()
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

    let legendLines: string[] = [];
    if (activeTabParam === "pre_inspecao") {
        legendLines = LEGENDA_PRE_INSPECAO;
    } else if (activeTabParam === "transporte") {
        legendLines = LEGENDA_TRANSPORTE;
    } else {
        legendLines = LEGENDA_OBJETOS_ESTRANHOS;
    }

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
    return new Blob([buffer]);
};