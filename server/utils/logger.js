export const logger = {
  info: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] INFO: ${message}`;
    console.log(logMessage, data ? JSON.stringify(data, null, 2) : '');
  },
  
  error: (message, error = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}`;
    console.error(logMessage, error);
  },
  
  warn: (message, data = null) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN: ${message}`;
    console.warn(logMessage, data ? JSON.stringify(data, null, 2) : '');
  },
  
  debug: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] DEBUG: ${message}`;
      console.log(logMessage, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};