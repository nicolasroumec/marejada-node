import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({  //Agarro la info del archivo .env
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testConnection() { //Testea la conexion de la db y arroja el mensaje adecuado
  try {
    const client = await pool.connect();
    console.log("Conexión exitosa a la base de datos");
    client.release();
  } catch (err) {
    console.error("Error al conectar a la base de datos", err);
  }
}

// Exportamos solo el pool por defecto
export default pool;
export { testConnection };
