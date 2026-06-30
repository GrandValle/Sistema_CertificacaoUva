import { Router } from "express";
import { ColaboradorLavagemController } from "../controllers/ColaboradorLavagemController";

const router = Router();
const controller = new ColaboradorLavagemController();

// ==========================================
// 👤 COLABORADORES PARA LAVAGEM DE MÃOS
// ==========================================
router.get("/", controller.listar);
router.post("/", controller.criar);
router.put("/:id", controller.atualizar);
router.patch("/:id/desativar", controller.desativar);
router.patch("/:id/reativar", controller.reativar);

export default router;