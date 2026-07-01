"use client";

import * as ExcelJS from "exceljs";
import { AreaPreenchimento, CleaningLog, PRODUTO_LEGENDA, RegistroHigienizacaoTesoura, DIAS_SEMANA_TESOURA, BebedouroLog, COMPLIANCE } from "../model/higienizacaoGeral";

// ────────────────────────────────────────────────────────────────────────────────
// FUNÇÕES AUXILIARES
// ────────────────────────────────────────────────────────────────────────────────

const formatName = (str: string) => {
    if (!str) return "";
    return str.replace(/_/g, " ").toUpperCase();
};

const formatSafeDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) {
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    }
    return dateStr;
};

const formatarPeriodo = (inicio?: string, fim?: string) => {
    if (!inicio || !fim) return "-";
    try {
        const [anoI, mesI, diaI] = inicio.split("-");
        const [anoF, mesF, diaF] = fim.split("-");
        const anoCurtoF = anoF.substring(2);
        return `${diaI}/${mesI} a ${diaF}/${mesF}/${anoCurtoF}`;
    } catch {
        return `${inicio} a ${fim}`;
    }
};

function buildLegendForArea(area: AreaPreenchimento): string[] {
    const baseLegend = [
        "• SIM: O produto ou procedimento de limpeza foi aplicado e verificado.",
        "• NÃO/Em branco: O produto ou procedimento não foi aplicado.",
    ];
    const lines = [...baseLegend, ""];
    if (area.isMatricial) {
        lines.push(`• PRODUTO UTILIZADO PARA HIGIENE: Água e Sanclor (Hipoclorito de sódio 20ml p/ 10L de água)`);
    } else if (area.produtos && area.produtos.length > 0) {
        area.produtos.forEach((sigla) => {
            const descricao = PRODUTO_LEGENDA[sigla] || sigla;
            lines.push(`• Sigla ${sigla}: Refere-se a "${descricao}".`);
        });
    }
    return lines;
}

function addRevisionControlSection(ws: ExcelJS.Worksheet, numCols: number, docCode: string) {
    ws.addRow([]);

    const titleRow = ws.addRow(["CONTROLE DE REVISÃO DO DOCUMENTO"]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, numCols);
    titleRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF000000" } };
    titleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    titleRow.height = 24;

    const reviewedByRow = ws.addRow(["Aprovação / Revisado por:", COMPLIANCE.revisedBy]);
    const revisionDateRow = ws.addRow(["Data da Última Revisão:", COMPLIANCE.revisionDate]);
    const docCodeRow = ws.addRow(["Código do Documento:", docCode]);

    [reviewedByRow, revisionDateRow, docCodeRow].forEach((row) => {
        if (numCols > 2) {
            ws.mergeCells(row.number, 2, row.number, numCols);
        }
        row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(1).font = { size: 10, color: { argb: "FF000000" } };
        row.getCell(2).font = { size: 10, color: { argb: "FF000000" } };
        row.height = 20;
    });
}

const fetchLogoImage = async () => {
    const baseUrl = window.location.origin;
    try {
        const res = await fetch(`${baseUrl}/logo.png`);
        if (res.ok) {
            const blob = await res.blob();
            return { buffer: await blob.arrayBuffer(), ext: 'png' as const };
        }
    } catch (e) {
        console.warn("Logo não encontrada na pasta public.");
    }
    return null;
};

const fetchSignatureImage = async (baseName: string) => {
    if (!baseName) return null;
    const baseUrl = window.location.origin;
    const url = `/assinaturas/${encodeURIComponent(baseName)}.png`;
    try {
        const res = await fetch(url);
        if (res.ok) {
            const blob = await res.blob();
            const buffer = await blob.arrayBuffer();
            return { buffer, ext: 'png' as const };
        }
    } catch (e) { }
    try {
        const res = await fetch(`${baseUrl}/assinaturas/${baseName}.png`);
        if (res.ok) {
            const blob = await res.blob();
            const buffer = await blob.arrayBuffer();
            return { buffer, ext: 'png' as const };
        }
    } catch (e) { }
    return null;
};

