import express from 'express';
import { getHealth, getPing } from '../controllers/health.controller.js';

const router = express.Router();

router.get('/', getHealth);
router.get('/ping', getPing);

export default router;
