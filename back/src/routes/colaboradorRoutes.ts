// src/routes/colaboradorRoutes.ts
import { Router } from "express";
import { ColaboradorController } from "../controllers/ColaboradorController";

const colaboradorRoutes = Router();
const controller = new ColaboradorController();

colaboradorRoutes.get("/", controller.listar);
colaboradorRoutes.post("/", controller.criar);
colaboradorRoutes.put("/:id", controller.atualizar);
colaboradorRoutes.patch("/:id/desligar", controller.desligar);

export default colaboradorRoutes;