"use client";

import * as ExcelJS from "exceljs";
import { ChecklistRow, ActionPlan, LavagemLog, QUESTIONS, DAYS, generateWeekDays, CondutaTabType } from "../model/condutaModel";

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

interface ExportCondutaParams {
    activeTab: CondutaTabType;
    week: string;
    signatures: { coordinator: string | null };
    checklist: ChecklistRow[];
    actions: ActionPlan[];
    lavagemLogs: LavagemLog[];
    colaboradores: any[]; // 🔥 Adicionado a lista completa para mapear os status na exportação
}

export const exportCondutaToExcel = async ({
    activeTab,
    week,
    signatures,
    checklist,
    actions,
    lavagemLogs,
    colaboradores // 🔥 Recebido aqui para fazermos os cruzamentos de cores
}: ExportCondutaParams): Promise<Blob> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(activeTab === "inspecao" ? "Conduta e Saúde" : "Lavagem de Mãos");
    const baseUrl = window.location.origin;

    const weekDays = generateWeekDays(week);
    const maxCol = activeTab === "inspecao" ? 2 + DAYS.length : 1 + (weekDays.length * 2);

    worksheet.pageSetup = { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } };

    if (activeTab === "inspecao") {
        worksheet.getColumn(1).width = 14;
        worksheet.getColumn(2).width = 85;
        for (let i = 3; i <= 2 + DAYS.length; i++) worksheet.getColumn(i).width = 14;
    } else {
        worksheet.getColumn(1).width = 45;
        let cIdx = 2;
        weekDays.forEach(() => { worksheet.getColumn(cIdx).width = 12; worksheet.getColumn(cIdx + 1).width = 12; cIdx += 2; });
    }

    worksheet.addRow([]).height = 70;
    try {
        const logoRes = await fetch(`${baseUrl}/logo.png`);
        if (logoRes.ok) worksheet.addImage(workbook.addImage({ buffer: await logoRes.arrayBuffer(), extension: 'png' }), { tl: { col: 0.1, row: 0.1 }, ext: { width: 140, height: 60 }, editAs: 'oneCell' });
    } catch (e) { }

    worksheet.addRow([]);

    const periodo = extrairPeriodoSemana(week);

    const titleConfig = activeTab === "inspecao"
        ? { title: "MONITORAMENTO DE CONDUTA E SAÚDE", meta: ["Área: Packing Manga", `Período da semana: ${periodo}`, "Código: PHU-2.9.7"] }
        : {
            title: "MONITORAMENTO DE LAVAGEM DE MÃOS",
            meta: [
                `Local: Packing House  |  Código: PHU-2.9.1`,
                `Período: ${periodo}`,
                `Exportado em: ${new Date().toLocaleString("pt-BR")}`
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
            const imgId = workbook.addImage(val.startsWith("data:image") ? { base64: (imgFile as any).base64, extension: "png" } : { buffer: (imgFile as any).buffer, extension: (imgFile as any).ext });
            worksheet.addImage(imgId, { tl: { col: cNum - 1 + offX, row: rNum - 1 + 0.02 }, ext: { width: w, height: h }, editAs: "oneCell" });
        }
    };

    // --- 3. DADOS: INSPEÇÃO DE CONDUTA ---
    if (activeTab === "inspecao") {
        const sigRow = worksheet.addRow(["Auxiliar de Segurança:", ""]); sigRow.height = 38;
        const nameRow = worksheet.addRow(["", formatName(signatures.coordinator || "")]); nameRow.height = 18;
        worksheet.mergeCells(sigRow.number, 1, nameRow.number, 1);
        sigRow.getCell(1).font = { bold: true, size: 11, color: { argb: "FF1F2937" } };
        nameRow.getCell(2).font = { bold: true, size: 10, color: { argb: "FF004080" } };
        await addTableSignature(signatures.coordinator, sigRow.number, 2);
        worksheet.addRow([]);

        const headerRow = worksheet.addRow(["Inspeção - Itens Observados", "", ...DAYS]);
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
                    formatSafeDate(row.date),
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
        weekDays.forEach(day => {
            worksheet.mergeCells(rowDia.number, colIdx, rowDia.number, colIdx + 1);
            worksheet.getCell(rowDia.number, colIdx).value = day.label;
            worksheet.getCell(rowHora.number, colIdx).value = "09h";
            worksheet.getCell(rowHora.number, colIdx + 1).value = "14h";
            colIdx += 2;
        });

        [rowDia, rowHora].forEach(r => r.eachCell(applyHeaderStyle));

        lavagemLogs.filter(log => !!String(log.colaborador || "").trim() && !log.colaborador?.startsWith("-")).forEach((log) => {
            const rowData = [log.colaborador || ""];
            weekDays.forEach(day => {
                const m = log.dias?.[day.short]?.manha;
                const t = log.dias?.[day.short]?.tarde;
                rowData.push(m === "C" ? "SIM" : m === "NC" ? "NÃO" : "");
                rowData.push(t === "C" ? "SIM" : t === "NC" ? "NÃO" : "");
            });
            const dataRow = worksheet.addRow(rowData);
            dataRow.height = 28;

            // 🔥 BUSCA O STATUS REAL DO COLABORADOR NA LISTA COMPLETA DO BANCO
            const colabInfo = colaboradores.find(c => c.nome?.trim().toUpperCase() === log.colaborador?.trim().toUpperCase());
            const isDesligado = colabInfo?.ativo === false;
            const isEfetivo = colabInfo?.tipo?.toUpperCase() === "EFETIVO";
            const isContratado = colabInfo?.tipo?.toUpperCase() === "CONTRATADO";

            dataRow.eachCell((c, i) => {
                applyDataStyle(c, i > 1);

                // 1. PRIMEIRA CÉLULA: Nome do Colaborador (Aplica as regras de cores de Contrato)
                if (i === 1) {
                    if (isDesligado) {
                        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }; // Cinza claro
                        // 🔥 A correção está aqui: use "strike" em vez de "strikeThrough"
                        c.font = { bold: true, color: { argb: "FF9CA3AF" }, strike: true } as any;
                    } else if (isEfetivo) {
                        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } }; // Verde clarinho
                        c.font = { bold: true, color: { argb: "FF065F46" } };
                    } else if (isContratado) {
                        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF3C7" } }; // Amarelo/Amber clarinho
                        c.font = { bold: true, color: { argb: "FF92400E" } };
                    }
                }
                // 2. RESTANTE DAS CÉLULAS: Células de preenchimento de turnos (SIM / NÃO / VAZIO)
                else {
                    if (isDesligado) {
                        // Se a pessoa foi desligada, toda a linha de turnos dela fica cinza chapado
                        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
                        c.font = { color: { argb: "FF9CA3AF" } };
                    } else {
                        // Se estiver ativo, preserva o comportamento normal do SIM/NÃO
                        if (c.value === "SIM") {
                            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6F4EA" } };
                            c.font = { bold: true, color: { argb: "FF137333" } };
                        }
                        if (c.value === "NÃO") {
                            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFCE8E6" } };
                            c.font = { bold: true, color: { argb: "FFC5221F" } };
                        }
                    }
                }
            });
        });
    }

    // --- 5. LEGENDA E RODAPÉ UNIFICADO ---
    worksheet.addRow([]);
    worksheet.addRow(["LEGENDA E DETALHES"]).getCell(1).font = { bold: true, size: 10 };
    worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, maxCol);

    if (activeTab === "inspecao") {
        worksheet.addRow(["• SIM: Conforme padrões de higiene. | • NÃO: Higienização inadequada ou não realizada."]).getCell(1).font = { size: 9 };
    } else {
        const comboRow = worksheet.addRow([""]);
        worksheet.mergeCells(comboRow.number, 1, comboRow.number, maxCol);
        comboRow.getCell(1).value = {
            richText: [
                { font: { bold: true, size: 8.5 }, text: "Legenda: " }, { font: { size: 8.5 }, text: "SIM: Conforme | NÃO: Higienização inadequada ou não realizada\n" },
                { font: { bold: true, size: 8.5 }, text: "Tipos de Contrato (Cores): " }, { font: { size: 8.5, color: { argb: "FF137333" } }, text: "Verde: Efetivo" }, { font: { size: 8.5 }, text: " | " }, { font: { size: 8.5, color: { argb: "FF92400E" } }, text: "Amarelo: Contratado" }, { font: { size: 8.5 }, text: " | " }, { font: { size: 8.5, color: { argb: "FF6B7280" } }, text: "Cinza Linha Inteira: Desligado na Semana\n" },
                { font: { bold: true, size: 8.5 }, text: "É Proibido: " }, { font: { size: 8.5 }, text: "Fumar • Unhas grandes/esmaltes • Adornos (Anel, Relógio, Brincos) • Perfume • Sem touca • Uniforme sujo\n" },
                { font: { bold: true, size: 8.5 }, text: "Produtos: " }, { font: { size: 8.5 }, text: "Sabão de mãos • Álcool gel 70% • Secador de mãos" }
            ]
        };
        applyDataStyle(comboRow.getCell(1), false); comboRow.height = 68;
    }

    worksheet.addRow([]);
    worksheet.addRow(["CONTROLE DE REVISÃO"]).getCell(1).font = { bold: true, size: 10 };
    [["Aprovado/Revisado:", "Clebitânia Carvalho"], ["Última Revisão:", "02/01/2026"], ["Código:", activeTab === "inspecao" ? "PHU-037" : "PHU-039"]].forEach(([l, v]) => {
        const r = worksheet.addRow([l, v]); worksheet.mergeCells(r.number, 2, r.number, maxCol);
        r.getCell(1).font = { bold: true, size: 9 }; r.getCell(2).font = { size: 9 };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};