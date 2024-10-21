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
    
    return result.rows.map(event => ({
        ...event,
        schedules: event.schedules[0] === null ? [] : event.schedules
    }));
};

export const getEventById = async (id) => {
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
        WHERE e.id = $1
        GROUP BY e.id
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
        return null;
    }
    
    const event = result.rows[0];
    return {
        ...event,
        schedules: event.schedules[0] === null ? [] : event.schedules
    };
};

export const updateEvent = async (id, eventData) => {
    const { name, description, author, location, photo, type, duration } = eventData;
    const query = `
        UPDATE events 
        SET name = $1, description = $2, author = $3, location = $4, photo = $5, type = $6, duration = $7 
        WHERE id = $8 
        RETURNING *;
    `;
    const values = [name, description, author, location, photo, type, duration, id];
    const result = await pool.query(query, values);
    return result.rows[0];
};