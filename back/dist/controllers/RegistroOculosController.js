"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistroOculosController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class RegistroOculosController {
    // 🔥 LISTAR REGISTROS ATIVOS
    async listar(req, res) {
        try {
            const registros = await prisma.registroOculos.findMany({
                where: { status: "ATIVO" },
                orderBy: { data: "desc" },
            });
            res.json(registros);
        }
        catch (error) {
            console.error("Erro ao listar registros:", error);
            res.status(500).json({ error: "Erro interno ao buscar registros." });
        }
    }
    // 🔥 CRIAR NOVO REGISTRO
    async criar(req, res) {
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
            });
            res.status(201).json(novo);
        }
        catch (error) {
            console.error("Erro ao criar registro:", error);
            res.status(500).json({ error: "Erro interno ao criar registro." });
        }
    }
    // 🔥 ATUALIZAR REGISTRO
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            const { data, colaboradorId, intacto, assinatura, observacao } = req.body;
            const atualizado = await prisma.registroOculos.update({
                where: { id },
                data: { data, colaboradorId, intacto, assinatura, observacao },
            });
            res.json(atualizado);
        }
        catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Registro não encontrado." });
            }
            console.error("Erro ao atualizar registro:", error);
            res.status(500).json({ error: "Erro interno ao atualizar registro." });
        }
    }
    // 🔥 DESATIVAR REGISTRO (soft delete)
    async desativar(req, res) {
        try {
            const { id } = req.params;
            const desativado = await prisma.registroOculos.update({
                where: { id },
                data: { status: "INATIVO" },
            });
            res.json(desativado);
        }
        catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Registro não encontrado." });
            }
            console.error("Erro ao desativar registro:", error);
            res.status(500).json({ error: "Erro interno ao desativar registro." });
        }
    }
}
exports.RegistroOculosController = RegistroOculosController;
