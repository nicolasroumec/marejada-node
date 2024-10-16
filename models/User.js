import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


class User {
  static async create(userData) {
    const { first_name, last_name, email, password, school, year, course } = userData;
    try {
      const result = await pool.query(
        `INSERT INTO users (first_name, last_name, email, password, school, year, course) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, first_name, last_name, email, school, year, course`,
        [first_name, last_name, email, password, school, year, course]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default User;