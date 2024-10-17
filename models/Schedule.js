import pool from '../config/database.js';

export const createSchedule = async ({ eventId, startTime, capacity }) => {
    const query = `
        INSERT INTO schedules (event_id, start_time, capacity)
        VALUES ($1, $2, $3)
        RETURNING *;
    `;
    const values = [eventId, startTime, capacity];
    const result = await pool.query(query, values);
    return result.rows[0];
};
