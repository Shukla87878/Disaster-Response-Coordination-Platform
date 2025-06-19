# Disaster Response Coordination Platform

A comprehensive disaster response platform built with MERN stack, featuring real-time data aggregation, geospatial queries, and AI-powered location extraction.

## Features

### Core Functionality
- **Disaster Management**: Full CRUD operations for disaster records with ownership tracking
- **Real-time Updates**: WebSocket integration for live updates across all connected clients
- **Geospatial Queries**: PostGIS-powered location-based resource lookup
- **AI Location Extraction**: Google Gemini API for extracting locations from disaster descriptions
- **Social Media Monitoring**: Mock Twitter API integration with real-time social media report processing
- **Official Updates**: Web scraping integration for government and relief organization updates
- **Image Verification**: AI-powered image authenticity analysis using Gemini API

### Technical Features
- **Supabase Integration**: PostgreSQL with PostGIS for geospatial data
- **Caching System**: TTL-based caching for external API responses
- **Rate Limiting**: API protection with Express rate limiting
- **Mock Authentication**: Role-based access control with predefined users
- **Real-time WebSockets**: Socket.IO for live updates and notifications

## Tech Stack

### Backend
- Node.js + Express.js
- Socket.IO for WebSockets
- Supabase (PostgreSQL + PostGIS)
- Google Gemini AI API
- Geocoding services (Google Maps/OpenStreetMap)

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Socket.IO client for real-time updates

## Setup Instructions

### Prerequisites
- Node.js 18+
- Supabase account
- Google Gemini API key

### Environment Setup

1. Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `GEMINI_API_KEY`: Google Gemini API key
- `GOOGLE_MAPS_API_KEY`: (Optional) Google Maps API key for geocoding

### Database Setup

1. Create a new Supabase project
2. Run the migration file in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of supabase/migrations/create_schema.sql
   ```

### Installation & Running

1. Install dependencies:
```bash
npm install
```

2. Start the development server (runs both frontend and backend):
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Documentation

### Authentication
The platform uses mock authentication with predefined users:
- `netrunnerX` (admin)
- `reliefAdmin` (admin)
- `contributor1` (contributor)
- `citizen1` (contributor)

Include `X-User-Id` header in requests for authentication.

### Core Endpoints

#### Disasters
- `GET /api/disasters` - List disasters (supports filtering by tag, owner)
- `POST /api/disasters` - Create new disaster
- `PUT /api/disasters/:id` - Update disaster
- `DELETE /api/disasters/:id` - Delete disaster
- `GET /api/disasters/:id` - Get disaster details

#### Social Media
- `GET /api/social-media/disasters/:id/social-media` - Get social media reports
- `GET /api/social-media/mock-social-media` - Mock social media endpoint

#### Resources
- `GET /api/resources/disasters/:id/resources` - Get disaster resources
- `POST /api/resources/disasters/:id/resources` - Create new resource
- `GET /api/resources/nearby` - Find nearby resources (geospatial)

#### Geocoding
- `POST /api/geocoding` - Extract location and geocode
- `POST /api/geocoding/extract-location` - Extract location from text

#### Verification
- `POST /api/verification/disasters/:id/verify-image` - Verify image authenticity

#### Official Updates
- `GET /api/updates/disasters/:id/official-updates` - Get official updates

### WebSocket Events

#### Client → Server
- `join_disaster` - Join disaster-specific room
- `leave_disaster` - Leave disaster room
- `subscribe_updates` - Subscribe to general updates
- `update_location` - Update responder location
- `priority_alert` - Send priority alert

#### Server → Client
- `disaster_updated` - Disaster created/updated/deleted
- `social_media_updated` - New social media reports
- `resources_updated` - New resource data
- `priority_alert_received` - Emergency priority alert
- `system_status` - System status updates

## Sample Data

### Creating a Test Disaster
```json
{
  "title": "NYC Flood Emergency",
  "location_name": "Manhattan, NYC",
  "description": "Heavy flooding in Manhattan area, multiple streets impassable",
  "tags": ["flood", "urgent", "emergency"]
}
```

### Sample Resource
```json
{
  "name": "Red Cross Emergency Shelter",
  "location_name": "Lower East Side, NYC",
  "type": "shelter",
  "description": "Emergency shelter with food and medical aid",
  "capacity": 100,
  "contact_info": {
    "phone": "555-0123",
    "email": "shelter@redcross.org"
  }
}
```

## External Service Integrations

### Google Gemini AI
- Location extraction from disaster descriptions
- Image verification and authenticity analysis
- Cached responses to optimize API usage

### Geocoding Services
- Primary: Google Maps Geocoding API
- Fallback: OpenStreetMap Nominatim
- Automatic coordinate conversion for geospatial queries

### Social Media Integration
- Mock Twitter API with realistic sample data
- Support for real Twitter API integration
- Alternative Bluesky API support structure

### Web Scraping
- Mock official updates from FEMA, Red Cross, CDC
- Extensible structure for real website scraping
- Cached responses with TTL

## Development Notes

### AI Tool Usage
This project was built using AI coding assistants (Cursor/Windsurf equivalent) for:
- API route generation and optimization
- Supabase query construction
- WebSocket implementation
- Complex geospatial logic
- Mock data generation

### Performance Optimizations
- Geospatial indexes on location columns
- GIN indexes for tag arrays
- API response caching with TTL
- Rate limiting for external API calls
- Efficient WebSocket event handling

### Error Handling
- Comprehensive try-catch blocks
- Graceful fallbacks for external services
- Structured logging with timestamps
- User-friendly error messages

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Backend (Render)
1. Create new Web Service on Render
2. Connect GitHub repository
3. Set environment variables
4. Deploy with build command: `npm install`
5. Start command: `npm run server`

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with proper error handling
4. Test WebSocket functionality
5. Update documentation
6. Submit pull request

## License

MIT License - see LICENSE file for details