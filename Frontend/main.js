const { app, BrowserWindow, session } = require("electron");
const path = require("path");
require("dotenv").config();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,
      enableRemoteModule: false,
    },
    title: "AI Voice Assistant",
    icon: path.join(__dirname, "assets", "icon.png"),
  });

  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      const allowedPermissions = [
        "media",
        "mediaKeySystem",
        "geolocation",
        "notifications",
        "midiSysex",
        "pointerLock",
        "fullscreen",
      ];
      if (allowedPermissions.includes(permission)) {
        callback(true);
      } else {
        callback(false);
      }
    }
  );

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  if (process.argv.includes("--dev")) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("env-variables", {
      BACKEND_URL: process.env.BACKEND_URL,
    });
  });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      console.log("Permission check:", permission, requestingOrigin);
      return true;
    }
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
