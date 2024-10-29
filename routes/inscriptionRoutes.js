import express from 'express';
import inscriptionController from '../controllers/inscriptionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// CREA NUEVA INSCRIPCION
router.post('/', inscriptionController.create);

// TRAE LAS INSCRIPCIONES DEL USUARIO AUTENTICADO
router.get('/my-inscriptions', inscriptionController.getUserInscriptions);

// TRAE TODOS LOS INSCRIPTOS DE UN SCHEDULE
router.get('/schedule/:scheduleId', inscriptionController.getScheduleInscriptions);

// CANCELA INSCRIPCION DEL USUARIO AUTENTICADO
router.delete('/schedule/:scheduleId', inscriptionController.cancelInscription);

// TRAE LA CANTIDAD DE CUPOS DISPONIBLES PARA UN SCHEDULE
router.get('/schedule/:scheduleId/available-spots')

export default router;