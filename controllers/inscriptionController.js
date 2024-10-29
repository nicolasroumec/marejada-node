import Inscription from '../models/Inscription.js';

const inscriptionController = {
    async create(req, res) {
        try {
            const { scheduleId } = req.body;
            const userId = req.user.userId; // Obtenido del middleware de autenticación

            const inscription = await Inscription.create({
                userId,
                scheduleId
            });

            res.status(201).json({
                message: 'Inscripción realizada exitosamente',
                inscription
            });
        } catch (error) {
            console.error('Error al crear inscripción:', error);
            
            if (error.message === 'No hay cupos disponibles' || 
                error.message === 'Usuario ya inscrito en este horario' ||
                error.message === 'Horario no encontrado') {
                return res.status(400).json({ message: error.message });
            }

            res.status(500).json({ message: 'Error al procesar la inscripción' });
        }
    },

    async getUserInscriptions(req, res) {
        try {
            const userId = req.user.userId;
            const inscriptions = await Inscription.getByUserId(userId);

            res.json({
                message: 'Inscripciones recuperadas exitosamente',
                inscriptions
            });
        } catch (error) {
            console.error('Error al obtener inscripciones:', error);
            res.status(500).json({ message: 'Error al obtener las inscripciones' });
        }
    },

    async getScheduleInscriptions(req, res) {
        try {
            const { scheduleId } = req.params;
            const inscriptions = await Inscription.getByScheduleId(scheduleId);

            res.json({
                message: 'Participantes recuperados exitosamente',
                inscriptions
            });
        } catch (error) {
            console.error('Error al obtener participantes:', error);
            res.status(500).json({ message: 'Error al obtener los participantes' });
        }
    },

    async cancelInscription(req, res) {
        try {
            const { scheduleId } = req.params;
            const userId = req.user.userId;

            await Inscription.delete(userId, scheduleId);

            res.json({
                message: 'Inscripción cancelada exitosamente'
            });
        } catch (error) {
            console.error('Error al cancelar inscripción:', error);
            
            if (error.message === 'Inscripción no encontrada') {
                return res.status(404).json({ message: error.message });
            }

            res.status(500).json({ message: 'Error al cancelar la inscripción' });
        }
    },

    async getAvailableSpots(req, res) {
        try {
            const { scheduleId } = req.params;

            const availableSpots = await Inscription.getAvailableSpots(scheduleId);

            res.json({
                message: 'Cupos disponibles obtenidos exitosamente',
                availableSpots
            });
        } catch (error) {
            console.error('Error al obtener cupos disponibles:', error);

            if (error.message === 'Horario no encontrado') {
                return res.status(404).json({ message: error.message });
            }

            res.status(500).json({ message: 'Error al obtener los cupos disponibles' });
        }
    }
};

export default inscriptionController;