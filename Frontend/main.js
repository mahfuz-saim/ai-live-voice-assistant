// main.js - Electron Main Process
// This file creates and manages the application window

const { app, BrowserWindow } = require("electron");
const path = require("path");
require("dotenv").config();

let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Allow node integration in renderer process
      nodeIntegration: true,
      contextIsolation: false,
      // Enable web security but allow screen capture
      webSecurity: true,
      // Enable media capture (screen sharing)
      enableRemoteModule: false,
    },
    title: "AI Voice Assistant",
    icon: path.join(__dirname, "assets", "icon.png"), // Optional: add icon if available
  });

  // Load the main HTML file
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  // Open DevTools in development mode (optional)
  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed event
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Pass environment variables to renderer process
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("env-variables", {
      BACKEND_URL: process.env.BACKEND_URL,
    });
  });
}

/**
 * App lifecycle: when Electron is ready, create the window
 */
app.whenReady().then(() => {
  createWindow();

  // macOS specific: recreate window when dock icon is clicked
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * Quit app when all windows are closed (except on macOS)
 */
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * Handle app activation (macOS)
 */
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
