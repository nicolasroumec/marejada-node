// models/Inscription.js
import pool from '../config/database.js';
import nodemailer from 'nodemailer';

class Inscription {
    static async create({ userId, scheduleId }) {
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
    
            // Verificar conflicto de horario
            const [timeConflict] = await connection.query(`
                SELECT i.id 
                FROM inscriptions i
                JOIN schedules s1 ON i.schedule_id = s1.id
                JOIN schedules s2 ON s2.id = ?
                WHERE i.user_id = ? 
                AND s1.start_time = s2.start_time
            `, [scheduleId, userId]);
    
            if (timeConflict && timeConflict.length > 0) {
                throw new Error('Ya estás inscrito en otro evento en este horario');
            }
    
            // Verificar cupo disponible
            const [capacityCheckResult] = await connection.query(`
                SELECT s.capacity, COUNT(i.id) AS current_inscriptions
                FROM schedules s
                LEFT JOIN inscriptions i ON s.id = i.schedule_id
                WHERE s.id = ?
                GROUP BY s.capacity
            `, [scheduleId]);
    
            if (!capacityCheckResult || capacityCheckResult.length === 0) {
                throw new Error('Horario no encontrado');
            }
    
            // Acceder a los datos de capacidad y cantidad de inscripciones actuales
            const { capacity, current_inscriptions } = capacityCheckResult[0];
    
            if (parseInt(current_inscriptions) >= capacity) {
                throw new Error('No hay cupos disponibles');
            }
    
            // Crear inscripción
            const [result] = await connection.query(
                'INSERT INTO inscriptions (user_id, schedule_id) VALUES (?, ?)',
                [userId, scheduleId]
            );
    
            // Confirmar la transacción
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }    

    static async sendConfirmationEmail(info) {
        // Solo intentar enviar email si están configuradas las credenciales
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('Credenciales de email no configuradas, saltando envío de email');
            return;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: info.email,
            subject: `Confirmación de inscripción - ${info.name}`,
            html: `
                <h1>¡Hola ${info.first_name}!</h1>
                <p>Tu inscripción al evento "${info.name}" ha sido confirmada.</p>
                <p><strong>Detalles del evento:</strong></p>
                <ul>
                    <li>Fecha y hora: ${new Date(info.start_time).toLocaleString()}</li>
                    <li>Ubicación: ${info.location}</li>
                </ul>
                <p>¡Te esperamos!</p>
            `
        };

        return transporter.sendMail(mailOptions);
    }

    // static async getByUserId(userId) {
    //     try {
    //         const [inscriptions] = await pool.query(`
    //             SELECT 
    //                 i.id as inscription_id,
    //                 e.id as event_id,
    //                 e.name as event_name,
    //                 e.description,
    //                 e.location,
    //                 e.type,
    //                 e.duration,
    //                 s.start_time,
    //                 s.capacity
    //             FROM inscriptions i
    //             JOIN schedules s ON i.schedule_id = s.id
    //             JOIN events e ON s.event_id = e.id
    //             WHERE i.user_id = ?
    //         `, [userId]);

    //         return inscriptions;
    //     } catch (error) {
    //         throw error;
    //     }
    // }

    // En Inscription.js, ajusta el getByUserId:
static async getByUserId(userId) {
    try {
        const [inscriptions] = await pool.query(`
 SELECT 
    i.id as inscription_id,
    s.id as schedule_id,
    e.name as event_name,
    e.description,
    e.location,
    e.type,
    e.duration,
    s.start_time as event_time,
    s.capacity
FROM inscriptions i
JOIN schedules s ON i.schedule_id = s.id
JOIN events e ON s.event_id = e.id
WHERE i.user_id = ?
ORDER BY s.start_time
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

            if (result.affectedRows === 0) {
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

            return result[0].available_spots;
        } catch (error) {
            throw error;
        }
    }
}

// Asegúrate de tener esta línea al final del archivo
export { Inscription as default };