// src/config/multer.ts
import multer from "multer";

const storage = multer.memoryStorage();

// Limite de 60 Megabytes em bytes
const LIMITE_TAMANHO_BYTES = 60 * 1024 * 1024;

export const uploadConfig = multer({
    storage,
    limits: { fileSize: LIMITE_TAMANHO_BYTES }
});