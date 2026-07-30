/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
"use client";

import * as ExcelJS from "exceljs";
import { TabType, EstoqueLog, DIAS_SEMANA, LEGENDA_ESTOQUE, LEGENDA_OCULOS, LEGENDA_TESOURAS, LEGENDA_LIMPEZA } from "../model/estoqueModel";

// --- HELPERS GERAIS ---
const formatName = (str: string) => {
    if (!str) return "";
    if (str.startsWith("data:image")) return "[ASSINATURA DIGITAL]";
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

const applyHeaderStyle = (cell: ExcelJS.Cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
};

const applyDataStyle = (cell: ExcelJS.Cell, isCenter = true, wrap = true) => {
    cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
    cell.alignment = { horizontal: isCenter ? "center" : "left", vertical: "middle", wrapText: wrap };
};

const applyStatusColor = (cell: ExcelJS.Cell) => {
    if (cell.value === "SIM") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } };
        cell.font = { bold: true, color: { argb: "FF137333" } };
    } else if (cell.value === "NÃO") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } };
        cell.font = { bold: true, color: { argb: "FFC5221F" } };
    } else if (cell.value === "F") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        cell.font = { bold: true, color: { argb: "FFB91C1C" } };
    }
};

interface ExportEstoqueParams {
    activeTab: TabType;
    estoqueLogs: EstoqueLog[];
    tesourasLogs: any[];
    oculosLogs: any[];
    cleaningLogs?: any[];
    dataInicio: string;
    dataFim: string;
    frequenciaTesoura: string;
    colaboradoresOculos: any[];
    statusMap?: Record<string, any>;
    observacaoGeral?: string;
}

