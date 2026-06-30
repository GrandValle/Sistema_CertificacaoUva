"use client";

import * as ExcelJS from "exceljs";
import { TabType, EstoqueLog, RegistroTesoura, RegistroOculos, EmbalagemEntry, DIAS_SEMANA, LEGENDA_OCULOS, LEGENDA_TESOURAS, LEGENDA_ESTOQUE } from "../model/estoqueModel";

// --- HELPERS GERAIS ---
const formatName = (str: string) => {
    if (!str) return "";
    if (str.startsWith("data:image")) return "[ASSINATURA DIGITAL]";
    return str.replace(/_/g, " ").toUpperCase();
};

const normalizeFileName = (str: string) => (!str ? "" : str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").toLowerCase());

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

const applyDataStyle = (cell: ExcelJS.Cell, isCenter = true) => {
    cell.border = { top: { style: "thin", color: { argb: "FFD1D5DB" } }, left: { style: "thin", color: { argb: "FFD1D5DB" } }, bottom: { style: "thin", color: { argb: "FFD1D5DB" } }, right: { style: "thin", color: { argb: "FFD1D5DB" } } };
    cell.alignment = { horizontal: isCenter ? "center" : "left", vertical: "middle", wrapText: true };
};

interface ExportEstoqueParams {
    activeTab: TabType;
    estoqueLogs: EstoqueLog[];
    tesourasLogs: RegistroTesoura[];
    oculosLogs: RegistroOculos[];
    embalagemLogs: EmbalagemEntry[];
    dataInicio: string;
    dataFim: string;
    frequenciaTesoura: string;
    colaboradoresOculos: any[];
}

export const exportEstoqueToExcel = async ({
    activeTab,
    estoqueLogs,
    tesourasLogs,
    oculosLogs,
    embalagemLogs,
    dataInicio,
    dataFim,
    frequenciaTesoura,
    colaboradoresOculos
}: ExportEstoqueParams) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(
        activeTab === "estoque" ? "Estoque" :
            activeTab === "tesouras" ? "Tesouras" :
                activeTab === "embalagem" ? "Embalagem" : "Óculos"
    );
    const baseUrl = window.location.origin;

    // --- 1. CONFIGURAÇÃO DE PÁGINA E COLUNAS ---
    const isTesouras = activeTab === "tesouras";
    const isEmbalagem = activeTab === "embalagem";
    worksheet.pageSetup = {
        paperSize: 9,
        orientation: (isTesouras || isEmbalagem) ? "landscape" : "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 }
    };

    let title = "", codigoDoc = "", headers: string[] = [], metaExtra: string[] = [];
    let colWidths: number[] = [];

    // Variável para controlar se a coluna de observação dos óculos vai existir
    let hasObservacaoOculos = false;

    if (activeTab === "estoque") {
        title = "CONTROLE DE ESTOQUE - MATERIAL DE LIMPEZA"; codigoDoc = "PHU-029";
        headers = ["Data", "Produto", "Entrada", "Saída", "Setor", "Quem Pegou", "Saldo", "Responsável"];
        colWidths = [14, 24, 14, 14, 18, 28, 14, 28];
    } else if (activeTab === "tesouras") {
        title = "ENTREGA E DEVOLUÇÃO DE TESOURAS"; codigoDoc = "PHU-043";
        headers = ["Contrato", "Funcionário", "Nº Tesoura", ...DIAS_SEMANA];
        metaExtra = [`Data início: ${formatSafeDate(dataInicio) || "-"}`, `Data fim: ${formatSafeDate(dataFim) || "-"}`, `Frequência: ${frequenciaTesoura || "-"}`];
        colWidths = [16, 26, 12, ...DIAS_SEMANA.map(() => 10)];
    } else if (activeTab === "embalagem") {
        title = "CONTROLE DE ENTRADA DE MATERIAL DE EMBALAGEM (PHU-032)"; codigoDoc = "PHU-032";
        const hasObservacao = embalagemLogs.some(log => log.observacoes && log.observacoes.trim() !== "");
        const hasAcao = embalagemLogs.some(log => log.acoesCorretivas && log.acoesCorretivas.trim() !== "");
        const baseHeaders = [
            "Data", "Hora Chegada", "Responsável", "Tipo Transporte", "Tipo Material",
            "Limpeza do Veículo", "Conservação du Material", "Estado do Transporte",
            "Odores no Transporte", "Problema de Acondicionamento", "Estado do Material",
            "Material Danificado?", "Material Limpo?", "Com Odores?"
        ];
        headers = [...baseHeaders];
        if (hasObservacao) headers.push("Observações Adicionais");
        if (hasAcao) headers.push("Ações Corretivas");
        const widths = {
            data: 14, hora: 12, responsavel: 30, tipoTransp: 20, tipoMat: 20,
            cond: 18, simNao: 14, obs: 40, acao: 40
        };
        colWidths = [
            widths.data, widths.hora, widths.responsavel, widths.tipoTransp, widths.tipoMat,
            widths.cond, widths.cond, widths.cond, widths.cond, widths.cond, widths.cond,
            widths.simNao, widths.simNao, widths.simNao
        ];
        if (hasObservacao) colWidths.push(widths.obs);
        if (hasAcao) colWidths.push(widths.acao);
    } else {
        // 🔥 ÓCULOS: Configuração dinâmica da Observação
        title = "CONTROLE DE ÓCULOS"; codigoDoc = "PHU-027";

        // Verifica se ALGUÉM tem observação preenchida
        hasObservacaoOculos = (oculosLogs || []).some(log => log.observacao && log.observacao.trim() !== "");

        headers = ["Data", "Colaborador", "Intacto", "Assinatura"];
        colWidths = [14, 26, 12, 28];

        // Só adiciona a coluna se existir alguma observação
        if (hasObservacaoOculos) {
            headers.push("Observação");
            colWidths.push(30);
        }
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

    const metadataRows = [`Exportado em: ${new Date().toLocaleString("pt-BR")}`];
    if (metaExtra.length) metadataRows.push(...metaExtra);

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

    // --- FUNÇÃO DE ASSINATURA ---
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

    // --- 5. PREENCHIMENTO DOS DADOS ---
    if (activeTab === "estoque") {
        const filled = estoqueLogs.filter(log => !!log.product?.trim() || !!log.date?.trim());
        for (const log of filled) {
            const row = worksheet.addRow([
                formatSafeDate(log.date), log.product || "",
                log.entry ? `${log.entry} ${log.entryUnit || ""}`.trim() : "",
                log.exit ? `${log.exit} ${log.exitUnit || ""}`.trim() : "",
                log.sector || "", "", log.balance ?? "", ""
            ]);
            row.eachCell((c, i) => applyDataStyle(c, i !== 2 && i !== 5));
            await addTableSignature(log.whoTook, row.number, 6, row.getCell(6));
            await addTableSignature(log.responsible, row.number, 8, row.getCell(8));
        }
    } else if (activeTab === "tesouras") {
        const ordemTipo: Record<string, number> = { 'EFETIVO': 1, 'CONTRATADO': 2, 'DESLIGADO': 3 };
        const registrosOrdenados = [...tesourasLogs]
            .filter(row => !!row.funcionario?.trim())
            .sort((a, b) => {
                const tipoA = ordemTipo[a.tipo] || 4;
                const tipoB = ordemTipo[b.tipo] || 4;
                if (tipoA !== tipoB) return tipoA - tipoB;
                return (a.funcionario || "").localeCompare(b.funcionario || "");
            });

        registrosOrdenados.forEach(row => {
            const rowData = [row.tipo, row.funcionario, row.numeroTesoura];
            DIAS_SEMANA.forEach(dia => {
                const e = row.dias?.[dia]?.e ? "E" : "";
                const d = row.dias?.[dia]?.d ? "D" : "";
                rowData.push([e, d].filter(Boolean).join("/"));
            });
            const dataRow = worksheet.addRow(rowData);
            dataRow.height = 24;
            dataRow.eachCell((c, i) => applyDataStyle(c, i !== 1 && i !== 2));

            const contratoCell = dataRow.getCell(1);
            if (row.tipo === 'EFETIVO') {
                contratoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
                contratoCell.font = { bold: true, color: { argb: "FF166534" } };
            } else if (row.tipo === 'CONTRATADO') {
                contratoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
                contratoCell.font = { bold: true, color: { argb: "FF854D0E" } };
            } else if (row.tipo === 'DESLIGADO') {
                contratoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
                contratoCell.font = { bold: true, color: { argb: "FF4B5563" } };
                dataRow.eachCell(cell => {
                    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
                });
            }
        });
    } else if (activeTab === "embalagem") {
        const filled = embalagemLogs.filter(log => !!log.data?.trim() || !!log.responsavel?.trim());
        const hasObservacao = filled.some(log => log.observacoes && log.observacoes.trim() !== "");
        const hasAcao = filled.some(log => log.acoesCorretivas && log.acoesCorretivas.trim() !== "");
        for (const log of filled) {
            const rowData: any[] = [
                formatSafeDate(log.data),
                log.horaChegada || "",
                log.responsavel || "",
                log.tipoTransporte || "",
                log.tipoMaterial || "",
                log.limpeza || "",
                log.conservacao || "",
                log.estadoTransporte || "",
                log.odoresTransporte || "",
                log.problemaAcondicionamento || "",
                log.estadoMaterial || "",
                log.materialDanificado ? "SIM" : "NÃO",
                log.materialLimpo ? "SIM" : "NÃO",
                log.comOdores ? "SIM" : "NÃO"
            ];
            if (hasObservacao) rowData.push(log.observacoes || "");
            if (hasAcao) rowData.push(log.acoesCorretivas || "");
            const row = worksheet.addRow(rowData);
            row.eachCell((c, i) => applyDataStyle(c, true));
            if (log.responsavel) {
                await addTableSignature(log.responsavel, row.number, 3, row.getCell(3));
            }
        }
    } else {
        // 🔥 ÓCULOS – Com Observação Dinâmica e Erro TypeScript Corrigido
        const colaboradoresMap = new Map(
            (colaboradoresOculos || []).map(c => [c.id, c.nome])
        );

        const filled = (oculosLogs || []).filter(log => {
            const nome = colaboradoresMap.get(log.colaboradorId) || "";
            return nome.trim() !== "" || !!log.data?.trim();
        });

        for (const log of filled) {
            // Conversão segura para o TypeScript não reclamar
            let intactoTexto = "";
            const valorIntacto = String(log.intacto).toUpperCase();

            if (valorIntacto === "TRUE" || valorIntacto === "SIM") {
                intactoTexto = "SIM";
            } else if (valorIntacto === "FALSE" || valorIntacto === "NÃO" || valorIntacto === "NAO") {
                intactoTexto = "NÃO";
            }

            const nomeColaborador = colaboradoresMap.get(log.colaboradorId) || "";

            // Monta a linha base
            const rowData: any[] = [
                formatSafeDate(log.data),
                nomeColaborador,
                intactoTexto,
                "" // Espaço para a assinatura
            ];

            // Só adiciona a observação na linha se a coluna existir
            if (hasObservacaoOculos) {
                rowData.push(log.observacao || "");
            }

            const row = worksheet.addRow(rowData);

            // i !== 2 (Colaborador fica alinhado à esquerda)
            // i !== 5 (Observação fica alinhada à esquerda, se existir)
            row.eachCell((c, i) => applyDataStyle(c, i !== 2 && i !== 5));

            await addTableSignature(log.assinatura, row.number, 4, row.getCell(4));
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
    else if (activeTab === "tesouras") legendLines = LEGENDA_TESOURAS;
    else if (activeTab === "embalagem") {
        legendLines = [
            "✓ Bom: Item em perfeitas condições.",
            "● Aceitável: Item com pequenas avarias, mas dentro do aceitável.",
            "✗ Reprovado: Item com problemas que requerem ação corretiva.",
            "SIM / NÃO: Para as verificações complementares (Material Danificado, Limpo, Com Odores).",
            "Observações Adicionais e Ações Corretivas: Preencher sempre que houver não conformidade."
        ];
    } else legendLines = LEGENDA_OCULOS;

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
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};