import { PrismaClient } from '@prisma/client';

// Isso exporta a conexão para podermos usar em qualquer lugar do projeto
export const prisma = new PrismaClient();