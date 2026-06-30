/*
  Warnings:

  - You are about to drop the `condutas_higiene` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `controles_acesso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `controles_qualidade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `estoques_almoxarifado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `higienizacoes_gerais` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inspecoes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `manutencoes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `condutas_higiene` DROP FOREIGN KEY `condutas_higiene_procedimentoId_fkey`;

-- DropForeignKey
ALTER TABLE `controles_acesso` DROP FOREIGN KEY `controles_acesso_procedimentoId_fkey`;

-- DropForeignKey
ALTER TABLE `controles_qualidade` DROP FOREIGN KEY `controles_qualidade_procedimentoId_fkey`;

-- DropForeignKey
ALTER TABLE `documentoexportado` DROP FOREIGN KEY `DocumentoExportado_condutaId_fkey`;

-- DropForeignKey
ALTER TABLE `documentoexportado` DROP FOREIGN KEY `DocumentoExportado_controleAcessoId_fkey`;

-- DropForeignKey
ALTER TABLE `documentoexportado` DROP FOREIGN KEY `DocumentoExportado_estoqueId_fkey`;

-- DropForeignKey
ALTER TABLE `documentoexportado` DROP FOREIGN KEY `DocumentoExportado_higienizacaoGeralId_fkey`;

-- DropForeignKey
ALTER TABLE `documentoexportado` DROP FOREIGN KEY `DocumentoExportado_inspecaoId_fkey`;

-- DropForeignKey
ALTER TABLE `documentoexportado` DROP FOREIGN KEY `DocumentoExportado_manutencaoId_fkey`;

-- DropForeignKey
ALTER TABLE `documentoexportado` DROP FOREIGN KEY `DocumentoExportado_qualidadeId_fkey`;

-- DropForeignKey
ALTER TABLE `estoques_almoxarifado` DROP FOREIGN KEY `estoques_almoxarifado_procedimentoId_fkey`;

-- DropForeignKey
ALTER TABLE `higienizacoes_gerais` DROP FOREIGN KEY `higienizacoes_gerais_procedimentoId_fkey`;

-- DropForeignKey
ALTER TABLE `inspecoes` DROP FOREIGN KEY `inspecoes_procedimentoId_fkey`;

-- DropForeignKey
ALTER TABLE `manutencoes` DROP FOREIGN KEY `manutencoes_procedimentoId_fkey`;

-- DropTable
DROP TABLE `condutas_higiene`;

-- DropTable
DROP TABLE `controles_acesso`;

-- DropTable
DROP TABLE `controles_qualidade`;

-- DropTable
DROP TABLE `estoques_almoxarifado`;

-- DropTable
DROP TABLE `higienizacoes_gerais`;

-- DropTable
DROP TABLE `inspecoes`;

-- DropTable
DROP TABLE `manutencoes`;

-- CreateTable
CREATE TABLE `controle_acesso` (
    `id` VARCHAR(191) NOT NULL,
    `mes` VARCHAR(191) NOT NULL,
    `setor` VARCHAR(191) NOT NULL,
    `registrosAcesso` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `procedimentoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `controle_acesso_setor_mes_key`(`setor`, `mes`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manutencao_calibracao` (
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
CREATE TABLE `conduta_higiene` (
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
CREATE TABLE `controle_qualidade` (
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
CREATE TABLE `estoque_material` (
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
CREATE TABLE `inspecao_operacional` (
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
CREATE TABLE `higienizacao_geral` (
    `id` VARCHAR(191) NOT NULL,
    `setor` VARCHAR(191) NOT NULL,
    `mes` VARCHAR(191) NOT NULL,
    `ano` INTEGER NOT NULL,
    `registrosDiarios` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `procedimentoId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `higienizacao_geral_setor_mes_ano_key`(`setor`, `mes`, `ano`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_controleAcessoId_fkey` FOREIGN KEY (`controleAcessoId`) REFERENCES `controle_acesso`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_manutencaoId_fkey` FOREIGN KEY (`manutencaoId`) REFERENCES `manutencao_calibracao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_condutaId_fkey` FOREIGN KEY (`condutaId`) REFERENCES `conduta_higiene`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_qualidadeId_fkey` FOREIGN KEY (`qualidadeId`) REFERENCES `controle_qualidade`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_estoqueId_fkey` FOREIGN KEY (`estoqueId`) REFERENCES `estoque_material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_inspecaoId_fkey` FOREIGN KEY (`inspecaoId`) REFERENCES `inspecao_operacional`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_higienizacaoGeralId_fkey` FOREIGN KEY (`higienizacaoGeralId`) REFERENCES `higienizacao_geral`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `controle_acesso` ADD CONSTRAINT `controle_acesso_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manutencao_calibracao` ADD CONSTRAINT `manutencao_calibracao_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conduta_higiene` ADD CONSTRAINT `conduta_higiene_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `controle_qualidade` ADD CONSTRAINT `controle_qualidade_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estoque_material` ADD CONSTRAINT `estoque_material_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inspecao_operacional` ADD CONSTRAINT `inspecao_operacional_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `higienizacao_geral` ADD CONSTRAINT `higienizacao_geral_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
