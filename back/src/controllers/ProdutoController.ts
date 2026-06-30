import { Request, Response } from "express";
import { ProdutoService } from "../services/ProdutoService";
import { TipoEstoque } from "@prisma/client";

export class ProdutoController {
    async criar(req: Request, res: Response) {
        try {
            const { nome, tipo, unidade, quantidade } = req.body;

            if (!nome || !tipo || !unidade) {
                return res.status(400).json({ error: "Nome, tipo e unidade são obrigatórios." });
            }

            const service = new ProdutoService();
            const produto = await service.criar(nome, tipo as TipoEstoque, unidade, quantidade);

            return res.status(201).json(produto);
        } catch (error: any) {
            console.error("Erro ao criar produto:", error);
            return res.status(400).json({ error: error.message || "Erro interno ao criar produto." });
        }
    }

    async listar(req: Request, res: Response) {
        try {
            const { tipo } = req.query;

            if (!tipo) {
                return res.status(400).json({ error: "O parâmetro 'tipo' é obrigatório." });
            }

            const service = new ProdutoService();
            const produtos = await service.listarPorTipo(tipo as TipoEstoque);

            return res.status(200).json(produtos);
        } catch (error) {
            console.error("Erro ao listar produtos:", error);
            return res.status(500).json({ error: "Erro interno ao buscar produtos." });
        }
    }

    async atualizarSaldos(req: Request, res: Response) {
        try {
            const { produtosAtualizados } = req.body;

            if (!produtosAtualizados || !Array.isArray(produtosAtualizados)) {
                return res.status(400).json({ error: "Lista de produtos inválida." });
            }

            const service = new ProdutoService();
            await service.atualizarSaldos(produtosAtualizados);

            return res.status(200).json({ message: "Saldos atualizados com sucesso!" });
        } catch (error) {
            console.error("Erro ao atualizar saldos:", error);
            return res.status(500).json({ error: "Erro interno ao atualizar saldos." });
        }
    }
}