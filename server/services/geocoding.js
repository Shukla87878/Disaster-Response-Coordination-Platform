import axios from 'axios';
import { CacheService } from './cache.js';
import { logger } from '../utils/logger.js';

export class GeocodingService {
  static async geocodeLocation(locationName) {
    if (!locationName) {
      return null;
    }

    const cacheKey = `geocode_${Buffer.from(locationName).toString('base64')}`;
    
    // Check cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      logger.info(`Geocoding from cache: ${locationName}`);
      return cached;
    }

    try {
      // Try Google Maps first if API key is available
      if (process.env.GOOGLE_MAPS_API_KEY) {
        return await this.geocodeWithGoogleMaps(locationName, cacheKey);
      }
      
      // Fallback to OpenStreetMap Nominatim (free)
      return await this.geocodeWithNominatim(locationName, cacheKey);
    } catch (error) {
      logger.error('Geocoding error:', error);
      return null;
    }
  }

  static async geocodeWithGoogleMaps(locationName, cacheKey) {
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const response = await axios.get(url, {
      params: {
        address: locationName,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const coordinates = {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted_address: result.formatted_address,
        service: 'google_maps'
      };

      await CacheService.set(cacheKey, coordinates, 1440); // Cache for 24 hours
      logger.info(`Geocoded with Google Maps: ${locationName} -> ${coordinates.lat}, ${coordinates.lng}`);
      return coordinates;
    }

    return null;
  }

  static async geocodeWithNominatim(locationName, cacheKey) {
    // Rate limit for Nominatim (1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const url = 'https://nominatim.openstreetmap.org/search';
    const response = await axios.get(url, {
      params: {
        q: locationName,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'DisasterResponsePlatform/1.0'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const coordinates = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted_address: result.display_name,
        service: 'nominatim'
      };

      await CacheService.set(cacheKey, coordinates, 1440); // Cache for 24 hours
      logger.info(`Geocoded with Nominatim: ${locationName} -> ${coordinates.lat}, ${coordinates.lng}`);
      return coordinates;
    }

    return null;
  }
}