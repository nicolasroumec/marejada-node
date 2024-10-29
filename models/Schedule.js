import pool from '../config/database.js';

export const createSchedule = async ({ eventId, startTime, capacity }) => {
    try {
        const [result] = await pool.query(
            'INSERT INTO schedules (event_id, start_time, capacity) VALUES (?, ?, ?)',
            [eventId, startTime, capacity]
        );
        return {
            id: result.insertId,
            event_id: eventId,
            start_time: startTime,
            capacity
        };
    } catch (error) {
        throw error;
    }
};