import { Router } from "express";
import { listUsers, login, profile, register, testUser, updateUser } from "../controllers/user.js";
import { ensureAuth } from "../middlewares/auth.js";

const router = Router();

// Definir rutas de user
router.get('/test-user', ensureAuth, testUser);
router.post('/register',register);
router.post('/login', login);
router.get('/profile/:id', ensureAuth, profile);
router.get('/list/:page?',ensureAuth, listUsers);
router.put('/update',ensureAuth,updateUser);

// Exportar el Router
export default router;