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
        const query = `
            SELECT 
                e.*,
                COALESCE(
                    JSON_ARRAYAGG(
                        IF(s.id IS NOT NULL,
                            JSON_OBJECT(
                                'id', s.id,
                                'event_id', s.event_id,
                                'start_time', TIME_FORMAT(s.start_time, '%H:%i'),
                                'capacity', s.capacity
                            ),
                            NULL
                        )
                    ),
                    '[]'
                ) as schedules
            FROM events e
            LEFT JOIN schedules s ON e.id = s.event_id
            GROUP BY e.id
        `;
        
        const [events] = await pool.query(query);
        
        if (!events || events.length === 0) {
            return [];
        }

        const processedEvents = events.map(event => {
            try {
                const eventData = {
                    ...event,
                    schedules: event.schedules === 'NULL' || !event.schedules ? 
                              [] : 
                              JSON.parse(event.schedules)
                };
                
                if (Array.isArray(eventData.schedules)) {
                    eventData.schedules = eventData.schedules.filter(schedule => schedule !== null);
                }
                
                return eventData;
            } catch (parseError) {
                return {
                    ...event,
                    schedules: []
                };
            }
        });

        return processedEvents;

    } catch (error) {
        throw new Error(`Error en la consulta de eventos: ${error.message}`);
    }
};