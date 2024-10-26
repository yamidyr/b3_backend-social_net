import { Router } from "express";
import { deletePublication, publicationsUser, savePublication, showPublication, testPublication, uploadMedia } from "../controllers/publication.js";
import { ensureAuth } from "../middlewares/auth.js";
import multer from 'multer';
import { CloudinaryStorage } from "multer-storage-cloudinary";
import pkg from 'cloudinary';
const {v2: cloudinary } = pkg;

// Configuración de subida de archivos en Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'publications',
        allowedFormats: ['jpg', 'png', 'jpeg', 'gif'], // formatos permitidos
        public_id: (req,file) => 'publication-' + Date.now()
    }
});

// Configurar multer con límites de tamaño de archivos
const uploads = multer({
    storage: storage,
    limits: { fileSize: 1 * 1024 * 1024} // limitar tamaño a 1 MB
});

const router = Router();

// Definir rutas de Publication
router.get('/test-publication', ensureAuth,testPublication);
router.post('/new-publication',ensureAuth, savePublication );
router.get('/show-publication/:id',ensureAuth,showPublication);
router.delete('/delete-publication/:id',ensureAuth,deletePublication);
router.get('/publications-user/:id/:page?',ensureAuth, publicationsUser);
router.post('/upload-media/:id',[ensureAuth,uploads.single("file0")],uploadMedia);

// Exportar el Router
export default router;