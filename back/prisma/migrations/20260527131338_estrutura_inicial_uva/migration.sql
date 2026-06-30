/*
  Warnings:

  - You are about to drop the column `manutencaoId` on the `documentoexportado` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `documentoexportado` DROP FOREIGN KEY `DocumentoExportado_manutencaoId_fkey`;

-- AlterTable
ALTER TABLE `documentoexportado` DROP COLUMN `manutencaoId`,
    ADD COLUMN `manutencaoCalibracaoId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `DocumentoExportado` ADD CONSTRAINT `DocumentoExportado_manutencaoCalibracaoId_fkey` FOREIGN KEY (`manutencaoCalibracaoId`) REFERENCES `manutencao_calibracao`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
