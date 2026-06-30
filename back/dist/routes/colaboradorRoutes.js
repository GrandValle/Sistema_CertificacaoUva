"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/colaboradorRoutes.ts
const express_1 = require("express");
const ColaboradorController_1 = require("../controllers/ColaboradorController");
const colaboradorRoutes = (0, express_1.Router)();
const controller = new ColaboradorController_1.ColaboradorController();
colaboradorRoutes.get("/", controller.listar);
colaboradorRoutes.post("/", controller.criar);
colaboradorRoutes.put("/:id", controller.atualizar);
colaboradorRoutes.patch("/:id/desligar", controller.desligar);
exports.default = colaboradorRoutes;
