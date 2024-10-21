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
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async update(id, userData) {
    const { first_name, last_name, email, school, year, course } = userData;
    try {
      const result = await pool.query(
        `UPDATE users 
         SET first_name = $1, last_name = $2, email = $3, school = $4, year = $5, course = $6
         WHERE id = $7
         RETURNING id, first_name, last_name, email, school, year, course`,
        [first_name, last_name, email, school, year, course, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

export default User;