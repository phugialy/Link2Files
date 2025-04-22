const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const ytdl = require('@distube/ytdl-core');
const YtDlpWrap = require('yt-dlp-wrap').default;

let mainWindow;
let ytDlp = null;

// Configure session and headers
const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Dest': 'video',
  'Referer': 'https://www.youtube.com/',
  'Origin': 'https://www.youtube.com',
  'Connection': 'keep-alive'
};

const configureSession = () => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({
      requestHeaders: {
        ...details.requestHeaders,
        ...defaultHeaders
      }
    });
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' https: http: data: blob: 'unsafe-inline' 'unsafe-eval'"]
      }
    });
  });
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Security: Prevent navigation and new windows
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
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

// Utility functions
const isValidYouTubeUrl = (url) => {
  try {
    return ytdl.validateURL(url);
  } catch (error) {
    return false;
  }
};

const getVideoId = (url) => {
  try {
    return ytdl.getURLVideoID(url);
  } catch (error) {
    throw new Error('Invalid YouTube URL');
  }
};

// IPC Handlers
ipcMain.handle('get-video-info', async (_, url) => {
  try {
    if (!isValidYouTubeUrl(url)) {
      throw new Error('Invalid YouTube URL');
    }

    const videoId = getVideoId(url);
    const info = await ytdl.getInfo(videoId, {
      requestOptions: {
        headers: defaultHeaders
      },
      client: {
        rejectUnauthorized: false,
        keepAlive: true,
        timeout: 60000
      },
      cookiejar: true
    });

    const formats = info.formats
      .filter(format => format.hasVideo && format.hasAudio && format.container === 'mp4')
      .sort((a, b) => Number(b.qualityLabel?.replace('p', '')) - Number(a.qualityLabel?.replace('p', '')));

    if (formats.length === 0) {
      throw new Error('No suitable video format found');
    }

    return {
      title: info.videoDetails.title,
      formats,
      videoDetails: {
        title: info.videoDetails.title,
        description: info.videoDetails.description,
        lengthSeconds: info.videoDetails.lengthSeconds,
        viewCount: info.videoDetails.viewCount
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch video info: ${error.message}`);
  }
});

ipcMain.handle('download-video', async (event, { url, filePath, format }) => {
  try {
    if (!isValidYouTubeUrl(url)) {
      throw new Error('Invalid URL');
    }

    if (!ytDlp) {
      ytDlp = new YtDlpWrap();
    }

    const downloadOptions = format === 'mp3' 
      ? ['-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0']
      : ['-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', '--merge-output-format', 'mp4'];

    const download = ytDlp.exec([
      url,
      ...downloadOptions,
      '-o', filePath,
      '--no-playlist',
      '--progress-template', '%(progress._percent_str)s'
    ]);

    download.on('progress', (progress) => {
      const progressMatch = progress.match(/(\d+\.\d+)%/);
      if (progressMatch) {
        event.sender.send('download-progress', parseFloat(progressMatch[1]));
      }
    });

    await new Promise((resolve, reject) => {
      download.on('close', resolve);
      download.on('error', reject);
    });

    event.sender.send('download-complete');
    return { success: true };
  } catch (error) {
    throw error;
  }
});

ipcMain.handle('show-save-dialog', async (_, options) => {
  try {
    const ext = options.defaultPath.split('.').pop();
    return await dialog.showSaveDialog(mainWindow, {
      defaultPath: options.defaultPath,
      filters: [{ name: ext === 'mp3' ? 'Audio' : 'Video', extensions: [ext] }],
      properties: ['createDirectory', 'showOverwriteConfirmation']
    });
  } catch (error) {
    throw new Error(`Save dialog failed: ${error.message}`);
  }
});

// App lifecycle
app.whenReady().then(async () => {
  configureSession();
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