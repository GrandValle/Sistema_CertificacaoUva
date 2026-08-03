import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./config/prisma";
import documentoRoutes from "./routes/documento.routes";
import produtoRoutes from "./routes/produtoRoutes";
import colaboradorRoutes from "./routes/colaboradorRoutes";
import oculosRoutes from "./routes/oculosRoutes";
import colaboradorLavagemRoutes from "./routes/colaboradorLavagemRoutes";
import relatorioRoutes from './routes/relatorioRoutes';

// Carrega as variáveis do arquivo .env
dotenv.config();

const app = express();

app.use(cors());

// Aumenta o limite do body do Express
app.use(express.json({ limit: "1gb" }));
app.use(express.urlencoded({ extended: true, limit: "1gb" }));

// Rotas
app.use("/api/documentos", documentoRoutes);
app.use("/api/produtos", produtoRoutes);
app.use("/api/oculos", oculosRoutes);
app.use("/api/colaboradores-tesoura", colaboradorRoutes);
app.use("/api/colaboradores-lavagem", colaboradorLavagemRoutes);
app.use('/api/relatorios', relatorioRoutes);

// Rota de teste
app.get("/", (req, res) => {
    res.json({ message: "API rodando perfeitamente! 🍇🚀" });
});

// Inicialização do servidor
const portNumber = 3019;

const server = app.listen(portNumber, () => {
    console.log(`🚀 Servidor rodando na porta ${portNumber}`);
});

// Define timeout de 10 minutos para suportar requisições longas de upload
server.timeout = 10 * 60 * 1000;