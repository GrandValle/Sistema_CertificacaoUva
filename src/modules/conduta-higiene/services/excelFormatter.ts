"use client";

import * as ExcelJS from "exceljs";
import { ChecklistRow, ActionPlan, LavagemLog, QUESTIONS, DAYS, CondutaTabType } from "../model/condutaModel";

// --- HELPERS GERAIS ---
const formatName = (str: string) => (!str ? "" : str.startsWith("data:image") ? "ASSINADO DIGITALMENTE" : str.replace(/_/g, " ").toUpperCase());
const normalizeFileName = (str: string) => (!str ? "" : str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").toLowerCase());

// 🟢 FUNÇÃO SEGURA PARA DATAS ADICIONADA AQUI
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

interface ExportCondutaParams {
    activeTab: CondutaTabType;
    week: string;
    signatures: { coordinator: string | null };
    checklist: ChecklistRow[];
    actions: ActionPlan[];
    lavagemLogs: LavagemLog[];
    localLavagem: string;
}

// 🟢 ALTERAÇÃO NO RETORNO: Promise<Blob> para devolver o arquivo
export const exportCondutaToExcel = async ({ activeTab, week, signatures, checklist, actions, lavagemLogs, localLavagem }: ExportCondutaParams): Promise<Blob> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(activeTab === "inspecao" ? "Conduta e Saúde" : "Lavagem de Mãos");
    const baseUrl = window.location.origin;

    // --- 1. CONFIGURAÇÃO DE COLUNAS E PÁGINA ---
    const maxCol = activeTab === "inspecao" ? 8 : 1 + (DAYS.length * 2);

    worksheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } };

    if (activeTab === "inspecao") {
        worksheet.columns = [{ width: 14 }, { width: 85 }, { width: 15 }, { width: 22 }, { width: 18 }, { width: 18 }, { width: 14 }, { width: 14 }];
    } else {
        worksheet.getColumn(1).width = 45;
        let cIdx = 2;
        DAYS.forEach(() => { worksheet.getColumn(cIdx).width = 12; worksheet.getColumn(cIdx + 1).width = 12; cIdx += 2; });
    }

    // --- 2. LOGO E CABEÇALHO UNIFICADO ---
    worksheet.addRow([]).height = 70;
    try {
        const logoRes = await fetch(`${baseUrl}/logo.png`);
        if (logoRes.ok) worksheet.addImage(workbook.addImage({ buffer: await logoRes.arrayBuffer(), extension: 'png' }), { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 60 }, editAs: 'oneCell' });
    } catch (e) { }

    worksheet.addRow([]);

    const titleConfig = activeTab === "inspecao"
        ? { title: "MONITORAMENTO DE CONDUTA E SAÚDE", meta: ["Área: Packing Manga", `Período da semana: ${week}`, "Código: PHU-2.9.7"] }
        : { title: "MONITORAMENTO DE LAVAGEM DE MÃOS", meta: [`Local: ${localLavagem || "Não Definido"}  |  Código: PHU-2.9.1`, `Exportado em: ${new Date().toLocaleString("pt-BR")}`] };

    const titleRow = worksheet.addRow([titleConfig.title]);
    worksheet.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };

    titleConfig.meta.forEach(meta => {
        const row = worksheet.addRow([meta]);
        worksheet.mergeCells(row.number, 1, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    });
    worksheet.addRow([]);

    // --- FUNÇÃO DE ASSINATURA REUTILIZÁVEL ---
    const addTableSignature = async (val: string | null, rNum: number, cNum: number, w = 130, h = 35, offX = 0.02) => {
        if (!val) return;
        const imgFile = val.startsWith("data:image") ? { base64: val.split(",")[1], ext: "png" } : await fetchSignatureImage(val);
        if (imgFile) {
            const imgId = workbook.addImage(val.startsWith("data:image") ? { base64: (imgFile as any).base64, extension: "png" } : { buffer: (imgFile as any).buffer, extension: (imgFile as any).ext });
            worksheet.addImage(imgId, { tl: { col: cNum - 1 + offX, row: rNum - 1 + 0.02 }, ext: { width: w, height: h }, editAs: "oneCell" });
        }
    };

    // --- 3. DADOS: INSPEÇÃO DE CONDUTA ---
    if (activeTab === "inspecao") {
        // Assinatura Cabeçalho
        const sigRow = worksheet.addRow(["Auxiliar de Segurança:", ""]); sigRow.height = 38;
        const nameRow = worksheet.addRow(["", formatName(signatures.coordinator || "")]); nameRow.height = 18;
        worksheet.mergeCells(sigRow.number, 1, nameRow.number, 1);
        sigRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1F2937" } };
        nameRow.getCell(2).font = { bold: true, size: 10, color: { argb: "FF004080" } };
        await addTableSignature(signatures.coordinator, sigRow.number, 2);
        worksheet.addRow([]);

        // Tabela Checklist
        const headerRow = worksheet.addRow(["Inspeção - Itens Observados", "", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]);
        worksheet.mergeCells(headerRow.number, 1, headerRow.number, 2);
        headerRow.eachCell(applyHeaderStyle);

        checklist.forEach((row, idx) => {
            const dataRow = worksheet.addRow([QUESTIONS[idx] || "", "", ...DAYS.map(day => (row as any)[day] === "ok" ? "SIM" : (row as any)[day] === "no" ? "NÃO" : "")]);
            worksheet.mergeCells(dataRow.number, 1, dataRow.number, 2);
            dataRow.height = 52;
            dataRow.eachCell((cell, col) => {
                applyDataStyle(cell, col > 2);
                if (cell.value === "SIM") { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } }; cell.font = { bold: true, color: { argb: "FF137333" } }; }
                if (cell.value === "NÃO") { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } }; cell.font = { bold: true, color: { argb: "FFC5221F" } }; }
            });
        });

        // Plano de Ação
        const filledActions = actions.filter(row => !!String(row.date || "").trim() || !!String(row.nonConformity || "").trim() || !!String(row.action || "").trim());
        if (filledActions.length > 0) {
            worksheet.addRow([]); worksheet.addRow([]);
            worksheet.addRow(["PLANO DE AÇÃO CORRETIVA"]).eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } }; c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.alignment = { horizontal: "center" }; });
            worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, maxCol);

            const aHeader = worksheet.addRow(["Data", "Não Conformidade", "Causa Raiz", "Ação Corretiva", "Responsável / Assinatura", "", "Status", ""]);
            worksheet.mergeCells(aHeader.number, 5, aHeader.number, 6); worksheet.mergeCells(aHeader.number, 7, aHeader.number, 8);
            aHeader.eachCell(c => { applyHeaderStyle(c); c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } }; });

            for (const row of filledActions) {
                const rawName = formatName(row.responsible || "______________________");
                const dataRow = worksheet.addRow([
                    formatSafeDate(row.date), // 🟢 DATA SEGURA APLICADA AQUI
                    row.nonConformity || "", row.rootCause || "", row.action || "",
                    `\n\n\n${rawName}`, "", row.status === "completed" ? "CONCLUÍDO" : row.status === "in_progress" ? "EM ANDAMENTO" : "PENDENTE", ""
                ]);
                worksheet.mergeCells(dataRow.number, 5, dataRow.number, 6); worksheet.mergeCells(dataRow.number, 7, dataRow.number, 8);
                dataRow.height = 75;
                dataRow.eachCell((c, i) => {
                    applyDataStyle(c, i === 1 || i >= 5);
                    if (i === 5) { c.alignment = { horizontal: "center", vertical: "bottom", wrapText: true }; c.font = { size: 9, bold: true, color: { argb: "FF004080" } }; }
                });
                await addTableSignature(row.responsible || null, dataRow.number, 5, 130, 42, 0.15);
            }
        }
    }
    // --- 4. DADOS: LAVAGEM DE MÃOS ---
    else {
        const rowDia = worksheet.addRow([]); const rowHora = worksheet.addRow([]);
        worksheet.mergeCells(rowDia.number, 1, rowHora.number, 1);
        worksheet.getCell(rowDia.number, 1).value = "Colaborador";

        let colIdx = 2;
        DAYS.forEach(day => {
            worksheet.mergeCells(rowDia.number, colIdx, rowDia.number, colIdx + 1);
            worksheet.getCell(rowDia.number, colIdx).value = day.toUpperCase();
            worksheet.getCell(rowHora.number, colIdx).value = "09h";
            worksheet.getCell(rowHora.number, colIdx + 1).value = "14h";
            colIdx += 2;
        });

        [rowDia, rowHora].forEach(r => r.eachCell(applyHeaderStyle));

        lavagemLogs.filter(log => !!String(log.colaborador || "").trim() && !log.colaborador?.startsWith("-")).forEach((log) => {
            const rowData = [log.colaborador || ""];
            DAYS.forEach(day => { rowData.push(log.dias?.[day]?.manha || ""); rowData.push(log.dias?.[day]?.tarde || ""); });
            const dataRow = worksheet.addRow(rowData);
            dataRow.height = 28;
            dataRow.eachCell((c, i) => {
                applyDataStyle(c, i > 1);
                if (c.value === "C") { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } }; c.font = { bold: true, color: { argb: "FF137333" } }; }
                if (c.value === "NC") { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } }; c.font = { bold: true, color: { argb: "FFC5221F" } }; }
            });
        });
    }

    // --- 5. LEGENDA E RODAPÉ UNIFICADO ---
    worksheet.addRow([]);
    worksheet.addRow(["LEGENDA E DETALHES"]).getCell(1).font = { bold: true, size: 10 };
    worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, maxCol);

    if (activeTab === "inspecao") {
        worksheet.addRow(["• SIM: Conforme padrões de higiene. | • NÃO: Irregularidade. Requer preenchimento do Plano de Ação."]).getCell(1).font = { size: 9 };
    } else {
        const comboRow = worksheet.addRow([""]);
        worksheet.mergeCells(comboRow.number, 1, comboRow.number, maxCol);
        comboRow.getCell(1).value = {
            richText: [
                { font: { bold: true, size: 8.5 }, text: "Legenda: " }, { font: { size: 8.5 }, text: "C: Conforme | NC: Não Conforme\n" },
                { font: { bold: true, size: 8.5 }, text: "É Proibido: " }, { font: { size: 8.5 }, text: "Fumar • Unhas grandes/esmaltes • Adornos (Anel, Relógio, Brincos) • Perfume • Sem touca • Uniforme sujo\n" },
                { font: { bold: true, size: 8.5 }, text: "Produtos: " }, { font: { size: 8.5 }, text: "Sabão de mãos • Álcool gel 70% • Secador de mãos" }
            ]
        };
        applyDataStyle(comboRow.getCell(1), false); comboRow.height = 54;
    }

    worksheet.addRow([]);
    worksheet.addRow(["CONTROLE DE REVISÃO"]).getCell(1).font = { bold: true, size: 10 };
    [["Aprovado/Revisado:", "Clebitânia Carvalho"], ["Última Revisão:", "02/01/2026"], ["Código:", activeTab === "inspecao" ? "PHU-037" : "PHU-039"]].forEach(([l, v]) => {
        const r = worksheet.addRow([l, v]); worksheet.mergeCells(r.number, 2, r.number, maxCol);
        r.getCell(1).font = { bold: true, size: 9 }; r.getCell(2).font = { size: 9 };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    // 🟢 EM VEZ DE BAIXAR, NÓS DEVOLVEMOS O ARQUIVO (Blob)
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};