import { Router } from "express";
import { ProdutoController } from "../controllers/ProdutoController";

const produtoRoutes = Router();
const controller = new ProdutoController();

produtoRoutes.post("/", controller.criar);
produtoRoutes.get("/", controller.listar);
produtoRoutes.put("/saldos", controller.atualizarSaldos); // 🟢 Nova rota para os saldos

export default produtoRoutes;