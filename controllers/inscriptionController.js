const pool = require('../db'); // Asegúrate de tener configurada la conexión con PostgreSQL

// Controlador para inscribir a un usuario en un evento
exports.inscribeUser = async (req, res) => {
    const { userId, scheduleId } = req.body;

    try {
        // Verifica si el usuario ya está inscrito
        const checkInscription = await pool.query(
            'SELECT * FROM inscriptions WHERE id_users = $1 AND id_schedules = $2',
            [userId, scheduleId]
        );

        if (checkInscription.rows.length > 0) {
            return res.status(400).json({ message: 'Ya estás inscrito en este evento.' });
        }

        // Inserta la inscripción en la base de datos
        const newInscription = await pool.query(
            'INSERT INTO inscriptions (id_users, id_schedules) VALUES ($1, $2) RETURNING *',
            [userId, scheduleId]
        );

        return res.status(201).json({ message: 'Inscripción exitosa', inscription: newInscription.rows[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al inscribir al usuario' });
    }
};

// Controlador para obtener todas las inscripciones de un usuario
exports.getUserInscriptions = async (req, res) => {
    const userId = req.params.id;

    try {
        // Obtiene todas las inscripciones de un usuario
        const inscriptions = await pool.query(
            'SELECT * FROM inscriptions WHERE id_users = $1',
            [userId]
        );

        if (inscriptions.rows.length === 0) {
            return res.status(404).json({ message: 'No tienes inscripciones.' });
        }

        return res.status(200).json(inscriptions.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error al obtener las inscripciones' });
    }
};
