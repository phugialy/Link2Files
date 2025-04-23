const { spawn } = require('child_process');
const { createServer } = require('vite');
const electron = require('electron');
const path = require('path');

/**
 * @type {import('child_process').ChildProcessWithoutNullStreams | null}
 */
let electronProcess = null;

/**
 * Start Electron process and watch for changes
 */
async function startElectron() {
  if (electronProcess) {
    electronProcess.kill();
    electronProcess = null;
  }

  electronProcess = spawn(electron, ['.'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });

  electronProcess.on('close', () => {
    if (!electronProcess?.killed) {
      process.exit();
    }
  });
}

/**
 * Start development server and watch for changes
 */
async function watchMain() {
  try {
    const server = await createServer({
      configFile: path.resolve(__dirname, '../vite.config.ts'),
      mode: 'development',
    });

    await server.listen();
    
    server.watcher.on('change', (file) => {
      console.log('File changed:', file);
      if (file.includes('electron/')) {
        startElectron();
      }
    });

    // Initial start
    startElectron();

    // Cleanup
    const cleanup = () => {
      if (electronProcess) {
        electronProcess.kill();
        electronProcess = null;
      }
      server.close();
      process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

  } catch (error) {
    console.error('Error starting development server:', error);
    process.exit(1);
  }
}

watchMain(); 