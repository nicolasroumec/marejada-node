import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

console.log('Database Config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 10, // Similar a connectionLimit en MySQL
  idleTimeoutMillis: 30000, // Tiempo máximo de inactividad antes de cerrar la conexión
  connectionTimeoutMillis: 2000 // Tiempo máximo de espera para establecer una nueva conexión
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Conexión exitosa a la base de datos');
    client.release();
  } catch (err) {
    console.error('Error al conectar a la base de datos', err);
  }
}

// Agregamos un manejador de errores para el pool
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones:', err);
});

// Exportamos el pool y la función de prueba
export default pool;
export { testConnection };