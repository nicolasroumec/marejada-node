import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import userRoutes from './routes/userRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import { sequelize } from './config/database.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve('public')));

// Rutas de API
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);

// Ruta para servir la página principal
app.get('/', (req, res) => {
    res.sendFile(path.resolve('public/index.html'));
});

// Sincronización de la base de datos
sequelize.sync()
  .then(() => console.log('Conexión a la base de datos establecida.'))
  .catch((error) => console.error('Error conectando a la base de datos:', error));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
