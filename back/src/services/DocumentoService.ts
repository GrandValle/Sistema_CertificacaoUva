import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class DocumentoService {
    async salvarGenerico(
        tipoTela: string,
        dados: any,
        file: Express.Multer.File,
    ) {
        const procedimento = await prisma.procedimentoOperacional.upsert({
            where: { codigo: dados.popCode || "GERAL" },
            update: {},
            create: {
                codigo: dados.popCode || "GERAL",
                titulo: dados.titulo || "Documento de Controle",
                revisadoPor: dados.revisadoPor || "Sistema",
                dataRevisao: new Date(),
            },
        });

        const dataAtual = new Date().toISOString().split("T")[0];
        const limpar = (str: string) =>
            str
                ? str
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/\W+/g, "_")
                    .toLowerCase()
                : "documento";

        const nomePadronizado = `${limpar(tipoTela)}_${limpar(dados.aba || dados.setor || dados.area || "sem_area")}_${dataAtual}.xlsx`;

        return await prisma.$transaction(
            async (tx) => {
                let registroId = "";
                let campoRelacao = "";

                switch (tipoTela) {
                    case "controle_acesso": {
                        const acesso = await tx.controleAcesso.create({
                            data: {
                                mes: dados.mes,
                                setor: dados.setor,
                                registrosAcesso:
                                    typeof dados.registrosAcesso === "string"
                                        ? dados.registrosAcesso
                                        : JSON.stringify(dados.registrosAcesso),
                                procedimentoId: procedimento.id,
                            },
                        });
                        registroId = acesso.id;
                        campoRelacao = "controleAcessoId";
                        break;
                    }

                    case "manutencao_calibracao": {
                        const mc = await tx.manutencaoCalibracao.create({
                            data: {
                                mes: dados.mes,
                                tipo: dados.tipo,
                                frequencia: dados.frequencia,
                                dadosManutencao:
                                    typeof dados.dadosManutencao === "string"
                                        ? dados.dadosManutencao
                                        : JSON.stringify(dados.dadosManutencao),
                                procedimentoId: procedimento.id,
                            },
                        });
                        registroId = mc.id;
                        campoRelacao = "manutencaoCalibracaoId";
                        break;
                    }

                    case "conduta_higiene": {
                        const ch = await tx.condutaHigiene.create({
                            data: {
                                semana: dados.semana,
                                aba: dados.aba,
                                dadosConduta:
                                    typeof dados.dadosConduta === "string"
                                        ? dados.dadosConduta
                                        : JSON.stringify(dados.dadosConduta),
                                procedimentoId: procedimento.id,
                            },
                        });
                        registroId = ch.id;
                        campoRelacao = "condutaHigieneId";
                        break;
                    }

                    case "controle_qualidade": {
                        const cq = await tx.controleQualidade.create({
                            data: {
                                mes: dados.mes,
                                aba: dados.aba,
                                status: dados.status,
                                dadosQualidade:
                                    typeof dados.dadosQualidade === "string"
                                        ? dados.dadosQualidade
                                        : JSON.stringify(dados.dadosQualidade),
                                procedimentoId: procedimento.id,
                            },
                        });
                        registroId = cq.id;
                        campoRelacao = "controleQualidadeId";
                        break;
                    }

                    case "estoque_material": {
                        const em = await tx.estoqueMaterial.create({
                            data: {
                                mes: dados.mes,
                                aba: dados.aba,
                                dadosEstoque:
                                    typeof dados.dadosEstoque === "string"
                                        ? dados.dadosEstoque
                                        : JSON.stringify(dados.dadosEstoque),
                                procedimentoId: procedimento.id,
                            },
                        });
                        registroId = em.id;
                        campoRelacao = "estoqueMaterialId";
                        break;
                    }

                    case "inspecao_operacional": {
                        const io = await tx.inspecaoOperacional.create({
                            data: {
                                mes: dados.mes,
                                aba: dados.aba,
                                setor: dados.setor || "",
                                dadosInspecao:
                                    typeof dados.dadosInspecao === "string"
                                        ? dados.dadosInspecao
                                        : JSON.stringify(dados.dadosInspecao),
                                procedimentoId: procedimento.id,
                            },
                        });
                        registroId = io.id;
                        campoRelacao = "inspecaoOperacionalId";
                        break;
                    }

                    case "higienizacao_geral": {
                        const registrosFormatados =
                            typeof dados.registrosDiarios === "string"
                                ? dados.registrosDiarios
                                : JSON.stringify(dados.registrosDiarios);

                        const hg = await tx.higienizacaoGeral.upsert({
                            where: {
                                setor_mes_ano_frequencia: {
                                    setor: dados.setor,
                                    mes: dados.mes,
                                    ano: Number(dados.ano),
                                    frequencia: dados.frequencia,
                                },
                            },
                            update: {
                                registrosDiarios: registrosFormatados,
                                status: dados.status,
                            },
                            create: {
                                setor: dados.setor,
                                mes: dados.mes,
                                ano: Number(dados.ano),
                                frequencia: dados.frequencia,
                                registrosDiarios: registrosFormatados,
                                status: dados.status,
                                procedimentoId: procedimento.id,
                            },
                        });
                        registroId = hg.id;
                        campoRelacao = "higienizacaoGeralId";
                        break;
                    }

                    case "questionario_visitante": {
                        const qv = await tx.questionarioVisitante.create({
                            data: {
                                data: dados.data,
                                nome: dados.nome,
                                empresa: dados.empresa,
                                motivo: dados.motivo,
                                respostas:
                                    typeof dados.respostas === "string"
                                        ? dados.respostas
                                        : JSON.stringify(dados.respostas),
                                procedimentoId: procedimento.id,
                            },
                        });
                        registroId = qv.id;
                        campoRelacao = "questionarioVisitanteId";
                        break;
                    }

                    default:
                        throw new Error(`Tipo de tela desconhecido: ${tipoTela}`);
                }

                await tx.documentoExportado.create({
                    data: {
                        nomeArquivo: nomePadronizado,
                        tipoMime: file.mimetype,
                        conteudo: file.buffer,
                        [campoRelacao]: registroId,
                    },
                });

                return { sucesso: true, id: registroId, tipo: tipoTela };
            },
            {
                maxWait: 10000,
                timeout: 30000,
            },
        );
    }

    async listarHistorico(tipoTela: string) {
        const includeDocumentos = {
            documentos: {
                select: {
                    id: true,
                    nomeArquivo: true,
                    criadoEm: true,
                },
            },
        };

        switch (tipoTela) {
            case "controle_acesso":
                return await prisma.controleAcesso.findMany({
                    orderBy: { criadoEm: "desc" },
                    include: includeDocumentos,
                });
            case "manutencao_calibracao":
                return await prisma.manutencaoCalibracao.findMany({
                    orderBy: { criadoEm: "desc" },
                    include: includeDocumentos,
                });
            case "conduta_higiene":
                return await prisma.condutaHigiene.findMany({
                    orderBy: { criadoEm: "desc" },
                    include: includeDocumentos,
                });
            case "controle_qualidade":
                return await prisma.controleQualidade.findMany({
                    orderBy: { criadoEm: "desc" },
                    include: includeDocumentos,
                });
            case "estoque_material":
                return await prisma.estoqueMaterial.findMany({
                    orderBy: { criadoEm: "desc" },
                    include: includeDocumentos,
                });
            case "inspecao_operacional":
                return await prisma.inspecaoOperacional.findMany({
                    orderBy: { criadoEm: "desc" },
                    include: includeDocumentos,
                });
            case "higienizacao_geral":
                return await prisma.higienizacaoGeral.findMany({
                    orderBy: { criadoEm: "desc" },
                    include: includeDocumentos,
                });
            case "questionario_visitante":
                return await prisma.questionarioVisitante.findMany({
                    orderBy: { criadoEm: "desc" },
                    include: includeDocumentos,
                });
            default:
                throw new Error(
                    `Tipo de tela desconhecido para histórico: ${tipoTela}`,
                );
        }
    }

    async baixarDocumento(idArquivo: string) {
        return await prisma.documentoExportado.findUnique({
            where: { id: idArquivo },
        });
    }

    async deletarControleAcesso(id: string) {
        await prisma.documentoExportado.deleteMany({
            where: { controleAcessoId: id },
        });
        return await prisma.controleAcesso.delete({ where: { id } });
    }

    async deletarManutencaoCalibracao(id: string) {
        await prisma.documentoExportado.deleteMany({
            where: { manutencaoCalibracaoId: id },
        });
        return await prisma.manutencaoCalibracao.delete({ where: { id } });
    }

    async deletarCondutaHigiene(id: string) {
        await prisma.documentoExportado.deleteMany({
            where: { condutaHigieneId: id },
        });
        return await prisma.condutaHigiene.delete({ where: { id } });
    }

    async deletarControleQualidade(id: string) {
        await prisma.documentoExportado.deleteMany({
            where: { controleQualidadeId: id },
        });
        return await prisma.controleQualidade.delete({ where: { id } });
    }

    async deletarEstoqueMaterial(id: string) {
        await prisma.documentoExportado.deleteMany({
            where: { estoqueMaterialId: id },
        });
        return await prisma.estoqueMaterial.delete({ where: { id } });
    }

    async deletarInspecaoOperacional(id: string) {
        await prisma.documentoExportado.deleteMany({
            where: { inspecaoOperacionalId: id },
        });
        return await prisma.inspecaoOperacional.delete({ where: { id } });
    }

    async deletarQuestionarioVisitante(id: string) {
        await prisma.documentoExportado.deleteMany({
            where: { questionarioVisitanteId: id },
        });
        return await prisma.questionarioVisitante.delete({ where: { id } });
    }

    async deletarHigienizacaoGeral(id: string) {
        await prisma.documentoExportado.deleteMany({
            where: { higienizacaoGeralId: id },
        });

        return await prisma.higienizacaoGeral.delete({ where: { id } });
    }
}