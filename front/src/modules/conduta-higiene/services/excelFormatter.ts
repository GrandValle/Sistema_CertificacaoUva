"use client";

import * as ExcelJS from "exceljs";
// 🔥 Importamos o isInverseQuestion aqui
import { ChecklistRow, ActionPlan, LavagemLog, QUESTIONS, DAYS, generateWeekDays, CondutaTabType, buildInspecaoGeralLegend, isInverseQuestion } from "../model/condutaModel";

type ObservacoesPorDia = Record<string, string>;

// --- HELPERS GERAIS ---
const formatName = (str: string) => (!str ? "" : str.startsWith("data:image") ? "ASSINADO DIGITALMENTE" : str.replace(/_/g, " ").toUpperCase());

const formatSafeDate = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("-")) {
        const [year, month, day] = dateStr.split("-");
        return `${day}/${month}/${year}`;
    }
    return dateStr;
};

const fetchSignatureImage = async (baseName: string) => {
    const originalName = baseName.replace(/_/g, " ");
    const baseUrl = window.location.origin;

    const encoded = encodeURIComponent(originalName);
    const withoutAccents = originalName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");

    const tentativas = [
        `${encoded}.png`,
        `${encoded}.jpg`,
        `${encodeURIComponent(withoutAccents)}.png`,
        `${encodeURIComponent(withoutAccents)}.jpg`,
        `${encodeURIComponent(originalName.toUpperCase())}.png`,
    ];

    for (const fileName of tentativas) {
        try {
            const res = await fetch(`${baseUrl}/assinaturas/${fileName}`);
            if (res.ok) {
                const blob = await res.blob();
                const buffer = await blob.arrayBuffer();
                const ext = fileName.endsWith('.jpg') ? 'jpeg' : 'png';
                return { buffer, ext };
            }
        } catch (e) { /* ignora */ }
    }
    return null;
};

// --- HELPERS DE ESTILO BASE ---
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

// --- REFATORAÇÃO: LÓGICA DE ESTILOS CONDICIONAIS ---
type CellStyle = {
    fill?: ExcelJS.Fill;
    font?: Partial<ExcelJS.Font>;
    alignment?: Partial<ExcelJS.Alignment>;
};

const getCellStyle = (
    cell: ExcelJS.Cell,
    columnIndex: number,
    colabInfo: any,
    obsRowText: string,
    isNameColumn: boolean,
    isObsColumn: boolean
): CellStyle => {
    const isDesligado = colabInfo?.ativo === false;
    const isEfetivo = colabInfo?.tipo?.toUpperCase() === "EFETIVO";
    const isContratado = colabInfo?.tipo?.toUpperCase() === "CONTRATADO";
    const value = cell.value;

    // 1. Coluna do Nome (primeira coluna)
    if (isNameColumn) {
        if (isDesligado) {
            return {
                fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } },
                font: { bold: true, color: { argb: "FF9CA3AF" }, strike: true }
            };
        }
        if (isEfetivo) {
            return {
                fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } },
                font: { bold: true, color: { argb: "FF065F46" } }
            };
        }
        if (isContratado) {
            return {
                fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FEF3C7" } },
                font: { bold: true, color: { argb: "FF92400E" } }
            };
        }
        return {};
    }

    // 2. Coluna de Observação (última coluna)
    if (isObsColumn && obsRowText) {
        return {
            font: { italic: true, color: { argb: "FF4B5563" }, size: 9 }
        };
    }

    // 3. Demais colunas (manhã/tarde)
    if (isDesligado) {
        return {
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } },
            font: { color: { argb: "FF9CA3AF" } }
        };
    }

    if (value === "SIM") {
        return {
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } },
            font: { bold: true, color: { argb: "FF137333" } }
        };
    }

    if (value === "NÃO") {
        return {
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } },
            font: { bold: true, color: { argb: "FFC5221F" } }
        };
    }

    if (value === "FALTA") {
        return {
            fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } },
            font: { bold: true, color: { argb: "FFFFFFFF" } }
        };
    }

    return {};
};

