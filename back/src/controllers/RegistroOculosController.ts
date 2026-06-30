import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class RegistroOculosController {
    // LISTAR REGISTROS ATIVOS
    async listar(req: Request, res: Response) {
        try {
            const registros = await prisma.registroOculos.findMany({
                select: {
                    id: true,
                    data: true,
                    colaboradorId: true,
                    intacto: true,
                    assinatura: true,
                    observacao: true,
                    status: true,
                },
                where: { status: "ATIVO" },
                orderBy: { data: "desc" },
            });
            res.json(registros);
        } catch (error) {
            console.error("Erro ao listar registros:", error);
            res.status(500).json({ error: "Erro interno ao buscar registros." });
        }
    }

    // CRIAR NOVO REGISTRO
    async criar(req: Request, res: Response) {
        try {
            const { data, colaboradorId, intacto, assinatura, observacao } = req.body;
            if (!colaboradorId) {
                return res.status(400).json({ error: "O campo 'colaboradorId' é obrigatório." });
            }
            const novo = await prisma.registroOculos.create({
                data: {
                    data: data || new Date().toISOString().split('T')[0],
                    colaboradorId: String(colaboradorId),
                    intacto: intacto || null,
                    assinatura: assinatura || "",
                    observacao: observacao || "",
                    status: "ATIVO",
                },
                select: {
                    id: true,
                    data: true,
                    colaboradorId: true,
                    intacto: true,
                    assinatura: true,
                    observacao: true,
                    status: true,
                }
            });
            res.status(201).json(novo);
        } catch (error) {
            console.error("Erro ao criar registro:", error);
            res.status(500).json({ error: "Erro interno ao criar registro." });
        }
    }

    // ATUALIZAR REGISTRO
    async atualizar(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const { data, colaboradorId, intacto, assinatura, observacao } = req.body;
            const atualizado = await prisma.registroOculos.update({
                where: { id },
                data: { data, colaboradorId, intacto, assinatura, observacao },
                select: {
                    id: true,
                    data: true,
                    colaboradorId: true,
                    intacto: true,
                    assinatura: true,
                    observacao: true,
                    status: true,
                }
            });
            res.json(atualizado);
        } catch (error: any) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Registro não encontrado." });
            }
            console.error("Erro ao atualizar registro:", error);
            res.status(500).json({ error: "Erro interno ao atualizar registro." });
        }
    }

    // DESATIVAR REGISTRO (soft delete)
    async desativar(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const desativado = await prisma.registroOculos.update({
                where: { id },
                data: { status: "INATIVO" },
                select: {
                    id: true,
                    data: true,
                    colaboradorId: true,
                    intacto: true,
                    assinatura: true,
                    observacao: true,
                    status: true,
                }
            });
            res.json(desativado);
        } catch (error: any) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Registro não encontrado." });
            }
            console.error("Erro ao desativar registro:", error);
            res.status(500).json({ error: "Erro interno ao desativar registro." });
        }
    }
}