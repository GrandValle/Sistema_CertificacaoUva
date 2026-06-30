import { PrismaClient, TipoEstoque } from "@prisma/client";

const prisma = new PrismaClient();

export class ProdutoService {
    async criar(nome: string, tipo: TipoEstoque, unidade: string, quantidade?: string) {
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

    async listarPorTipo(tipo: TipoEstoque) {
        return await prisma.produto.findMany({
            where: { tipo },
            orderBy: { nome: "asc" },
        });
    }

    async atualizarSaldos(produtosAtualizados: any[]) {
        // Cria uma transação para atualizar o saldo de vários produtos de uma vez
        const transacoes = produtosAtualizados.map((produto) =>
            prisma.produto.update({
                where: { nome: produto.nome },
                data: { quantidade: String(produto.quantidade) },
            })
        );

        return await prisma.$transaction(transacoes);
    }
}