"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColaboradorController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ColaboradorController {
    /**
     * Lista TODOS os colaboradores (Ativos e Desligados)
     * Isso é necessário para o frontend conseguir reativar quem já saiu.
     */
    async listar(req, res) {
        try {
            // 🟢 CORREÇÃO 1: Removido o where: { tipo: { not: "DESLIGADO" } }
            const colaboradores = await prisma.colaboradorTesoura.findMany({
                orderBy: { nome: "asc" },
            });
            return res.status(200).json(colaboradores);
        }
        catch (error) {
            console.error("Erro ao listar colaboradores:", error);
            return res.status(500).json({ error: "Erro interno ao buscar colaboradores." });
        }
    }
    /**
     * Cria um novo colaborador com trava de duplicidade
     */
    async criar(req, res) {
        try {
            const { nome, numeroTesoura, tipo, observacao } = req.body;
            if (!nome || !numeroTesoura || !tipo) {
                return res.status(400).json({ error: "Nome, número da tesoura e tipo são obrigatórios." });
            }
            const nomeFormatado = nome.trim().toUpperCase();
            // 🟢 CORREÇÃO 2: Trava de segurança no banco!
            // Verifica se já existe alguém com esse nome exato.
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
                    nome: nomeFormatado, // Garante que salva em maiúsculo
                    numeroTesoura,
                    tipo,
                    observacao: observacao || ""
                },
            });
            return res.status(201).json(novo);
        }
        catch (error) {
            console.error("Erro ao criar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao criar colaborador." });
        }
    }
    /**
     * Atualiza os dados de um colaborador (Usado também para REATIVAR)
     */
    async atualizar(req, res) {
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
            });
            return res.status(200).json(atualizado);
        }
        catch (error) {
            console.error("Erro ao atualizar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao atualizar colaborador." });
        }
    }
    /**
     * Soft Delete: marca o colaborador como "DESLIGADO"
     */
    async desligar(req, res) {
        try {
            const { id } = req.params;
            const colaboradorId = Array.isArray(id) ? id[0] : id;
            const colaborador = await prisma.colaboradorTesoura.findUnique({
                where: { id: colaboradorId },
            });
            if (!colaborador) {
                return res.status(404).json({ error: "Colaborador não encontrado." });
            }
            // Tratando também o caso feminino para não dar erro
            if (colaborador.tipo === "DESLIGADO" || colaborador.tipo === "DESLIGADA") {
                return res.status(200).json({ message: "Colaborador já está desligado." });
            }
            const desligado = await prisma.colaboradorTesoura.update({
                where: { id: colaboradorId },
                data: { tipo: "DESLIGADA" }, // Salvando como DESLIGADA como conversamos
            });
            return res.status(200).json(desligado);
        }
        catch (error) {
            console.error("Erro ao desligar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao desligar colaborador." });
        }
    }
}
exports.ColaboradorController = ColaboradorController;
