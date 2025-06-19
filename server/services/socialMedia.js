import axios from 'axios';
import { CacheService } from './cache.js';
import { logger } from '../utils/logger.js';

export class SocialMediaService {
  static async getMockSocialMediaReports(disasterId, keywords = []) {
    const cacheKey = `social_media_${disasterId}_${keywords.join(',') || 'general'}`;
    
    // Check cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      logger.info(`Social media reports from cache for disaster: ${disasterId}`);
      return cached;
    }

    // Mock social media data
    const mockReports = [
      {
        id: 'mock_1',
        user: 'citizen1',
        content: `#floodrelief Need food and water in lower manhattan area. Family of 4 stranded. ${keywords.includes('flood') ? '#flood' : ''}`,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        urgency: 'high',
        location_mentioned: 'Lower Manhattan',
        engagement: Math.floor(Math.random() * 100),
        verified: false
      },
      {
        id: 'mock_2', 
        user: 'emergencyvolunteer',
        content: `Shelter available at community center on 5th street. Can accommodate 20 people. ${keywords.includes('shelter') ? '#shelter' : ''} #disasterrelief`,
        timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString(),
        urgency: 'medium',
        location_mentioned: '5th Street',
        engagement: Math.floor(Math.random() * 50),
        verified: true
      },
      {
        id: 'mock_3',
        user: 'localresident',
        content: `Roads completely flooded near central park. Emergency vehicles having trouble getting through. #emergency ${keywords.includes('flood') ? '#flood' : ''}`,
        timestamp: new Date(Date.now() - Math.random() * 1800000).toISOString(),
        urgency: 'high',
        location_mentioned: 'Central Park',
        engagement: Math.floor(Math.random() * 200),
        verified: false
      },
      {
        id: 'mock_4',
        user: 'redcross_volunteer',
        content: `Medical aid station set up at Washington Square Park. Treating minor injuries and providing first aid. #medicalaid #disasterresponse`,
        timestamp: new Date(Date.now() - Math.random() * 5400000).toISOString(),
        urgency: 'medium',
        location_mentioned: 'Washington Square Park',
        engagement: Math.floor(Math.random() * 75),
        verified: true
      }
    ];

    // Filter based on keywords if provided
    let filteredReports = mockReports;
    if (keywords.length > 0) {
      filteredReports = mockReports.filter(report => 
        keywords.some(keyword => 
          report.content.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }

    const result = {
      reports: filteredReports,
      total: filteredReports.length,
      last_updated: new Date().toISOString(),
      source: 'mock_twitter_api'
    };

    // Cache for 5 minutes (shorter for social media)
    await CacheService.set(cacheKey, result, 5);
    
    logger.info(`Generated ${filteredReports.length} mock social media reports for disaster: ${disasterId}`);
    return result;
  }

  static async getTwitterReports(disasterId, keywords = []) {
    // If Twitter API is available, implement real Twitter integration
    if (process.env.TWITTER_BEARER_TOKEN) {
      try {
        // This would be the real Twitter API integration
        // For now, falling back to mock data
        logger.info('Twitter API integration not fully implemented, using mock data');
        return await this.getMockSocialMediaReports(disasterId, keywords);
      } catch (error) {
        logger.error('Twitter API error:', error);
        return await this.getMockSocialMediaReports(disasterId, keywords);
      }
    }

    // Fallback to mock data
    return await this.getMockSocialMediaReports(disasterId, keywords);
  }

  static async getBlueskyReports(disasterId, keywords = []) {
    // Placeholder for Bluesky integration
    logger.info('Bluesky API integration not implemented, using mock data');
    return await this.getMockSocialMediaReports(disasterId, keywords);
  }
}