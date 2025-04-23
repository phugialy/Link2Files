const { app, BrowserWindow, ipcMain, dialog, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const ytdl = require('@distube/ytdl-core');
const YtDlpWrap = require('yt-dlp-wrap').default;

let mainWindow;
let ytDlp = null;

// Prevent multiple instances
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#000000'
  });

  // Basic error handling for certificates
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
}

// Initialize yt-dlp
async function initYtDlp() {
  try {
    const binaryPath = path.join(app.getPath('userData'), process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    const binaryDir = path.dirname(binaryPath);
    
    if (!fs.existsSync(binaryDir)) {
      fs.mkdirSync(binaryDir, { recursive: true });
    }

    if (!fs.existsSync(binaryPath)) {
      await YtDlpWrap.downloadFromGithub(binaryPath);
    }

    ytDlp = new YtDlpWrap(binaryPath);
    await ytDlp.getVersion();
    return true;
  } catch (error) {
    console.error('Error initializing yt-dlp:', error);
    return false;
  }
}

// App lifecycle
app.whenReady().then(async () => {
  await initYtDlp();
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

// IPC Handlers
ipcMain.handle('get-video-info', async (_, url) => {
  console.log('Fetching video info for:', url);
  try {
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    const videoId = ytdl.getURLVideoID(url);
    const info = await ytdl.getInfo(videoId);

    return {
      title: info.videoDetails.title,
      formats: info.formats.filter(f => f.hasVideo && f.hasAudio),
      videoDetails: {
        title: info.videoDetails.title,
        description: info.videoDetails.description,
        lengthSeconds: info.videoDetails.lengthSeconds,
        viewCount: info.videoDetails.viewCount,
        thumbnails: info.videoDetails.thumbnails
      }
    };
  } catch (error) {
    console.error('Failed to fetch video info:', error);
    throw new Error(`Failed to fetch video info: ${error.message}`);
  }
});

ipcMain.handle('download-video', async (event, { url, filePath, format }) => {
  console.log('Starting download:', { url, filePath, format });
  try {
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid URL');
    }

    const downloadOptions = format === 'mp3' 
      ? ['-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3']
      : ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'];

    const download = ytDlp.exec([
      url,
      ...downloadOptions,
      '-o', filePath,
      '--no-playlist',
      '--progress-template', '%(progress._percent_str)s'
    ]);

    download.on('progress', (progress) => {
      try {
        let progressValue = 0;
        if (typeof progress === 'string') {
          // Try to extract percentage from the progress string
          const match = progress.match(/(\d+(?:\.\d+)?)/);
          if (match) {
            progressValue = parseFloat(match[1]);
          }
        } else if (typeof progress === 'object' && progress.percent != null) {
          progressValue = progress.percent;
        }
        
        // Only send valid progress values
        if (!isNaN(progressValue) && progressValue >= 0 && progressValue <= 100) {
          console.log('Sending progress:', progressValue);
          event.sender.send('download-progress', progressValue);
        }
      } catch (err) {
        console.error('Error processing progress:', err);
      }
    });

    download.on('ytDlpEvent', (eventType, eventData) => {
      console.log('yt-dlp event:', eventType, eventData);
    });

    await new Promise((resolve, reject) => {
      download.on('close', () => {
        event.sender.send('download-progress', 100);
        setTimeout(() => {
          event.sender.send('download-complete');
          resolve();
        }, 500);
      });
      download.on('error', reject);
    });

    return { success: true };
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
});

ipcMain.handle('show-save-dialog', async (_, options) => {
  try {
    return await dialog.showSaveDialog(mainWindow, {
      defaultPath: options.defaultPath,
      filters: [{ name: 'All Files', extensions: ['*'] }]
    });
  } catch (error) {
    throw new Error(`Save dialog failed: ${error.message}`);
  }
});

ipcMain.handle('open-file-location', async (_, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File does not exist');
    }
    await shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to open file location: ${error.message}`);
  }
});

ipcMain.handle('check-file-exists', async (_, filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}); 