// --- UTILITÁRIOS DE PERÍODO ---
const extrairPeriodoSemana = (weekString: string): string => {
    const weekDays = generateWeekDays(weekString);
    if (weekDays.length === 0) return weekString;
    const primeiro = weekDays[0].label.match(/\((\d{2}\/\d{2})\)/)?.[1];
    const ultimo = weekDays[weekDays.length - 1].label.match(/\((\d{2}\/\d{2})\)/)?.[1];
    if (!primeiro || !ultimo) return weekString;
    const anoMatch = weekString.match(/\d{4}/);
    const ano = anoMatch ? anoMatch[0] : new Date().getFullYear().toString();
    return `${primeiro} a ${ultimo}/${ano}`;
};

const formatShiftLabel = (hora?: string) => {
    if (!hora) return "";
    const [hh, mm] = hora.split(":");
    if (!hh) return "";
    return mm && mm !== "00" ? `${hh}:${mm}` : `${hh}h`;
};

// --- INTERFACE PRINCIPAL ---
export interface ExportCondutaParams {
    activeTab: CondutaTabType;
    week: string;
    signatures: { coordinator: string | null };
    checklist: ChecklistRow[];
    actions: ActionPlan[];
    lavagemLogs: LavagemLog[];
    lavagemHorarios?: Record<string, { manha: string; tarde: string }>;
    colaboradores: any[];
    observacoes: ObservacoesPorDia;
    statusMapLavagem?: Record<string, any>;
    observacaoGeralLavagem?: string;
}

