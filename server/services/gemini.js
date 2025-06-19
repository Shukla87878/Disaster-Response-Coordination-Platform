import { GoogleGenerativeAI } from '@google/generative-ai';
import { CacheService } from './cache.js';
import { logger } from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export class GeminiService {
  static async extractLocation(description) {
    const cacheKey = `gemini_location_${Buffer.from(description).toString('base64').slice(0, 50)}`;
    
    // Check cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      logger.info('Location extraction from cache');
      return cached;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Extract the location name from this disaster description. Return only the location name (city, state/country format if available), or "Unknown" if no location is found.

Description: "${description}"

Location:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const location = response.text().trim();
      
      const result_data = {
        location: location === 'Unknown' ? null : location,
        confidence: location === 'Unknown' ? 0 : 0.8
      };

      // Cache the result
      await CacheService.set(cacheKey, result_data, 60);
      
      logger.info(`Location extracted: ${location}`);
      return result_data;
    } catch (error) {
      logger.error('Gemini location extraction error:', error);
      return { location: null, confidence: 0 };
    }
  }

  static async verifyImage(imageUrl, context = '') {
    const cacheKey = `gemini_verify_${Buffer.from(imageUrl).toString('base64').slice(0, 50)}`;
    
    // Check cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      logger.info('Image verification from cache');
      return cached;
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = `Analyze this image URL for potential signs of manipulation or to verify disaster context.
Image URL: ${imageUrl}
Context: ${context}

Provide a brief analysis focusing on:
1. Signs of digital manipulation
2. Consistency with disaster context
3. Overall authenticity assessment

Keep response concise and factual.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text().trim();
      
      const result_data = {
        analysis,
        status: 'analyzed',
        timestamp: new Date().toISOString()
      };

      // Cache the result
      await CacheService.set(cacheKey, result_data, 60);
      
      logger.info(`Image verified: ${imageUrl.slice(0, 50)}...`);
      return result_data;
    } catch (error) {
      logger.error('Gemini image verification error:', error);
      return {
        analysis: 'Unable to verify image due to service error',
        status: 'error',
        timestamp: new Date().toISOString()
      };
    }
  }
}