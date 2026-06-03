"use client";

import * as ExcelJS from "exceljs";
// 🟢 O IMPORT DO FILE-SAVER FOI REMOVIDO DAQUI
import { TabType, EstoqueLog, RegistroTesoura, RegistroOculos, DIAS_SEMANA, LEGENDA_OCULOS, LEGENDA_TESOURAS, LEGENDA_ESTOQUE } from "../model/estoqueModel";

// --- HELPERS GERAIS ---
const formatName = (str: string) => {
    if (!str) return "";
    if (str.startsWith("data:image")) return "[ASSINATURA DIGITAL]";
    return str.replace(/_/g, " ").toUpperCase();
};

const normalizeFileName = (str: string) => (!str ? "" : str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").toLowerCase());

// 🟢 FUNÇÃO DE DATA SEGURA ADICIONADA AQUI
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

interface ExportEstoqueParams {
    activeTab: TabType;
    estoqueLogs: EstoqueLog[];
    tesourasLogs: RegistroTesoura[];
    oculosLogs: RegistroOculos[];
    dataInicio: string;
    dataFim: string;
    frequenciaTesoura: string;
}

export const exportEstoqueToExcel = async ({ activeTab, estoqueLogs, tesourasLogs, oculosLogs, dataInicio, dataFim, frequenciaTesoura }: ExportEstoqueParams) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(activeTab === "estoque" ? "Estoque" : activeTab === "tesouras" ? "Tesouras" : "Óculos");
    const baseUrl = window.location.origin;

    // --- 1. CONFIGURAÇÃO DE PÁGINA E COLUNAS ---
    worksheet.pageSetup = { paperSize: 9, orientation: activeTab === "tesouras" ? "landscape" : "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } };

    let title = "", codigoDoc = "", headers: string[] = [], metaExtra: string[] = [];

    if (activeTab === "estoque") {
        title = "CONTROLE DE ESTOQUE - MATERIAL DE LIMPEZA"; codigoDoc = "PHU-029";
        headers = ["Data", "Produto", "Entrada", "Saída", "Setor", "Quem Pegou", "Saldo", "Responsável"];
        worksheet.columns = [{ width: 14 }, { width: 24 }, { width: 14 }, { width: 14 }, { width: 18 }, { width: 28 }, { width: 14 }, { width: 28 }];
    } else if (activeTab === "tesouras") {
        title = "ENTREGA E DEVOLUÇÃO DE TESOURAS"; codigoDoc = "PHU-043";
        headers = ["Funcionário", "Nº Tesoura", ...DIAS_SEMANA];
        metaExtra = [`Data início: ${formatSafeDate(dataInicio) || "-"}`, `Data fim: ${formatSafeDate(dataFim) || "-"}`, `Frequência: ${frequenciaTesoura || "-"}`];
        worksheet.getColumn(1).width = 26; worksheet.getColumn(2).width = 16;
        DIAS_SEMANA.forEach((_, i) => worksheet.getColumn(3 + i).width = 12);
    } else {
        title = "CONTROLE DE ÓCULOS (EPI)"; codigoDoc = "PHU-027";
        headers = ["Data", "Colaborador", "Intacto", "Assinatura", "Observação"];
        worksheet.columns = [{ width: 14 }, { width: 26 }, { width: 12 }, { width: 28 }, { width: 30 }];
    }

    const maxCol = headers.length;

    // --- 2. LOGO ---
    worksheet.addRow([]).height = 70;
    try {
        const logoRes = await fetch(`${baseUrl}/logo.png`);
        if (logoRes.ok) worksheet.addImage(workbook.addImage({ buffer: await logoRes.arrayBuffer(), extension: 'png' }), { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 60 }, editAs: 'oneCell' });
    } catch (e) { }

    worksheet.addRow([]);

    // --- 3. TÍTULO E METADADOS ---
    const titleRow = worksheet.addRow([title]);
    worksheet.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };

    const metadataRows = [
        `Exportado em: ${new Date().toLocaleString("pt-BR")}`
    ];
    if (metaExtra.length > 0) metadataRows.push(...metaExtra);

    metadataRows.forEach(meta => {
        const row = worksheet.addRow([meta]);
        worksheet.mergeCells(row.number, 1, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    });

    worksheet.addRow([]);

    // --- 4. CABEÇALHO DA TABELA ---
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 24;
    headerRow.eachCell(applyHeaderStyle);

    // --- FUNÇÃO DE ASSINATURA INLINE REUTILIZÁVEL ---
    const addTableSignature = async (val: string | null, rNum: number, cNum: number, cell: ExcelJS.Cell) => {
        if (!val) return;
        const imgFile = val.startsWith("data:image") ? { base64: val.split(",")[1], ext: "png" } : await fetchSignatureImage(val);

        cell.value = formatName(val);
        cell.font = { size: 8, bold: true, color: { argb: "FF003366" } };
        cell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

        if (imgFile) {
            const imgId = workbook.addImage(val.startsWith("data:image") ? { base64: (imgFile as any).base64, extension: "png" } : { buffer: (imgFile as any).buffer, extension: (imgFile as any).ext });
            worksheet.addImage(imgId, { tl: { col: cNum - 1 + 0.1, row: rNum - 1 + 0.1 }, ext: { width: 100, height: 35 }, editAs: "oneCell" });
            cell.value = `\n\n\n${formatName(val)}`;
        }
    };

    // --- 5. DADOS ---
    if (activeTab === "estoque") {
        const filledEstoque = estoqueLogs.filter((log: any) => !!String(log.product || "").trim() || !!String(log.date || "").trim());
        for (const log of filledEstoque) {
            const dataRow = worksheet.addRow([
                formatSafeDate(log.date), // 🟢 DATA SEGURA
                log.product || "",
                log.entry ? `${log.entry} ${log.entryUnit || ""}`.trim() : "",
                log.exit ? `${log.exit} ${log.exitUnit || ""}`.trim() : "",
                log.sector || "", "", log.balance ?? "", ""
            ]);
            dataRow.height = 55;
            dataRow.eachCell((c, i) => applyDataStyle(c, i !== 2 && i !== 5));

            await addTableSignature(log.whoTook || null, dataRow.number, 6, dataRow.getCell(6));
            await addTableSignature(log.responsible || null, dataRow.number, 8, dataRow.getCell(8));
        }
    } else if (activeTab === "tesouras") {
        const filledTesouras = tesourasLogs.filter((row: any) => !!String(row.funcionario || "").trim());
        filledTesouras.forEach((row) => {
            const rowData = [row.funcionario || "", row.numeroTesoura || ""];
            DIAS_SEMANA.forEach(dia => rowData.push([row.dias?.[dia]?.e && "E", row.dias?.[dia]?.d && "D"].filter(Boolean).join("/")));

            const dataRow = worksheet.addRow(rowData);
            dataRow.height = 24;
            dataRow.eachCell((c, i) => applyDataStyle(c, i !== 1));
        });
    } else {
        const filledOculos = oculosLogs.filter((log: any) => !!String(log.colaborador || "").trim() || !!String(log.data || "").trim());
        for (const log of filledOculos) {
            const dataRow = worksheet.addRow([
                formatSafeDate(log.data), // 🟢 DATA SEGURA
                log.colaborador || "", log.intacto || "", "", log.observacao || ""
            ]);
            dataRow.height = 55;
            dataRow.eachCell((c, i) => applyDataStyle(c, i !== 2 && i !== 5));

            await addTableSignature(log.assinatura || null, dataRow.number, 4, dataRow.getCell(4));
        }
    }

    // --- 6. LEGENDA E OBSERVAÇÕES ---
    worksheet.addRow([]);
    const legendTitle = worksheet.addRow(["LEGENDA E OBSERVAÇÕES"]);
    worksheet.mergeCells(legendTitle.number, 1, legendTitle.number, maxCol);
    legendTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    legendTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    legendTitle.height = 24;
    legendTitle.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

    const legendLines = activeTab === "estoque" ? LEGENDA_ESTOQUE : activeTab === "tesouras" ? LEGENDA_TESOURAS : LEGENDA_OCULOS;
    legendLines.forEach((line) => {
        const obsRow = worksheet.addRow([line]);
        worksheet.mergeCells(obsRow.number, 1, obsRow.number, maxCol);
        obsRow.getCell(1).font = { size: 9 };
        obsRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        obsRow.height = 20;
    });

    // --- 7. CONTROLE DE REVISÃO DO DOCUMENTO ---
    worksheet.addRow([]);
    const revTitleRow = worksheet.addRow(["CONTROLE DE REVISÃO DO DOCUMENTO"]);
    worksheet.mergeCells(revTitleRow.number, 1, revTitleRow.number, maxCol);
    revTitleRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };
    revTitleRow.height = 18;

    const reviewInfo = [
        ["Aprovação / Revisado por:", "Clebitânia Carvalho"],
        ["Data da Última Revisão:", "02/01/2026"],
        ["Código do Documento:", codigoDoc]
    ];
    for (const [label, value] of reviewInfo) {
        const row = worksheet.addRow([label, value]);
        worksheet.mergeCells(row.number, 2, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 9, color: { argb: "FF374151" } };
        row.getCell(2).font = { size: 9, color: { argb: "FF1F2937" } };
        row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
        row.height = 16;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    // 🟢 DEVOLVE O BLOB NO LUGAR DE FAZER DOWNLOAD DIRETO!
    return new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
};