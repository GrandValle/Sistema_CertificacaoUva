"use client";

import * as ExcelJS from "exceljs";
import {
    AreaPreenchimento, CleaningLog, PRODUTO_LEGENDA,
    RegistroHigienizacaoTesoura, DIAS_SEMANA_TESOURA,
    BebedouroLog, COMPLIANCE,
    buildBebedouroLegend,
    buildLegendForArea
} from "../model/higienizacaoGeral";

// ────────────────────────────────────────────────────────────────
// UTILITÁRIOS PUROS
// ────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────
// FUNÇÕES ASSÍNCRONAS PARA IMAGENS
// ────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────
// FUNÇÕES COMUNS DE CONFIGURAÇÃO DA PLANILHA
// ────────────────────────────────────────────────────────────────

function setupWorkbook(ws: ExcelJS.Worksheet, numCols: number, orientation: 'portrait' | 'landscape' = 'landscape') {
    ws.pageSetup = {
        paperSize: 9,
        orientation,
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };
}

async function addHeader(
    workbook: ExcelJS.Workbook,
    ws: ExcelJS.Worksheet,
    numCols: number,
    title: string,
    freq?: string
) {
    // 5 linhas em branco para respiro do logo
    for (let i = 0; i < 5; i++) ws.addRow([]);

    // Título principal do relatório
    const titleRow = ws.addRow([title]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, numCols);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };
    titleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    titleRow.height = 25;

    // Frequência de execução (se houver)
    if (freq) {
        const freqRow = ws.addRow([`Frequência: ${freq}`]);
        ws.mergeCells(freqRow.number, 1, freqRow.number, numCols);
        freqRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    }

    // Setor padrão
    const setorRow = ws.addRow(["Setor: PACKING HOUSE"]);
    ws.mergeCells(setorRow.number, 1, setorRow.number, numCols);
    setorRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    ws.addRow([]);

    // Insere o logotipo corporativo no canto superior
    const logoFile = await fetchLogoImage();
    if (logoFile) {
        const imageId = workbook.addImage({ buffer: logoFile.buffer, extension: logoFile.ext });
        ws.addImage(imageId, { tl: { col: 0.1, row: 0.2 }, ext: { width: 140, height: 75 } });
    }
}

function addObservation(ws: ExcelJS.Worksheet, numCols: number, observacao: string | undefined) {
    if (!observacao || observacao.trim() === "") return;
    ws.addRow([]);
    const titleRow = ws.addRow(["OBSERVAÇÕES DE NÃO CONFORMIDADE"]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, numCols);
    titleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
    titleRow.height = 20;

    const contentRow = ws.addRow([observacao]);
    ws.mergeCells(contentRow.number, 1, contentRow.number, numCols);
    contentRow.getCell(1).alignment = { horizontal: "left", vertical: "top", wrapText: true };
    contentRow.height = 40;
}

function addLegend(ws: ExcelJS.Worksheet, numCols: number, legendLines: string[]) {
    ws.addRow([]);
    const titleRow = ws.addRow(["LEGENDA E PRODUTOS UTILIZADOS"]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, numCols);
    titleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    titleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    titleRow.height = 24;

    legendLines.forEach((line) => {
        const row = ws.addRow([line]);
        ws.mergeCells(row.number, 1, row.number, numCols);
        row.getCell(1).font = { size: 9 };
        row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        row.height = 18;
    });
}

