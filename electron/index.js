const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  // 🔹 Select icon based on platform
  let iconPath;
  if (process.platform === 'darwin') {
    iconPath = path.join(__dirname, 'assets/icon.icns');
  } else if (process.platform === 'win32') {
    iconPath = path.join(__dirname, 'assets/icon.ico');
  } else {
    iconPath = path.join(__dirname, 'assets/icon.png');
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,               // prevents white flash
    autoHideMenuBar: false,    // menu visible
    icon: iconPath,
    title: 'NSCSL Dashboard',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // ✅ MAXIMIZE WINDOW
  mainWindow.maximize();
  mainWindow.show();

  // 🔗 Load backend server
  mainWindow.loadURL('http://10.1.1.151:3002');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // =========================================
  // APPLICATION MENU
  // =========================================

  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Refresh',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About NSCSL Dashboard',
              message: 'NSCSL Dashboard',
              detail:
                'Version 1.0.0\n\nLaboratory Dashboard System\n\nServer: 10.1.1.151:3002'
            });
          }
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);

  // =========================================
  // HANDLE EXTERNAL LINKS
  // =========================================

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
