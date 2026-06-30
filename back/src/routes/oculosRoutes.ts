import { Router } from "express";
import { OculosController } from "../controllers/OculosController"; // colaboradores
import { RegistroOculosController } from "../controllers/RegistroOculosController"; // registros

const router = Router();
const colabController = new OculosController();
const registroController = new RegistroOculosController();

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

export default router;