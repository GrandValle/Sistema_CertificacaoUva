"use client";

import * as ExcelJS from "exceljs";
import {
    ManutencaoTabType, RegistroBalanca, RegistroReparo, InspecaoChecklist,
    FrequenciaAfericao, ITENS_SEMANAL_PHU040, ITENS_MENSAL_PHU040,
    LEGENDA_CHECKLIST, LEGENDA_REPAROS, LEGENDA_BALANCAS, COMPLIANCE_MANUTENCAO
} from "../model/manutencaoModel";

// 🟢 FUNÇÃO SEGURA PARA DATAS
const formatSafeDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) {
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    }
    return dateStr;
};

// --- HELPERS GERAIS E IMAGEM (CORRIGIDO) ---
const formatName = (str: string) => {
    if (!str) return "";
    if (str.startsWith("data:image")) return "[ASSINATURA DIGITAL]";
    return str.replace(/_/g, " ").toUpperCase();
};

// 🟢 CORREÇÃO: Usar encodeURIComponent com o nome original (como no projeto manga)
const fetchSignatureImage = async (baseName: string) => {
    if (!baseName) return null;
    const baseUrl = window.location.origin;
    // Tenta com encodeURIComponent (espaços → %20)
    const urlEncoded = `/assinaturas/${encodeURIComponent(baseName)}.png`;
    try {
        const res = await fetch(urlEncoded);
        if (res.ok) {
            const blob = await res.blob();
            const buffer = await blob.arrayBuffer();
            return { buffer, ext: 'png' as const };
        }
    } catch (e) { }
    // Fallback: tenta com o nome original (sem codificação)
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

// 🟢 addTableSignature mantido, mas fetchSignatureImage já está corrigido
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

interface ExportManutencaoParams {
    activeTab: ManutencaoTabType;
    frequencia: FrequenciaAfericao;
    freqChecklist: "Semanal" | "Mensal";
    balancasLogs: RegistroBalanca[];
    reparosLogs: RegistroReparo[];
    inspecoesSemanais: InspecaoChecklist[];
    inspecoesMensais: InspecaoChecklist[];
}

export const exportManutencaoToExcel = async ({ activeTab, frequencia, freqChecklist, balancasLogs, reparosLogs, inspecoesSemanais, inspecoesMensais }: ExportManutencaoParams): Promise<Blob> => {
    const workbook = new ExcelJS.Workbook();

    const sheetName = activeTab === "balancas" ? "Balanças" : activeTab === "reparos" ? "Reparos" : `Checklist ${freqChecklist}`;
    const ws = workbook.addWorksheet(sheetName);
    const baseUrl = window.location.origin;

    // 1. Configurações base por Aba
    let title = "";
    let codigoDoc = "";
    let headers: string[] = [];
    let metaFrequencia = "";

    if (activeTab === "balancas") {
        title = "AFERIÇÃO DE BALANÇAS";
        codigoDoc = COMPLIANCE_MANUTENCAO.pops.balancas;
        metaFrequencia = frequencia || "Diário";
        headers = ["Data calibração", "Identificação balança", "Quantidade medida", "Houve variação", "Quantidade variação", "Ação corretiva", "Responsável"];
        ws.columns = [{ width: 18 }, { width: 22 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 35 }, { width: 25 }];
    }
    else if (activeTab === "reparos") {
        title = "REGISTRO DE REPAROS E MANUTENÇÕES";
        codigoDoc = COMPLIANCE_MANUTENCAO.pops.reparos;
        headers = ["Data", "Equipamento", "Serviço", "Solicitante", "Solicitada por", "Confirmação Limpeza", "Responsável", "Coordenador da Área", "Ação corretiva"];
        ws.columns = [{ width: 18 }, { width: 25 }, { width: 16 }, { width: 22 }, { width: 22 }, { width: 18 }, { width: 22 }, { width: 22 }, { width: 35 }];
    }
    else {
        title = `CHECK-LIST DE MANUTENÇÃO - ${freqChecklist.toUpperCase()}`;
        codigoDoc = COMPLIANCE_MANUTENCAO.pops.checklist;
        metaFrequencia = freqChecklist;
        const itens = freqChecklist === "Semanal" ? ITENS_SEMANAL_PHU040 : ITENS_MENSAL_PHU040;
        headers = ["Data", ...itens, "Ação corretiva", "Responsável"];

        ws.getColumn(1).width = 18; // Data
        itens.forEach((_, i) => ws.getColumn(2 + i).width = 24);
        ws.getColumn(2 + itens.length).width = 30; // Ação
        ws.getColumn(3 + itens.length).width = 25; // Responsável
    }

    const maxCol = headers.length;

    ws.pageSetup = {
        paperSize: 9,
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    // --- 2. LOGO ---
    ws.addRow([]).height = 70;
    try {
        const logoRes = await fetch(`${baseUrl}/logo.png`);
        if (logoRes.ok) ws.addImage(workbook.addImage({ buffer: await logoRes.arrayBuffer(), extension: 'png' }), { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 60 }, editAs: 'oneCell' });
    } catch (e) { }
    ws.addRow([]);

    // --- 3. CABEÇALHO CASCATA ---
    const titleRow = ws.addRow([title]);
    ws.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };

    const metaRows: string[] = [`Área: Packing Uva`];
    if (metaFrequencia) metaRows.push(`Frequência: ${metaFrequencia}`);
    metaRows.push(`Código do documento: ${codigoDoc}`);
    metaRows.push(`Exportado em: ${new Date().toLocaleString("pt-BR")}`);

    metaRows.forEach(meta => {
        const row = ws.addRow([meta]);
        ws.mergeCells(row.number, 1, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    });
    ws.addRow([]);

    // --- 4. CABEÇALHOS DA TABELA ---
    const headerRow = ws.addRow(headers);
    headerRow.height = activeTab === "checklist" ? 65 : 30;
    headerRow.eachCell(applyHeaderStyle);

    // --- 5. RENDERIZAÇÃO DOS DADOS ---
    if (activeTab === "balancas") {
        const filledBalancas = balancasLogs.filter(log => !!String(log.dataCalibracao || "").trim() || !!String(log.identificacaoBalanca || "").trim());

        for (const log of filledBalancas) {
            const dataRow = ws.addRow([
                formatSafeDate(log.dataCalibracao),
                log.identificacaoBalanca || "",
                log.quantidadeMedida || "",
                log.houveVariacao || "-",
                log.quantidadeVariacao || "-",
                log.acaoCorretiva || "-",
                ""
            ]);
            dataRow.height = 55;
            dataRow.eachCell((c, i) => applyDataStyle(c, i !== 6));
            await addTableSignature(workbook, ws, log.responsavel || null, dataRow.number, 7, dataRow.getCell(7));
        }
    }
    else if (activeTab === "reparos") {
        const filledReparos = reparosLogs.filter(log => !!String(log.data || "").trim() || !!String(log.equipamento || "").trim());

        for (const log of filledReparos) {
            const dataRow = ws.addRow([
                formatSafeDate(log.data),
                log.equipamento || "",
                log.servico || "",
                "", // Solicitante
                "", // Solicitada por
                log.confirmacaoLimpeza || "-",
                "", // Responsável Manutenção
                "", // Coordenador da Área
                log.acaoCorretiva || ""
            ]);
            dataRow.height = 55;
            dataRow.eachCell((c, i) => applyDataStyle(c, ![2, 9].includes(i)));

            await addTableSignature(workbook, ws, log.solicitante || null, dataRow.number, 4, dataRow.getCell(4));
            await addTableSignature(workbook, ws, log.solicitadaPor || null, dataRow.number, 5, dataRow.getCell(5));
            await addTableSignature(workbook, ws, log.responsavel || null, dataRow.number, 7, dataRow.getCell(7));
            await addTableSignature(workbook, ws, log.supervisor || null, dataRow.number, 8, dataRow.getCell(8));
        }
    }
    else {
        const isSemanal = freqChecklist === "Semanal";
        const itens = isSemanal ? ITENS_SEMANAL_PHU040 : ITENS_MENSAL_PHU040;
        const inspecoes = isSemanal ? inspecoesSemanais : inspecoesMensais;

        const filledInspecoes = inspecoes.filter(insp => !!String(insp.data || "").trim());

        for (const insp of filledInspecoes) {
            const rowData = [formatSafeDate(insp.data)];
            itens.forEach((_, i) => rowData.push(insp.respostas?.[i] ?? ""));
            rowData.push(insp.acaoCorretiva || "");
            rowData.push(""); // Espaço da assinatura

            const dataRow = ws.addRow(rowData);
            dataRow.height = 55;

            const totalCells = dataRow.cellCount;
            dataRow.eachCell((c, i) => applyDataStyle(c, i !== totalCells - 1));

            await addTableSignature(workbook, ws, insp.responsavel || null, dataRow.number, totalCells, dataRow.getCell(totalCells));
        }
    }

    // --- 6. LEGENDAS E OBSERVAÇÕES ---
    ws.addRow([]);
    const legendTitle = ws.addRow(["LEGENDA E OBSERVAÇÕES"]);
    ws.mergeCells(legendTitle.number, 1, legendTitle.number, maxCol);
    legendTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    legendTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    legendTitle.height = 24;

    const legendLines = activeTab === "balancas" ? LEGENDA_BALANCAS : activeTab === "reparos" ? LEGENDA_REPAROS : LEGENDA_CHECKLIST;
    legendLines.forEach((line) => {
        const obsRow = ws.addRow([line]);
        ws.mergeCells(obsRow.number, 1, obsRow.number, maxCol);
        obsRow.getCell(1).font = { size: 9 };
        obsRow.height = 20;
    });

    // --- 7. CONTROLE DE REVISÃO DO DOCUMENTO ---
    ws.addRow([]);
    const revTitleRow = ws.addRow(["CONTROLE DE REVISÃO DO DOCUMENTO"]);
    ws.mergeCells(revTitleRow.number, 1, revTitleRow.number, maxCol);
    revTitleRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };
    revTitleRow.height = 18;

    const reviewInfo = [
        ["Aprovação / Revisado por:", COMPLIANCE_MANUTENCAO.revisedBy],
        ["Data da Última Revisão:", COMPLIANCE_MANUTENCAO.revisionDate],
        ["Código do Documento:", codigoDoc]
    ];
    for (const [label, value] of reviewInfo) {
        const row = ws.addRow([label, value]);
        ws.mergeCells(row.number, 2, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 9, color: { argb: "FF374151" } };
        row.getCell(2).font = { size: 9, color: { argb: "FF1F2937" } };
        row.height = 16;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};