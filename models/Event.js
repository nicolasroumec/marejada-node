import pool from '../config/database.js';

export const createEvent = async ({ name, description, author, location, photo }) => {
    const query = `
        INSERT INTO events (name, description, author, location, photo)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
    `;
    const values = [name, description, author, location, photo];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const deleteEvent = async (eventId) => {
    // Borrar horarios asociados al evento
    await pool.query('DELETE FROM schedules WHERE event_id = $1', [eventId]);
    // Borrar el evento
    await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
};

export const listEvents = async () => {
    const result = await pool.query('SELECT * FROM events');
    return result.rows;
};