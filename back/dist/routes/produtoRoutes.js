"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ProdutoController_1 = require("../controllers/ProdutoController");
const produtoRoutes = (0, express_1.Router)();
const controller = new ProdutoController_1.ProdutoController();
produtoRoutes.post("/", controller.criar);
produtoRoutes.get("/", controller.listar);
produtoRoutes.put("/saldos", controller.atualizarSaldos); // 🟢 Nova rota para os saldos
exports.default = produtoRoutes;
