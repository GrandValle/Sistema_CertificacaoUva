"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OculosController_1 = require("../controllers/OculosController"); // colaboradores
const RegistroOculosController_1 = require("../controllers/RegistroOculosController"); // registros
const router = (0, express_1.Router)();
const colabController = new OculosController_1.OculosController();
const registroController = new RegistroOculosController_1.RegistroOculosController();
// ROTAS PARA COLABORADORES DE ÓCULOS
router.get("/colaboradores", colabController.listar);
router.post("/colaboradores", colabController.criar);
router.patch("/colaboradores/:id/desativar", colabController.desativar);
router.patch("/colaboradores/:id/tipo", colabController.atualizarTipo);
router.put("/colaboradores/:id", colabController.atualizarTipo);
// ROTAS PARA REGISTROS DE ÓCULOS
router.get("/registros", registroController.listar);
router.post("/registros", registroController.criar);
router.put("/registros/:id", registroController.atualizar);
router.patch("/registros/:id/desativar", registroController.desativar);
exports.default = router;
