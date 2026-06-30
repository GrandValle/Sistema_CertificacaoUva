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


// Carrega as variáveis do arquivo .env (a URL do seu banco)
dotenv.config();

const app = express();

app.use(cors());

// Aumenta o limite para o back-end conseguir receber os Excels pesados
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

// No final do seu arquivo do back-end
const portNumber = Number(process.env.PORT || 3019);

// A função listen aceita: (port, hostname, callback)
app.listen(portNumber, () => {
    console.log(`🚀 Servidor rodando na porta ${portNumber}`);
});