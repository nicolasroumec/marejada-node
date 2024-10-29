import pool from '../config/database.js';

export const createEvent = async ({ name, description, author, location, photo, type, duration }) => {
    try {
        const [result] = await pool.query(
            'INSERT INTO events (name, description, author, location, photo, type, duration) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, author, location, photo, type, duration]
        );
        return {
            id: result.insertId,
            name,
            description,
            author,
            location,
            photo,
            type,
            duration
        };
    } catch (error) {
        throw error;
    }
};

export const deleteEvent = async (eventId) => {
    try {
        await pool.query('DELETE FROM schedules WHERE event_id = ?', [eventId]);
        await pool.query('DELETE FROM events WHERE id = ?', [eventId]);
    } catch (error) {
        throw error;
    }
};

export const listEvents = async () => {
    try {
        const [events] = await pool.query(`
            SELECT 
                e.*,
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', s.id,
                            'start_time', s.start_time,
                            'capacity', s.capacity
                        )
                    )
                    FROM schedules s
                    WHERE s.event_id = e.id
                ) as schedules
            FROM events e
        `);
        
        // Transformar null en array vacío cuando no hay horarios
        return events.map(event => ({
            ...event,
            schedules: event.schedules === null ? [] : JSON.parse(event.schedules)
        }));
    } catch (error) {
        throw error;
    }
};
