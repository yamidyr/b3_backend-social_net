import { Router } from "express";
import { saveFollow, testFollow } from "../controllers/follow.js";
import { ensureAuth } from "../middlewares/auth.js";

const router = Router();

// Definir rutas de follows
router.get('/test-follow',testFollow);
router.post('/follow',ensureAuth,saveFollow)

// Exportar el Router
export default router;