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

export const updateSchedule = async (id, scheduleData) => {
    const { startTime, capacity } = scheduleData;
    const query = `
        UPDATE schedules 
        SET start_time = $1, capacity = $2 
        WHERE id = $3 
        RETURNING *;
    `;
    const values = [startTime, capacity, id];
    const result = await pool.query(query, values);
    return result.rows[0];
};

export const deleteSchedule = async (id) => {
    const query = 'DELETE FROM schedules WHERE id = $1';
    await pool.query(query, [id]);
};

export const getSchedulesByEventId = async (eventId) => {
    const query = 'SELECT * FROM schedules WHERE event_id = $1';
    const result = await pool.query(query, [eventId]);
    return result.rows;
};