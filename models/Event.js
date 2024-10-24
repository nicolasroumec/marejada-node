//Los models abstraen como estan hechas las tablas de la base de datos de la aplicacion

import pool from '../config/database.js';

export const createEvent = async ({ name, description, author, location, photo, type, duration }) => {
    const query = `
        INSERT INTO events (name, description, author, location, photo, type, duration)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
    `;
    const values = [name, description, author, location, photo, type, duration];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const deleteEvent = async (eventId) => {
    await pool.query('DELETE FROM schedules WHERE event_id = $1', [eventId]);
    await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
};

export const listEvents = async () => {
    const query = `
        SELECT 
            e.*,
            json_agg(
                json_build_object(
                    'id', s.id,
                    'start_time', s.start_time,
                    'capacity', s.capacity
                )
            ) as schedules
        FROM events e
        LEFT JOIN schedules s ON e.id = s.event_id
        GROUP BY e.id
    `;
    const result = await pool.query(query);
    
    // Transformar null en array vacío cuando no hay horarios
    return result.rows.map(event => ({
        ...event,
        schedules: event.schedules[0] === null ? [] : event.schedules
    }));
};