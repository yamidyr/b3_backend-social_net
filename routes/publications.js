import { Router } from "express";
import { testPublication } from "../controllers/publication.js";

const router = Router();

// Definir rutas de Publication
router.get('/test-publication',testPublication);

// Exportar el Router
export default router;