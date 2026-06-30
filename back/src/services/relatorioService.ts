// src/services/relatorioService.ts
import { PrismaClient } from '@prisma/client';
import { PassThrough } from 'stream';

// 🔹 (Opcional) Importa apenas o tipo Archiver para tipar a variável 'archive'
//    Se preferir, pode deixar comentado e usar 'any' no lugar.
// import type { Archiver } from 'archiver';

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

    // 🔥 IMPORTAÇÃO DINÂMICA DO 'ARCHIVER' (ESM)
    const archiverModule = await import('archiver');
    // ✅ Correção: afirmamos explicitamente que o default é uma função
    const archiver = archiverModule.default as (format: string, options?: any) => any;

    return new Promise<Buffer>((resolve, reject) => {
        const buffers: any[] = [];
        const output = new PassThrough();

        output.on('data', (data) => buffers.push(data));
        output.on('end', () => resolve(Buffer.concat(buffers)));

        // Agora o TypeScript não reclama, pois 'archiver' é tratado como função
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(output);

        const usedNames: Record<string, number> = {};

        documentosFiltrados.forEach((doc) => {
            let fileName = doc.nomeArquivo;
            if (usedNames[fileName]) {
                const parts = fileName.split('.');
                const ext = parts.pop();
                fileName = `${parts.join('.')}_${usedNames[fileName]}.${ext}`;
                usedNames[doc.nomeArquivo]++;
            } else {
                usedNames[fileName] = 1;
            }
            archive.append(doc.conteudo, { name: fileName });
        });

        archive.on('error', (err: any) => reject(err));
        archive.finalize();
    });
};