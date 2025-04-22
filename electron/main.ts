import { app, BrowserWindow, ipcMain, session } from 'electron';
import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export {};

let mainWindow: BrowserWindow | null = null;

const configureSession = () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: ws: wss: http: https: blob:;"
        ]
      }
    });
  });
};

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
      preload: join(__dirname, 'preload.js')
    }
  });

  // Configure CSP
  configureSession();

  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      require('electron').shell.openExternal(url);
    }
    return { action: 'deny' };
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ... existing code ...
ipcMain.handle('download-file', async (event, { downloadPath, filename }) => {
  try {
    // After successful download, emit completion event
    const outputPath = join(downloadPath, filename);
    const tempPath = join(downloadPath, `${filename}.temp`);
    
    await new Promise<void>((resolve, reject) => {
      const writeStream = createWriteStream(outputPath);
      const readStream = createReadStream(tempPath);
      
      writeStream
        .on('finish', () => {
          mainWindow?.webContents?.send('download-complete', {
            success: true,
            filePath: outputPath
          });
          resolve();
        })
        .on('error', (error) => {
          mainWindow?.webContents?.send('download-complete', {
            success: false,
            error: error.message
          });
          reject(error);
        });
      readStream.pipe(writeStream);
    });
  } catch (error) {
    console.error('Error during file download:', error);
    throw error;
  }
});
// ... existing code ... 