"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OculosController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class OculosController {
    // 🔥 LISTAR TODOS (ativos e inativos) para permitir reativação
    async listar(req, res) {
        try {
            const colaboradores = await prisma.colaboradorOculos.findMany({
                orderBy: { nome: "asc" },
            });
            return res.status(200).json(colaboradores);
        }
        catch (error) {
            console.error("Erro ao listar colaboradores de óculos:", error);
            return res.status(500).json({ error: "Erro interno ao buscar colaboradores." });
        }
    }
    // 🔥 CRIAR com trava de duplicidade
    async criar(req, res) {
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
            });
            return res.status(201).json(novo);
        }
        catch (error) {
            console.error("Erro ao criar colaborador de óculos:", error);
            return res.status(500).json({ error: "Erro interno ao criar colaborador." });
        }
    }
    // 🔥 DESATIVAR (soft delete)
    async desativar(req, res) {
        try {
            const { id } = req.params;
            const desativado = await prisma.colaboradorOculos.update({
                where: { id },
                data: { status: "INATIVO" },
            });
            return res.status(200).json(desativado);
        }
        catch (error) {
            console.error("Erro ao desativar colaborador:", error);
            return res.status(500).json({ error: "Erro interno ao desativar colaborador." });
        }
    }
    // 🔥 ATUALIZAR TIPO (e opcionalmente reativar/editar nome)
    async atualizarTipo(req, res) {
        try {
            const { id } = req.params;
            const { tipo, status, nome } = req.body;
            const dataToUpdate = {};
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
            });
            return res.status(200).json(atualizado);
        }
        catch (error) {
            console.error("Erro ao atualizar dados:", error);
            if (error.code === "P2025") {
                return res.status(404).json({ error: "Colaborador não encontrado." });
            }
            return res.status(500).json({ error: "Erro interno ao atualizar dados." });
        }
    }
}
exports.OculosController = OculosController;
