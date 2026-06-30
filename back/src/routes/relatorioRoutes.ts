import { Router } from 'express';
import { getRelatorios, exportarRelatorio } from '../controllers/relatorioController';

const router = Router();

router.get('/', getRelatorios); // <--- Mude para / (raiz do router)
router.get('/exportar-zip', exportarRelatorio);


export default router;