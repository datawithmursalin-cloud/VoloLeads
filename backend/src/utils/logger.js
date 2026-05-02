class Logger {
  static log(message, data = null) {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, data || '');
  }

  static info(message, data = null) {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, data || '');
  }

  static error(message, error = null) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error || '');
  }

  static warn(message, data = null) {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, data || '');
  }

  static debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${new Date().toISOString()}] DEBUG: ${message}`, data || '');
    }
  }
}

module.exports = Logger;