function addRevisionControl(ws: ExcelJS.Worksheet, numCols: number, docCode: string) {
    ws.addRow([]);
    const titleRow = ws.addRow(["CONTROLE DE REVISÃO DO DOCUMENTO"]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, numCols);
    titleRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF000000" } };
    titleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    titleRow.height = 24;

    // 🔥 Código do Documento de volta no Rodapé
    const rows = [
        ["Aprovação / Revisado por:", COMPLIANCE.revisedBy],
        ["Data da Última Revisão:", COMPLIANCE.revisionDate],
        ["Código do Documento:", docCode]
    ];
    rows.forEach(([label, value]) => {
        const row = ws.addRow([label, value]);
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

/**
 * 🔥 PROCESSA A CÉLULA DE ASSINATURA COM TAMANHO DINÂMICO PARA NOME LONGO
 */
async function processSignatureCell(
    workbook: ExcelJS.Workbook,
    ws: ExcelJS.Worksheet,
    row: ExcelJS.Row,
    colIndex: number,
    signatureName: string | null
) {
    if (!signatureName) return;
    const cell = row.getCell(colIndex);
    const formattedName = formatName(signatureName);
    cell.value = formattedName;

    const nameLength = formattedName.length;
    const fontSize = nameLength > 28 ? 7.5 : (nameLength > 20 ? 8 : 9);

    cell.font = { size: fontSize, bold: true };
    cell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

    if (signatureName.startsWith("data:image")) {
        try {
            const base64Data = signatureName.split(",")[1];
            const imgId = workbook.addImage({ base64: base64Data, extension: "png" });
            ws.addImage(imgId, {
                tl: { col: colIndex - 1 + 0.15, row: row.number - 1 + 0.10 },
                ext: { width: 140, height: 50 },
                editAs: "oneCell"
            });
            return;
        } catch (e) { }
    }

    const imageFile = await fetchSignatureImage(signatureName);
    if (imageFile) {
        const imgId = workbook.addImage({ buffer: imageFile.buffer, extension: imageFile.ext });
        ws.addImage(imgId, {
            tl: { col: colIndex - 1 + 0.15, row: row.number - 1 + 0.10 },
            ext: { width: 140, height: 50 },
            editAs: "oneCell"
        });
    }
}

// ────────────────────────────────────────────────────────────────
// EXPORTAÇÃO PRINCIPAL (ÁREAS NORMAIS)
// ────────────────────────────────────────────────────────────────

interface ExportParams {
    activeArea: AreaPreenchimento;
    currentLogs: CleaningLog[];
    modoOperacao: "campo" | "packing";
    observacaoGeral?: string;
    tesourasLogs?: RegistroHigienizacaoTesoura[];
    bebedourosLogs?: BebedouroLog[];
}

export const exportHigienizacaoToExcel = async ({
    activeArea,
    currentLogs,
    modoOperacao,
    observacaoGeral,
    tesourasLogs,
    bebedourosLogs,
}: ExportParams) => {

    if (activeArea.id === 'tesouras' && tesourasLogs) {
        return await exportarTesourasExcel({ activeArea, tesourasLogs, observacaoGeral, modoOperacao });
    }

    if (activeArea.id === 'bebedouros' && bebedourosLogs) {
        return await exportarBebedourosExcel({ activeArea, bebedourosLogs, observacaoGeral, modoOperacao });
    }

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
        headers = ["Data", activeArea.campo2 || "Horário", "Status", "Responsável Limpeza", "Monitor"];
        ws.getColumn(1).width = 14;
        ws.getColumn(2).width = 14;
        ws.getColumn(3).width = 12;
        ws.getColumn(4).width = 40;
        ws.getColumn(5).width = 40;
    } else {
        const nomeAssinatura = activeArea.id === 'lavagem_proc' ? "Fiscal Responsável" : "Assinatura";

        headers = ["Data", activeArea.campo2 || "Horário", ...(activeArea.produtos || []), nomeAssinatura];
        ws.getColumn(1).width = 14;
        ws.getColumn(2).width = 14;
        let colIdx = 3;
        (activeArea.produtos || []).forEach(() => {
            ws.getColumn(colIdx).width = 10;
            colIdx++;
        });
        ws.getColumn(colIdx).width = 40;
    }

    const numCols = headers.length;
    setupWorkbook(ws, numCols, numCols > 6 ? "landscape" : "portrait");

    let tituloOficial = activeArea.nome.toUpperCase();
    if (activeArea.id === 'lavagem_proc') tituloOficial = 'LAVAGEM DE CONTENTORES DO PROCESSAMENTO';
    if (activeArea.id === 'lavagem_ref') tituloOficial = 'LAVAGEM DE CONTENTORES DE REFUGO';

    await addHeader(workbook, ws, numCols, `CONTROLE DE HIGIENIZAÇÃO - ${tituloOficial}`, activeArea.freq);

    const headerRow = ws.addRow(headers);
    headerRow.height = 24;
    for (let i = 1; i <= numCols; i++) {
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

        for (let i = 1; i <= numCols; i++) {
            const cell = dataRow.getCell(i);
            cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
            cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        }

        if (isMatricial && reg.monitorSignature) {
            await processSignatureCell(workbook, ws, dataRow, 5, reg.monitorSignature);
        }
        if (reg.signature) {
            const colPos = isMatricial ? 4 : numCols;
            await processSignatureCell(workbook, ws, dataRow, colPos, reg.signature);
        }
    }

    addObservation(ws, numCols, observacaoGeral);
    addLegend(ws, numCols, buildLegendForArea(activeArea));
    addRevisionControl(ws, numCols, activeArea.doc);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};

// ────────────────────────────────────────────────────────────────
// EXPORTAÇÃO TESOURAS
// ────────────────────────────────────────────────────────────────

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

    setupWorkbook(ws, numCols, "landscape");

    ws.getColumn(1).width = 28;
    for (let i = 0; i < numDias; i++) {
        ws.getColumn(2 + i * 2).width = 12;
        ws.getColumn(3 + i * 2).width = 12;
    }
    ws.getColumn(2 + numDias * 2).width = 38;
    ws.getColumn(3 + numDias * 2).width = 38;

    await addHeader(workbook, ws, numCols, `CONTROLE DE HIGIENIZAÇÃO - ${activeArea.nome.toUpperCase()}`);

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

        await processSignatureCell(workbook, ws, row, respCol, week.respLimpeza);
        await processSignatureCell(workbook, ws, row, monCol, week.monitorResponsavel);

        row.height = 65;
        for (let i = 1; i <= numCols; i++) {
            const cell = row.getCell(i);
            cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
        }
    }

    addObservation(ws, numCols, observacaoGeral);
    addLegend(ws, numCols, buildLegendForArea(activeArea));
    addRevisionControl(ws, numCols, activeArea.doc);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

// ────────────────────────────────────────────────────────────────
// EXPORTAÇÃO BEBEDOUROS
// ────────────────────────────────────────────────────────────────

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

    setupWorkbook(ws, numCols, "landscape");

    ws.getColumn(1).width = 18;
    ws.getColumn(2).width = 30;
    ws.getColumn(3).width = 22;
    ws.getColumn(4).width = 22;
    ws.getColumn(5).width = 22;
    let nextCol = 6;
    if (hasObservacao) {
        ws.getColumn(nextCol).width = 40;
        nextCol++;
    }
    if (hasAcaoCorretiva) {
        ws.getColumn(nextCol).width = 40;
        nextCol++;
    }
    ws.getColumn(nextCol).width = 38;

    await addHeader(workbook, ws, numCols, `CONTROLE DE HIGIENIZAÇÃO - ${activeArea.nome.toUpperCase()}`);

    const headerRow = ws.addRow(headers);
    headerRow.height = 24;
    for (let i = 1; i <= numCols; i++) {
        const cell = headerRow.getCell(i);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }

    const mapStatus = (value: string | null | undefined): string => {
        const normalized = String(value || "").trim().toUpperCase();
        if (normalized === "S" || normalized === "C" || normalized === "SIM") return "Sim";
        if (normalized === "N" || normalized === "NC" || normalized === "NÃO" || normalized === "NAO") return "Não";
        return "";
    };

    for (const log of filledLogs) {
        const rowData: Array<string> = [
            formatSafeDate(log.data),
            log.local || '',
            mapStatus(log.limpeza),
            mapStatus(log.trocaFiltro),
            mapStatus(log.manutencao)
        ];
        if (hasObservacao) rowData.push(log.observacao || '');
        if (hasAcaoCorretiva) rowData.push(log.acaoCorretiva || '');
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

        if (log.signature) {
            await processSignatureCell(workbook, ws, dataRow, signatureColIndex, log.signature);
        }
    }

    addObservation(ws, numCols, observacaoGeral);
    addLegend(ws, numCols, buildBebedouroLegend());
    addRevisionControl(ws, numCols, activeArea.doc);

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}