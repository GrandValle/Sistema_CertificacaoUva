// src/services/relatorioService.ts
import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';

const prisma = new PrismaClient();

// ==========================================
// 📋 CONFIGURAÇÃO DOS MÓDULOS (ÚNICO LUGAR PARA ADICIONAR NOVOS)
// ==========================================

interface ModuloConfig {
    key: string;
    displayName: string;
    model: any;
    hasDocumentos?: boolean;
}

const MODULOS: ModuloConfig[] = [
    { key: 'higienizacaoGeral', displayName: 'Higienização Geral', model: prisma.higienizacaoGeral, hasDocumentos: true },
    { key: 'inspecaoOperacional', displayName: 'Inspeção Operacional', model: prisma.inspecaoOperacional, hasDocumentos: true },
    { key: 'estoqueMaterial', displayName: 'Estoque Material', model: prisma.estoqueMaterial, hasDocumentos: true },
    { key: 'controleQualidade', displayName: 'Controle Qualidade', model: prisma.controleQualidade, hasDocumentos: true },
    { key: 'condutaHigiene', displayName: 'Conduta Higiene', model: prisma.condutaHigiene, hasDocumentos: true },
    { key: 'manutencaoCalibracao', displayName: 'Manutenção/Calibração', model: prisma.manutencaoCalibracao, hasDocumentos: true },
    { key: 'controleAcesso', displayName: 'Controle Acesso', model: prisma.controleAcesso, hasDocumentos: true },
    { key: 'questionarioVisitante', displayName: 'Questionário Visitante', model: prisma.questionarioVisitante, hasDocumentos: true },
];

const MODULO_TIPO_MAP: Record<string, string> = Object.fromEntries(
    MODULOS.map(m => [m.key, m.displayName])
);

// ==========================================
// 📊 BUSCAR RELATÓRIOS UNIFICADOS
// ==========================================

export const buscarRelatoriosUnificados = async (inicio?: Date, fim?: Date) => {
    const filtroData = inicio && fim ? { criadoEm: { gte: inicio, lte: fim } } : {};
    const includeDocumentos = {
        documentos: {
            select: {
                id: true,
                nomeArquivo: true,
                tipoMime: true,
                conteudo: true,
                criadoEm: true
            }
        }
    };

    const resultados = await Promise.all(
        MODULOS.map(mod => {
            const where: any = { ...filtroData };
            if (mod.hasDocumentos) {
                where.documentos = { some: {} };
            }
            return mod.model.findMany({
                where,
                include: mod.hasDocumentos ? includeDocumentos : undefined,
            });
        })
    );

    const dados: Record<string, any[]> = {};
    MODULOS.forEach((mod, index) => {
        dados[mod.key] = resultados[index];
    });

    return dados;
};

// ==========================================
// 📦 GERAR ZIP COM OS ARQUIVOS EXCEL ORIGINAIS
// ==========================================

export const gerarZipRelatorios = async (inicio?: Date, fim?: Date, modulo?: string): Promise<Buffer> => {
    const dados = await buscarRelatoriosUnificados(inicio, fim);

    let todosDocumentos: Array<{ id: string; nomeArquivo: string; conteudo: Buffer; criadoEm: Date; tipo: string }> = [];
    for (const mod of MODULOS) {
        if (!mod.hasDocumentos) continue;
        const registros = dados[mod.key] || [];
        for (const registro of registros) {
            const docs = (registro as any).documentos || [];
            for (const doc of docs) {
                if (!doc.conteudo) {
                    console.warn(`Documento ${doc.id} sem conteúdo, ignorado.`);
                    continue;
                }
                todosDocumentos.push({
                    ...doc,
                    tipo: mod.displayName,
                });
            }
        }
    }

    let documentosFiltrados = todosDocumentos;
    if (modulo && MODULO_TIPO_MAP[modulo]) {
        const tipoEsperado = MODULO_TIPO_MAP[modulo];
        documentosFiltrados = todosDocumentos.filter(doc => doc.tipo === tipoEsperado);
    }

    if (documentosFiltrados.length === 0) {
        throw new Error(`Nenhum documento encontrado para ${modulo ? 'o módulo ' + modulo : 'o período selecionado'}.`);
    }

    // 🔥 Usando adm-zip para gerar o arquivo na memória
    const zip = new AdmZip();
    const usedNames: Record<string, number> = {};

    documentosFiltrados.forEach((doc) => {
        let fileName = doc.nomeArquivo;

        // Evita nomes duplicados de arquivos dentro do ZIP
        if (usedNames[fileName]) {
            const parts = fileName.split('.');
            const ext = parts.pop();
            fileName = `${parts.join('.')}_${usedNames[fileName]}.${ext}`;
            usedNames[doc.nomeArquivo]++;
        } else {
            usedNames[fileName] = 1;
        }

        // Adiciona o arquivo diretamente na memória do ZIP
        zip.addFile(fileName, doc.conteudo);
    });

    // Retorna o Buffer pronto para ser enviado ao Controller e baixado pelo usuário
    return zip.toBuffer();
};