import pool from '../config/database.js';

export const createInscription = async ({ id_users, id_schedules }) => {
    const query = `
        INSERT INTO inscription (id_users, id_schedules)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [id_users, id_schedules];
    const result = await pool.query(query, values);
    return result.rows[0];
};