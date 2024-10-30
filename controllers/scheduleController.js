import { getAllSchedulesWithEventInfo, getScheduleWithEventInfo } from '../models/Schedule.js';

export const getAllScheduleCards = async (req, res) => {
    try {
        const scheduleCards = await getAllSchedulesWithEventInfo();
        
        if (!scheduleCards || scheduleCards.length === 0) {
            return res.status(404).json({ message: 'No schedules found' });
        }

        res.status(200).json(scheduleCards);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schedule cards', error: error.message });
    }
};

export const getScheduleCardById = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        if (!scheduleId) {
            return res.status(400).json({ message: 'Schedule ID is required' });
        }

        const scheduleCard = await getScheduleWithEventInfo(scheduleId);

        if (!scheduleCard) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        res.status(200).json(scheduleCard);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schedule card', error: error.message });
    }
};