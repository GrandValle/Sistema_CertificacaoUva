// src/routes/documento.routes.ts
import { Router } from "express";
import { uploadConfig } from "../config/multer";
import { DocumentoController } from "../controllers/DocumentoController";

const documentoRoutes = Router();
const controller = new DocumentoController();

// A rota oficial que o front-end vai chamar no post:
documentoRoutes.post("/salvar", uploadConfig.single("excel"), controller.salvar);

// 2. Rota para LER O HISTÓRICO
documentoRoutes.get("/historico/:tipoTela", controller.listarHistorico);

// 3. 🟢 Rota para BAIXAR O EXCEL
documentoRoutes.get("/download/:idArquivo", controller.downloadExcel);

// 4. Rota para DELETAR (genérica, o controller decide qual método do service chamar)
documentoRoutes.delete("/controle_acesso/:id", (req, res) =>
    controller.deletarGenerico(req, res, "deletarControleAcesso"));

documentoRoutes.delete("/higienizacao_geral/:id", (req, res) =>
    controller.deletarGenerico(req, res, "deletarHigienizacaoGeral"));

documentoRoutes.delete("/manutencao_calibracao/:id", (req, res) =>
    controller.deletarGenerico(req, res, "deletarManutencaoCalibracao"));

documentoRoutes.delete("/conduta_higiene/:id", (req, res) =>
    controller.deletarGenerico(req, res, "deletarCondutaHigiene"));

documentoRoutes.delete("/controle_qualidade/:id", (req, res) =>
    controller.deletarGenerico(req, res, "deletarControleQualidade"));

documentoRoutes.delete("/estoque_material/:id", (req, res) =>
    controller.deletarGenerico(req, res, "deletarEstoqueMaterial"));

documentoRoutes.delete("/inspecao_operacional/:id", (req, res) =>
    controller.deletarGenerico(req, res, "deletarInspecaoOperacional"));

documentoRoutes.delete("/questionario_visitante/:id", (req, res) =>
    controller.deletarGenerico(req, res, "deletarQuestionarioVisitante"));

export default documentoRoutes;