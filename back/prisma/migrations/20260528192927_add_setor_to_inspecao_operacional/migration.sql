/*
  Warnings:

  - Added the required column `setor` to the `inspecao_operacional` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `inspecao_operacional` ADD COLUMN `setor` VARCHAR(191) NOT NULL;
