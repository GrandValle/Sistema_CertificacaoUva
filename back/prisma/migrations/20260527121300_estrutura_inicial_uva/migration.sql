-- CreateTable
CREATE TABLE `ProcedimentoOperacional` (
    `id` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `revisadoPor` VARCHAR(191) NOT NULL,
    `dataRevisao` DATETIME(3) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProcedimentoOperacional_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentoExportado` (
    `id` VARCHAR(191) NOT NULL,
    `nomeArquivo` VARCHAR(191) NOT NULL,
    `tipoMime` VARCHAR(191) NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    `conteudo` MEDIUMBLOB NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `controleAcessoId` VARCHAR(191) NULL,
    `manutencaoId` VARCHAR(191) NULL,
    `condutaId` VARCHAR(191) NULL,
    `qualidadeId` VARCHAR(191) NULL,
    `estoqueId` VARCHAR(191) NULL,
    `inspecaoId` VARCHAR(191) NULL,
    `higienizacaoGeralId` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `controles_acesso` (
    `id` VARCHAR(191) NOT NULL,
    `mes` VARCHAR(191) NOT NULL,
    `setor` VARCHAR(191) NOT NULL,
    `registrosAcesso` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `procedimentoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `controles_acesso_setor_mes_key`(`setor`, `mes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manutencoes` (
    `id` VARCHAR(191) NOT NULL,
    `mes` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `frequencia` VARCHAR(191) NOT NULL,
    `dadosManutencao` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `procedimentoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `condutas_higiene` (
    `id` VARCHAR(191) NOT NULL,
    `semana` VARCHAR(191) NOT NULL,
    `aba` VARCHAR(191) NOT NULL,
    `dadosConduta` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `procedimentoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `controles_qualidade` (
    `id` VARCHAR(191) NOT NULL,
    `mes` VARCHAR(191) NOT NULL,
    `aba` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `dadosQualidade` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `procedimentoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estoques_almoxarifado` (
    `id` VARCHAR(191) NOT NULL,
    `mes` VARCHAR(191) NOT NULL,
    `aba` VARCHAR(191) NOT NULL,
    `dadosEstoque` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `procedimentoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inspecoes` (
    `id` VARCHAR(191) NOT NULL,
    `mes` VARCHAR(191) NOT NULL,
    `aba` VARCHAR(191) NOT NULL,
    `dadosInspecao` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `procedimentoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `higienizacoes_gerais` (
    `id` VARCHAR(191) NOT NULL,
    `setor` VARCHAR(191) NOT NULL,
    `mes` VARCHAR(191) NOT NULL,
    `ano` INTEGER NOT NULL,
    `registrosDiarios` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `procedimentoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `higienizacoes_gerais_setor_mes_ano_key`(`setor`, `mes`, `ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_controleAcessoId_fkey` FOREIGN KEY (`controleAcessoId`) REFERENCES `controles_acesso`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_manutencaoId_fkey` FOREIGN KEY (`manutencaoId`) REFERENCES `manutencoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_condutaId_fkey` FOREIGN KEY (`condutaId`) REFERENCES `condutas_higiene`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_qualidadeId_fkey` FOREIGN KEY (`qualidadeId`) REFERENCES `controles_qualidade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_estoqueId_fkey` FOREIGN KEY (`estoqueId`) REFERENCES `estoques_almoxarifado`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_inspecaoId_fkey` FOREIGN KEY (`inspecaoId`) REFERENCES `inspecoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_higienizacaoGeralId_fkey` FOREIGN KEY (`higienizacaoGeralId`) REFERENCES `higienizacoes_gerais`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `controles_acesso` ADD CONSTRAINT `controles_acesso_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manutencoes` ADD CONSTRAINT `manutencoes_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `condutas_higiene` ADD CONSTRAINT `condutas_higiene_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `controles_qualidade` ADD CONSTRAINT `controles_qualidade_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estoques_almoxarifado` ADD CONSTRAINT `estoques_almoxarifado_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspecoes` ADD CONSTRAINT `inspecoes_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `higienizacoes_gerais` ADD CONSTRAINT `higienizacoes_gerais_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
