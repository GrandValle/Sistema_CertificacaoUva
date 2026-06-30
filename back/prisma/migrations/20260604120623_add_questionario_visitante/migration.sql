-- AlterTable
ALTER TABLE `documentoexportado` ADD COLUMN `questionarioVisitanteId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `produtos` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('QUIMICO', 'LIMPEZA') NOT NULL DEFAULT 'LIMPEZA',
    `unidade` VARCHAR(191) NOT NULL,
    `quantidade` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `produtos_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questionario_visitante` (
    `id` VARCHAR(191) NOT NULL,
    `data` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `empresa` VARCHAR(191) NOT NULL,
    `motivo` VARCHAR(191) NOT NULL,
    `respostas` JSON NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `procedimentoId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_questionarioVisitanteId_fkey` FOREIGN KEY (`questionarioVisitanteId`) REFERENCES `questionario_visitante`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questionario_visitante` ADD CONSTRAINT `questionario_visitante_procedimentoId_fkey` FOREIGN KEY (`procedimentoId`) REFERENCES `ProcedimentoOperacional`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