// ────────────────────────────────────────────────────────────────────────────────
// INTERFACE PRINCIPAL (atualizada com bebedourosLogs)
// ────────────────────────────────────────────────────────────────────────────────

interface ExportHigienizacaoParams {
    activeArea: AreaPreenchimento;
    currentLogs: CleaningLog[];
    modoOperacao: "campo" | "packing";
    observacaoGeral?: string;
    tesourasLogs?: RegistroHigienizacaoTesoura[];
    bebedourosLogs?: BebedouroLog[];
}

// ────────────────────────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL
// ────────────────────────────────────────────────────────────────────────────────

export const exportHigienizacaoToExcel = async ({
    activeArea,
    currentLogs,
    modoOperacao,
    observacaoGeral,
    tesourasLogs,
    bebedourosLogs, // 🔥 NOVO
}: ExportHigienizacaoParams) => {

    // 🔥 CASO TESOURAS
    if (activeArea.id === 'tesouras' && tesourasLogs) {
        return await exportarTesourasExcel({
            activeArea,
            tesourasLogs,
            observacaoGeral,
            modoOperacao
        });
    }

    // 🔥 CASO BEBEDOUROS
    if (activeArea.id === 'bebedouros' && bebedourosLogs) {
        return await exportarBebedourosExcel({
            activeArea,
            bebedourosLogs,
            observacaoGeral,
            modoOperacao
        });
    }

    // ─── ÁREAS NORMAIS (PANOS, ETC.) ──────────────────────────────────────────
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Higienização");

    const isMatricial = activeArea.isMatricial || false;

    const filledLogs = currentLogs.filter(reg => {
        const hasDate = !!String(reg.date || "").trim();
        const hasTime = !!String(reg.time || "").trim();
        const hasStatus = !!String(reg.status || "").trim();
        const hasSig = !!String(reg.signature || "").trim();
        const hasMonSig = !!String(reg.monitorSignature || "").trim();
        const hasChecks = reg.checks && Object.values(reg.checks).some(v =>
            v === true || v === "C" || v === "NC" || String(v).toUpperCase() === "SIM"
        );
        return hasDate || hasTime || hasStatus || hasSig || hasMonSig || hasChecks;
    });

    let headers: string[] = [];
    if (isMatricial) {
        headers = ["Data", activeArea.campo2 || "Horário", "Status", "Responsável Limpeza", "Monitora"];
        ws.getColumn(1).width = 14;
        ws.getColumn(2).width = 14;
        ws.getColumn(3).width = 12;
        ws.getColumn(4).width = 35;
        ws.getColumn(5).width = 35;
    } else {
        headers = ["Data", activeArea.campo2 || "Horário", ...(activeArea.produtos || []), "Assinatura"];
        ws.getColumn(1).width = 14;
        ws.getColumn(2).width = 14;
        let colIdx = 3;
        (activeArea.produtos || []).forEach(() => {
            ws.getColumn(colIdx).width = 10;
            colIdx++;
        });
        ws.getColumn(colIdx).width = 30;
    }

    const maxCol = headers.length;

    ws.pageSetup = {
        paperSize: 9,
        orientation: maxCol > 6 ? "landscape" : "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    for (let i = 0; i < 5; i++) ws.addRow([]);

    const titleRow = ws.addRow([`CONTROLE DE HIGIENIZAÇÃO - ${activeArea.nome.toUpperCase()}`]);
    titleRow.height = 25;
    ws.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };
    titleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

    const metaFreqRow = ws.addRow([`Frequência: ${activeArea.freq}`]);
    ws.mergeCells(metaFreqRow.number, 1, metaFreqRow.number, maxCol);
    metaFreqRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    const metaDateRow = ws.addRow([`Exportado em: ${new Date().toLocaleString("pt-BR")}`]);
    ws.mergeCells(metaDateRow.number, 1, metaDateRow.number, maxCol);
    metaDateRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    const metaSetorRow = ws.addRow(["Setor: PACKING HOUSE"]);
    ws.mergeCells(metaSetorRow.number, 1, metaSetorRow.number, maxCol);
    metaSetorRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    ws.addRow([]);

    const logoFile = await fetchLogoImage();
    if (logoFile) {
        const imageId = workbook.addImage({ buffer: logoFile.buffer, extension: logoFile.ext });
        ws.addImage(imageId, { tl: { col: 0.1, row: 0.2 }, ext: { width: 140, height: 75 } });
    }

    const headerRow = ws.addRow(headers);
    headerRow.height = 24;
    for (let i = 1; i <= maxCol; i++) {
        const cell = headerRow.getCell(i);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }

    for (const reg of filledLogs) {
        let rowData: any[] = [];

        if (isMatricial) {
            let statusExportado = reg.status || "";
            if (statusExportado.toUpperCase() === "C") statusExportado = "SIM";
            else if (statusExportado.toUpperCase() === "NC") statusExportado = "NÃO";

            rowData = [
                formatSafeDate(reg.date),
                reg.time || "",
                statusExportado,
                "",
                ""
            ];
        } else {
            const productChecks = (activeArea.produtos || []).map(p => reg.checks?.[p] ? "SIM" : "");
            rowData = [
                formatSafeDate(reg.date),
                reg.time || "",
                ...productChecks,
                ""
            ];
        }

        const dataRow = ws.addRow(rowData);
        dataRow.height = 65;

        for (let i = 1; i <= maxCol; i++) {
            const cell = dataRow.getCell(i);
            cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        }

        const processSignature = async (signatureName: string, colPos: number) => {
            if (!signatureName) return;
            const sigCell = dataRow.getCell(colPos);
            sigCell.value = formatName(signatureName);
            sigCell.font = { size: 9, bold: true };
            sigCell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

            if (signatureName.startsWith("data:image")) {
                try {
                    const base64Data = signatureName.split(",")[1];
                    const imgId = workbook.addImage({ base64: base64Data, extension: "png" });
                    ws.addImage(imgId, { tl: { col: colPos - 1 + 0.25, row: dataRow.number - 1 + 0.15 }, ext: { width: 150, height: 60 }, editAs: "oneCell" });
                    return;
                } catch (e) { }
            }

            const imageFile = await fetchSignatureImage(signatureName);
            if (imageFile) {
                const imgId = workbook.addImage({ buffer: imageFile.buffer, extension: imageFile.ext });
                ws.addImage(imgId, { tl: { col: colPos - 1 + 0.25, row: dataRow.number - 1 + 0.15 }, ext: { width: 150, height: 60 }, editAs: "oneCell" });
            }
        };

        if (isMatricial && reg.monitorSignature) {
            await processSignature(reg.monitorSignature, 5);
        }
        if (reg.signature) {
            const colPos = isMatricial ? 4 : maxCol;
            await processSignature(reg.signature, colPos);
        }
    }

    if (observacaoGeral && observacaoGeral.trim() !== "") {
        ws.addRow([]);
        const obsTitleRow = ws.addRow(["OBSERVAÇÕES DE NÃO CONFORMIDADE"]);
        ws.mergeCells(obsTitleRow.number, 1, obsTitleRow.number, maxCol);
        obsTitleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        obsTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
        obsTitleRow.height = 20;

        const obsContentRow = ws.addRow([observacaoGeral]);
        ws.mergeCells(obsContentRow.number, 1, obsContentRow.number, maxCol);
        obsContentRow.getCell(1).alignment = { horizontal: "left", vertical: "top", wrapText: true };
        obsContentRow.height = 40;
    }

    ws.addRow([]);

    const legendTitle = ws.addRow(["LEGENDA E PRODUTOS UTILIZADOS"]);
    ws.mergeCells(legendTitle.number, 1, legendTitle.number, maxCol);
    legendTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    legendTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    legendTitle.height = 24;

    const legendLines = buildLegendForArea(activeArea);
    legendLines.forEach((line) => {
        const obsRow = ws.addRow([line]);
        ws.mergeCells(obsRow.number, 1, obsRow.number, maxCol);
        obsRow.getCell(1).font = { size: 9 };
        obsRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        obsRow.height = 18;
    });

    addRevisionControlSection(ws, maxCol, activeArea.doc);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};

