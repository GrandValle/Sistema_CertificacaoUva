"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Isso exporta a conexão para podermos usar em qualquer lugar do projeto
exports.prisma = new client_1.PrismaClient();
