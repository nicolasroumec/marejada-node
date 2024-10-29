import pool from '../config/database.js';

class User {
  static async create(userData) {
    const { first_name, last_name, email, password, school, year, course } = userData;
    try {
      const [result] = await pool.query(
        'INSERT INTO users (first_name, last_name, email, password, school, year, course) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, password, school, year, course]
      );
      return {
        id: result.insertId,
        first_name,
        last_name,
        email,
        school,
        year,
        course
      };
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default User;
