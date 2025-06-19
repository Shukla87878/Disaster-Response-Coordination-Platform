import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export class CacheService {
  static async get(key) {
    try {
      const { data, error } = await supabase
        .from('cache')
        .select('value, expires_at')
        .eq('key', key)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if cache has expired
      if (new Date(data.expires_at) < new Date()) {
        // Remove expired cache entry
        await this.delete(key);
        return null;
      }

      return data.value;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key, value, ttlMinutes = 60) {
    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

      const { error } = await supabase
        .from('cache')
        .upsert({
          key,
          value,
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        logger.error('Cache set error:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  static async delete(key) {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .eq('key', key);

      if (error) {
        logger.error('Cache delete error:', error);
      }
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  static async cleanup() {
    try {
      const { error } = await supabase
        .from('cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error('Cache cleanup error:', error);
      } else {
        logger.info('Cache cleanup completed');
      }
    } catch (error) {
      logger.error('Cache cleanup error:', error);
    }
  }
}

// Run cleanup every hour
setInterval(() => {
  CacheService.cleanup();
}, 60 * 60 * 1000);