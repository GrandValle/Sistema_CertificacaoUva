/*
  Warnings:

  - A unique constraint covering the columns `[setor,mes,ano,frequencia]` on the table `higienizacao_geral` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `frequencia` to the `higienizacao_geral` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `higienizacao_geral_setor_mes_ano_key` ON `higienizacao_geral`;

-- AlterTable
ALTER TABLE `higienizacao_geral` ADD COLUMN `frequencia` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `higienizacao_geral_setor_mes_ano_frequencia_key` ON `higienizacao_geral`(`setor`, `mes`, `ano`, `frequencia`);