// ────────────────────────────────────────────────────────────────────────────────
// FUNÇÃO AUXILIAR PARA EXPORTAÇÃO SEMANAL (TESOURAS)
// ────────────────────────────────────────────────────────────────────────────────

async function exportarTesourasExcel({
    activeArea,
    tesourasLogs,
    observacaoGeral,
    modoOperacao
}: {
    activeArea: AreaPreenchimento;
    tesourasLogs: RegistroHigienizacaoTesoura[];
    observacaoGeral?: string;
    modoOperacao: "campo" | "packing";
}) {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Higienização - Tesouras");

    const numDias = DIAS_SEMANA_TESOURA.length;
    const numCols = 1 + numDias * 2 + 2;

    ws.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    ws.getColumn(1).width = 28;
    for (let i = 0; i < numDias; i++) {
        ws.getColumn(2 + i * 2).width = 12;
        ws.getColumn(3 + i * 2).width = 12;
    }
    ws.getColumn(2 + numDias * 2).width = 25;
    ws.getColumn(3 + numDias * 2).width = 25;

    for (let i = 0; i < 5; i++) ws.addRow([]);

    const titleRow = ws.addRow([`CONTROLE DE HIGIENIZAÇÃO - ${activeArea.nome.toUpperCase()}`]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, numCols);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };

    const metaDateRow = ws.addRow([`Exportado em: ${new Date().toLocaleString("pt-BR")}`]);
    ws.mergeCells(metaDateRow.number, 1, metaDateRow.number, numCols);
    metaDateRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    const metaSetorRow = ws.addRow(["Setor: PACKING HOUSE"]);
    ws.mergeCells(metaSetorRow.number, 1, metaSetorRow.number, numCols);
    metaSetorRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    ws.addRow([]);

    const logoFile = await fetchLogoImage();
    if (logoFile) {
        const imageId = workbook.addImage({ buffer: logoFile.buffer, extension: logoFile.ext });
        ws.addImage(imageId, { tl: { col: 0.1, row: 0.2 }, ext: { width: 140, height: 75 } });
    }

    const headerRow1 = ws.addRow([]);
    headerRow1.getCell(1).value = "Período";
    for (let i = 0; i < numDias; i++) {
        const col = 2 + i * 2;
        ws.mergeCells(headerRow1.number, col, headerRow1.number, col + 1);
        headerRow1.getCell(col).value = DIAS_SEMANA_TESOURA[i].label;
        headerRow1.getCell(col).alignment = { horizontal: "center", vertical: "middle" };
    }
    const respCol = 2 + numDias * 2;
    const monCol = respCol + 1;
    headerRow1.getCell(respCol).value = "Resp./Limpeza";
    headerRow1.getCell(monCol).value = "Monitora Resp.";
    headerRow1.getCell(respCol).alignment = { horizontal: "center", vertical: "middle" };
    headerRow1.getCell(monCol).alignment = { horizontal: "center", vertical: "middle" };

    const headerRow2 = ws.addRow([]);
    headerRow2.getCell(1).value = "";
    for (let i = 0; i < numDias; i++) {
        const col = 2 + i * 2;
        headerRow2.getCell(col).value = "Q.T";
        headerRow2.getCell(col + 1).value = "C/NC";
        headerRow2.getCell(col).alignment = { horizontal: "center", vertical: "middle" };
        headerRow2.getCell(col + 1).alignment = { horizontal: "center", vertical: "middle" };
    }
    headerRow2.getCell(respCol).value = "";
    headerRow2.getCell(monCol).value = "";

    [headerRow1, headerRow2].forEach(row => {
        row.height = 24;
        for (let i = 1; i <= numCols; i++) {
            const cell = row.getCell(i);
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
            cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
            cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        }
    });

    for (const week of tesourasLogs) {
        const row = ws.addRow([]);

        row.getCell(1).value = formatarPeriodo(week.dataInicio, week.dataFim);
        row.getCell(1).alignment = { horizontal: "center", vertical: "middle", wrapText: true };

        for (let i = 0; i < numDias; i++) {
            const diaId = DIAS_SEMANA_TESOURA[i].id;
            const qtde = week.dias?.[diaId]?.qtde ?? "";
            const status = week.dias?.[diaId]?.status ?? "";

            const statusLabel = status === 'C' ? 'SIM' : (status === 'NC' ? 'NÃO' : '');

            row.getCell(2 + i * 2).value = qtde;
            row.getCell(3 + i * 2).value = statusLabel;
            row.getCell(2 + i * 2).alignment = { horizontal: "center", vertical: "middle" };
            row.getCell(3 + i * 2).alignment = { horizontal: "center", vertical: "middle" };
        }

        const respCell = row.getCell(respCol);
        const monCell = row.getCell(monCol);

        respCell.value = formatName(week.respLimpeza || "");
        monCell.value = formatName(week.monitorResponsavel || "");

        respCell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
        monCell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

        respCell.font = { size: 9, bold: true };
        monCell.font = { size: 9, bold: true };

        const processSig = async (signatureName: string | null, cell: ExcelJS.Cell, colIndex: number) => {
            if (!signatureName) return;
            if (signatureName.startsWith("data:image")) {
                try {
                    const base64Data = signatureName.split(",")[1];
                    const imgId = workbook.addImage({ base64: base64Data, extension: "png" });
                    ws.addImage(imgId, { tl: { col: colIndex - 1 + 0.25, row: row.number - 1 + 0.15 }, ext: { width: 150, height: 60 }, editAs: "oneCell" });
                    return;
                } catch (e) { }
            }
            const imageFile = await fetchSignatureImage(signatureName);
            if (imageFile) {
                const imgId = workbook.addImage({ buffer: imageFile.buffer, extension: imageFile.ext });
                ws.addImage(imgId, { tl: { col: colIndex - 1 + 0.25, row: row.number - 1 + 0.15 }, ext: { width: 150, height: 60 }, editAs: "oneCell" });
            }
        };

        await processSig(week.respLimpeza, respCell, respCol);
        await processSig(week.monitorResponsavel, monCell, monCol);

        row.height = 65;
        for (let i = 1; i <= numCols; i++) {
            const cell = row.getCell(i);
            cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        }
    }

    if (observacaoGeral && observacaoGeral.trim() !== "") {
        ws.addRow([]);
        const obsTitleRow = ws.addRow(["OBSERVAÇÕES DE NÃO CONFORMIDADE"]);
        ws.mergeCells(obsTitleRow.number, 1, obsTitleRow.number, numCols);
        obsTitleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        obsTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
        obsTitleRow.height = 20;

        const obsContentRow = ws.addRow([observacaoGeral]);
        ws.mergeCells(obsContentRow.number, 1, obsContentRow.number, numCols);
        obsContentRow.getCell(1).alignment = { horizontal: "left", vertical: "top", wrapText: true };
        obsContentRow.height = 28;
    }

    ws.addRow([]);

    const legendTitle = ws.addRow(["LEGENDA E PRODUTOS UTILIZADOS"]);
    ws.mergeCells(legendTitle.number, 1, legendTitle.number, numCols);
    legendTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    legendTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    legendTitle.height = 24;

    const legendLines = buildLegendForArea(activeArea);
    legendLines.forEach((line) => {
        const row = ws.addRow([line]);
        ws.mergeCells(row.number, 1, row.number, numCols);
        row.getCell(1).font = { size: 9 };
        row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        row.height = 18;
    });

    addRevisionControlSection(ws, numCols, activeArea.doc);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// ────────────────────────────────────────────────────────────────────────────────
