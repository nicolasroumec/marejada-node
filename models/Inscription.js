import pool from '../config/database.js';

export const createInscription = async ({ id_user, id_schedule }) => {
    const query = `
        INSERT INTO inscriptions (id_users, id_schedules ) 
        VALUES ($1, $2)
        RETURNING *;
    `;
    const values = [id_user, id_schedule];
    const result = await pool.query(query, values);
    return result.rows[0];
};