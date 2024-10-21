import { createEvent, deleteEvent, listEvents, getEventById, updateEvent } from '../models/Event.js';
import { createSchedule, updateSchedule, deleteSchedule } from '../models/Schedule.js';

export const createEventWithSchedules = async (req, res) => {
    try {
        const { name, description, author, location, photo, schedules, capacity } = req.body;

        if (!name || !description || !author || !location || !schedules || !capacity) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const event = await createEvent({ name, description, author, location, photo });

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
        console.error('Error creating event and schedules:', error);
        res.status(500).json({ message: 'Error creating event', error: error.message });
    }
};

export const deleteEventById = async (req, res) => {
    try {
        const { id } = req.params;

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

export const getEventByIdController = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        const event = await getEventById(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching event', error: error.message });
    }
};

export const updateEventController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, author, location, photo, schedules, capacity } = req.body;

        if (!id) {
            return res.status(400).json({ message: 'Event ID is required' });
        }

        if (!name && !description && !author && !location && !photo && !schedules && !capacity) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const updatedEvent = await updateEvent(id, { name, description, author, location, photo });

        if (schedules && schedules.length > 0) {
            for (let schedule of schedules) {
                if (schedule.id) {
                    await updateSchedule(schedule.id, {
                        startTime: schedule.startTime,
                        capacity: capacity || schedule.capacity,
                    });
                } else {
                    await createSchedule({
                        eventId: id,
                        startTime: schedule.startTime,
                        capacity: capacity || schedule.capacity,
                    });
                }
            }
        }

        res.status(200).json({ message: 'Event updated successfully', event: updatedEvent });
    } catch (error) {
        res.status(500).json({ message: 'Error updating event', error: error.message });
    }
};