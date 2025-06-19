import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../models/User.js';
import { GeminiService } from '../services/gemini.js';
import { GeocodingService } from '../services/geocoding.js';
import { logger } from '../utils/logger.js';
import { io } from '../index.js';

const router = express.Router();

// GET /disasters - List all disasters with optional filtering
router.get('/', async (req, res) => {
  try {
    const { tag, owner_id, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('disasters')
      .select(`
        *,
        reports:reports(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error('Error fetching disasters:', error);
      return res.status(500).json({ error: 'Failed to fetch disasters' });
    }

    res.json({
      disasters: data || [],
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    logger.error('Disasters fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /disasters/:id - Get specific disaster
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('disasters')
      .select(`
        *,
        reports:reports(*),
        resources:resources(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Disaster not found' });
      }
      logger.error('Error fetching disaster:', error);
      return res.status(500).json({ error: 'Failed to fetch disaster' });
    }

    res.json(data);
  } catch (error) {
    logger.error('Disaster fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /disasters - Create new disaster
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, location_name, description, tags = [] } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    // Extract location from description if location_name not provided
    let finalLocationName = location_name;
    if (!finalLocationName && description) {
      const locationResult = await GeminiService.extractLocation(description);
      finalLocationName = locationResult.location;
    }

    // Geocode location if available
    let coordinates = null;
    if (finalLocationName) {
      coordinates = await GeocodingService.geocodeLocation(finalLocationName);
    }

    // Create disaster record
    const disasterData = {
      title,
      location_name: finalLocationName,
      description,
      tags,
      owner_id: req.user.id,
      audit_trail: [{
        action: 'create',
        user_id: req.user.id,
        timestamp: new Date().toISOString()
      }]
    };

    // Add coordinates if geocoding was successful
    if (coordinates) {
      disasterData.location = `POINT(${coordinates.lng} ${coordinates.lat})`;
    }

    const { data, error } = await supabase
      .from('disasters')
      .insert(disasterData)
      .select()
      .single();

    if (error) {
      logger.error('Error creating disaster:', error);
      return res.status(500).json({ error: 'Failed to create disaster' });
    }

    // Emit real-time update
    io.emit('disaster_updated', {
      action: 'create',
      disaster: data
    });

    logger.info(`Disaster created: ${title} by ${req.user.id}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Disaster creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /disasters/:id - Update disaster
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, location_name, description, tags } = req.body;

    // First, get the existing disaster
    const { data: existing, error: fetchError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Disaster not found' });
    }

    // Check ownership or admin rights
    if (existing.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this disaster' });
    }

    // Update audit trail
    const updatedAuditTrail = [...(existing.audit_trail || []), {
      action: 'update',
      user_id: req.user.id,
      timestamp: new Date().toISOString(),
      changes: { title, location_name, description, tags }
    }];

    // Prepare update data
    const updateData = {
      ...(title && { title }),
      ...(location_name !== undefined && { location_name }),
      ...(description && { description }),
      ...(tags && { tags }),
      audit_trail: updatedAuditTrail
    };

    // Re-geocode if location changed
    if (location_name !== undefined && location_name !== existing.location_name) {
      if (location_name) {
        const coordinates = await GeocodingService.geocodeLocation(location_name);
        if (coordinates) {
          updateData.location = `POINT(${coordinates.lng} ${coordinates.lat})`;
        }
      } else {
        updateData.location = null;
      }
    }

    const { data, error } = await supabase
      .from('disasters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating disaster:', error);
      return res.status(500).json({ error: 'Failed to update disaster' });
    }

    // Emit real-time update
    io.emit('disaster_updated', {
      action: 'update',
      disaster: data
    });

    logger.info(`Disaster updated: ${id} by ${req.user.id}`);
    res.json(data);
  } catch (error) {
    logger.error('Disaster update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /disasters/:id - Delete disaster
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // First, get the existing disaster
    const { data: existing, error: fetchError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Disaster not found' });
    }

    // Check ownership or admin rights
    if (existing.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this disaster' });
    }

    const { error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting disaster:', error);
      return res.status(500).json({ error: 'Failed to delete disaster' });
    }

    // Emit real-time update
    io.emit('disaster_updated', {
      action: 'delete',
      disaster_id: id
    });

    logger.info(`Disaster deleted: ${id} by ${req.user.id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Disaster deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;