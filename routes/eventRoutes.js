import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createEventWithSchedules, deleteEventById, getAllEvents } from '../controllers/eventController.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta para servir el archivo admin.html
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

// Ruta para crear un evento con horarios
router.post('/event', createEventWithSchedules);

// Ruta para eliminar un evento y sus horarios asociados
router.delete('/event/:id', deleteEventById);

// Ruta para listar todos los eventos
router.get('/get-events', getAllEvents);

export default router;