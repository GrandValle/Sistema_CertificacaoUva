// src/controllers/DocumentoController.ts
import { Request, Response } from "express";
import { DocumentoService } from "../services/DocumentoService";

// Função atualizada: Agora recebe o tipoTela também!
const garantirNomePadronizado = (nomeOriginal: string, tipoTela: string): string => {
    const dataAtual = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // 1. Tira a extensão (.xlsx) para a gente trabalhar só com o texto
    let nomeBase = nomeOriginal.replace(/\.xlsx$/i, "");

    // 2. Tira uma possível data que já esteja no final (para não ficar com 2 datas repetidas)
    nomeBase = nomeBase.replace(/_\d{4}-\d{2}-\d{2}$/, "");

    // 3. O "Faxineiro": Remove acentos (ç, ã, í) e troca espaços/símbolos por underline (_)
    const limpar = (str: string) => str
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\W+/g, '_') // Troca tudo que não for letra ou número por '_'
        .toLowerCase();

    const telaFormatada = limpar(tipoTela);
    const areaFormatada = limpar(nomeBase);

    // 4. Monta o nome final
    // Se o nome que veio do Front já tiver a tela escrita nele, a gente não duplica.
    if (areaFormatada.startsWith(telaFormatada)) {
        return `${areaFormatada}_${dataAtual}.xlsx`;
    }

    // Caso contrário, junta: Tela + Área + Data
    return `${telaFormatada}_${areaFormatada}_${dataAtual}.xlsx`;
};

export class DocumentoController {
    async salvar(req: Request, res: Response) {
        try {
            const file = req.file;
            const { tipoTela, dados } = req.body;

            if (!file || !dados || !tipoTela) {
                return res.status(400).json({ error: "Arquivo Excel, tipoTela e dados são obrigatórios." });
            }

            // 🟢 A MÁGICA ACONTECE AQUI: Passamos o tipoTela também!
            file.originalname = garantirNomePadronizado(file.originalname, tipoTela);

            const dadosFormatados = JSON.parse(dados);
            const service = new DocumentoService();

            const resultado = await service.salvarGenerico(tipoTela, dadosFormatados, file);

            return res.status(201).json(resultado);
        } catch (error: any) {
            console.error("Erro no DocumentoController.salvar:", error);

            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ error: "O arquivo excede o limite máximo permitido de 60MB." });
            }

            return res.status(500).json({ error: "Erro interno ao salvar documento." });
        }
    }

    async downloadExcel(req: Request, res: Response) {
        try {
            const { idArquivo } = req.params;
            const service = new DocumentoService();

            const id = Array.isArray(idArquivo) ? idArquivo[0] : idArquivo;
            const documento = await service.baixarDocumento(id);

            if (!documento) {
                return res.status(404).json({ error: "Documento não encontrado no banco de dados." });
            }

            res.setHeader('Content-Disposition', `attachment; filename="${documento.nomeArquivo}"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            return res.send(documento.conteudo);
        } catch (error) {
            console.error("Erro ao fazer download do documento:", error);
            return res.status(500).json({ error: "Erro interno ao processar o download." });
        }
    }

    async listarHistorico(req: Request, res: Response) {
        try {
            const { tipoTela } = req.params;
            const service = new DocumentoService();
            const tipo = Array.isArray(tipoTela) ? tipoTela[0] : tipoTela;

            const historico = await service.listarHistorico(tipo);
            return res.status(200).json(historico);
        } catch (error) {
            console.error("Erro ao listar histórico:", error);
            return res.status(500).json({ error: "Erro interno ao buscar histórico." });
        }
    }

    async deletarGenerico(req: Request, res: Response, metodoService: string) {
        try {
            const { id } = req.params;
            if (!id) return res.status(400).json({ error: "ID é obrigatório." });

            const service = new DocumentoService();
            const resultado = await (service as any)[metodoService](id);

            return res.status(200).json({ sucesso: true, resultado });
        } catch (error) {
            console.error(`Erro ao deletar via ${metodoService}:`, error);
            return res.status(500).json({ error: "Erro interno ao deletar." });
        }
    }
}