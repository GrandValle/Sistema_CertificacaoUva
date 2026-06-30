// src/controllers/relatorioController.ts
import { Request, Response } from 'express';
import { buscarRelatoriosUnificados, gerarZipRelatorios } from '../services/relatorioService';

export const getRelatorios = async (req: Request, res: Response) => {
    try {
        const { dataInicio, dataFim } = req.query;

        let inicio = undefined;
        let fim = undefined;

        if (dataInicio && dataFim) {
            inicio = new Date(`${dataInicio}T00:00:00.000Z`);
            fim = new Date(`${dataFim}T23:59:59.999Z`);
        }

        const dadosRelatorio = await buscarRelatoriosUnificados(inicio, fim);

        return res.status(200).json({
            sucesso: true,
            dados: dadosRelatorio
        });

    } catch (error) {
        console.error("Erro ao buscar relatórios unificados:", error);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro interno no servidor ao processar o relatório."
        });
    }
};

export const exportarRelatorio = async (req: Request, res: Response) => {
    try {
        const { dataInicio, dataFim, modulo } = req.query;

        if (!modulo) {
            return res.status(400).json({
                sucesso: false,
                mensagem: "O parâmetro 'modulo' é obrigatório para exportar."
            });
        }

        let inicio = undefined;
        let fim = undefined;

        if (dataInicio && dataFim) {
            inicio = new Date(`${dataInicio}T00:00:00.000Z`);
            fim = new Date(`${dataFim}T23:59:59.999Z`);
        }

        const buffer = await gerarZipRelatorios(inicio, fim, modulo as string);

        if (!buffer || buffer.length === 0) {
            throw new Error("O arquivo gerado está vazio.");
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${modulo}_${dataInicio || 'completo'}_a_${dataFim || 'completo'}.zip"`);
        res.send(buffer);

    } catch (error) {
        console.error("❌ ERRO NA EXPORTAÇÃO:", error);
        return res.status(500).json({
            sucesso: false,
            mensagem: error instanceof Error ? error.message : "Erro ao gerar o arquivo Excel."
        });
    }
};