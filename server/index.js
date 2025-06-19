import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import disasterRoutes from './routes/disasters.js';
import socialMediaRoutes from './routes/socialMedia.js';
import resourceRoutes from './routes/resources.js';
import updatesRoutes from './routes/updates.js';
import verificationRoutes from './routes/verification.js';
import geocodingRoutes from './routes/geocoding.js';
import { setupWebSocketHandlers } from './websocket/handlers.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ["http://localhost:5173"]
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/disasters', disasterRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/geocoding', geocodingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Setup WebSocket handlers
setupWebSocketHandlers(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };