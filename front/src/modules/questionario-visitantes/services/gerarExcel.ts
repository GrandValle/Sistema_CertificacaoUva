import ExcelJS from 'exceljs';
import { VisitanteData, PERGUNTAS_VISITANTE } from '../model/questionarioModel';

export async function gerarExcelVisitante(
    visitante: VisitanteData,
    respostas: Record<string, string>,
    assinaturaBase64: string
) {
    try {
        const workbook = new ExcelJS.Workbook();

        // 1. FUNDO BRANCO: Oculta as linhas de grade padrão do Excel (Estilo Documento)
        const worksheet = workbook.addWorksheet('PHU-038', {
            views: [{ showGridLines: false }]
        });

        // 2. ESTRUTURA DE 5 COLUNAS
        worksheet.columns = [
            { key: 'A', width: 6 },  // ID (Letras A, B, C...)
            { key: 'B', width: 28 }, // Diminuído para puxar a linha pra perto
            { key: 'C', width: 52 }, // Aumentado para compensar
            { key: 'D', width: 9 },  // YES (Sim)
            { key: 'E', width: 9 }   // NO (Não)
        ];

        const bordaPreta = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
        } as Partial<ExcelJS.Borders>;

        // ==========================================
        // 3. LOGO GRANDVALLE
        // ==========================================
        for (let i = 0; i < 4; i++) worksheet.addRow([]);
        worksheet.mergeCells('A1:E4');

        try {
            const responseLogo = await fetch('/logo.png');

            if (responseLogo.ok) {
                const logoBuffer = await responseLogo.arrayBuffer();
                const logoId = workbook.addImage({
                    buffer: logoBuffer,
                    extension: 'png'
                });

                worksheet.addImage(logoId, {
                    tl: { col: 2.1, row: 0.2 },
                    ext: { width: 150, height: 60 }
                });
            }
        } catch (erroLogo) {
            console.warn("Não foi possível carregar a logo do diretório public.", erroLogo);
        }

        // ==========================================
        // 4. CABEÇALHO DO DOCUMENTO
        // ==========================================
        worksheet.addRow(['Código: PHU-038', '', '', '', '']);
        worksheet.mergeCells(`A5:E5`);
        worksheet.getCell('A5').font = { name: 'Arial', size: 10 };

        worksheet.addRow([]);

        worksheet.addRow(["VISITOR'S HEALTH QUESTIONNAIRE (Questionário de Saúde de Visitas)", '', '', '', '']);
        const linhaTitulo = worksheet.lastRow!.number;
        worksheet.mergeCells(`A${linhaTitulo}:E${linhaTitulo}`);
        worksheet.getCell(`A${linhaTitulo}`).font = { name: 'Arial', size: 10, bold: true };

        // ==========================================
        // 5. DADOS DO VISITANTE
        // ==========================================
        const adicionarCampoInfo = (label: string, valor: string) => {
            const linha = worksheet.addRow(['', '', '', '', '']);
            const rowNum = linha.number;

            worksheet.mergeCells(`A${rowNum}:B${rowNum}`);
            const cLabel = worksheet.getCell(`A${rowNum}`);
            cLabel.value = label;
            cLabel.font = { name: 'Arial', size: 10, bold: true };
            cLabel.alignment = { vertical: 'bottom', horizontal: 'left' };

            worksheet.mergeCells(`C${rowNum}:E${rowNum}`);
            const cValor = worksheet.getCell(`C${rowNum}`);
            cValor.value = valor || '';
            cValor.font = { name: 'Arial', size: 10 };
            cValor.alignment = { vertical: 'bottom', horizontal: 'left' };
            cValor.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };

            linha.height = 18;
        };

        adicionarCampoInfo('DATE (Data):', visitante.data);
        adicionarCampoInfo('FULL NAME (Nome Completo):', visitante.nome);
        adicionarCampoInfo('COMPANY (Empresa):', visitante.empresa);
        adicionarCampoInfo('REASON FOR VISIT (Motivo da Visita):', visitante.motivo);

        worksheet.addRow([]);
        worksheet.addRow([]);

        // ==========================================
        // 6. BLOCOS DE PERGUNTAS
        // ==========================================
        const adicionarBlocoPerguntas = (grupoId: number, introEn: string, introPt: string) => {
            const linhaIntroEn = worksheet.addRow([introEn, '', '', '', '']);
            worksheet.mergeCells(`A${linhaIntroEn.number}:E${linhaIntroEn.number}`);
            worksheet.getCell(`A${linhaIntroEn.number}`).font = { name: 'Arial', size: 10 };

            const linhaIntroPt = worksheet.addRow([introPt, '', '', '', '']);
            worksheet.mergeCells(`A${linhaIntroPt.number}:E${linhaIntroPt.number}`);
            worksheet.getCell(`A${linhaIntroPt.number}`).font = { name: 'Arial', size: 10, bold: true };

            worksheet.addRow([]);
            worksheet.lastRow!.height = 5;

            // Cabeçalho YES/NO
            const linhaHeader = worksheet.addRow(['', '', '', '', '']);
            const hRow = linhaHeader.number;
            worksheet.mergeCells(`B${hRow}:C${hRow}`);
            linhaHeader.height = 30;

            ['D', 'E'].forEach(col => {
                const cell = worksheet.getCell(`${col}${hRow}`);
                cell.border = bordaPreta;
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            });

            const cYes = worksheet.getCell(`D${hRow}`);
            cYes.value = {
                richText: [
                    { font: { name: 'Arial', size: 10, bold: true }, text: 'YES\n' },
                    { font: { name: 'Arial', size: 8, bold: false }, text: '(Sim)' }
                ]
            };

            const cNo = worksheet.getCell(`E${hRow}`);
            cNo.value = {
                richText: [
                    { font: { name: 'Arial', size: 10, bold: true }, text: 'NO\n' },
                    { font: { name: 'Arial', size: 8, bold: false }, text: '(Não)' }
                ]
            };

            const perguntas = PERGUNTAS_VISITANTE.filter((p) => p.grupo === grupoId);
            perguntas.forEach((pergunta) => {
                const resposta = (respostas[pergunta.id] || '').toLowerCase();
                const linhaRow = worksheet.addRow(['', '', '', '', '']);
                const rNum = linhaRow.number;

                const cId = worksheet.getCell(`A${rNum}`);
                cId.value = pergunta.id;
                cId.font = { name: 'Arial', size: 10, bold: true };
                cId.alignment = { horizontal: 'center', vertical: 'middle' };
                cId.border = bordaPreta;

                worksheet.mergeCells(`B${rNum}:C${rNum}`);
                const cTexto = worksheet.getCell(`B${rNum}`);
                cTexto.value = {
                    richText: [
                        { font: { name: 'Arial', size: 10 }, text: pergunta.en + '\n' },
                        { font: { name: 'Arial', size: 10, bold: true }, text: pergunta.pt }
                    ]
                };
                cTexto.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                cTexto.border = bordaPreta;

                const cSim = worksheet.getCell(`D${rNum}`);
                cSim.value = resposta === 'sim' ? 'X' : '';
                cSim.font = { name: 'Arial', size: 11, bold: true };
                cSim.alignment = { horizontal: 'center', vertical: 'middle' };
                cSim.border = bordaPreta;

                const cNao = worksheet.getCell(`E${rNum}`);
                cNao.value = resposta === 'nao' ? 'X' : '';
                cNao.font = { name: 'Arial', size: 11, bold: true };
                cNao.alignment = { horizontal: 'center', vertical: 'middle' };
                cNao.border = bordaPreta;

                linhaRow.height = 35;
            });

            worksheet.addRow([]);
            worksheet.addRow([]);
        };

        const grupos = [
            {
                id: 1,
                en: 'Have you presented or been in contact with someone who presented the following symptoms in the last 21 days?',
                pt: 'Você já apresentou ou esteve em contato com alguém que apresentou os seguintes sintomas nos últimos 21 dias?'
            },
            {
                id: 2,
                en: 'Can the following be found in your medical history?',
                pt: 'Pode ser encontrado o seguinte em seu histórico médico?'
            },
            {
                id: 3,
                en: 'Food allergy',
                pt: 'Alergia alimentar'
            }
        ];

        grupos.forEach((g) => adicionarBlocoPerguntas(g.id, g.en, g.pt));

        // ==========================================
        // 7. ASSINATURA (CORRIGIDA)
        // ==========================================
        worksheet.addRow([]);

        const linhaAssinatura = worksheet.addRow(['', '', '', '', '']);
        const rSig = linhaAssinatura.number;

        // 🟢 Aumentamos a altura para dar espaço para a imagem "sentar"
        linhaAssinatura.height = 45;

        worksheet.mergeCells(`A${rSig}:B${rSig}`);
        const cSigLabel = worksheet.getCell(`A${rSig}`);
        cSigLabel.value = "Visitor's Signature:";
        cSigLabel.font = { name: 'Arial', size: 10 };
        cSigLabel.alignment = { horizontal: 'left', vertical: 'bottom' };

        worksheet.mergeCells(`C${rSig}:E${rSig}`);
        const cSigLinha = worksheet.getCell(`C${rSig}`);
        cSigLinha.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };

        if (assinaturaBase64) {
            const imagemPura = assinaturaBase64.replace(/^data:image\/\w+;base64,/, '');
            const imageId = workbook.addImage({ base64: imagemPura, extension: 'png' });

            worksheet.addImage(imageId, {
                // 🟢 Empurramos o "row" mais para baixo (+ 0.3) para ficar rente à linha inferior
                tl: { col: 2.1, row: rSig - 1 + 0.3 },
                // 🟢 Diminuímos as dimensões para ficar mais delicado e alinhado
                ext: { width: 90, height: 26 }
            });
        }
        worksheet.addRow([]); // Espaço

        // Título combinado (Visitante e Visitor ficam juntos na mesma linha)
        const rDisclaimer1 = worksheet.addRow(['Assinatura Visitante', '', '', '', '']);
        rDisclaimer1.font = { bold: true, name: 'Arial', size: 10, color: { argb: 'FF000000' } };
        worksheet.mergeCells(`A${rDisclaimer1.number}:E${rDisclaimer1.number}`);

        // Texto do Aviso (Logo abaixo do título)
        const rDisclaimer2 = worksheet.addRow([
            "If you have answered yes to any of these questions, please contact a member of our operational team.\nSe você respondeu SIM a qualquer das questões acima, entre em contato com um membro da nossa equipe operacional.",
            '', '', '', ''
        ]);
        rDisclaimer2.height = 40;
        rDisclaimer2.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
        worksheet.mergeCells(`A${rDisclaimer2.number}:E${rDisclaimer2.number}`);

        worksheet.getCell(`A${rDisclaimer2.number}`).alignment = { wrapText: true, vertical: 'top' };

        // ==========================================
        // 8. FINALIZAÇÃO E ENVIO
        // ==========================================
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const nomeArquivo = `PHU038_${visitante.nome.replace(/\s+/g, '_') || 'Visitante'}_${visitante.data.replace(/\//g, '-')}.xlsx`;
        return { excelBlob: blob, nomeArquivo };

    } catch (erro) {
        console.error("Erro interno ao desenhar planilha:", erro);
        throw erro;
    }
}