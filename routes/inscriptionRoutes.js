import express from 'express';
import { inscribeUser, getUserInscriptions } from '../controllers/inscriptionController.js'

const router = express.Router();

// Ruta para inscribirse en un evento
router.post('/inscribe', inscribeUser);

// Ruta para obtener todas las inscripciones de un usuario
router.get('/user/:id/inscriptions', getUserInscriptions);

export default router;