import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Middleware para manejar errores
const errorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Ruta para registrar un nuevo usuario
router.post('/register', errorHandler(authController.register));

// Ruta para iniciar sesión
router.post('/login', errorHandler(authController.login));

// Ruta para obtener información del usuario autenticado
router.get('/me', authMiddleware, errorHandler((req, res) => {
    res.json({ user: req.user });
}));

// Ruta para cerrar sesión (si es necesario)
router.post('/logout', authMiddleware, errorHandler(authController.logout));

export default router;