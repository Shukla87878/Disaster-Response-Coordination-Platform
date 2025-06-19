import express from 'express';
import { WebScraperService } from '../services/webScraper.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /disasters/:id/official-updates - Get official updates for a disaster
router.get('/disasters/:id/official-updates', async (req, res) => {
  try {
    const { id } = req.params;
    const { source, type = 'general' } = req.query;

    const updates = await WebScraperService.getOfficialUpdates(type);

    logger.info(`Official updates fetched for disaster: ${id}, type: ${type}`);
    res.json(updates);
  } catch (error) {
    logger.error('Official updates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch official updates' });
  }
});

// GET /official-updates - Get general official updates
router.get('/official-updates', async (req, res) => {
  try {
    const { type = 'general', source } = req.query;

    const updates = await WebScraperService.getOfficialUpdates(type);

    logger.info(`General official updates fetched, type: ${type}`);
    res.json(updates);
  } catch (error) {
    logger.error('Official updates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch official updates' });
  }
});

export default router;