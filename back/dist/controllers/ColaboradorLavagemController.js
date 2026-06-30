"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ColaboradorLavagemController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ColaboradorLavagemController {
    // 🔥 CORREÇÃO 1: Listar TODOS os colaboradores (removido o filtro de apenas ativos)
    async listar(req, res) {
        try {
            // Agora ignoramos o filtro para que o frontend veja os desativados e possa reativá-los
            const colaboradores = await prisma.colaboradorLavagem.findMany({
                orderBy: { nome: "asc" },
            });
            // Adiciona campo textual 'status'
            const resultado = colaboradores.map(c => ({
                ...c,
                status: c.ativo ? "Ativo" : "Desligado"
            }));
            res.json(resultado);
        }
        catch (error) {
            console.error("Erro ao listar colaboradores:", error);
            res.status(500).json({ erro: "Erro ao listar colaboradores" });
        }
    }
    // 🔥 CORREÇÃO 2: Criar com trava de duplicidade
    async criar(req, res) {
        try {
            const { nome, tipo, ativo } = req.body;
            if (!nome || typeof nome !== "string" || !nome.trim()) {
                return res.status(400).json({ erro: "Nome é obrigatório e deve ser texto" });
            }
            const nomeFormatado = nome.trim().toUpperCase();
            // 🟢 TRAVA DE SEGURANÇA
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
                    tipo: tipo === "CONTRATADO" ? "CONTRATADO" : "EFETIVO", // se não enviar, padrão EFETIVO
                    ativo: ativo !== undefined ? Boolean(ativo) : true,
                },
            });
            res.status(201).json(colaborador);
        }
        catch (error) {
            console.error("Erro ao criar colaborador:", error);
            res.status(500).json({ erro: "Erro ao criar colaborador" });
        }
    }
    async atualizar(req, res) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== "string") {
                return res.status(400).json({ erro: "ID inválido" });
            }
            const { nome, tipo, ativo } = req.body;
            // Monta o objeto de dados dinamicamente
            const data = {};
            if (nome !== undefined) {
                if (typeof nome !== "string" || !nome.trim()) {
                    return res.status(400).json({ erro: "Nome deve ser texto não vazio" });
                }
                data.nome = nome.trim().toUpperCase(); // Garante que atualiza em maiúsculo
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
            if (Object.keys(data).length === 0) {
                return res.status(400).json({ erro: "Nenhum campo para atualizar" });
            }
            const colaborador = await prisma.colaboradorLavagem.update({
                where: { id },
                data,
            });
            res.json(colaborador);
        }
        catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ erro: "Colaborador não encontrado" });
            }
            console.error("Erro ao atualizar colaborador:", error);
            res.status(500).json({ erro: "Erro ao atualizar colaborador" });
        }
    }
    async desativar(req, res) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== "string") {
                return res.status(400).json({ erro: "ID inválido" });
            }
            const colaborador = await prisma.colaboradorLavagem.update({
                where: { id },
                data: { ativo: false },
            });
            res.json({ mensagem: "Colaborador desativado", colaborador });
        }
        catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ erro: "Colaborador não encontrado" });
            }
            console.error("Erro ao desativar colaborador:", error);
            res.status(500).json({ erro: "Erro ao desativar colaborador" });
        }
    }
    async reativar(req, res) {
        try {
            const { id } = req.params;
            if (!id || typeof id !== "string") {
                return res.status(400).json({ erro: "ID inválido" });
            }
            const colaborador = await prisma.colaboradorLavagem.update({
                where: { id },
                data: { ativo: true },
            });
            res.json({ mensagem: "Colaborador reativado", colaborador });
        }
        catch (error) {
            if (error.code === "P2025") {
                return res.status(404).json({ erro: "Colaborador não encontrado" });
            }
            console.error("Erro ao reativar colaborador:", error);
            res.status(500).json({ erro: "Erro ao reativar colaborador" });
        }
    }
}
exports.ColaboradorLavagemController = ColaboradorLavagemController;
