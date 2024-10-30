import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEventWithSchedules, deleteEventById, getAllEvents } from '../controllers/eventController.js'; // Asegúrate que la ruta es correcta

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta para servir el archivo admin.html
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Ruta para crear un evento con horarios
router.post('/events', createEventWithSchedules);

// Ruta para eliminar un evento y sus horarios asociados
router.delete('/events/:id', deleteEventById);

// Ruta para listar todos los eventos
router.get('/events', getAllEvents);

export default router;
