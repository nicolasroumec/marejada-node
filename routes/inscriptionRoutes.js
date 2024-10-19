import express from 'express';

const router = express.Router();
const inscriptionController = require('../controllers/inscriptionController');

// Ruta para inscribirse en un evento
router.post('/inscribe', inscriptionController.inscribeUser);

// Ruta para obtener todas las inscripciones de un usuario
router.get('/user/:id/inscriptions', inscriptionController.getUserInscriptions);

module.exports = router;