// --- FUNÇÃO PRINCIPAL DE EXPORTAÇÃO ---
export const exportCondutaToExcel = async ({
    activeTab,
    week,
    signatures,
    checklist,
    actions,
    lavagemLogs,
    lavagemHorarios,
    colaboradores,
    observacoes,
    statusMapLavagem,
    observacaoGeralLavagem
}: ExportCondutaParams): Promise<Blob> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(activeTab === "inspecao" ? "Conduta e Saúde" : "Lavagem de Mãos");
    const baseUrl = window.location.origin;

    const weekDays = generateWeekDays(week);
    const maxCol = activeTab === "inspecao"
        ? 2 + DAYS.length
        : 1 + (weekDays.length * 2) + 1;

    worksheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } };

    if (activeTab === "inspecao") {
        worksheet.getColumn(1).width = 14;
        worksheet.getColumn(2).width = 85;
        for (let i = 3; i <= 2 + DAYS.length; i++) worksheet.getColumn(i).width = 14;
    } else {
        worksheet.getColumn(1).width = 45;
        let cIdx = 2;
        weekDays.forEach(() => {
            worksheet.getColumn(cIdx).width = 12;
            worksheet.getColumn(cIdx + 1).width = 12;
            cIdx += 2;
        });
        worksheet.getColumn(cIdx).width = 35;
    }

    worksheet.addRow([]).height = 70;
    try {
        const logoRes = await fetch(`${baseUrl}/logo.png`);
        if (logoRes.ok) {
            worksheet.addImage(
                workbook.addImage({ buffer: await logoRes.arrayBuffer(), extension: 'png' }),
                { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 60 }, editAs: 'oneCell' }
            );
        }
    } catch (e) { /* ignora */ }

    worksheet.addRow([]);

    const periodo = extrairPeriodoSemana(week);

    // 🔥 CORREÇÃO: Removendo o Código e Data de Exportação
    const titleConfig = activeTab === "inspecao"
        ? { title: "MONITORAMENTO DE CONDUTA E SAÚDE", meta: ["Área: Packing Manga", `Período da semana: ${periodo}`] }
        : {
            title: "MONITORAMENTO DE LAVAGEM DE MÃOS",
            meta: [
                `Local: Packing House`,
                `Período: ${periodo}`
            ]
        };

    const titleRow = worksheet.addRow([titleConfig.title]);
    worksheet.mergeCells(titleRow.number, 1, titleRow.number, maxCol);
    titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: "FF000080" } };

    titleConfig.meta.forEach(meta => {
        const row = worksheet.addRow([meta]);
        worksheet.mergeCells(row.number, 1, row.number, maxCol);
        row.getCell(1).font = { bold: true, size: 10, color: { argb: "FF4B5563" } };
    });
    worksheet.addRow([]);

    const addTableSignature = async (val: string | null, rNum: number, cNum: number, w = 130, h = 35, offX = 0.02) => {
        if (!val) return;
        const imgFile = val.startsWith("data:image") ? { base64: val.split(",")[1], ext: "png" } : await fetchSignatureImage(val);
        if (imgFile) {
            const imgId = workbook.addImage(
                val.startsWith("data:image")
                    ? { base64: (imgFile as any).base64, extension: "png" }
                    : { buffer: (imgFile as any).buffer, extension: (imgFile as any).ext }
            );
            worksheet.addImage(imgId, { tl: { col: cNum - 1 + offX, row: rNum - 1 + 0.02 }, ext: { width: w, height: h }, editAs: "oneCell" });
        }
    };

    // ============================================================
    //  ABA DE INSPEÇÃO (CONDUTA E SAÚDE)
    // ============================================================
    if (activeTab === "inspecao") {
        const sigRow = worksheet.addRow(["Auxiliar de Segurança:", ""]);
        sigRow.height = 38;
        const nameRow = worksheet.addRow(["", formatName(signatures.coordinator || "")]);
        nameRow.height = 18;
        worksheet.mergeCells(sigRow.number, 1, nameRow.number, 1);
        sigRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1F2937" } };
        nameRow.getCell(2).font = { bold: true, size: 10, color: { argb: "FF004080" } };
        await addTableSignature(signatures.coordinator, sigRow.number, 2);
        worksheet.addRow([]);

        const headerRow = worksheet.addRow(["Inspeção - Itens Observados", "", ...DAYS]);
        worksheet.mergeCells(headerRow.number, 1, headerRow.number, 2);
        headerRow.eachCell(applyHeaderStyle);

        // --- Itens (perguntas) com Inteligência de Cores ---
        checklist.forEach((row, idx) => {
            const questionText = QUESTIONS[idx] || "";
            const isInverse = isInverseQuestion(questionText); // 🔥 Checa se é invertida

            const dataRow = worksheet.addRow([
                questionText,
                "",
                ...DAYS.map(day => (row as any)[day] === "ok" ? "SIM" : (row as any)[day] === "no" ? "NÃO" : "")
            ]);
            worksheet.mergeCells(dataRow.number, 1, dataRow.number, 2);
            dataRow.height = 52;

            dataRow.eachCell((cell, col) => {
                applyDataStyle(cell, col > 2);

                if (col > 2) {
                    if (cell.value === "SIM") {
                        if (isInverse) {
                            // SIM Invertido = Vermelho (Alerta)
                            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } };
                            cell.font = { bold: true, color: { argb: "FFC5221F" } };
                        } else {
                            // SIM Normal = Verde (Conforme)
                            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } };
                            cell.font = { bold: true, color: { argb: "FF137333" } };
                        }
                    } else if (cell.value === "NÃO") {
                        if (isInverse) {
                            // NÃO Invertido = Verde (Conforme, nenhum objeto/sintoma achado)
                            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } };
                            cell.font = { bold: true, color: { argb: "FF137333" } };
                        } else {
                            // NÃO Normal = Vermelho (Alerta)
                            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } };
                            cell.font = { bold: true, color: { argb: "FFC5221F" } };
                        }
                    }
                }
            });
        });

        // --- Plano de Ação Corretiva ---
        const filledActions = actions.filter(row =>
            !!String(row.date || "").trim() ||
            !!String(row.nonConformity || "").trim() ||
            !!String(row.action || "").trim()
        );

        if (filledActions.length > 0) {
            worksheet.addRow([]);
            worksheet.addRow([]);
            const paRow = worksheet.addRow(["PLANO DE AÇÃO CORRETIVA"]);
            paRow.eachCell(c => {
                c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };
                c.font = { bold: true, color: { argb: "FFFFFFFF" } };
                c.alignment = { horizontal: "center" };
            });
            worksheet.mergeCells(paRow.number, 1, paRow.number, maxCol);

            // 🔥 CORREÇÃO: Estendendo o Responsável/Assinatura até maxCol para não deixar buraco no final
            const aHeader = worksheet.addRow(["Data", "Não Conformidade", "Causa Raiz", "Ação Corretiva", "Responsável / Assinatura", "", "", ""]);
            worksheet.mergeCells(aHeader.number, 5, aHeader.number, maxCol);

            aHeader.eachCell(c => {
                applyHeaderStyle(c);
                c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B5563" } };
            });

            for (const row of filledActions) {
                const rawName = formatName(row.responsible || "______________________");
                const dataRow = worksheet.addRow([
                    formatSafeDate(row.date),
                    row.nonConformity || "",
                    row.rootCause || "",
                    row.action || "",
                    `\n\n\n${rawName}`,
                    "",
                    "",
                    ""
                ]);
                worksheet.mergeCells(dataRow.number, 5, dataRow.number, maxCol);
                dataRow.height = 75;
                dataRow.eachCell((c, i) => {
                    applyDataStyle(c, i === 1 || i >= 5);
                    if (i === 5) {
                        c.alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
                        c.font = { size: 9, bold: true, color: { argb: "FF004080" } };
                    }
                });
                await addTableSignature(row.responsible || null, dataRow.number, 5, 130, 42, 0.15);
            }
        }

        // --- Observações Gerais ---
        const obsText = Object.entries(observacoes || {})
            .filter(([_, text]) => text && text.trim() !== "")
            .map(([key, text]) => {
                if (key === "geral") return text;
                return `${key}: ${text}`;
            })
            .join("\n");

        if (obsText) {
            worksheet.addRow([]);
            worksheet.addRow(["OBSERVAÇÕES GERAIS"]).getCell(1).font = { bold: true, size: 11 };
            worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, maxCol);
            const row = worksheet.addRow([obsText]);
            worksheet.mergeCells(row.number, 1, row.number, maxCol);
            row.getCell(1).alignment = { wrapText: true, vertical: "top" };
            row.height = 20 + 15 * obsText.split("\n").length;
            applyDataStyle(row.getCell(1), false);
        }
    }
    // ============================================================
    //  ABA DE LAVAGEM DE MÃOS
    // ============================================================
    else {
        const rowDia = worksheet.addRow([]);
        const rowHora = worksheet.addRow([]);
        worksheet.mergeCells(rowDia.number, 1, rowHora.number, 1);
        worksheet.getCell(rowDia.number, 1).value = "Colaborador";

        let colIdx = 2;
        weekDays.forEach(day => {
            worksheet.mergeCells(rowDia.number, colIdx, rowDia.number, colIdx + 1);
            worksheet.getCell(rowDia.number, colIdx).value = day.label;
            const diaHorario = lavagemHorarios?.[day.short] || { manha: "09:00", tarde: "14:00" };
            worksheet.getCell(rowHora.number, colIdx).value = formatShiftLabel(diaHorario.manha);
            worksheet.getCell(rowHora.number, colIdx + 1).value = formatShiftLabel(diaHorario.tarde);
            colIdx += 2;
        });

        worksheet.mergeCells(rowDia.number, colIdx, rowHora.number, colIdx);
        worksheet.getCell(rowDia.number, colIdx).value = "Situação / Observação";

        [rowDia, rowHora].forEach(r => r.eachCell(applyHeaderStyle));

        lavagemLogs
            .filter(log => !!String(log.colaborador || "").trim() && !log.colaborador?.startsWith("-"))
            .forEach((log) => {
                const rowData = [log.colaborador || ""];
                weekDays.forEach(day => {
                    const m = log.dias?.[day.short]?.manha;
                    const t = log.dias?.[day.short]?.tarde;
                    rowData.push(m === "C" ? "SIM" : m === "NC" ? "NÃO" : m === "F" ? "FALTA" : "");
                    rowData.push(t === "C" ? "SIM" : t === "NC" ? "NÃO" : t === "F" ? "FALTA" : "");
                });

                const colabInfo = colaboradores.find(c => c.nome?.trim().toUpperCase() === log.colaborador?.trim().toUpperCase());
                let obsRowText = "";
                if (colabInfo && statusMapLavagem && statusMapLavagem[colabInfo.id]) {
                    const statData = statusMapLavagem[colabInfo.id];
                    const statusStr = statData?.status && statData.status !== 'NORMAL' ? statData.status : '';
                    const obsStr = statData?.obsList && statData.obsList.length > 0 ? statData.obsList[0].texto : '';
                    if (statusStr && obsStr) {
                        obsRowText = `${statusStr.toUpperCase()} - ${obsStr}`;
                    } else if (statusStr) {
                        obsRowText = statusStr.toUpperCase();
                    } else if (obsStr) {
                        obsRowText = obsStr;
                    }
                }
                rowData.push(obsRowText);

                const dataRow = worksheet.addRow(rowData);
                dataRow.height = 28;

                dataRow.eachCell((c, i) => {
                    const isNameColumn = i === 1;
                    const isObsColumn = i === colIdx;
                    applyDataStyle(c, i > 1 && i < colIdx);

                    const style = getCellStyle(c, i, colabInfo, obsRowText, isNameColumn, isObsColumn);
                    if (style.fill) c.fill = style.fill;
                    if (style.font) c.font = { ...c.font, ...style.font } as ExcelJS.Font;
                    if (style.alignment) c.alignment = { ...c.alignment, ...style.alignment };
                });
            });

        if (observacaoGeralLavagem && observacaoGeralLavagem.trim() !== "") {
            worksheet.addRow([]);
            worksheet.addRow(["OBSERVAÇÃO GERAL DA SEMANA"]).getCell(1).font = { bold: true, size: 11 };
            worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, maxCol);
            const row = worksheet.addRow([observacaoGeralLavagem]);
            worksheet.mergeCells(row.number, 1, row.number, maxCol);
            row.getCell(1).alignment = { wrapText: true, vertical: "top", horizontal: "left" };
            row.height = 20 + 15 * observacaoGeralLavagem.split("\n").length;
            applyDataStyle(row.getCell(1), false);
        }
    }

    // --- LEGENDA E RODAPÉ UNIFICADO ---
    worksheet.addRow([]);
    worksheet.addRow(["LEGENDA E DETALHES"]).getCell(1).font = { bold: true, size: 10 };
    worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, maxCol);

    if (activeTab === "inspecao") {
        const legendLines = buildInspecaoGeralLegend();
        legendLines.forEach(line => {
            const row = worksheet.addRow([line]);
            worksheet.mergeCells(row.number, 1, row.number, maxCol);
            row.getCell(1).font = { size: 9 };
            applyDataStyle(row.getCell(1), false);
            row.getCell(1).border = {};
        });

    } else {
        const comboRow = worksheet.addRow([""]);
        worksheet.mergeCells(comboRow.number, 1, comboRow.number, maxCol);
        comboRow.getCell(1).value = {
            richText: [
                { font: { bold: true, size: 8.5 }, text: "Legenda: " },
                { font: { size: 8.5 }, text: "SIM: Conforme | NÃO: Inadequado | " },
                { font: { bold: true, size: 8.5, color: { argb: "FFDC2626" } }, text: "FALTA: Ausente no turno\n" },
                { font: { bold: true, size: 8.5 }, text: "Tipos de Contrato (Cores): " },
                { font: { size: 8.5, color: { argb: "FF137333" } }, text: "Verde: Efetivo" },
                { font: { size: 8.5 }, text: " | " },
                { font: { size: 8.5, color: { argb: "FF92400E" } }, text: "Amarelo: Contratado" },
                { font: { size: 8.5 }, text: " | " },
                { font: { size: 8.5, color: { argb: "FF6B7280" } }, text: "Cinza Linha Inteira: Desligado na Semana\n" },
                { font: { bold: true, size: 8.5 }, text: "É Proibido: " },
                { font: { size: 8.5 }, text: "Fumar • Unhas grandes/esmaltes • Adornos (Anel, Relógio, Brincos) • Perfume • Sem touca • Uniforme sujo\n" },
                { font: { bold: true, size: 8.5 }, text: "Produtos: " },
                { font: { size: 8.5 }, text: "Sabão de mãos • Álcool gel 70% • Secador de mãos" }
            ]
        };
        applyDataStyle(comboRow.getCell(1), false);
        comboRow.height = 72;
    }

    worksheet.addRow([]);
    worksheet.addRow(["CONTROLE DE REVISÃO"]).getCell(1).font = { bold: true, size: 10 };
    [["Aprovado/Revisado:", "Clebitânia Carvalho"], ["Última Revisão:", "02/01/2026"], ["Código:", activeTab === "inspecao" ? "PHU-037" : "PHU-039"]].forEach(([l, v]) => {
        const r = worksheet.addRow([l, v]);
        worksheet.mergeCells(r.number, 2, r.number, maxCol);
        r.getCell(1).font = { bold: true, size: 9 };
        r.getCell(2).font = { size: 9 };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};