// Configuration file for dynamic environment handling
class Config {
  constructor() {
    // Detect environment
    this.isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('dev');
    
    // API Base URL configuration
    this.API_BASE_URL = this.isDevelopment 
      ? 'http://localhost:3000/api'
      : `${window.location.protocol}//${window.location.host}/api`;
    
    // Domain configuration
    this.DOMAIN = window.location.host;
    this.PROTOCOL = window.location.protocol.replace(':', '');
    this.BASE_URL = `${this.PROTOCOL}://${this.DOMAIN}`;
  }
  
  // Get API base URL
  getApiBaseUrl() {
    return this.API_BASE_URL;
  }
  
  // Get full API endpoint
  getApiEndpoint(endpoint) {
    return `${this.API_BASE_URL}${endpoint}`;
  }
  
  // Get environment info
  getEnvironment() {
    return this.isDevelopment ? 'development' : 'production';
  }
  
  // Debug logging (only in development)
  log(...args) {
    if (this.isDevelopment) {
      console.log('[Config]', ...args);
    }
  }
  
  // Error logging (always enabled)
  error(...args) {
    console.error('[Config Error]', ...args);
  }
}

// Create global config instance
window.Config = new Config();

// Export for modules (if using ES6 modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Config;
}