export const exportEstoqueToExcel = async ({
    activeTab,
    estoqueLogs,
    tesourasLogs,
    oculosLogs,
    cleaningLogs = [],
    dataInicio,
    dataFim,
    frequenciaTesoura,
    colaboradoresOculos,
    statusMap = {},
    observacaoGeral = ""
}: ExportEstoqueParams) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
        activeTab === "estoque" ? "Estoque" :
            activeTab === "tesouras" ? "Tesouras" :
                activeTab === "limpeza" ? "Limpeza" : "Óculos"
    );
    const baseUrl = window.location.origin;

    // --- 1. CONFIGURAÇÃO DE PÁGINA E COLUNAS ---
    const isTesouras = activeTab === "tesouras";
    const isLimpeza = activeTab === "limpeza";
    worksheet.pageSetup = {
        paperSize: 9,
        orientation: (isTesouras || isLimpeza) ? "landscape" : "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    let title = "", codigoDoc = "", headers: string[] = [], metaExtra: string[] = [];
    let colWidths: number[] = [];

    if (activeTab === "estoque") {
        title = "CONTROLE DE ESTOQUE - MATERIAL DE LIMPEZA"; codigoDoc = "PHU-029";
        // 🟢 Saldo realocado para antes do Setor
        headers = ["Data", "Produto", "Entrada", "Saída", "Saldo", "Setor", "Quem Pegou", "Responsável"];
        colWidths = [14, 24, 14, 14, 14, 18, 40, 40];
    } else if (activeTab === "tesouras") {
        title = "ENTREGA E DEVOLUÇÃO DE TESOURAS"; codigoDoc = "PHU-043";
        headers = ["Contrato", "Funcionário", "Nº Tesoura", ...DIAS_SEMANA, "Observação"];
        metaExtra = [`Data início: ${formatSafeDate(dataInicio) || "-"}`, `Data fim: ${formatSafeDate(dataFim) || "-"}`, `Frequência: ${frequenciaTesoura || "-"}`];
        colWidths = [16, 50, 12, ...DIAS_SEMANA.map(() => 10), 60];
    } else if (activeTab === "limpeza") {
        title = "RECEBIMENTO DE MATERIAL DE LIMPEZA"; codigoDoc = "PHU-036";
        headers = ["Data", "Produto", "Produto Correto", "Composição OK", "Embalagem OK", "Padrão Exigido", "Cumpre Pedido", "Responsável"];
        colWidths = [18, 30, 16, 16, 16, 16, 16, 35];
        metaExtra = [`Produto: ${cleaningLogs[0]?.product || "Todos"}`];
    } else {
        title = "CONTROLE DE ÓCULOS"; codigoDoc = "PHU-027";
        metaExtra = [`Data início: ${formatSafeDate(dataInicio) || "-"}`, `Data fim: ${formatSafeDate(dataFim) || "-"}`];
        const hasObservacao = (oculosLogs || []).some(log => Object.values(log.incidentes || {}).some((inc: any) => inc?.observacao?.trim() !== ""));
        const hasStatusObs = statusMap && Object.values(statusMap).some((item: any) =>
            item.obsList && item.obsList.some((obs: any) => obs.texto && obs.texto.trim() !== "")
        );

        const baseHeaders = ["Colaborador", ...DIAS_SEMANA];
        if (hasObservacao) baseHeaders.push("Observação e Ação Corretiva");
        if (hasStatusObs) baseHeaders.push("Registros de Observação");
        baseHeaders.push("Assinatura");
        headers = baseHeaders;
        colWidths = [40, ...DIAS_SEMANA.map(() => 10)];
        if (hasObservacao) colWidths.push(40);
        if (hasStatusObs) colWidths.push(40);
        colWidths.push(45);
    }

    const maxCol = headers.length;
    colWidths.forEach((width, idx) => worksheet.getColumn(idx + 1).width = width);

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

    // 🟢 Linha da Data de Exportação Removida
    const metadataRows = [...metaExtra];

    metadataRows.forEach(meta => {
        const row = worksheet.addRow([meta]);
        worksheet.mergeCells(row.number, 1, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    });

    if (activeTab === "oculos") {
        worksheet.addRow([]);
        const subtitleRow = worksheet.addRow(["Estado dos óculos – verificação diária"]);
        worksheet.mergeCells(subtitleRow.number, 1, subtitleRow.number, maxCol);
        subtitleRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1E3A8A" } };
        subtitleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    }

    worksheet.addRow([]);

    // --- 4. CABEÇALHO DA TABELA ---
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 24;
    headerRow.eachCell(applyHeaderStyle);

    // --- FUNÇÃO DE ASSINATURA CORRIGIDA ---
    const addTableSignature = async (val: string | null, rNum: number, cNum: number, cell: ExcelJS.Cell, rowHeight: number = 65) => {
        if (!val) return;
        const imgFile = val.startsWith("data:image") ? { base64: val.split(",")[1], ext: "png" } : await fetchSignatureImage(val);
        const nomeFormatado = formatName(val);

        cell.value = `\n\n${nomeFormatado}`;

        const nameLength = nomeFormatado.length;
        const fontSize = nameLength > 30 ? 7 : (nameLength > 20 ? 8 : 9);

        cell.font = { size: fontSize, bold: true, color: { argb: "FF003366" } };
        cell.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

        if (imgFile) {
            const imgWidth = 120;
            const imgHeight = 35;
            worksheet.addImage(workbook.addImage(val.startsWith("data:image") ? { base64: (imgFile as any).base64, extension: "png" } : { buffer: (imgFile as any).buffer, extension: (imgFile as any).ext }), {
                tl: { col: cNum - 1 + 0.15, row: rNum - 1 + 0.08 },
                ext: { width: imgWidth, height: imgHeight },
                editAs: "oneCell"
            });
        }
    };

    // --- 5. PREENCHIMENTO DOS DADOS ---
    if (activeTab === "estoque") {
        // 🔥 Filtra apenas se houve Entrada ou Saída preenchida
        const filled = estoqueLogs.filter(log => {
            const hasProduct = !!log.product?.trim();
            const hasEntry = !!log.entry && String(log.entry).trim() !== "" && String(log.entry).trim() !== "0";
            const hasExit = !!log.exit && String(log.exit).trim() !== "" && String(log.exit).trim() !== "0";
            return hasProduct && (hasEntry || hasExit);
        });

        for (const log of filled) {
            // 🟢 Dados preenchidos de acordo com a nova ordem: Data, Produto, Entrada, Saída, Saldo, Setor, QuemPegou, Responsável
            const row = worksheet.addRow([
                formatSafeDate(log.date),
                log.product || "",
                log.entry ? `${log.entry} ${log.entryUnit || ""}`.trim() : "",
                log.exit ? `${log.exit} ${log.exitUnit || ""}`.trim() : "",
                log.balance ?? "", // Saldo agora na coluna 5
                log.sector || "",  // Setor agora na coluna 6
                "",                // Quem Pegou (col 7)
                ""                 // Responsável (col 8)
            ]);

            row.height = 65;
            row.eachCell((c, i) => {
                // Ajustados os índices das colunas de acordo com a nova ordem: 
                // Col 7 (Quem Pegou) e Col 8 (Responsável)
                if (i === 7 || i === 8) {
                    applyDataStyle(c, false, true);
                } else {
                    // Col 2 (Produto) e Col 6 (Setor) não são centralizados (isCenter = false)
                    applyDataStyle(c, i !== 2 && i !== 6, true);
                }
            });
            // 🟢 Ajustados os índices das assinaturas para as colunas 7 e 8
            await addTableSignature(log.whoTook, row.number, 7, row.getCell(7), 65);
            await addTableSignature(log.responsible, row.number, 8, row.getCell(8), 65);
        }
    } else if (activeTab === "tesouras") {
        let currentStatusMap = statusMap || {};
        if (Object.keys(currentStatusMap).length === 0 && typeof window !== "undefined") {
            const saved = localStorage.getItem('status_tesouras');
            if (saved) {
                try { currentStatusMap = JSON.parse(saved); } catch (e) { }
            }
        }

        const ordemTipo: Record<string, number> = { 'EFETIVO': 1, 'CONTRATADO': 2, 'DESLIGADO': 3, 'DESLIGADA': 3 };

        const registrosOrdenados = [...tesourasLogs]
            .filter(row => {
                if (row.visivel === false) return false;
                if (!row.funcionario?.trim()) return false;

                const localStatus = currentStatusMap[row.id];
                const status = localStatus?.status || 'NORMAL';

                const hasMarks = DIAS_SEMANA.some(dia => {
                    const diaObj = row.dias?.[dia];
                    return diaObj?.e || diaObj?.d || diaObj?.f;
                });

                return status === 'NORMAL' || hasMarks;
            })
            .sort((a, b) => {
                const tipoA = ordemTipo[a.tipo] || 4;
                const tipoB = ordemTipo[b.tipo] || 4;
                if (tipoA !== tipoB) return tipoA - tipoB;
                return (a.funcionario || "").localeCompare(b.funcionario || "");
            });

        registrosOrdenados.forEach(row => {
            const isDevolvida = row.statusTesoura === 'DEVOLVIDA' || row.tipo === 'DESLIGADO' || row.tipo === 'DESLIGADA';
            const numeroExibido = isDevolvida ? "DEVOLVIDA" : row.numeroTesoura;

            const rowData = [row.tipo, row.funcionario, numeroExibido];

            DIAS_SEMANA.forEach(dia => {
                const diaObj = row.dias?.[dia];
                if (diaObj?.f) {
                    rowData.push("F");
                } else {
                    const e = diaObj?.e ? "E" : "";
                    const d = diaObj?.d ? "D" : "";
                    const valorDia = [e, d].filter(Boolean).join("/");
                    rowData.push(valorDia || "-");
                }
            });

            const localStatus = currentStatusMap[row.id];
            let valorFinal = "-";

            if (localStatus) {
                let obsList = localStatus.obsList || [];
                if (obsList.length === 0 && localStatus.obs && localStatus.obs.trim() !== '') {
                    obsList = [{ texto: localStatus.obs }];
                }
                const textos = obsList
                    .map((o: any) => o.texto?.trim())
                    .filter((t: string) => t && t !== '');
                if (textos.length > 0) {
                    valorFinal = textos.join(" | ");
                }
            }

            rowData.push(valorFinal);

            const dataRow = worksheet.addRow(rowData);
            dataRow.height = 30;
            dataRow.eachCell((c, i) => {
                if (i === 2) {
                    applyDataStyle(c, false, false);
                } else {
                    applyDataStyle(c, i !== 1 && i !== 2, true);
                }
                applyStatusColor(c);
            });

            const contratoCell = dataRow.getCell(1);
            const isDesligado = row.tipo === 'DESLIGADO' || row.tipo === 'DESLIGADA';

            if (row.tipo === 'EFETIVO') {
                contratoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
                contratoCell.font = { bold: true, color: { argb: "FF166534" } };
            } else if (row.tipo === 'CONTRATADO') {
                contratoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
                contratoCell.font = { bold: true, color: { argb: "FF854D0E" } };
            } else if (isDesligado) {
                dataRow.eachCell(cell => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
                });
                contratoCell.font = { bold: true, color: { argb: "FF4B5563" } };
            }
        });

        if (observacaoGeral && observacaoGeral.trim() !== "") {
            worksheet.addRow([]);
            worksheet.addRow([]);
            const obsTitleRow = worksheet.addRow(["OBSERVAÇÕES GERAIS DA SEMANA"]);
            worksheet.mergeCells(obsTitleRow.number, 1, obsTitleRow.number, maxCol);
            obsTitleRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1E3A8A" } };
            obsTitleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
            obsTitleRow.height = 20;

            const obsContentRow = worksheet.addRow([observacaoGeral]);
            worksheet.mergeCells(obsContentRow.number, 1, obsContentRow.number, maxCol);
            obsContentRow.getCell(1).font = { size: 10, color: { argb: "FF333333" } };
            obsContentRow.getCell(1).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
            const linhas = observacaoGeral.split('\n').length;
            obsContentRow.height = 30 + 15 * (linhas - 1) || 30;
        }

    } else if (activeTab === "limpeza") {
        // 🔥 Filtra apenas se houver preenchimento real nos status da inspeção
        const filled = cleaningLogs.filter((log: any) => {
            const hasProduct = !!log.product?.trim();
            const hasChecks = !!log.produtoCorreto || !!log.composicaoOk || !!log.embalagemOk || !!log.padraoExigido || !!log.cumprePedido;
            return hasProduct && hasChecks;
        });

        for (const log of filled) {
            const row = worksheet.addRow([
                log.date ? log.date.split('-').reverse().join('/') : "",
                log.product || "",
                log.produtoCorreto ? log.produtoCorreto.toUpperCase() : "",
                log.composicaoOk ? log.composicaoOk.toUpperCase() : "",
                log.embalagemOk ? log.embalagemOk.toUpperCase() : "",
                log.padraoExigido ? log.padraoExigido.toUpperCase() : "",
                log.cumprePedido ? log.cumprePedido.toUpperCase() : "",
                ""
            ]);
            row.height = 65;
            row.eachCell((c, i) => {
                applyDataStyle(c, i !== 2 && i !== 8, true);
                if (i >= 3 && i <= 7) {
                    applyStatusColor(c);
                }
            });
            await addTableSignature(log.responsavel, row.number, 8, row.getCell(8), 65);
        }
    } else {
        // ABA ÓCULOS
        const colaboradoresParaExportar = (colaboradoresOculos || []).filter(c => {
            const status = statusMap?.[c.id]?.status || 'NORMAL';
            const log = (oculosLogs || []).find(l => String(l.colaboradorId) === String(c.id));
            const hasMarks = log ? ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"].some(dia => log.dias?.[dia] !== null && log.dias?.[dia] !== undefined && log.dias?.[dia] !== "") : false;

            return status === 'NORMAL' || hasMarks;
        });

        const colaboradoresMap = new Map(colaboradoresParaExportar.map(c => [c.id, { nome: c.nome, status: c.status }]));

        const hasObservacao = (oculosLogs || []).some(log => Object.values(log.incidentes || {}).some((inc: any) => inc?.observacao?.trim() !== ""));
        const hasStatusObs = colaboradoresParaExportar.some(c => {
            const item = statusMap?.[c.id];
            return item?.obsList?.some((obs: any) => obs.texto && obs.texto.trim() !== "");
        });
        const colaboradoresOrdenados = [...colaboradoresMap.keys()].sort((a, b) => {
            const infoA = colaboradoresMap.get(a)!;
            const infoB = colaboradoresMap.get(b)!;
            if (infoA.status === "INATIVO" && infoB.status !== "INATIVO") return 1;
            if (infoA.status !== "INATIVO" && infoB.status === "INATIVO") return -1;
            return infoA.nome.localeCompare(infoB.nome);
        });

        for (const colabId of colaboradoresOrdenados) {
            const info = colaboradoresMap.get(colabId)!;
            const log = (oculosLogs || []).find(l => String(l.colaboradorId) === String(colabId));
            const rowData: any[] = [info.nome];

            for (const dia of DIAS_SEMANA) {
                const status = log?.dias?.[dia];
                if (status === "F") {
                    rowData.push("F");
                } else {
                    rowData.push(status === true ? "SIM" : status === false ? "NÃO" : "");
                }
            }

            if (hasObservacao) {
                rowData.push(DIAS_SEMANA.filter(dia => log?.incidentes?.[dia]?.observacao?.trim()).map(dia => `${dia}: ${log!.incidentes![dia].observacao}`).join("; "));
            }

            if (hasStatusObs) {
                const statusData = statusMap?.[colabId];
                let obsText = "";
                if (statusData?.obsList) {
                    const textos = statusData.obsList
                        .map((o: any) => o.texto?.trim())
                        .filter((t: string) => t && t !== '');
                    if (textos.length > 0) {
                        obsText = textos.join(" | ");
                    }
                }
                rowData.push(obsText);
            }

            rowData.push(log?.assinaturaSemanal || "");

            const row = worksheet.addRow(rowData);
            row.height = 65;

            const assinaturaColIndex = rowData.length;
            const nomeColIndex = 1;

            row.eachCell((cell, colIndex) => {
                const isNameCol = colIndex === nomeColIndex;
                const isAssinaturaCol = colIndex === assinaturaColIndex;
                if (isNameCol || isAssinaturaCol) {
                    applyDataStyle(cell, false, true);
                } else {
                    applyDataStyle(cell, colIndex !== 1, true);
                }

                applyStatusColor(cell);

                if (info.status === "INATIVO") {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
                    cell.font = { ...cell.font, color: { argb: "FF6B7280" } };
                }
            });

            if (log?.assinaturaSemanal) {
                await addTableSignature(log.assinaturaSemanal, row.number, assinaturaColIndex, row.getCell(assinaturaColIndex), 65);
            }
        }

        if (observacaoGeral && observacaoGeral.trim() !== "") {
            worksheet.addRow([]);
            worksheet.addRow([]);
            const obsTitleRow = worksheet.addRow(["OBSERVAÇÕES GERAIS DA SEMANA"]);
            worksheet.mergeCells(obsTitleRow.number, 1, obsTitleRow.number, maxCol);
            obsTitleRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1E3A8A" } };
            obsTitleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
            obsTitleRow.height = 20;

            const obsContentRow = worksheet.addRow([observacaoGeral]);
            worksheet.mergeCells(obsContentRow.number, 1, obsContentRow.number, maxCol);
            obsContentRow.getCell(1).font = { size: 10, color: { argb: "FF333333" } };
            obsContentRow.getCell(1).alignment = { horizontal: "left", vertical: "middle", wrapText: true };
            const linhas = observacaoGeral.split('\n').length;
            obsContentRow.height = 30 + 15 * (linhas - 1) || 30;
        }
    }

    // --- 6. LEGENDA ---
    worksheet.addRow([]);
    const legendTitleRow = worksheet.addRow(["LEGENDA"]);
    worksheet.mergeCells(legendTitleRow.number, 1, legendTitleRow.number, maxCol);
    legendTitleRow.getCell(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    legendTitleRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
    legendTitleRow.height = 24;
    legendTitleRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };

    let legendLines: string[] = [];
    if (activeTab === "estoque") legendLines = LEGENDA_ESTOQUE;
    else if (activeTab === "tesouras") legendLines = [...LEGENDA_TESOURAS, "F: Falta no dia"];
    else if (activeTab === "limpeza") legendLines = LEGENDA_LIMPEZA;
    else {
        legendLines = [...LEGENDA_OCULOS, "Fundo cinza: Colaborador desligado (não está mais trabalhando na empresa).", "F: Falta no dia"];
    }

    legendLines.forEach(line => {
        const row = worksheet.addRow([line]);
        worksheet.mergeCells(row.number, 1, row.number, maxCol);
        row.getCell(1).font = { size: 9 };
        row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        row.height = 18;
    });

    // --- 7. CONTROLE DE REVISÃO DO DOCUMENTO ---
    worksheet.addRow([]);
    const revTitleRow = worksheet.addRow(["CONTROLE DE REVISÃO DO DOCUMENTO"]);
    worksheet.mergeCells(revTitleRow.number, 1, revTitleRow.number, maxCol);
    revTitleRow.getCell(1).font = { bold: true, size: 10, color: { argb: "FF1F2937" } };
    revTitleRow.height = 18;

    [["Aprovação / Revisado por:", "Clebitânia Carvalho"], ["Data da Última Revisão:", "02/01/2026"], ["Código do Documento:", codigoDoc]].forEach(([label, value]) => {
        const row = worksheet.addRow([label, value]);
        worksheet.mergeCells(row.number, 2, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 9, color: { argb: "FF374151" } };
        row.getCell(2).font = { size: 9, color: { argb: "FF1F2937" } };
        row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
        row.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
        row.height = 16;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    if (activeTab === "tesouras" && typeof window !== "undefined") {
        localStorage.removeItem('status_tesouras');
        window.dispatchEvent(new Event('limpar_status_tesouras'));
    }

    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};