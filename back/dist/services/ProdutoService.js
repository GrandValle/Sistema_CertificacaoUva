"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProdutoService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ProdutoService {
    async criar(nome, tipo, unidade, quantidade) {
        const produtoExistente = await prisma.produto.findUnique({
            where: { nome },
        });
        if (produtoExistente) {
            throw new Error("Já existe um produto com este nome.");
        }
        return await prisma.produto.create({
            data: {
                nome,
                tipo,
                unidade,
                quantidade: quantidade || "0",
            },
        });
    }
    async listarPorTipo(tipo) {
        return await prisma.produto.findMany({
            where: { tipo },
            orderBy: { nome: "asc" },
        });
    }
    async atualizarSaldos(produtosAtualizados) {
        // Cria uma transação para atualizar o saldo de vários produtos de uma vez
        const transacoes = produtosAtualizados.map((produto) => prisma.produto.update({
            where: { nome: produto.nome },
            data: { quantidade: String(produto.quantidade) },
        }));
        return await prisma.$transaction(transacoes);
    }
}
exports.ProdutoService = ProdutoService;
