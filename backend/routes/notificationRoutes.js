import express from 'express';
import { getNotifications } from '../controllers/notificationController.js';

const router = express.Router();

//router.post('/', saveNotification);
router.get('/', getNotifications);

export default router;
