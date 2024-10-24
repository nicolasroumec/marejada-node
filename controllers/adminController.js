import { createEvent, deleteEvent, listEvents } from '../models/Event.js';
import { createSchedule } from '../models/Schedule.js';

export const createEventWithSchedules = async (req, res) => {
    try {
        const { name, description, author, location, photo, schedules, capacity, type, duration } = req.body;

        // Validación básica de los datos requeridos
        if (!name || !description || !author || !location || !schedules || !capacity || !type || !duration) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Crear el evento
        const event = await createEvent({ name, description, author, location, photo, type, duration });

        // Crear los horarios asociados al evento
        for (let schedule of schedules) {
            if (!schedule.startTime) {
                return res.status(400).json({ message: 'Missing startTime in one of the schedules' });
            }
            await createSchedule({
                eventId: event.id,
                startTime: schedule.startTime,
                capacity,
            });
        }

        res.status(201).json({ message: 'Event and schedules created successfully', event });
    } catch (error) {
        res.status(500).json({ message: 'Error creating event', error: error.message });
    }
};

export const deleteEventById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validación básica del ID
        if (!id) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        await deleteEvent(id);
        res.status(200).json({ message: 'Event and associated schedules deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting event', error: error.message });
    }
};

export const getAllEvents = async (req, res) => {
    try {
        const events = await listEvents();
        
        if (!events || events.length === 0) {
            return res.status(404).json({ message: 'No events found' });
        }

        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
};