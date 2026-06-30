import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ColaboradorController {
    /**
     * Lista TODOS os colaboradores (Ativos e Desligados)
     * Isso é necessário para o frontend conseguir reativar quem já saiu.
     * Retorna apenas os campos essenciais: id, nome, numeroTesoura, tipo.
     */
    async listar(req: Request, res: Response) {
        try {
            const colaboradores = await prisma.colaboradorTesoura.findMany({
                select: {
                    id: true,
                    nome: true,
                    numeroTesoura: true,
                    tipo: true,
                },
                orderBy: { nome: "asc" },
            });
            return res.status(200).json(colaboradores);
        } catch (error) {
            console.error("Erro ao listar colaboradores:", error);
            return res.status(500).json({ error: "Erro interno ao buscar colaboradores." });
        }
    }

    /**
     * Cria um novo colaborador com trava de duplicidade
     * Retorna os dados essenciais do novo registro.
     */
    async criar(req: Request, res: Response) {
        try {
            const { nome, numeroTesoura, tipo, observacao } = req.body;
            if (!nome || !numeroTesoura || !tipo) {
                return res.status(400).json({ error: "Nome, número da tesoura e tipo são obrigatórios." });
            }

            const nomeFormatado = nome.trim().toUpperCase();

            const colaboradorExistente = await prisma.colaboradorTesoura.findFirst({
                where: { nome: nomeFormatado }
            });

            if (colaboradorExistente) {
                return res.status(400).json({
                    error: `O colaborador ${nomeFormatado} já existe no banco de dados. Use a rota de atualização (PUT) para reativá-lo.`
                });
            }

            const novo = await prisma.colaboradorTesoura.create({
                data: {
                    nome: nomeFormatado,
                    numeroTesoura,
                    tipo,
                    observacao: observacao || ""
                },
                select: {
                    id: true,
                    nome: true,
                    numeroTesoura: true,
                    tipo: true,
                }
            });
            return res.status(201).json(novo);
        } catch (error) {
            console.error("Erro ao criar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao criar colaborador." });
        }
    }

    /**
     * Atualiza os dados de um colaborador (Usado também para REATIVAR)
     * Retorna os dados essenciais atualizados.
     */
    async atualizar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const colaboradorId = Array.isArray(id) ? id[0] : id;

            const { nome, numeroTesoura, tipo, observacao } = req.body;

            const colaboradorExistente = await prisma.colaboradorTesoura.findUnique({
                where: { id: colaboradorId },
            });

            if (!colaboradorExistente) {
                return res.status(404).json({ error: "Colaborador não encontrado." });
            }

            const atualizado = await prisma.colaboradorTesoura.update({
                where: { id: colaboradorId },
                data: {
                    nome: nome !== undefined ? nome.trim().toUpperCase() : colaboradorExistente.nome,
                    numeroTesoura: numeroTesoura !== undefined ? numeroTesoura : colaboradorExistente.numeroTesoura,
                    tipo: tipo !== undefined ? tipo : colaboradorExistente.tipo,
                    observacao: observacao !== undefined ? observacao : colaboradorExistente.observacao,
                },
                select: {
                    id: true,
                    nome: true,
                    numeroTesoura: true,
                    tipo: true,
                }
            });
            return res.status(200).json(atualizado);
        } catch (error) {
            console.error("Erro ao atualizar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao atualizar colaborador." });
        }
    }

    /**
     * Soft Delete: marca o colaborador como "DESLIGADO"
     * Retorna os dados essenciais do colaborador desligado.
     */
    async desligar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const colaboradorId = Array.isArray(id) ? id[0] : id;

            const colaborador = await prisma.colaboradorTesoura.findUnique({
                where: { id: colaboradorId },
            });
            if (!colaborador) {
                return res.status(404).json({ error: "Colaborador não encontrado." });
            }

            if (colaborador.tipo === "DESLIGADO" || colaborador.tipo === "DESLIGADA") {
                return res.status(200).json({ message: "Colaborador já está desligado." });
            }

            const desligado = await prisma.colaboradorTesoura.update({
                where: { id: colaboradorId },
                data: { tipo: "DESLIGADA" },
                select: {
                    id: true,
                    nome: true,
                    numeroTesoura: true,
                    tipo: true,
                }
            });
            return res.status(200).json(desligado);
        } catch (error) {
            console.error("Erro ao desligar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao desligar colaborador." });
        }
    }
}