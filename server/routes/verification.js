import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../models/User.js';
import { GeminiService } from '../services/gemini.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// POST /disasters/:id/verify-image - Verify image authenticity
router.post('/disasters/:id/verify-image', requireAuth, async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const { image_url, report_id, context } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // Verify the image using Gemini API
    const verification = await GeminiService.verifyImage(image_url, context);

    // If report_id is provided, update the report's verification status
    if (report_id) {
      const { error: updateError } = await supabase
        .from('reports')
        .update({
          verification_status: verification.status,
          verification_details: verification
        })
        .eq('id', report_id)
        .eq('disaster_id', disaster_id);

      if (updateError) {
        logger.error('Error updating report verification:', updateError);
      }
    }

    // Log the verification activity
    const { error: logError } = await supabase
      .from('verification_log')
      .insert({
        disaster_id,
        report_id,
        image_url,
        verification_result: verification,
        verified_by: req.user.id,
        created_at: new Date().toISOString()
      });

    if (logError) {
      logger.error('Error logging verification:', logError);
    }

    logger.info(`Image verified for disaster: ${disaster_id} by ${req.user.id}`);
    res.json({
      verification,
      disaster_id,
      report_id,
      verified_by: req.user.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Image verification error:', error);
    res.status(500).json({ error: 'Failed to verify image' });
  }
});

// GET /disasters/:id/verifications - Get verification history for a disaster
router.get('/disasters/:id/verifications', async (req, res) => {
  try {
    const { id: disaster_id } = req.params;

    const { data, error } = await supabase
      .from('verification_log')
      .select('*')
      .eq('disaster_id', disaster_id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching verifications:', error);
      return res.status(500).json({ error: 'Failed to fetch verifications' });
    }

    res.json({
      verifications: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    logger.error('Verifications fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;