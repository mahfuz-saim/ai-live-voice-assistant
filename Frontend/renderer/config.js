// config.js - Configuration and Environment Variables
// This file manages application configuration including backend URL

const { ipcRenderer } = require('electron');

/**
 * Global configuration object
 */
const Config = {
  BACKEND_URL: 'http://localhost:5000', // Default value
  WS_URL: null,
  FRAME_RATE: 1, // Frames per second (1-2 FPS for low bandwidth)
  initialized: false
};

/**
 * Initialize configuration from environment variables
 */
function initializeConfig() {
  // Try to get environment variables from main process
  try {
    const dotenv = require('dotenv');
    const result = dotenv.config();
    
    if (result.parsed && result.parsed.BACKEND_URL) {
      Config.BACKEND_URL = result.parsed.BACKEND_URL;
    }
  } catch (error) {
    console.warn('Could not load .env file, using default configuration:', error);
  }

  // Construct WebSocket URL from backend URL
  Config.WS_URL = Config.BACKEND_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
  
  Config.initialized = true;
  
  console.log('Configuration initialized:', {
    BACKEND_URL: Config.BACKEND_URL,
    WS_URL: Config.WS_URL,
    FRAME_RATE: Config.FRAME_RATE
  });
}

/**
 * Get backend API URL
 */
function getBackendURL() {
  if (!Config.initialized) {
    initializeConfig();
  }
  return Config.BACKEND_URL;
}

/**
 * Get WebSocket URL
 */
function getWebSocketURL() {
  if (!Config.initialized) {
    initializeConfig();
  }
  return Config.WS_URL;
}

/**
 * Get frame rate for screen capture
 */
function getFrameRate() {
  return Config.FRAME_RATE;
}

// Initialize configuration on load
initializeConfig();

// Export functions for use in other modules
window.Config = {
  getBackendURL,
  getWebSocketURL,
  getFrameRate
};
