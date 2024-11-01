import pool from '../config/database.js';

class Inscription {
    static async create({ userId, scheduleId }) {
        try {
            // Verificar si hay cupo disponible
            const [capacityCheck] = await pool.query(`
                SELECT s.capacity, COUNT(i.id) as current_inscriptions
                FROM schedules s
                LEFT JOIN inscriptions i ON s.id = i.schedule_id
                WHERE s.id = ?
                GROUP BY s.capacity
            `, [scheduleId]);

            if (!capacityCheck) {
                throw new Error('Horario no encontrado');
            }

            const { capacity, current_inscriptions } = capacityCheck;

            // Comparar la cantidad de inscripciones actuales con la capacidad
            if (parseInt(current_inscriptions) >= capacity) {
                throw new Error('No hay cupos disponibles');
            }

            // Verificar si el usuario ya está inscrito en este horario
            const [existingInscription] = await pool.query(
                'SELECT id FROM inscriptions WHERE user_id = ? AND schedule_id = ?',
                [userId, scheduleId]
            );

            // Si se encuentra un registro, arrojar el error
            if (existingInscription.length > 0) {
                throw new Error('Usuario ya inscrito en este horario');
            }

            // Si hay cupo y el usuario no está inscrito, agregar inscripción
            const [result] = await pool.query(
                'INSERT INTO inscriptions (user_id, schedule_id) VALUES (?, ?)',
                [userId, scheduleId]
            );

            // Obtener el ID de la inscripción creada
            const insertedId = result.insertId;
            return { id: insertedId, user_id: userId, schedule_id: scheduleId };

        } catch (error) {
            throw error;
        }
    }

    static async getByUserId(userId) {
        try {
            const [inscriptions] = await pool.query(`
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
                WHERE i.user_id = ?
            `, [userId]);

            return inscriptions;
        } catch (error) {
            throw error;
        }
    }

    static async getByScheduleId(scheduleId) {
        try {
            const [inscriptions] = await pool.query(`
                SELECT 
                    i.id as inscription_id,
                    u.id as user_id,
                    u.first_name,
                    u.last_name,
                    u.email
                FROM inscriptions i
                JOIN users u ON i.user_id = u.id
                WHERE i.schedule_id = ?
            `, [scheduleId]);

            return inscriptions;
        } catch (error) {
            throw error;
        }
    }

    static async delete(userId, scheduleId) {
        try {
            const [result] = await pool.query(
                'DELETE FROM inscriptions WHERE user_id = ? AND schedule_id = ?',
                [userId, scheduleId]
            );

            if (!result) {
                throw new Error('Inscripción no encontrada');
            }

            return result;
        } catch (error) {
            throw error;
        }
    }

    static async getAvailableSpots(scheduleId) {
        try {
            const [result] = await pool.query(`
                SELECT s.capacity - COUNT(i.id) AS available_spots
                FROM schedules s
                LEFT JOIN inscriptions i ON s.id = i.schedule_id
                WHERE s.id = ?
                GROUP BY s.capacity
            `, [scheduleId]);

            if (!result || result.length === 0) {
                throw new Error('Horario no encontrado');
            }

            const { available_spots } = result[0];
            return parseInt(available_spots);
        } catch (error) {
            throw error;
        }
    }
}

export default Inscription;