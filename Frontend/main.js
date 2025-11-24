const { app, BrowserWindow, session, ipcMain } = require("electron");
const path = require("path");
require("dotenv").config();

let mainWindow;
let floatingWindow;

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
    if (floatingWindow) {
      floatingWindow.close();
      floatingWindow = null;
    }
  });

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("env-variables", {
      BACKEND_URL: process.env.BACKEND_URL,
    });
  });
}

function createFloatingWindow() {
  if (floatingWindow) {
    floatingWindow.show();
    floatingWindow.focus();
    return;
  }

  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  floatingWindow = new BrowserWindow({
    width: 700,
    height: 80,
    x: Math.floor((width - 700) / 2),
    y: height - 120,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: true,
    focusable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  floatingWindow.loadFile(path.join(__dirname, "renderer", "floating.html"));

  // Keep it above fullscreen apps
  floatingWindow.setAlwaysOnTop(true, "screen-saver");

  floatingWindow.on("closed", () => {
    floatingWindow = null;
  });

  if (process.argv.includes("--dev")) {
    floatingWindow.webContents.openDevTools({ mode: "detach" });
  }
}

function closeFloatingWindow() {
  if (floatingWindow) {
    floatingWindow.close();
    floatingWindow = null;
  }
}

// IPC handlers for window management
ipcMain.on("create-floating-window", () => {
  createFloatingWindow();
});

ipcMain.on("close-floating-window", () => {
  closeFloatingWindow();
});

ipcMain.on("minimize-main-window", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on("restore-main-window", () => {
  if (mainWindow) {
    mainWindow.restore();
    mainWindow.focus();
    mainWindow.show();
  }
});

ipcMain.on("floating-send-message", (event, data) => {
  // Forward message to main window
  if (mainWindow) {
    mainWindow.webContents.send("floating-message", data);
  }
});

ipcMain.on("floating-stop", () => {
  // Forward stop command to main window
  if (mainWindow) {
    mainWindow.webContents.send("floating-stop");
  }
});

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
