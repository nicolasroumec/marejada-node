import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  createEventWithSchedules, 
  deleteEventById, 
  getAllEvents, 
  // getEventById 
  // updateEvent 
} from '../controllers/adminController.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para manejar errores
const errorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Ruta para servir el archivo admin.html
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Ruta para crear un evento con horarios
router.post('/events', errorHandler(createEventWithSchedules));

// Ruta para eliminar un evento y sus horarios asociados
router.delete('/events/:id', errorHandler(deleteEventById));

// Ruta para listar todos los eventos
router.get('/events', errorHandler(getAllEvents));

// Ruta para obtener un evento específico
// router.get('/events/:id', errorHandler(getEventById));

// Ruta para actualizar un evento
// router.put('/events/:id', errorHandler(updateEvent));

export default router;