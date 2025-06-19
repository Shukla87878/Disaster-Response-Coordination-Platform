import express from 'express';
import { GeminiService } from '../services/gemini.js';
import { GeocodingService } from '../services/geocoding.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /geocode - Extract location from text and convert to coordinates
router.post('/', async (req, res) => {
  try {
    const { text, location_name } = req.body;

    if (!text && !location_name) {
      return res.status(400).json({ error: 'Either text or location_name is required' });
    }

    let finalLocationName = location_name;
    let extractionResult = null;

    // If text is provided, extract location using Gemini
    if (text && !location_name) {
      extractionResult = await GeminiService.extractLocation(text);
      finalLocationName = extractionResult.location;
    }

    // Geocode the location name
    let coordinates = null;
    if (finalLocationName) {
      coordinates = await GeocodingService.geocodeLocation(finalLocationName);
    }

    const result = {
      input_text: text,
      location_extraction: extractionResult,
      location_name: finalLocationName,
      coordinates,
      success: !!coordinates
    };

    logger.info(`Geocoding completed: ${finalLocationName} -> ${coordinates ? `${coordinates.lat}, ${coordinates.lng}` : 'not found'}`);
    res.json(result);
  } catch (error) {
    logger.error('Geocoding error:', error);
    res.status(500).json({ error: 'Failed to geocode location' });
  }
});

// POST /extract-location - Extract location from text using Gemini
router.post('/extract-location', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await GeminiService.extractLocation(text);

    logger.info(`Location extracted from text: ${result.location || 'none found'}`);
    res.json(result);
  } catch (error) {
    logger.error('Location extraction error:', error);
    res.status(500).json({ error: 'Failed to extract location' });
  }
});

export default router;