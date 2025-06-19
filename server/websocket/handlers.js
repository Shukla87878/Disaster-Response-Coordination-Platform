import { logger } from '../utils/logger.js';

export function setupWebSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join disaster-specific rooms
    socket.on('join_disaster', (disasterId) => {
      socket.join(`disaster_${disasterId}`);
      logger.info(`Client ${socket.id} joined disaster room: ${disasterId}`);
    });

    // Leave disaster-specific rooms
    socket.on('leave_disaster', (disasterId) => {
      socket.leave(`disaster_${disasterId}`);
      logger.info(`Client ${socket.id} left disaster room: ${disasterId}`);
    });

    // Handle general updates subscription
    socket.on('subscribe_updates', () => {
      socket.join('general_updates');
      logger.info(`Client ${socket.id} subscribed to general updates`);
    });

    socket.on('unsubscribe_updates', () => {
      socket.leave('general_updates');
      logger.info(`Client ${socket.id} unsubscribed from general updates`);
    });

    // Handle real-time location tracking (for emergency responders)
    socket.on('update_location', (data) => {
      const { disaster_id, lat, lng, user_id } = data;
      
      // Broadcast location update to disaster room
      socket.to(`disaster_${disaster_id}`).emit('responder_location_updated', {
        user_id,
        lat,
        lng,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Location updated for user ${user_id} in disaster ${disaster_id}`);
    });

    // Handle priority alerts
    socket.on('priority_alert', (data) => {
      const { disaster_id, message, urgency, location } = data;
      
      // Broadcast priority alert to all connected clients
      io.emit('priority_alert_received', {
        disaster_id,
        message,
        urgency,
        location,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`Priority alert sent for disaster ${disaster_id}: ${urgency}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Periodic status broadcasts
  setInterval(() => {
    io.emit('system_status', {
      timestamp: new Date().toISOString(),
      connected_clients: io.engine.clientsCount,
      status: 'operational'
    });
  }, 30000); // Every 30 seconds
}