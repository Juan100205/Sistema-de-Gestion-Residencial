import { app, BrowserWindow, ipcMain, dialog, nativeImage } from 'electron';
import path from 'node:path';
import { log, logError } from './utils/logger';
import * as XLSX from "xlsx";
import { initDatabase } from './db/index.db';
import { registerExcelIPC } from './ipc/excel.ipc';
import { registerPeriodoIPC } from './ipc/periodo.ipc';
import { registerAuditIPC } from './ipc/audit.ipc';
import appIconPath from './assets/Logo.png'; // ✅ Import icon path

// Custom handling for Squirrel events on Windows
if (process.platform === 'win32') {
  const squirrelEvent = process.argv[1];
  if (squirrelEvent) {
    log(`Squirrel event detected: ${squirrelEvent}`);
    switch (squirrelEvent) {
      case '--squirrel-install':
      case '--squirrel-updated':
        // Optionally do something here
        log('Installation/Update event complete');
        app.quit();
        process.exit(0);
        break;
      case '--squirrel-uninstall':
        log('Uninstallation event');
        app.quit();
        process.exit(0);
        break;
      case '--squirrel-obsolete':
        app.quit();
        process.exit(0);
        break;
    }
  }
}

const createWindow = () => {
  log('Creating main window...');

  // Create native image from the imported path
  const icon = nativeImage.createFromPath(appIconPath);

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: icon, // ✅ Use nativeImage
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // ✅ Necesario para contextBridge
      nodeIntegration: false
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools only in specific environments
  // if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
  //   mainWindow.webContents.openDevTools();
  // }

  // Or better, only if not packaged for production
  // if (!app.isPackaged) {
  //   mainWindow.webContents.openDevTools();
  // }

  log('Main window created and loaded.');
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  log('App is ready.');
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open
  // .
  try {
    log('Initializing database...');
    initDatabase();
    log('Registering IPC handlers...');
    registerExcelIPC(ipcMain);
    registerPeriodoIPC(ipcMain);
    registerAuditIPC(ipcMain);
    createWindow();
  } catch (e) {
    logError(e);
    dialog.showErrorBox(
      'Error inicializando la aplicación',
      e.message
    );
    app.quit();
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  log('All windows closed.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  log('App quitted.');
});


