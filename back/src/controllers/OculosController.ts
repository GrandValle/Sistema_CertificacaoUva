import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class OculosController {
    // LISTAR TODOS (ativos e inativos) para permitir reativação
    // Retorna apenas id, nome, tipo, status
    async listar(req: Request, res: Response) {
        try {
            const colaboradores = await prisma.colaboradorOculos.findMany({
                select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    status: true,
                },
                orderBy: { nome: "asc" },
            });
            return res.status(200).json(colaboradores);
        } catch (error) {
            console.error("Erro ao listar colaboradores de óculos:", error);
            return res.status(500).json({ error: "Erro interno ao buscar colaboradores." });
        }
    }

    // CRIAR com trava de duplicidade
    async criar(req: Request, res: Response) {
        try {
            const { nome, tipo } = req.body;
            if (!nome || !tipo) {
                return res.status(400).json({ error: "Nome e tipo são obrigatórios." });
            }

            const nomeFormatado = nome.trim().toUpperCase();

            const colaboradorExistente = await prisma.colaboradorOculos.findFirst({
                where: { nome: nomeFormatado }
            });

            if (colaboradorExistente) {
                return res.status(400).json({
                    error: `O colaborador ${nomeFormatado} já existe no sistema. Reative-o caso esteja inativo.`
                });
            }

            const novo = await prisma.colaboradorOculos.create({
                data: {
                    nome: nomeFormatado,
                    tipo,
                    status: "ATIVO"
                },
                select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    status: true,
                }
            });
            return res.status(201).json(novo);
        } catch (error) {
            console.error("Erro ao criar colaborador de óculos:", error);
            return res.status(500).json({ error: "Erro interno ao criar colaborador." });
        }
    }

    // DESATIVAR (soft delete)
    async desativar(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };

            const desativado = await prisma.colaboradorOculos.update({
                where: { id },
                data: { status: "INATIVO" },
                select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    status: true,
                }
            });
            return res.status(200).json(desativado);
        } catch (error) {
            console.error("Erro ao desativar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao desativar colaborador." });
        }
    }

    // ATUALIZAR TIPO (e opcionalmente reativar/editar nome)
    // Este método é chamado tanto para atualização de tipo quanto para reativação (status)
    async atualizarTipo(req: Request, res: Response) {
        try {
            const { id } = req.params as { id: string };
            const { tipo, status, nome } = req.body;

            const dataToUpdate: any = {};

            if (tipo) {
                if (!["EFETIVO", "CONTRATADO"].includes(tipo)) {
                    return res.status(400).json({ error: "Tipo inválido. Use 'EFETIVO' ou 'CONTRATADO'." });
                }
                dataToUpdate.tipo = tipo;
            }

            if (status) {
                dataToUpdate.status = status;
            }

            if (nome) {
                dataToUpdate.nome = nome.trim().toUpperCase();
            }

            const atualizado = await prisma.colaboradorOculos.update({
                where: { id },
                data: dataToUpdate,
                select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    status: true,
                }
            });

            return res.status(200).json(atualizado);
        } catch (error: any) {
            console.error("Erro ao atualizar dados:", error);
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Colaborador não encontrado." });
            }
            return res.status(500).json({ error: "Erro interno ao atualizar dados." });
        }
    }
}