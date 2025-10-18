const { ipcRenderer } = require("electron");

const Config = {
  BACKEND_URL: "http://localhost:5000",
  WS_URL: null,
  FRAME_RATE: 1,
  initialized: false,
};

function initializeConfig() {
  try {
    const dotenv = require("dotenv");
    const result = dotenv.config();

    if (result.parsed && result.parsed.BACKEND_URL) {
      Config.BACKEND_URL = result.parsed.BACKEND_URL;
    }
  } catch (error) {
    console.warn(
      "Could not load .env file, using default configuration:",
      error
    );
  }

  Config.WS_URL =
    Config.BACKEND_URL.replace("http://", "ws://").replace(
      "https://",
      "wss://"
    ) + "/ws";

  Config.initialized = true;

  console.log("Configuration initialized:", {
    BACKEND_URL: Config.BACKEND_URL,
    WS_URL: Config.WS_URL,
    FRAME_RATE: Config.FRAME_RATE,
  });
}

function getBackendURL() {
  if (!Config.initialized) {
    initializeConfig();
  }
  return Config.BACKEND_URL;
}

function getWebSocketURL() {
  if (!Config.initialized) {
    initializeConfig();
  }
  return Config.WS_URL;
}

function getFrameRate() {
  return Config.FRAME_RATE;
}

initializeConfig();

window.Config = {
  getBackendURL,
  getWebSocketURL,
  getFrameRate,
};
