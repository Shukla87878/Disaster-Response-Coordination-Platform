import express from 'express';
import { SocialMediaService } from '../services/socialMedia.js';
import { logger } from '../utils/logger.js';
import { io } from '../index.js';

const router = express.Router();

// GET /disasters/:id/social-media - Get social media reports for a disaster
router.get('/disasters/:id/social-media', async (req, res) => {
  try {
    const { id } = req.params;
    const { keywords, source = 'mock' } = req.query;
    
    let keywordArray = [];
    if (keywords) {
      keywordArray = keywords.split(',').map(k => k.trim());
    }

    let reports;
    
    switch (source) {
      case 'twitter':
        reports = await SocialMediaService.getTwitterReports(id, keywordArray);
        break;
      case 'bluesky':
        reports = await SocialMediaService.getBlueskyReports(id, keywordArray);
        break;
      default:
        reports = await SocialMediaService.getMockSocialMediaReports(id, keywordArray);
    }

    // Emit real-time update
    io.emit('social_media_updated', {
      disaster_id: id,
      reports: reports.reports,
      source
    });

    logger.info(`Social media reports fetched for disaster: ${id}, source: ${source}`);
    res.json(reports);
  } catch (error) {
    logger.error('Social media fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch social media reports' });
  }
});

// GET /mock-social-media - Mock endpoint for testing
router.get('/mock-social-media', async (req, res) => {
  try {
    const { keywords } = req.query;
    let keywordArray = [];
    if (keywords) {
      keywordArray = keywords.split(',').map(k => k.trim());
    }

    const reports = await SocialMediaService.getMockSocialMediaReports('general', keywordArray);
    
    res.json(reports);
  } catch (error) {
    logger.error('Mock social media error:', error);
    res.status(500).json({ error: 'Failed to fetch mock social media data' });
  }
});

export default router;