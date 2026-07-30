import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ColaboradorController {
    /**
     * Lista TODOS os colaboradores (Ativos e Desligados)
     * Retorna campos essenciais + status e statusDetalhe.
     */
    async listar(req: Request, res: Response) {
        try {
            const colaboradores = await prisma.colaboradorTesoura.findMany({
                select: {
                    id: true,
                    nome: true,
                    numeroTesoura: true,
                    tipo: true,
                    statusTesoura: true,
                    status: true,        // 🔥 ADICIONADO
                    statusDetalhe: true, // 🔥 ADICIONADO
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
     * Cria um novo colaborador com valores padrão para status e statusDetalhe.
     */
    async criar(req: Request, res: Response) {
        try {
            const { nome, numeroTesoura, tipo, observacao } = req.body;

            if (!nome || nome.trim() === '') {
                return res.status(400).json({ error: "O campo Nome é obrigatório." });
            }
            if (!numeroTesoura || numeroTesoura.trim() === '') {
                return res.status(400).json({ error: "O campo Nº Tesoura é obrigatório." });
            }
            if (!tipo) {
                return res.status(400).json({ error: "O campo Tipo é obrigatório." });
            }

            const nomeFormatado = nome.trim().toUpperCase();
            const numeroFormatado = numeroTesoura.trim();

            const colaboradorExistente = await prisma.colaboradorTesoura.findFirst({
                where: { nome: nomeFormatado }
            });

            if (colaboradorExistente) {
                return res.status(400).json({
                    error: `O colaborador ${nomeFormatado} já existe no banco de dados. Use a rota de atualização (PUT) para reativá-lo.`
                });
            }

            const tesouraOcupada = await prisma.colaboradorTesoura.findFirst({
                where: {
                    numeroTesoura: numeroFormatado,
                    statusTesoura: "EM_USO"
                }
            });

            if (tesouraOcupada) {
                return res.status(400).json({
                    error: `O Nº Tesoura ${numeroFormatado} já está em uso por ${tesouraOcupada.nome}.`
                });
            }

            const novo = await prisma.colaboradorTesoura.create({
                data: {
                    nome: nomeFormatado,
                    numeroTesoura: numeroFormatado,
                    tipo,
                    observacao: observacao || "",
                    statusTesoura: "EM_USO",
                    status: "NORMAL",        // 🔥 ADICIONADO
                    statusDetalhe: "NORMAL", // 🔥 ADICIONADO
                },
                select: {
                    id: true,
                    nome: true,
                    numeroTesoura: true,
                    tipo: true,
                    statusTesoura: true,
                    status: true,
                    statusDetalhe: true,
                }
            });
            return res.status(201).json(novo);
        } catch (error) {
            console.error("Erro ao criar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao criar colaborador." });
        }
    }

    /**
     * Atualiza os dados de um colaborador, incluindo status e statusDetalhe.
     * Retorna os dados atualizados.
     */
    async atualizar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const colaboradorId = Array.isArray(id) ? id[0] : id;

            const { nome, numeroTesoura, tipo, observacao, statusTesoura, status, statusDetalhe } = req.body;

            if (nome !== undefined && (!nome || nome.trim() === '')) {
                return res.status(400).json({ error: "O campo Nome não pode ficar vazio." });
            }
            if (numeroTesoura !== undefined && (!numeroTesoura || numeroTesoura.trim() === '')) {
                return res.status(400).json({ error: "O campo Nº Tesoura não pode ficar vazio." });
            }

            const colaboradorExistente = await prisma.colaboradorTesoura.findUnique({
                where: { id: colaboradorId },
            });

            if (!colaboradorExistente) {
                return res.status(404).json({ error: "Colaborador não encontrado." });
            }

            const numeroFinal = numeroTesoura !== undefined ? numeroTesoura.trim() : colaboradorExistente.numeroTesoura;

            if (numeroFinal !== colaboradorExistente.numeroTesoura) {
                const tesouraOcupada = await prisma.colaboradorTesoura.findFirst({
                    where: {
                        numeroTesoura: numeroFinal,
                        id: { not: colaboradorId },
                        statusTesoura: "EM_USO"
                    }
                });

                if (tesouraOcupada) {
                    return res.status(400).json({
                        error: `O Nº Tesoura ${numeroFinal} já está em uso por ${tesouraOcupada.nome}.`
                    });
                }
            }

            const nomeFinal = nome !== undefined ? nome.trim().toUpperCase() : colaboradorExistente.nome;
            const tipoFinal = tipo !== undefined ? tipo : colaboradorExistente.tipo;
            const obsFinal = observacao !== undefined ? observacao : colaboradorExistente.observacao;
            const statusTesouraFinal = statusTesoura !== undefined ? statusTesoura : colaboradorExistente.statusTesoura;
            const statusFinal = status !== undefined ? status : (colaboradorExistente as any).status;
            const statusDetalheFinal = statusDetalhe !== undefined ? statusDetalhe : (colaboradorExistente as any).statusDetalhe;

            const atualizado = await prisma.colaboradorTesoura.update({
                where: { id: colaboradorId },
                data: {
                    nome: nomeFinal,
                    numeroTesoura: numeroFinal,
                    tipo: tipoFinal,
                    observacao: obsFinal,
                    statusTesoura: statusTesouraFinal,
                    status: statusFinal,
                    statusDetalhe: statusDetalheFinal,
                },
                select: {
                    id: true,
                    nome: true,
                    numeroTesoura: true,
                    tipo: true,
                    statusTesoura: true,
                    status: true,
                    statusDetalhe: true,
                }
            });
            return res.status(200).json(atualizado);
        } catch (error) {
            console.error("Erro ao atualizar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao atualizar colaborador." });
        }
    }

    /**
     * Soft Delete: marca o colaborador como "DESLIGADO" e devolve a tesoura.
     * Opcionalmente atualiza statusDetalhe para "DESLIGADO".
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
                data: {
                    tipo: "DESLIGADA",
                    statusTesoura: "DEVOLVIDA",
                    status: "NORMAL",          // Mantém ou define como NORMAL
                    statusDetalhe: "DESLIGADO" // Opcional: indica o motivo do desligamento
                },
                select: {
                    id: true,
                    nome: true,
                    numeroTesoura: true,
                    tipo: true,
                    statusTesoura: true,
                    status: true,
                    statusDetalhe: true,
                }
            });
            return res.status(200).json(desligado);
        } catch (error) {
            console.error("Erro ao desligar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao desligar colaborador." });
        }
    }
}