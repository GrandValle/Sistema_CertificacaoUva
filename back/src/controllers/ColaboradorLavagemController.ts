import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ColaboradorLavagemController {
    // Listar TODOS os colaboradores (removido o filtro de apenas ativos)
    // Retorna id, nome, tipo, ativo, status, statusDetalhe
    async listar(req: Request, res: Response) {
        try {
            const colaboradores = await prisma.colaboradorLavagem.findMany({
                select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    ativo: true,
                    status: true,        // 🔥 ADICIONAR
                    statusDetalhe: true, // 🔥 ADICIONAR
                },
                orderBy: { nome: "asc" },
            });

            // 🔥 Agora retornamos os campos diretamente, sem mapear
            // O frontend usará statusDetalhe para a situação (NORMAL, FÉRIAS, etc.)
            res.json(colaboradores);
        } catch (error) {
            console.error("Erro ao listar colaboradores:", error);
            res.status(500).json({ erro: "Erro ao listar colaboradores" });
        }
    }

    // Criar com trava de duplicidade
    async criar(req: Request, res: Response) {
        try {
            const { nome, tipo, ativo } = req.body;
            if (!nome || typeof nome !== "string" || !nome.trim()) {
                return res.status(400).json({ erro: "Nome é obrigatório e deve ser texto" });
            }

            const nomeFormatado = nome.trim().toUpperCase();

            const colaboradorExistente = await prisma.colaboradorLavagem.findFirst({
                where: { nome: nomeFormatado }
            });

            if (colaboradorExistente) {
                return res.status(400).json({
                    erro: `O colaborador ${nomeFormatado} já existe. Use a função de reativar/atualizar.`
                });
            }

            const colaborador = await prisma.colaboradorLavagem.create({
                data: {
                    nome: nomeFormatado,
                    tipo: tipo === "CONTRATADO" ? "CONTRATADO" : "EFETIVO",
                    ativo: ativo !== undefined ? Boolean(ativo) : true,
                    status: "NORMAL",        // 🔥 ADICIONAR
                    statusDetalhe: "NORMAL", // 🔥 ADICIONAR
                },
                select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    ativo: true,
                    status: true,
                    statusDetalhe: true,
                }
            });
            res.status(201).json(colaborador);
        } catch (error) {
            console.error("Erro ao criar colaborador:", error);
            res.status(500).json({ erro: "Erro ao criar colaborador" });
        }
    }

    async atualizar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== "string") {
                return res.status(400).json({ erro: "ID inválido" });
            }

            const { nome, tipo, ativo, status, statusDetalhe } = req.body;

            const data: any = {};
            if (nome !== undefined) {
                if (typeof nome !== "string" || !nome.trim()) {
                    return res.status(400).json({ erro: "Nome deve ser texto não vazio" });
                }
                data.nome = nome.trim().toUpperCase();
            }
            if (tipo !== undefined) {
                if (tipo !== "EFETIVO" && tipo !== "CONTRATADO") {
                    return res.status(400).json({ erro: "Tipo deve ser EFETIVO ou CONTRATADO" });
                }
                data.tipo = tipo;
            }
            if (ativo !== undefined) {
                data.ativo = Boolean(ativo);
            }
            if (status !== undefined) {
                data.status = status;
            }
            if (statusDetalhe !== undefined) {
                data.statusDetalhe = statusDetalhe;
            }

            if (Object.keys(data).length === 0) {
                return res.status(400).json({ erro: "Nenhum campo para atualizar" });
            }

            const colaborador = await prisma.colaboradorLavagem.update({
                where: { id },
                data,
                select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    ativo: true,
                    status: true,
                    statusDetalhe: true,
                }
            });
            res.json(colaborador);
        } catch (error: any) {
            if (error.code === "P2025") {
                return res.status(404).json({ erro: "Colaborador não encontrado" });
            }
            console.error("Erro ao atualizar colaborador:", error);
            res.status(500).json({ erro: "Erro ao atualizar colaborador" });
        }
    }

    async desativar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== "string") {
                return res.status(400).json({ erro: "ID inválido" });
            }

            const colaborador = await prisma.colaboradorLavagem.update({
                where: { id },
                data: { ativo: false },
                select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    ativo: true,
                    status: true,
                    statusDetalhe: true,
                }
            });
            res.json({ mensagem: "Colaborador desativado", colaborador });
        } catch (error: any) {
            if (error.code === "P2025") {
                return res.status(404).json({ erro: "Colaborador não encontrado" });
            }
            console.error("Erro ao desativar colaborador:", error);
            res.status(500).json({ erro: "Erro ao desativar colaborador" });
        }
    }

    async reativar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== "string") {
                return res.status(400).json({ erro: "ID inválido" });
            }

            const colaborador = await prisma.colaboradorLavagem.update({
                where: { id },
                data: { ativo: true },
                select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    ativo: true,
                    status: true,
                    statusDetalhe: true,
                }
            });
            res.json({ mensagem: "Colaborador reativado", colaborador });
        } catch (error: any) {
            if (error.code === "P2025") {
                return res.status(404).json({ erro: "Colaborador não encontrado" });
            }
            console.error("Erro ao reativar colaborador:", error);
            res.status(500).json({ erro: "Erro ao reativar colaborador" });
        }
    }
}