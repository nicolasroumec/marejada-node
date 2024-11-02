import pool from '../config/database.js';

class User {
  static async create(userData) {
    const { first_name, last_name, email, password, school, year, course } = userData;
    try {
      const { rows } = await pool.query(
        'INSERT INTO users (first_name, last_name, email, password, school, year, course) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [first_name, last_name, email, password, school, year, course]
      );
      const user = rows[0];
      return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        school: user.school,
        year: user.year,
        course: user.course
      };
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

export default User;