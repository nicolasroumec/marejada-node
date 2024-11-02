import pool from '../config/database.js';

export const createSchedule = async ({ eventId, startTime, capacity }) => {
    try {
        const { rows } = await pool.query(
            'INSERT INTO schedules (event_id, start_time, capacity) VALUES ($1, $2, $3) RETURNING *',
            [eventId, startTime, capacity]
        );
        const schedule = rows[0];
        return {
            id: schedule.id,
            event_id: schedule.event_id,
            start_time: schedule.start_time,
            capacity: schedule.capacity
        };
    } catch (error) {
        throw error;
    }
};

export const getAllSchedulesWithEventInfo = async () => {
    try {
        const { rows: schedules } = await pool.query(`
            SELECT 
                s.id as schedule_id,
                s.start_time,
                s.capacity,
                s.event_id,
                e.name,
                e.description,
                e.author,
                e.location,
                e.photo,
                e.type,
                e.duration
            FROM schedules s
            JOIN events e ON s.event_id = e.id
            ORDER BY s.start_time ASC
        `);
        
        return schedules.map(schedule => ({
            scheduleId: schedule.schedule_id,
            startTime: schedule.start_time,
            capacity: schedule.capacity,
            event: {
                id: schedule.event_id,
                name: schedule.name,
                description: schedule.description,
                author: schedule.author,
                location: schedule.location,
                photo: schedule.photo,
                type: schedule.type,
                duration: schedule.duration
            }
        }));
    } catch (error) {
        throw error;
    }
};

export const getScheduleWithEventInfo = async (scheduleId) => {
    try {
        const { rows: schedules } = await pool.query(`
            SELECT 
                s.id as schedule_id,
                s.start_time,
                s.capacity,
                s.event_id,
                e.name,
                e.description,
                e.author,
                e.location,
                e.photo,
                e.type,
                e.duration
            FROM schedules s
            JOIN events e ON s.event_id = e.id
            WHERE s.id = $1
        `, [scheduleId]);

        if (schedules.length === 0) {
            return null;
        }

        const schedule = schedules[0];
        return {
            scheduleId: schedule.schedule_id,
            startTime: schedule.start_time,
            capacity: schedule.capacity,
            event: {
                id: schedule.event_id,
                name: schedule.name,
                description: schedule.description,
                author: schedule.author,
                location: schedule.location,
                photo: schedule.photo,
                type: schedule.type,
                duration: schedule.duration
            }
        };
    } catch (error) {
        throw error;
    }
};