// 🔥 FUNÇÃO AUXILIAR PARA EXPORTAÇÃO DOS BEBEDOUROS
// ────────────────────────────────────────────────────────────────────────────────

async function exportarBebedourosExcel({
    activeArea,
    bebedourosLogs,
    observacaoGeral,
    modoOperacao
}: {
    activeArea: AreaPreenchimento;
    bebedourosLogs: BebedouroLog[];
    observacaoGeral?: string;
    modoOperacao: "campo" | "packing";
}) {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Higienização - Bebedouros");

    const filledLogs = bebedourosLogs.filter((log) => {
        const hasData = String(log.data || "").trim() !== "";
        const hasLocal = String(log.local || "").trim() !== "";
        const hasLimpeza = String(log.limpeza || "").trim() !== "";
        const hasTrocaFiltro = String(log.trocaFiltro || "").trim() !== "";
        const hasManutencao = String(log.manutencao || "").trim() !== "";
        const hasObservacao = String(log.observacao || "").trim() !== "";
        const hasAcaoCorretiva = String(log.acaoCorretiva || "").trim() !== "";
        const hasSignature = String(log.signature || "").trim() !== "";

        return hasData || hasLocal || hasLimpeza || hasTrocaFiltro || hasManutencao || hasObservacao || hasAcaoCorretiva || hasSignature;
    });

    const hasObservacao = filledLogs.some((log) => String(log.observacao || "").trim() !== "");
    const hasAcaoCorretiva = filledLogs.some((log) => String(log.acaoCorretiva || "").trim() !== "");

    const headers = [
        "Data",
        "Local",
        "Limpeza do Bebedouro",
        "Troca do Filtro",
        "Manutenção do Bebedouro",
        ...(hasObservacao ? ["Observação"] : []),
        ...(hasAcaoCorretiva ? ["Ação Corretiva"] : []),
        "Assinatura"
    ];
    const numCols = headers.length;
    const signatureColIndex = numCols;

    ws.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    ws.getColumn(1).width = 18;  // Data
    ws.getColumn(2).width = 30;  // Local
    ws.getColumn(3).width = 22;  // Limpeza
    ws.getColumn(4).width = 22;  // Troca Filtro
    ws.getColumn(5).width = 22;  // Manutenção
    let nextCol = 6;
    if (hasObservacao) {
        ws.getColumn(nextCol).width = 40;  // Observação
        nextCol++;
    }
    if (hasAcaoCorretiva) {
        ws.getColumn(nextCol).width = 40;  // Ação Corretiva
        nextCol++;
    }
    ws.getColumn(nextCol).width = 34;  // Assinatura

    for (let i = 0; i < 5; i++) ws.addRow([]);

    const titleRow = ws.addRow([`CONTROLE DE HIGIENIZAÇÃO - ${activeArea.nome.toUpperCase()}`]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, numCols);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };

    const metaDateRow = ws.addRow([`Exportado em: ${new Date().toLocaleString("pt-BR")}`]);
    ws.mergeCells(metaDateRow.number, 1, metaDateRow.number, numCols);
    metaDateRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    const metaSetorRow = ws.addRow(["Setor: PACKING HOUSE"]);
    ws.mergeCells(metaSetorRow.number, 1, metaSetorRow.number, numCols);
    metaSetorRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    ws.addRow([]);

    const logoFile = await fetchLogoImage();
    if (logoFile) {
        const imageId = workbook.addImage({ buffer: logoFile.buffer, extension: logoFile.ext });
        ws.addImage(imageId, { tl: { col: 0.1, row: 0.2 }, ext: { width: 140, height: 75 } });
    }

    const headerRow = ws.addRow(headers);
    headerRow.height = 24;
    for (let i = 1; i <= numCols; i++) {
        const cell = headerRow.getCell(i);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }

    const mapBebedouroStatus = (value: string | null | undefined): string => {
        const normalized = String(value || "").trim().toUpperCase();
        if (normalized === "S" || normalized === "C" || normalized === "SIM") return "Sim";
        if (normalized === "N" || normalized === "NC" || normalized === "NÃO" || normalized === "NAO") return "Não";
        return "";
    };

    for (const log of filledLogs) {
        const rowData: Array<string> = [
            formatSafeDate(log.data),
            log.local || '',
            mapBebedouroStatus(log.limpeza),
            mapBebedouroStatus(log.trocaFiltro),
            mapBebedouroStatus(log.manutencao)
        ];
        if (hasObservacao) {
            rowData.push(log.observacao || '');
        }
        if (hasAcaoCorretiva) {
            rowData.push(log.acaoCorretiva || '');
        }
        rowData.push('');

        const dataRow = ws.addRow(rowData);
        dataRow.height = 65;
        for (let i = 1; i <= numCols; i++) {
            const cell = dataRow.getCell(i);
            cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
            if (cell.value === "Sim") {
                cell.font = { bold: true, color: { argb: "FF137333" } };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } };
            } else if (cell.value === "Não") {
                cell.font = { bold: true, color: { argb: "FFC5221F" } };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } };
            }
        }

        const signature = String(log.signature || "").trim();
        if (signature) {
            const signatureCell = dataRow.getCell(signatureColIndex);
            signatureCell.value = formatName(signature);
            signatureCell.font = { size: 9, bold: true };
            signatureCell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

            if (signature.startsWith("data:image")) {
                try {
                    const base64Data = signature.split(",")[1];
                    const imgId = workbook.addImage({ base64: base64Data, extension: "png" });
                    ws.addImage(imgId, { tl: { col: signatureColIndex - 1 + 0.25, row: dataRow.number - 1 + 0.15 }, ext: { width: 150, height: 60 }, editAs: "oneCell" });
                } catch (e) { }
            } else {
                const imageFile = await fetchSignatureImage(signature);
                if (imageFile) {
                    const imgId = workbook.addImage({ buffer: imageFile.buffer, extension: imageFile.ext });
                    ws.addImage(imgId, { tl: { col: signatureColIndex - 1 + 0.25, row: dataRow.number - 1 + 0.15 }, ext: { width: 150, height: 60 }, editAs: "oneCell" });
                }
            }
        }
    }

    if (observacaoGeral && observacaoGeral.trim() !== "") {
        ws.addRow([]);
        const obsTitleRow = ws.addRow(["OBSERVAÇÕES DE NÃO CONFORMIDADE"]);
        ws.mergeCells(obsTitleRow.number, 1, obsTitleRow.number, numCols);
        obsTitleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        obsTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
        obsTitleRow.height = 20;
        const obsContentRow = ws.addRow([observacaoGeral]);
        ws.mergeCells(obsContentRow.number, 1, obsContentRow.number, numCols);
        obsContentRow.getCell(1).alignment = { horizontal: "left", vertical: "top", wrapText: true };
        obsContentRow.height = 28;
    }

    ws.addRow([]);

    const legendTitle = ws.addRow(["LEGENDA E PRODUTOS UTILIZADOS"]);
    ws.mergeCells(legendTitle.number, 1, legendTitle.number, numCols);
    legendTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    legendTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    legendTitle.height = 24;

    const legendLines = [
        "• SIM: Procedimento executado e aprovado.",
        "• NÃO: Procedimento não executado ou reprovado.",
        "",
        "Materiais Necessários:",
        "• Balde, Esponja, Luvas Nitrílica, Bota PVC, Óculos de Proteção.",
        "",
        "Diluição dos Produtos:",
        "• Preparar solução de 50 mL de detergente neutro para 10 litros de água.",
        "• Preparar solução de 100 mL de hipoclorito de sódio para 10 litros de água.",
    ];
    legendLines.forEach((line) => {
        const row = ws.addRow([line]);
        ws.mergeCells(row.number, 1, row.number, numCols);
        row.getCell(1).font = { size: 9 };
        row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        row.height = 18;
    });

    addRevisionControlSection(ws, numCols, activeArea.doc);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}