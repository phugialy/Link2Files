const { spawn } = require('child_process');
const { createServer } = require('vite');
const electron = require('electron');
const path = require('path');

async function startApp() {
  // Create Vite dev server
  const server = await createServer({
    configFile: path.resolve(__dirname, '../vite.config.ts'),
  });

  await server.listen();

  // Set development environment
  const env = Object.assign(process.env, {
    NODE_ENV: 'development',
  });

  // Start Electron
  const electronProcess = spawn(electron, ['.'], {
    stdio: 'inherit',
    env,
  });

  electronProcess.on('close', () => {
    server.close();
    process.exit();
  });
}

startApp(); 