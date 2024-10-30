import express from 'express';
import { getAllScheduleCards, getScheduleCardById } from '../controllers/scheduleController.js';

const router = express.Router();

router.get('/schedule-cards', getAllScheduleCards);
router.get('/schedule-cards/:scheduleId', getScheduleCardById);

export default router;