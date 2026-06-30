"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadConfig = void 0;
// src/config/multer.ts
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
// Limite de 60 Megabytes em bytes
const LIMITE_TAMANHO_BYTES = 60 * 1024 * 1024;
exports.uploadConfig = (0, multer_1.default)({
    storage,
    limits: { fileSize: LIMITE_TAMANHO_BYTES }
});
