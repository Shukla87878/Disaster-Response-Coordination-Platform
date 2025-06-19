import express from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth } from '../models/User.js';
import { GeocodingService } from '../services/geocoding.js';
import { logger } from '../utils/logger.js';
import { io } from '../index.js';

const router = express.Router();

// GET /disasters/:id/resources - Get resources for a disaster with geospatial filtering
router.get('/disasters/:id/resources', async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lon, radius = 10000 } = req.query; // radius in meters, default 10km
    
    let query = supabase
      .from('resources')
      .select('*')
      .eq('disaster_id', id);

    // Add geospatial filtering if coordinates provided
    if (lat && lon) {
      // Use PostGIS ST_DWithin for distance-based queries
      const point = `POINT(${lon} ${lat})`;
      query = query.rpc('resources_within_distance', {
        center_point: point,
        radius_meters: parseInt(radius)
      });
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching resources:', error);
      return res.status(500).json({ error: 'Failed to fetch resources' });
    }

    // If no geospatial query was used, we still get all resources
    const result = {
      resources: data || [],
      total: data?.length || 0,
      center: lat && lon ? { lat: parseFloat(lat), lon: parseFloat(lon) } : null,
      radius_meters: parseInt(radius)
    };

    logger.info(`Resources fetched for disaster: ${id}, found: ${result.total}`);
    res.json(result);
  } catch (error) {
    logger.error('Resources fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /disasters/:id/resources - Create new resource
router.post('/disasters/:id/resources', requireAuth, async (req, res) => {
  try {
    const { id: disaster_id } = req.params;
    const { name, location_name, type, description, capacity, contact_info } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Geocode location if provided
    let coordinates = null;
    if (location_name) {
      coordinates = await GeocodingService.geocodeLocation(location_name);
    }

    const resourceData = {
      disaster_id,
      name,
      location_name,
      type,
      description,
      capacity,
      contact_info,
      created_by: req.user.id
    };

    // Add coordinates if geocoding was successful
    if (coordinates) {
      resourceData.location = `POINT(${coordinates.lng} ${coordinates.lat})`;
    }

    const { data, error } = await supabase
      .from('resources')
      .insert(resourceData)
      .select()
      .single();

    if (error) {
      logger.error('Error creating resource:', error);
      return res.status(500).json({ error: 'Failed to create resource' });
    }

    // Emit real-time update
    io.emit('resources_updated', {
      action: 'create',
      disaster_id,
      resource: data
    });

    logger.info(`Resource created: ${name} for disaster: ${disaster_id} by ${req.user.id}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error('Resource creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /resources/nearby - Find nearby resources using geospatial query
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lon, radius = 10000, type } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Build the geospatial query
    let query = supabase
      .from('resources')
      .select(`
        *,
        disasters:disasters(title, tags)
      `);

    // Filter by resource type if specified
    if (type) {
      query = query.eq('type', type);
    }

    // For now, we'll use a simpler approach since ST_DWithin might need custom RPC
    const { data: allResources, error } = await query;

    if (error) {
      logger.error('Error fetching nearby resources:', error);
      return res.status(500).json({ error: 'Failed to fetch nearby resources' });
    }

    // Filter by distance in JavaScript (in production, this should be done in the database)
    const targetLat = parseFloat(lat);
    const targetLon = parseFloat(lon);
    const maxDistance = parseInt(radius);

    const nearbyResources = allResources?.filter(resource => {
      if (!resource.location) return false;
      
      // Simple distance calculation (Haversine formula would be more accurate)
      // This is a simplified version for demo purposes
      const resourceCoords = resource.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
      if (!resourceCoords) return false;
      
      const resourceLon = parseFloat(resourceCoords[1]);
      const resourceLat = parseFloat(resourceCoords[2]);
      
      const distance = Math.sqrt(
        Math.pow(targetLat - resourceLat, 2) + Math.pow(targetLon - resourceLon, 2)
      ) * 111000; // Rough conversion to meters
      
      return distance <= maxDistance;
    }) || [];

    const result = {
      resources: nearbyResources,
      total: nearbyResources.length,
      center: { lat: targetLat, lon: targetLon },
      radius_meters: maxDistance
    };

    logger.info(`Nearby resources found: ${result.total} within ${maxDistance}m of ${lat}, ${lon}`);
    res.json(result);
  } catch (error) {
    logger.error('Nearby resources error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;