const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const http = require('http');

// Enable Hot Reload
if (process.env.NODE_ENV !== 'production') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
  });
}

let mainWindow;

// Force Single Instance
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    startAuthServer();
    createWindow();

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

function startAuthServer() {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url.startsWith('/auth/callback')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0f1115; color: white;">
            <div id="msg" style="text-align: center;">
              <h2>Authenticating...</h2>
            </div>
            <script>
              // The browser has the full URL including the #hash fragment
              fetch('/token', {
                method: 'POST',
                body: window.location.href
              }).then(() => {
                document.getElementById('msg').innerHTML = '<h2>Login Successful! 🎉</h2><p style="color: #a0a5b1;">You can safely close this tab and return to the app.</p>';
                setTimeout(() => window.close(), 3000);
              }).catch(() => {
                document.getElementById('msg').innerHTML = '<h2>Error completing login.</h2>';
              });
            </script>
          </body>
        </html>
      `);
    } else if (req.method === 'POST' && req.url === '/token') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', () => {
        if (mainWindow) {
          mainWindow.webContents.send('oauth-callback', body);
        }
        res.writeHead(200);
        res.end('ok');
      });
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(34567, () => {
    console.log('Auth server listening on port 34567');
  }).on('error', (err) => {
    console.error('Auth server error (port might be in use):', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  mainWindow.loadFile('index.html');
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Custom Desktop Notification IPC
ipcMain.on('show-notification', (event, data) => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  let notifWindow = new BrowserWindow({
    width: 400,
    height: 120,
    x: width - 420,
    y: 50, // Top-right position like WhatsApp
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  notifWindow.loadFile('notification.html');
  
  notifWindow.once('ready-to-show', () => {
    notifWindow.webContents.send('notif-data', data);
    notifWindow.show();
  });

  // Auto-close after 5 seconds
  setTimeout(() => {
    if (!notifWindow.isDestroyed()) notifWindow.close();
  }, 5000);
});
