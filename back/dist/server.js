"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const documento_routes_1 = __importDefault(require("./routes/documento.routes"));
const produtoRoutes_1 = __importDefault(require("./routes/produtoRoutes"));
const colaboradorRoutes_1 = __importDefault(require("./routes/colaboradorRoutes"));
const oculosRoutes_1 = __importDefault(require("./routes/oculosRoutes"));
const colaboradorLavagemRoutes_1 = __importDefault(require("./routes/colaboradorLavagemRoutes"));
// Carrega as variáveis do arquivo .env (a URL do seu banco)
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Aumenta o limite para o back-end conseguir receber os Excels pesados
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
app.use("/api/documentos", documento_routes_1.default);
app.use("/api/produtos", produtoRoutes_1.default);
app.use("/api/oculos", oculosRoutes_1.default);
app.use("/api/colaboradores-tesoura", colaboradorRoutes_1.default);
app.use("/api/colaboradores-lavagem", colaboradorLavagemRoutes_1.default);
// Rota de teste
app.get("/", (req, res) => {
    res.json({ message: "API Packing de Uva rodando perfeitamente! 🍇🚀" });
});
// No final do seu arquivo do back-end
const portNumber = Number(process.env.PORT || 3019);
// A função listen aceita: (port, hostname, callback)
app.listen(portNumber, () => {
    console.log(`🚀 Servidor rodando na porta ${portNumber}`);
});
