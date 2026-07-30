"use client";

import * as ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// --- HELPERS GERAIS E IMAGEM ---
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
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
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

interface RegistroAcesso {
    data: string;
    hora: string;
    nome: string;
    objetivo: string;
    autorizacao: string | null;
    horaSaida?: string;
    status: string;
}

interface ExportAcessoParams {
    registros: RegistroAcesso[];
    setor: string;
    assinaturaResp: string | null;
}

export const exportControleAcessoToExcel = async ({ registros, setor, assinaturaResp }: ExportAcessoParams): Promise<Blob> => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Acessos");
    const baseUrl = window.location.origin;

    // --- 1. CONFIGURAÇÃO DE COLUNAS ---
    ws.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    ws.columns = [
        { width: 18 }, // Data
        { width: 14 }, // Hora Entrada
        { width: 35 }, // Nome Visitante
        { width: 45 }, // Objetivo
        { width: 25 }, // Autorização (Assinatura inline)
        { width: 14 }, // Hora Saída
    ];

    const maxCol = 6;

    // --- 2. LOGO ---
    ws.addRow([]).height = 70;
    try {
        const logoRes = await fetch(`${baseUrl}/logo.png`);
        if (logoRes.ok) ws.addImage(workbook.addImage({ buffer: await logoRes.arrayBuffer(), extension: 'png' }), { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 60 }, editAs: 'oneCell' });
    } catch (e) { }
    ws.addRow([]);

    // --- 3. CABEÇALHO CASCATA ---
    const titleRow = ws.addRow(["CONTROLE DE ACESSO - Entrada por Setor"]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };

    const metaRows: string[] = [
        `Setor: ${setor || "Geral"}`
    ];

    metaRows.forEach(meta => {
        const row = ws.addRow([meta]);
        ws.mergeCells(row.number, 1, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    });
    ws.addRow([]);

    // 🟢 ASSINATURA LADO A LADO DO RESPONSÁVEL
    if (assinaturaResp) {
        const coordRow = ws.addRow(["Responsável:", ""]);
        coordRow.height = 55;
        coordRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };
        coordRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

        await addTableSignature(workbook, ws, assinaturaResp, coordRow.number, 2, coordRow.getCell(2));
        ws.addRow([]);
    }

    // --- 4. RENDERIZAÇÃO DA TABELA ---
    const headers = ["Data", "Hora entrada", "Nome visitante", "Objetivo da visita", "Autorização", "Hora saida"];
    const headerRow = ws.addRow(headers);
    headerRow.height = 24;
    headerRow.eachCell(applyHeaderStyle);

    const filledRegistros = registros.filter(reg => !!String(reg.nome || "").trim() || !!String(reg.objetivo || "").trim());

    for (const reg of filledRegistros) {
        const dataRow = ws.addRow([
            reg.data ? reg.data.split('-').reverse().join('/') : "",
            reg.hora || "",
            reg.nome || "",
            reg.objetivo || "",
            "",
            reg.horaSaida || "-",
        ]);

        dataRow.height = 55;

        dataRow.eachCell((cell, colNum) => {
            applyDataStyle(cell, ![3, 4].includes(colNum));
        });

        await addTableSignature(workbook, ws, reg.autorizacao || null, dataRow.number, 5, dataRow.getCell(5));
    }

    // --- 5. LEGENDAS E OBSERVAÇÕES ---
    ws.addRow([]);
    const legendTitle = ws.addRow(["LEGENDA E OBSERVAÇÕES"]);
    ws.mergeCells(legendTitle.number, 1, legendTitle.number, maxCol);
    legendTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    legendTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    legendTitle.height = 24;

    const observations = [
        "• AUTORIZAÇÃO: Assinatura obrigatória do responsável autorizando a entrada.",
        "",
        "Observação: Qualquer ocorrência destinada ao descumprimento das regras da empresa, o visitante ou colaborador será advertido verbalmente para a correção imediata do ato ao entrar em áreas sensíveis."
    ];

    observations.forEach((line) => {
        const obsRow = ws.addRow([line]);
        ws.mergeCells(obsRow.number, 1, obsRow.number, maxCol);
        obsRow.getCell(1).font = { size: 9, italic: line.startsWith("Observação") };
        obsRow.height = 20;
    });

    // --- 6. CONTROLE DE REVISÃO (Com Código do Documento no rodapé) ---
    ws.addRow([]);
    const revTitleRow = ws.addRow(["CONTROLE DE REVISÃO DO DOCUMENTO"]);
    ws.mergeCells(revTitleRow.number, 1, revTitleRow.number, maxCol);
    revTitleRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };
    revTitleRow.height = 18;

    const reviewInfo = [
        ["Aprovação / Revisado por:", "Clebitânia Carvalho"],
        ["Data da Última Revisão:", "02/01/2026"],
        ["Código do Documento:", "PHU-033"]
    ];

    for (const [label, value] of reviewInfo) {
        const row = ws.addRow([label, value]);
        ws.mergeCells(row.number, 2, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 9, color: { argb: "FF374151" } };
        row.getCell(2).font = { size: 9, color: { argb: "FF1F2937" } };
        row.height = 16;
    }

    // --- 7. DOWNLOAD ---
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};