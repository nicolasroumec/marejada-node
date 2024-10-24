import pool from '../config/database.js';

<<<<<<< HEAD
export const createInscription = async ({ id_user, id_schedule }) => {
    const query = `
        INSERT INTO inscriptions (id_users, id_schedules ) 
        VALUES ($1, $2)
        RETURNING *;
    `;
    const values = [id_user, id_schedule];
    const result = await pool.query(query, values);
    return result.rows[0];
};
=======
class Inscription {
    static async create({ userId, scheduleId }) {
        try {
            // Verificar si hay cupo disponible
            const capacityCheck = await pool.query(`
                SELECT s.capacity, COUNT(i.id) as current_inscriptions
                FROM schedules s
                LEFT JOIN inscriptions i ON s.id = i.schedule_id
                WHERE s.id = $1
                GROUP BY s.capacity
            `, [scheduleId]);

            if (capacityCheck.rows.length === 0) {
                throw new Error('Horario no encontrado');
            }

            const { capacity, current_inscriptions } = capacityCheck.rows[0];
            if (parseInt(current_inscriptions) >= capacity) {
                throw new Error('No hay cupos disponibles');
            }

            const existingInscription = await pool.query(
                'SELECT id FROM inscriptions WHERE user_id = $1 AND schedule_id = $2',
                [userId, scheduleId]
            );

            if (existingInscription.rows.length > 0) {
                throw new Error('Usuario ya inscrito en este horario');
            }

            const result = await pool.query(
                `INSERT INTO inscriptions (user_id, schedule_id)
                 VALUES ($1, $2)
                 RETURNING *`,
                [userId, scheduleId]
            );

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getByUserId(userId) {
        try {
            const result = await pool.query(`
                SELECT 
                    i.id as inscription_id,
                    e.id as event_id,
                    e.name as event_name,
                    e.description,
                    e.location,
                    e.type,
                    e.duration,
                    s.start_time,
                    s.capacity
                FROM inscriptions i
                JOIN schedules s ON i.schedule_id = s.id
                JOIN events e ON s.event_id = e.id
                WHERE i.user_id = $1
            `, [userId]);

            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async getByScheduleId(scheduleId) {
        try {
            const result = await pool.query(`
                SELECT 
                    i.id as inscription_id,
                    u.id as user_id,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM inscriptions i
                JOIN users u ON i.user_id = u.id
                WHERE i.schedule_id = $1
            `, [scheduleId]);

            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async delete(userId, scheduleId) {
        try {
            const result = await pool.query(
                'DELETE FROM inscriptions WHERE user_id = $1 AND schedule_id = $2 RETURNING *',
                [userId, scheduleId]
            );

            if (result.rows.length === 0) {
                throw new Error('Inscripción no encontrada');
            }

            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }
}

export default Inscription;
>>>>>>> 3e277e3c1c82e3a9eaf985f7ad2285b0d4fcd478
