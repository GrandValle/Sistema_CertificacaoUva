"use client";

import * as ExcelJS from "exceljs";
import { AreaPreenchimento, CleaningLog, PRODUTO_LEGENDA } from "../model/higienizacaoGeral";

// Formata o texto que fica embaixo da assinatura
const formatName = (str: string) => {
    if (!str) return "";
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

// 🟢 FUNÇÃO NOVA: Formata a data com segurança, sem cair no bug do fuso horário
const formatSafeDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) {
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    }
    return dateStr;
};

// LEGENDA ATUALIZADA
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

// FUNÇÃO PARA BUSCAR A LOGO DA EMPRESA
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

interface ExportHigienizacaoParams {
    activeArea: AreaPreenchimento;
    currentLogs: CleaningLog[];
    modoOperacao: "campo" | "packing";
    observacaoGeral?: string;
}

export const exportHigienizacaoToExcel = async ({
    activeArea,
    currentLogs,
    modoOperacao,
    observacaoGeral
}: ExportHigienizacaoParams) => {

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Higienização");

    const isMatricial = activeArea.isMatricial || false;

    // FILTRAGEM INTELIGENTE
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

    // Ajuste das colunas
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

    // 1. ESPAÇO PARA A LOGO NO TOPO
    for (let i = 0; i < 5; i++) {
        ws.addRow([]);
    }

    // 2. TÍTULO E META DADOS (Abaixo da logo)
    const titleRow = ws.addRow([`CONTROLE DE HIGIENIZAÇÃO - ${activeArea.nome.toUpperCase()}`]);
    titleRow.height = 25;
    ws.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };
    titleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

    const metaAreaRow = ws.addRow([`Área: ${activeArea.nome}`]);
    ws.mergeCells(metaAreaRow.number, 1, metaAreaRow.number, maxCol);
    metaAreaRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    const metaFreqRow = ws.addRow([`Frequência: ${activeArea.freq}`]);
    ws.mergeCells(metaFreqRow.number, 1, metaFreqRow.number, maxCol);
    metaFreqRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    const metaDateRow = ws.addRow([`Exportado em: ${new Date().toLocaleString("pt-BR")}`]);
    ws.mergeCells(metaDateRow.number, 1, metaDateRow.number, maxCol);
    metaDateRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };

    if (isMatricial) {
        const metaModoRow = ws.addRow([`Setor de Uso: ${modoOperacao.toUpperCase()}`]);
        ws.mergeCells(metaModoRow.number, 1, metaModoRow.number, maxCol);
        metaModoRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    }

    ws.addRow([]); // Linha de espaçamento antes da tabela

    // 3. INSERE A IMAGEM NO TOPO
    const logoFile = await fetchLogoImage();
    if (logoFile) {
        const imageId = workbook.addImage({
            buffer: logoFile.buffer,
            extension: logoFile.ext,
        });

        ws.addImage(imageId, {
            tl: { col: 0.1, row: 0.2 },
            ext: { width: 140, height: 75 },
        });
    }

    // ========================================================
    // TABELA E CABEÇALHOS
    // ========================================================
    const headerRow = ws.addRow(headers);
    headerRow.height = 24;
    for (let i = 1; i <= maxCol; i++) {
        const cell = headerRow.getCell(i);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }

    const fetchSignatureImage = async (baseName: string) => {
        const baseUrl = window.location.origin;
        const withSpaces = baseName.replace(/_/g, " ");
        const capitalized = withSpaces.replace(/(?:^|\s)\S/g, a => a.toUpperCase());
        const allUpper = withSpaces.toUpperCase();

        const tentativas = [
            `${baseName}.png`,
            `${withSpaces}.png`,
            `${capitalized}.png`,
            `${allUpper}.png`,
            `${baseName}.jpg`,
            `${withSpaces}.jpg`
        ];

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

    for (const reg of filledLogs) {
        let rowData: any[] = [];

        if (isMatricial) {
            let statusExportado = reg.status || "";
            if (statusExportado.toUpperCase() === "C") statusExportado = "SIM";
            else if (statusExportado.toUpperCase() === "NC") statusExportado = "NÃO";

            rowData = [
                formatSafeDate(reg.date), // 🟢 USANDO A FUNÇÃO SEGURA DE DATA AQUI
                reg.time || "",
                statusExportado,
                "",
                ""
            ];
        } else {
            const productChecks = (activeArea.produtos || []).map(p => reg.checks?.[p] ? "SIM" : "");
            rowData = [
                formatSafeDate(reg.date), // 🟢 E AQUI TAMBÉM
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
            cell.alignment = {
                horizontal: "center",
                vertical: "middle",
                wrapText: true
            };
        }

        const processSignature = async (signatureName: string, colPos: number) => {
            if (!signatureName) return;
            const sigCell = dataRow.getCell(colPos);

            sigCell.value = formatName(signatureName);
            sigCell.font = { size: 9, color: { argb: "FF004080" }, bold: true };
            sigCell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

            if (signatureName.startsWith("data:image")) {
                try {
                    const base64Data = signatureName.split(",")[1];
                    const imgId = workbook.addImage({ base64: base64Data, extension: "png" });
                    ws.addImage(imgId, { tl: { col: colPos - 1 + 0.25, row: dataRow.number - 1 + 0.05 }, ext: { width: 100, height: 40 }, editAs: "oneCell" });
                    return;
                } catch (e) { }
            }

            const normalized = normalizeFileName(signatureName);
            const imageFile = await fetchSignatureImage(normalized);

            if (imageFile) {
                const imgId = workbook.addImage({ buffer: imageFile.buffer, extension: imageFile.ext as any });
                ws.addImage(imgId, { tl: { col: colPos - 1 + 0.25, row: dataRow.number - 1 + 0.05 }, ext: { width: 100, height: 40 }, editAs: "oneCell" });
            }
        };

        if (isMatricial && reg.monitorSignature) {
            const colPos = 5;
            await processSignature(reg.monitorSignature, colPos);
        }

        if (reg.signature) {
            const colPos = isMatricial ? 4 : maxCol;
            await processSignature(reg.signature, colPos);
        }
    }

    // ========================================================
    // 4. OBSERVAÇÃO DE NÃO CONFORMIDADE (Abaixo da tabela, só se existir)
    // ========================================================
    if (observacaoGeral && observacaoGeral.trim() !== "") {
        ws.addRow([]);
        const obsTitleRow = ws.addRow(["OBSERVAÇÕES DE NÃO CONFORMIDADE"]);
        ws.mergeCells(obsTitleRow.number, 1, obsTitleRow.number, maxCol);
        obsTitleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        obsTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB91C1C" } };
        obsTitleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        obsTitleRow.height = 20;

        const obsContentRow = ws.addRow([observacaoGeral]);
        ws.mergeCells(obsContentRow.number, 1, obsContentRow.number, maxCol);
        obsContentRow.getCell(1).alignment = { horizontal: "left", vertical: "top", wrapText: true };
        obsContentRow.getCell(1).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        obsContentRow.height = 40;
    }

    ws.addRow([]);

    // ========================================================
    // 5. LEGENDA CORRIGIDA E NOMEADA
    // ========================================================
    const legendTitle = ws.addRow(["LEGENDA E PRODUTOS UTILIZADOS"]);
    ws.mergeCells(legendTitle.number, 1, legendTitle.number, maxCol);
    legendTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    legendTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    legendTitle.height = 24;
    legendTitle.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

    const legendLines = buildLegendForArea(activeArea);
    legendLines.forEach((line) => {
        const obsRow = ws.addRow([line]);
        ws.mergeCells(obsRow.number, 1, obsRow.number, maxCol);
        obsRow.getCell(1).font = { size: 9 };
        obsRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        obsRow.height = 18;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
};