import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

console.log('Database Config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    console.log('Conexión exitosa a la base de datos');
    
    // Verificar que podemos hacer una consulta
    const result = await client.query('SELECT NOW()');
    console.log('Consulta de prueba exitosa:', result.rows[0]);
    
    client.release();
  } catch (err) {
    console.error('Error al conectar a la base de datos:', {
      message: err.message,
      code: err.code,
      detail: err.detail
    });
    if (client) client.release();
    throw err;
  }
}


// Agregamos un manejador de errores para el pool
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones:', err);
});

// Exportamos el pool y la función de prueba
export default pool;
export { testConnection };