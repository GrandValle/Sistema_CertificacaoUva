"use client";

import * as ExcelJS from "exceljs";
import {
    LEGENDA_VIDROS,
    LEGENDA_PRAGAS,
    LEGENDA_INUSUAIS,
    LEGENDA_REJEITOS,
    LEGENDA_RESIDUOS,
    PRAGAS_SETORES,
    PRAGAS_COLUNAS
} from "../model/controleQualidadeModel";

const formatName = (str: string) => {
    if (!str) return "";
    if (str.startsWith("data:image")) return "[ASSINATURA DIGITAL]";
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
    const normalized = normalizeFileName(baseName);
    const tentativas = [`${baseName}.png`, `${withSpaces}.png`, `${normalized}.png`, `${normalized}.jpg`];

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

const addTopSignature = (
    worksheet: ExcelJS.Worksheet,
    workbook: ExcelJS.Workbook,
    imageData: { buffer?: ArrayBuffer; base64?: string; ext: string },
    rowNumber: number,
    colNumber: number,
    imgWidth: number = 130,
    imgHeight: number = 32
) => {
    const imgId = workbook.addImage(
        imageData.buffer
            ? { buffer: imageData.buffer, extension: imageData.ext as any }
            : { base64: imageData.base64!, extension: imageData.ext as any }
    );

    const colOffset = 0.3;
    worksheet.addImage(imgId, {
        tl: { col: colNumber - 1 + colOffset, row: rowNumber - 1 },
        ext: { width: imgWidth, height: imgHeight },
        editAs: 'oneCell'
    });
};

interface ExportExcelParams {
    activeTab: string;
    vidrosDate?: string;
    vidrosMonitor?: string | null;
    vidrosResp?: string | null;
    vidrosObs?: string;
    vidrosLogs?: any[];
    pragasLogs?: any[];
    inusuaisLogs?: any[];
    rejeitosLogs?: any[];
    residuosLogs?: any[];
    actionPlans?: any[];
    responsavel?: string | null;
    respPacking?: string | null;
    pragasColunas?: string[];
    pragasSetores?: string[];
}

export const exportControleQualidadeToExcel = async ({
    activeTab,
    vidrosDate,
    vidrosMonitor,
    vidrosResp,
    vidrosObs,
    vidrosLogs = [],
    pragasLogs = [],
    inusuaisLogs = [],
    rejeitosLogs = [],
    residuosLogs = [],
    actionPlans = [],
    responsavel: responsavelParam,
    respPacking: respPackingParam,
    pragasColunas: pragasColunasParam,
    pragasSetores: pragasSetoresParam,
}: ExportExcelParams) => {

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Qualidade");
    const baseUrl = window.location.origin;

    const colunasPragas = (activeTab === "pragas" && pragasColunasParam && pragasColunasParam.length > 0)
        ? pragasColunasParam
        : PRAGAS_COLUNAS;

    const setoresPragas = (activeTab === "pragas" && pragasSetoresParam && pragasSetoresParam.length > 0)
        ? pragasSetoresParam
        : PRAGAS_SETORES;

    let headers: string[] = [];
    let temAcaoCorretiva = false;

    if (activeTab === "vidros") {
        // 🔥 Atualizado para refletir a ordem correta: Observação/Local antes de Ação Recomendada
        headers = ["Verificar (Item)", "Status", "Observação / Local", "Ação Recomendada", "Tempo de Correção"];
    } else if (activeTab === "pragas") {
        temAcaoCorretiva = pragasLogs.some(log => {
            const acao = log.grid?.['GERAL_AcaoCorretiva'];
            return acao && acao.trim() !== '';
        });

        headers = ["Setor", ...colunasPragas];
        if (temAcaoCorretiva) {
            headers.push("Ação Corretiva");
        }
    } else if (activeTab === "inusuais") {
        headers = ["Data", "Descrição do Acontecimento", "Ação Corretiva", "Resp. Correção", "Resp. Packing"];
    } else if (activeTab === "rejeitos") {
        headers = ["Produto/Material", "Quantidade/Kg", "Local de Destino", "Data de Retenção", "Resp. Retenção", "Data de Saída", "Resp. Rejeitados"];
    } else if (activeTab === "residuos") {
        headers = ["Data Período", "Terça", "Sexta", "Responsável / Recolhimento", "Monitor Responsável"];
    }

    const maxCol = headers.length || 7;

    worksheet.pageSetup = {
        paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    const logoRow = worksheet.addRow([]);
    logoRow.height = 70;
    try {
        const logoRes = await fetch(`${baseUrl}/logo.png`);
        if (logoRes.ok) {
            const buffer = await logoRes.arrayBuffer();
            const imgId = workbook.addImage({ buffer: buffer, extension: 'png' });
            worksheet.addImage(imgId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 60 }, editAs: 'oneCell' });
        }
    } catch (e) { }

    worksheet.addRow([]);

    const titulosMap: any = {
        vidros: "MONITORAMENTO DE VIDRO E PLÁSTICO RÍGIDO",
        pragas: "MONITORAMENTO DE VETORES E PRAGAS URBANAS",
        inusuais: "REGISTRO DE ACONTECIMENTOS INUSUAIS",
        rejeitos: "REGISTRO DIÁRIO DE RETIDOS E REJEITOS",
        residuos: "CONTROLE DE RESÍDUOS"
    };

    const titleRow = worksheet.addRow([titulosMap[activeTab] || "CONTROLE DE QUALIDADE"]);
    worksheet.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };
    titleRow.height = 50;

    if (activeTab === "residuos") {
        worksheet.addRow(["Área: Packing House"]).getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    }

    if (activeTab === "vidros") {
        worksheet.addRow([`Frequência: Semanal`]).getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
        worksheet.addRow([`Data da verificação: ${formatSafeDate(vidrosDate || new Date().toISOString().split("T")[0])}`]).getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    }

    if (activeTab === "pragas") {
        worksheet.addRow([`Data de Registro: ${new Date().toLocaleDateString("pt-BR")}`]).getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    }

    worksheet.addRow([]);

    const processSignature = async (label: string, value: string | null | undefined) => {
        const row = worksheet.addRow([label, value ? formatName(value) : "_________________________________"]);
        const rowHeight = 60;
        row.height = rowHeight;
        row.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1F2937" } };
        row.getCell(2).alignment = { horizontal: "left", vertical: "bottom", wrapText: false };
        worksheet.getColumn(2).width = 60;

        if (value) {
            let imgData = null;
            if (value.startsWith("data:image")) {
                imgData = { base64: value.split(",")[1], ext: "png" };
            } else {
                const file = await fetchSignatureImage(value);
                if (file) imgData = { buffer: file.buffer, ext: file.ext };
            }
            if (imgData) {
                addTopSignature(worksheet, workbook, imgData, row.number, 2, 130, 32);
            }
        }
    };

    let responsavel = responsavelParam;
    let respPacking = respPackingParam;

    if (activeTab === "pragas" && pragasLogs.length > 0) {
        responsavel = pragasLogs[0].monitor || null;
        respPacking = null;
    }

    if (activeTab === "vidros") {
        await processSignature("Assinatura do Monitor:", vidrosMonitor);
        await processSignature("Assinatura do Resp. Packing:", vidrosResp);
    } else if (activeTab === "residuos") {
    } else {
        if (responsavel) await processSignature("Assinatura do Responsável:", responsavel);
        if (respPacking) await processSignature("Assinatura do Resp. Packing:", respPacking);
    }
    worksheet.addRow([]);

    if (activeTab === "vidros") {
        worksheet.columns = [{ width: 30 }, { width: 12 }, { width: 35 }, { width: 35 }, { width: 20 }];
    } else if (activeTab === "pragas") {
        worksheet.getColumn(1).width = 25;
        colunasPragas.forEach((coluna, index) => {
            const colNumber = index + 2;
            const colLower = coluna.toLowerCase();
            let width = 14;
            if (colLower.includes('armadilha') || colLower.includes('armadilhas')) width = 18;
            else if (colLower.includes('quantidade')) width = 22;
            else if (colLower.includes('encontrada')) width = 20;
            else if (colLower.includes('ação') || colLower.includes('corretiva')) width = 35;
            else if (colLower.length > 12) width = 18;
            worksheet.getColumn(colNumber).width = width;
        });
        if (temAcaoCorretiva) {
            const lastCol = colunasPragas.length + 2;
            worksheet.getColumn(lastCol).width = 40;
        }
    } else if (activeTab === "inusuais") {
        worksheet.columns = [{ width: 15 }, { width: 45 }, { width: 40 }, { width: 45 }, { width: 45 }];
    } else if (activeTab === "rejeitos") {
        worksheet.columns = [{ width: 30 }, { width: 15 }, { width: 25 }, { width: 18 }, { width: 45 }, { width: 18 }, { width: 45 }];
    } else if (activeTab === "residuos") {
        worksheet.columns = [
            { width: 25 },
            { width: 12 },
            { width: 12 },
            { width: 40 },
            { width: 40 }
        ];
    }

    const headerRow = worksheet.addRow(headers);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });

    const addTableSignature = async (value: string | null | undefined, rowNum: number, colNum: number) => {
        if (!value) return;
        let imgData = null;
        if (value.startsWith("data:image")) {
            imgData = { base64: value.split(",")[1], ext: "png" };
        } else {
            const file = await fetchSignatureImage(value);
            if (file) imgData = { buffer: file.buffer, ext: file.ext };
        }
        if (imgData) {
            addTopSignature(worksheet, workbook, imgData, rowNum, colNum, 130, 32);
        }
    };

    const applyRowStyle = (row: ExcelJS.Row, isSignatureRow = false) => {
        row.eachCell((cell, colNumber) => {
            cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
            let verticalAlign = "middle";
            cell.alignment = {
                horizontal: "center",
                vertical: verticalAlign as any,
                wrapText: true
            };
        });
    };

    if (activeTab === "vidros") {
        const filteredRows = vidrosLogs.filter(r => r.item !== "Outros" && !(r.item?.startsWith("Outros:") && r.item.replace("Outros:", "").trim() === ""));

        for (let i = 0; i < filteredRows.length; i++) {
            const row = filteredRows[i];
            const itemSemPrefixoOutros = String(row.item || "").replace(/^Outros\s*:\s*/i, "").trim();

            // 🔥 Mapeamento correto: Observação individual na linha e em seguida Ação Recomendada
            const dataRow = worksheet.addRow([
                itemSemPrefixoOutros || row.item || "",
                row.conforme || "",
                row.observacao || "",
                row.acaoRecomendada || "",
                row.tempoCorrecao || ""
            ]);

            applyRowStyle(dataRow);
        }
    } else if (activeTab === "pragas") {
        for (let i = 0; i < pragasLogs.length; i++) {
            const log = pragasLogs[i];
            const acaoCorretiva = log.grid?.['GERAL_AcaoCorretiva'] || "";
            setoresPragas.forEach((setor, index) => {
                const rowData = [setor];
                colunasPragas.forEach(coluna => {
                    rowData.push(log.grid[`${setor}_${coluna}`] || "");
                });
                if (temAcaoCorretiva) {
                    rowData.push(index === 0 ? acaoCorretiva : "");
                }
                const dataRow = worksheet.addRow(rowData);
                applyRowStyle(dataRow);
            });
        }
    } else if (activeTab === "inusuais") {
        for (let i = 0; i < inusuaisLogs.length; i++) {
            const row = inusuaisLogs[i];
            const dataRow = worksheet.addRow([
                formatSafeDate(row.data),
                row.descricao || "",
                row.acaoCorretiva || "",
                formatName(row.respCorrecao),
                formatName(row.respPacking)
            ]);
            applyRowStyle(dataRow, true);
            dataRow.getCell(4).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
            dataRow.getCell(5).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
            await addTableSignature(row.respCorrecao, dataRow.number, 4);
            await addTableSignature(row.respPacking, dataRow.number, 5);
        }
    } else if (activeTab === "rejeitos") {
        for (const rejeito of rejeitosLogs) {
            const dataRow = worksheet.addRow([
                rejeito.produto || "",
                rejeito.quantidade || "",
                rejeito.localDestino || "",
                formatSafeDate(rejeito.dataRetencao),
                formatName(rejeito.responsavelRetencao),
                formatSafeDate(rejeito.dataSaida),
                formatName(rejeito.responsavelRejeitados)
            ]);
            applyRowStyle(dataRow, true);
            dataRow.getCell(5).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
            dataRow.getCell(7).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
            await addTableSignature(rejeito.responsavelRetencao, dataRow.number, 5);
            await addTableSignature(rejeito.responsavelRejeitados, dataRow.number, 7);
        }

        const planosDeAcao = rejeitosLogs.filter(r =>
            (r.naoConformidade && r.naoConformidade.trim() !== "") ||
            (r.acaoCorretiva && r.acaoCorretiva.trim() !== "")
        );

        if (planosDeAcao.length > 0) {
            worksheet.addRow([]);
            const pacTitle = worksheet.addRow(["PLANO DE AÇÃO CORRETIVA (Não Conformidades)"]);
            worksheet.mergeCells(pacTitle.number, 1, pacTitle.number, maxCol);
            pacTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
            pacTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
            pacTitle.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
            pacTitle.height = 30;

            const pacHeaders = worksheet.addRow(["Produto", "Não Conformidade Identificada", "", "Ação Corretiva Proposta", "", "", ""]);
            worksheet.mergeCells(pacHeaders.number, 2, pacHeaders.number, 3);
            worksheet.mergeCells(pacHeaders.number, 4, pacHeaders.number, 7);

            pacHeaders.eachCell((cell) => {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
                cell.font = { bold: true, color: { argb: "FF991B1B" } };
                cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
                cell.alignment = { horizontal: "center", vertical: "middle" };
            });

            for (const action of planosDeAcao) {
                const pacRow = worksheet.addRow([
                    action.produto || "",
                    action.naoConformidade || "", "",
                    action.acaoCorretiva || "", "", "", ""
                ]);
                worksheet.mergeCells(pacRow.number, 2, pacRow.number, 3);
                worksheet.mergeCells(pacRow.number, 4, pacRow.number, 7);
                applyRowStyle(pacRow, false);

                pacRow.getCell(1).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
                pacRow.getCell(2).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
                pacRow.getCell(4).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
            }
        }
    } else if (activeTab === "residuos") {
        const excecoesColetadas: { periodo: string, dia: string, motivo: string }[] = [];

        for (const residuo of residuosLogs) {

            let tercaVal = "—";
            if (residuo.terca === "SIM") {
                tercaVal = "SIM";
            } else if (residuo.terca && residuo.terca.trim() !== "") {
                tercaVal = "NÃO";
                excecoesColetadas.push({ periodo: residuo.dataPeriodo || "", dia: "Terça", motivo: residuo.terca });
            }

            let sextaVal = "—";
            if (residuo.sexta === "SIM") {
                sextaVal = "SIM";
            } else if (residuo.sexta && residuo.sexta.trim() !== "") {
                sextaVal = "NÃO";
                excecoesColetadas.push({ periodo: residuo.dataPeriodo || "", dia: "Sexta", motivo: residuo.sexta });
            }

            const dataRow = worksheet.addRow([
                residuo.dataPeriodo || "",
                tercaVal,
                sextaVal,
                formatName(residuo.responsavelRecolhimento),
                formatName(residuo.monitorResponsavel)
            ]);
            applyRowStyle(dataRow, true);

            dataRow.getCell(4).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
            dataRow.getCell(5).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

            await addTableSignature(residuo.responsavelRecolhimento, dataRow.number, 4);
            await addTableSignature(residuo.monitorResponsavel, dataRow.number, 5);
        }

        if (excecoesColetadas.length > 0) {
            worksheet.addRow([]);

            const excTitle = worksheet.addRow(["REGISTRO DE EXCEÇÕES E FERIADOS"]);
            worksheet.mergeCells(excTitle.number, 1, excTitle.number, maxCol);
            excTitle.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
            excTitle.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
            excTitle.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
            excTitle.height = 30;

            const excHeaders = worksheet.addRow(["Data Período", "Dia da Semana", "Motivo da Exceção (Observação)", "", ""]);
            worksheet.mergeCells(excHeaders.number, 3, excHeaders.number, 5);
            excHeaders.eachCell((cell) => {
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
                cell.font = { bold: true, color: { argb: "FF991B1B" } };
                cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
                cell.alignment = { horizontal: "center", vertical: "middle" };
            });

            for (const exc of excecoesColetadas) {
                const excRow = worksheet.addRow([
                    exc.periodo,
                    exc.dia,
                    exc.motivo, "", ""
                ]);
                worksheet.mergeCells(excRow.number, 3, excRow.number, 5);

                excRow.eachCell((cell, colNumber) => {
                    cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
                    cell.alignment = {
                        horizontal: colNumber === 3 ? "left" : "center",
                        vertical: "middle",
                        wrapText: true
                    };
                });
            }
        }
    }

    worksheet.addRow([]);

    const legendasMap: Record<string, string[]> = {
        vidros: LEGENDA_VIDROS,
        pragas: LEGENDA_PRAGAS,
        inusuais: LEGENDA_INUSUAIS,
        rejeitos: LEGENDA_REJEITOS,
        residuos: LEGENDA_RESIDUOS
    };

    const legendaSelecionada = legendasMap[activeTab] || [];

    if ((activeTab as string) === "inusuais") {
        const inusuaisTitulo = legendaSelecionada[0] || "Exemplos de ocorrências para registro:";
        const inusuaisTitleRow = worksheet.addRow([inusuaisTitulo]);
        worksheet.mergeCells(inusuaisTitleRow.number, 1, inusuaisTitleRow.number, maxCol);
        inusuaisTitleRow.getCell(1).font = { bold: true, color: { argb: "FF1F2937" }, size: 10 };
        legendaSelecionada.slice(1).forEach((texto) => {
            const legRow = worksheet.addRow([texto]);
            worksheet.mergeCells(legRow.number, 1, legRow.number, maxCol);
            legRow.getCell(1).font = { size: 9, color: { argb: "FF1F2937" } };
        });
    } else {
        const legendTitle = worksheet.addRow(["LEGENDA E OBSERVAÇÕES"]);
        worksheet.mergeCells(legendTitle.number, 1, legendTitle.number, maxCol);
        legendTitle.getCell(1).font = { bold: true, color: { argb: "FF1F2937" }, size: 10 };
        legendaSelecionada.forEach((texto) => {
            const legRow = worksheet.addRow([texto]);
            worksheet.mergeCells(legRow.number, 1, legRow.number, maxCol);
            legRow.getCell(1).font = { size: 9, color: { argb: "FF1F2937" } };
        });
    }

    worksheet.addRow([]);
    const revTitleRow = worksheet.addRow(["CONTROLE DE REVISÃO DO DOCUMENTO"]);
    worksheet.mergeCells(revTitleRow.number, 1, revTitleRow.number, maxCol);
    revTitleRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };

    const reviewInfo = [
        ["Aprovado/Revisador:", "Clebitania Carvalho"],
        ["Data da última revisão:", "02/01/2026"],
        ["Código do documento:", "PHU-035"]
    ];

    reviewInfo.forEach(([label, value]) => {
        const row = worksheet.addRow([label, value]);
        worksheet.mergeCells(row.number, 2, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 9 };
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
};