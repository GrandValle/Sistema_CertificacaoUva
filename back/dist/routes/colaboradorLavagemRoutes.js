"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ColaboradorLavagemController_1 = require("../controllers/ColaboradorLavagemController");
const router = (0, express_1.Router)();
const controller = new ColaboradorLavagemController_1.ColaboradorLavagemController();
// ==========================================
// 👤 COLABORADORES PARA LAVAGEM DE MÃOS
// ==========================================
router.get("/", controller.listar);
router.post("/", controller.criar);
router.put("/:id", controller.atualizar);
router.patch("/:id/desativar", controller.desativar);
router.patch("/:id/reativar", controller.reativar);
exports.default = router;
