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
export const getAllSchedulesWithEventInfo = async () => {
    try {
        const [schedules] = await pool.query(`
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
//Método para obtener un horario específico con info del evento
export const getScheduleWithEventInfo = async (scheduleId) => {
    try {
        const [schedules] = await pool.query(`
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
            WHERE s.id = ?
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
