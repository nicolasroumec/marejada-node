// import express from 'express';
// import inscriptionController from '../controllers/inscriptionController.js';
// import authMiddleware from '../middlewares/authMiddleware.js';

// const router = express.Router();

// router.use(authMiddleware);

// // CREA NUEVA INSCRIPCION
// router.post('/', inscriptionController.create);

// // TRAE LAS INSCRIPCIONES DEL USUARIO AUTENTICADO
// router.get('/my-inscriptions', inscriptionController.getUserInscriptions);

// // TRAE TODOS LOS INSCRIPTOS DE UN SCHEDULE
// router.get('/schedule/:scheduleId', inscriptionController.getScheduleInscriptions);

// // CANCELA INSCRIPCION DEL USUARIO AUTENTICADO
// router.delete('/schedule/:scheduleId', inscriptionController.cancelInscription);

// // TRAE LA CANTIDAD DE CUPOS DISPONIBLES PARA ESE SCHEDULE
// router.get('/schedule/:scheduleId/available-spots', inscriptionController.getAvailableSpots);
// export default router;

// routes/inscriptionRoutes.js
import express from 'express';
import inscriptionController from '../controllers/inscriptionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';  // Importación correcta para export default

const router = express.Router();

// Rutas protegidas con autenticación
router.post('/', authMiddleware, inscriptionController.create);
router.get('/user', authMiddleware, inscriptionController.getUserInscriptions);
router.get('/schedule/:scheduleId', inscriptionController.getScheduleInscriptions);
router.delete('/:scheduleId', inscriptionController.cancelInscription);

// Ruta pública
router.get('/available-spots/:scheduleId', inscriptionController.getAvailableSpots);

export default router;

