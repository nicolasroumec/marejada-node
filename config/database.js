
import dotenv from 'dotenv';

dotenv.config();


console.log('Database Config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});



const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión exitosa a la base de datos');
    connection.release();
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