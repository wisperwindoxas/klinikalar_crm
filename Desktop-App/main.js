// Sadaf Clinic - Smart Desktop Queue & Multi-Display TV System
// Electron Main Process
delete process.env.ELECTRON_RUN_AS_NODE;

const { app, BrowserWindow, ipcMain, screen, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

app.setName('Klinika-admin');

// Setup macOS dock icon if available
function setupAppIcon() {
  if (process.platform === 'darwin' && app.dock) {
    const iconPath = path.join(__dirname, 'build/icon.png');
    if (fs.existsSync(iconPath)) {
      try {
        app.dock.setIcon(iconPath);
      } catch (e) {
        console.warn('Dock icon error:', e);
      }
    }
  }
}
setupAppIcon();

let mainWindow = null;
let tvWindow = null;

const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development' || !app.isPackaged;
const USER_PANEL_DEV_URL = 'http://localhost:3001';
const TV_DISPLAY_DEV_URL = 'http://localhost:3002';
const BACKEND_URL = 'http://localhost:5001';

// Format display object for IPC
function formatDisplays() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  return displays.map((disp, index) => {
    const isPrimary = disp.id === primaryDisplay.id;
    const label = disp.label || (isPrimary ? `Asosiy Monitor (Ekran #${index + 1})` : `Tashqi TV / HDMI Ekran #${index + 1}`);

    return {
      id: disp.id,
      index: index + 1,
      label: label,
      isPrimary: isPrimary,
      bounds: disp.bounds,
      workArea: disp.workArea,
      resolution: `${disp.bounds.width}x${disp.bounds.height}`,
      scaleFactor: disp.scaleFactor
    };
  });
}

// Resolve bundle path for User-Panel
function getUserPanelPath() {
  const localDist = path.join(__dirname, 'dist/user/index.html');
  if (fs.existsSync(localDist)) return localDist;
  return path.join(__dirname, '../User-Panel/dist/index.html');
}

// Resolve bundle path for TV-Display
function getTvDisplayPath() {
  const localDist = path.join(__dirname, 'dist/tv/index.html');
  if (fs.existsSync(localDist)) return localDist;
  return path.join(__dirname, '../TV-Display/dist/index.html');
}

// 1. Create Main Window (User-Panel: Kassir / Menejer / Shifokor)
function createMainWindow() {
  const appIcon = process.platform === 'darwin'
    ? path.join(__dirname, 'build/icon.icns')
    : path.join(__dirname, 'build/icon.png');

  mainWindow = new BrowserWindow({
    title: 'Klinika-admin — Boshqaruv & Qabul Paneli',
    icon: appIcon,
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0B1528',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Guarantee window is shown even if network slows down
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 1200);

  const localDistPath = getUserPanelPath();

  // Load URL or build dist
  if (isDev) {
    const req = http.get(USER_PANEL_DEV_URL, () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(USER_PANEL_DEV_URL).catch(() => {
          mainWindow.loadFile(localDistPath);
        });
      }
    });
    req.on('error', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadFile(localDistPath);
      }
    });
    req.setTimeout(800, () => {
      req.destroy();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadFile(localDistPath);
      }
    });
  } else {
    mainWindow.loadFile(localDistPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (tvWindow && !tvWindow.isDestroyed()) {
      tvWindow.close();
    }
  });
}

// 2. Create or Move TV Window (TV-Display on target HDMI display)
function createOrMoveTvWindow(targetDisplayId, fullscreen = true) {
  const allDisplays = screen.getAllDisplays();
  let targetDisplay = null;

  if (targetDisplayId) {
    targetDisplay = allDisplays.find(d => String(d.id) === String(targetDisplayId));
  }

  // If target not found or not specified, choose the first secondary display (HDMI TV), otherwise primary
  if (!targetDisplay) {
    const primary = screen.getPrimaryDisplay();
    targetDisplay = allDisplays.find(d => d.id !== primary.id) || primary;
  }

  const { x, y, width, height } = targetDisplay.bounds;

  if (tvWindow && !tvWindow.isDestroyed()) {
    // If TV window already exists, relocate to target display
    tvWindow.setFullScreen(false);
    tvWindow.setBounds({ x, y, width, height });
    if (fullscreen) {
      tvWindow.setFullScreen(true);
    }
    tvWindow.show();
    tvWindow.focus();
    return { success: true, message: `TV Tablo ${targetDisplay.id} ekraniga o'tkazildi` };
  }

  const appIcon = process.platform === 'darwin'
    ? path.join(__dirname, 'build/icon.icns')
    : path.join(__dirname, 'build/icon.png');

  tvWindow = new BrowserWindow({
    title: 'Klinika-admin — Katta TV Tablo',
    icon: appIcon,
    x: x,
    y: y,
    width: width,
    height: height,
    fullscreen: fullscreen,
    autoHideMenuBar: true,
    backgroundColor: '#0F172A',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      autoplayPolicy: 'no-user-gesture-required' // Allow immediate sound announcement
    }
  });

  tvWindow.once('ready-to-show', () => {
    tvWindow.show();
    if (fullscreen) {
      tvWindow.setFullScreen(true);
    }
  });

  setTimeout(() => {
    if (tvWindow && !tvWindow.isDestroyed() && !tvWindow.isVisible()) {
      tvWindow.show();
    }
  }, 1200);

  const localTvPath = getTvDisplayPath();

  if (isDev) {
    const req = http.get(TV_DISPLAY_DEV_URL, () => {
      if (tvWindow && !tvWindow.isDestroyed()) {
        tvWindow.loadURL(TV_DISPLAY_DEV_URL).catch(() => {
          tvWindow.loadFile(localTvPath);
        });
      }
    });
    req.on('error', () => {
      if (tvWindow && !tvWindow.isDestroyed()) {
        tvWindow.loadFile(localTvPath);
      }
    });
    req.setTimeout(800, () => {
      req.destroy();
      if (tvWindow && !tvWindow.isDestroyed()) {
        tvWindow.loadFile(localTvPath);
      }
    });
  } else {
    tvWindow.loadFile(localTvPath);
  }

  tvWindow.on('closed', () => {
    tvWindow = null;
  });

  return { success: true, message: `TV Tablo ${targetDisplay.id} ekranida muvaffaqiyatli ochildi` };
}

// App lifecycle
app.whenReady().then(() => {
  setupAppIcon();
  createMainWindow();

  // Listen to screen changes (HDMI plugged or unplugged)
  screen.on('display-added', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('displays-changed', formatDisplays());
    }
  });

  screen.on('display-removed', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('displays-changed', formatDisplays());
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC HANDLERS ---

// 1. Get all connected monitors/displays
ipcMain.handle('get-displays', () => {
  return formatDisplays();
});

// 2. Open TV Tablo on selected display
ipcMain.handle('open-tv-on-display', (_event, { displayId, fullscreen }) => {
  return createOrMoveTvWindow(displayId, fullscreen);
});

// 3. Close TV Tablo window
ipcMain.handle('close-tv-display', () => {
  if (tvWindow && !tvWindow.isDestroyed()) {
    tvWindow.close();
    tvWindow = null;
    return { success: true };
  }
  return { success: false, message: 'TV oynasi ochiq emas' };
});

// 4. Check if TV window is currently open
ipcMain.handle('is-tv-open', () => {
  return tvWindow !== null && !tvWindow.isDestroyed();
});

// 5. Get available system printers
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    return await mainWindow.webContents.getPrintersAsync();
  } catch (e) {
    console.error('getPrinters error:', e);
    return [];
  }
});

// Helper: Print clean thermal HTML document in an isolated off-screen window
async function printThermalHtmlElectron(options) {
  const {
    html,
    paperSize = '80mm',
    silent = false,
    printerName,
    copies = 1,
    heightMm
  } = options || {};

  if (!html) return { success: false, error: 'Chop etish uchun HTML berilmadi' };

  return new Promise((resolve) => {
    let printWin = new BrowserWindow({
      show: false,
      width: paperSize === '58mm' ? 300 : 380,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    printWin.webContents.on('did-finish-load', async () => {
      try {
        let targetHeightMicrons = 100000;
        if (heightMm) {
          targetHeightMicrons = Math.max(40000, Math.round(Number(heightMm) * 1000));
        } else {
          // Dynamically measure exact content height in microns from isolated DOM
          const heightPx = await printWin.webContents.executeJavaScript('document.body.scrollHeight');
          targetHeightMicrons = Math.max(40000, Math.ceil((heightPx / 96) * 25400) + 2000);
        }

        printWin.webContents.print(
          {
            silent: Boolean(silent),
            printBackground: true,
            deviceName: printerName || undefined,
            copies: Number(copies) || 1,
            margins: { marginType: 'none' },
            pageSize: {
              width: paperSize === '58mm' ? 58000 : 80000,
              height: targetHeightMicrons
            },
            preferCSSPageSize: true
          },
          (success, failureReason) => {
            if (printWin && !printWin.isDestroyed()) {
              printWin.close();
              printWin = null;
            }
            if (!success) {
              console.warn('Electron thermal print failure:', failureReason);
              resolve({ success: false, error: failureReason });
            } else {
              resolve({ success: true });
            }
          }
        );
      } catch (err) {
        if (printWin && !printWin.isDestroyed()) {
          printWin.close();
          printWin = null;
        }
        resolve({ success: false, error: err.message });
      }
    });
  });
}

// 6. Direct silent print for thermal receipt tickets
ipcMain.handle('silent-print', async (_event, options) => {
  return printThermalHtmlElectron({ ...options, silent: true });
});

// 6.1 Direct thermal ticket print for POS/Xprinter roll printers (supports dialog or silent)
ipcMain.handle('print-ticket', async (event, options) => {
  if (options && options.html) {
    return printThermalHtmlElectron(options);
  }

  // Fallback: If no HTML provided, print sender window
  const { paperSize = '80mm', heightMm, silent = false, printerName, copies = 1 } = options || {};
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { success: false, error: 'Oyna topilmadi' };

  const targetHeightMicrons = heightMm ? Math.max(45000, Math.round(Number(heightMm) * 1000)) : 105000;

  return new Promise((resolve) => {
    const printOptions = {
      silent: Boolean(silent),
      printBackground: true,
      deviceName: printerName || undefined,
      copies: Number(copies) || 1,
      margins: { marginType: 'none' },
      pageSize: {
        width: paperSize === '58mm' ? 58000 : 80000,
        height: targetHeightMicrons
      },
      preferCSSPageSize: true
    };

    win.webContents.print(printOptions, (success, failureReason) => {
      if (!success) {
        console.warn('Electron print-ticket status:', failureReason);
        resolve({ success: false, error: failureReason });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// 7. Check local backend server connectivity (Offline verification)
ipcMain.handle('check-backend-health', async () => {
  return new Promise((resolve) => {
    const req = http.get(`${BACKEND_URL}/api/v1/clinic/settings`, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve({ ok: true });
      } else {
        resolve({ ok: false, error: `Status ${res.statusCode}` });
      }
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });

    req.setTimeout(2500, () => {
      req.destroy();
      resolve({ ok: false, error: 'Timeout' });
    });
  });
});

// 8. GitHub Update & Downloader Handlers
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('open-external-url', (_event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
    return true;
  }
  return false;
});

ipcMain.handle('download-update', async (event, { url, fileName }) => {
  if (!url) return { success: false, message: "URL ko'rsatilmadi" };

  // Validate URL to prevent arbitrary URL downloading
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (_) {
    return { success: false, message: "Noto'g'ri URL manzili" };
  }

  // Allow HTTPS from trusted GitHub release origins OR local backend server
  const isAllowedHost = (
    (parsedUrl.protocol === 'https:' && (
      parsedUrl.hostname === 'github.com' ||
      parsedUrl.hostname.endsWith('.github.com') ||
      parsedUrl.hostname === 'github-releases.githubusercontent.com' ||
      parsedUrl.hostname === 'objects.githubusercontent.com' ||
      parsedUrl.hostname.endsWith('.githubusercontent.com')
    )) ||
    ((parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') && (
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.hostname === '127.0.0.1' ||
      parsedUrl.hostname.startsWith('192.168.') ||
      parsedUrl.hostname.startsWith('10.') ||
      parsedUrl.pathname.includes('/api/v1/app/download/')
    ))
  );

  if (!isAllowedHost) {
    return { success: false, message: "Faqat rasmiy relizlar yoki klinik server orqali yangilashga ruxsat berilgan." };
  }

  // Strictly sanitize fileName to prevent path traversal
  const baseName = path.basename(fileName || parsedUrl.pathname || 'Klinika-admin-update');
  const safeFileName = baseName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

  // Verify safe extension
  const ext = path.extname(safeFileName).toLowerCase();
  const allowedExts = ['.exe', '.dmg', '.zip', '.pkg', '.blockmap'];
  if (!allowedExts.includes(ext)) {
    return { success: false, message: `Ruxsat etilmagan fayl turi: ${ext}` };
  }

  return new Promise((resolve) => {
    try {
      const downloadDir = app.getPath('downloads');
      const targetPath = path.join(downloadDir, safeFileName);

      const file = fs.createWriteStream(targetPath);

      const downloadWithRedirect = (currentUrl, redirectCount = 0) => {
        if (redirectCount > 5) {
          file.close();
          fs.unlink(targetPath, () => { });
          return resolve({ success: false, message: "Juda ko'p redirect amalga oshirildi." });
        }

        let curParsed;
        try {
          curParsed = new URL(currentUrl);
        } catch (_) {
          file.close();
          fs.unlink(targetPath, () => { });
          return resolve({ success: false, message: "Noto'g'ri yo'naltirilgan URL" });
        }

        // Validate redirect host
        const isAllowedRedirect = (
          (curParsed.protocol === 'https:' && (
            curParsed.hostname === 'github.com' ||
            curParsed.hostname.endsWith('.github.com') ||
            curParsed.hostname === 'github-releases.githubusercontent.com' ||
            curParsed.hostname === 'objects.githubusercontent.com' ||
            curParsed.hostname.endsWith('.githubusercontent.com') ||
            curParsed.hostname.endsWith('.amazonaws.com') ||
            curParsed.hostname.endsWith('.blob.core.windows.net')
          )) ||
          ((curParsed.protocol === 'http:' || curParsed.protocol === 'https:') && (
            curParsed.hostname === 'localhost' ||
            curParsed.hostname === '127.0.0.1' ||
            curParsed.hostname.startsWith('192.168.') ||
            curParsed.hostname.startsWith('10.')
          ))
        );

        if (!isAllowedRedirect) {
          file.close();
          fs.unlink(targetPath, () => { });
          return resolve({ success: false, message: "Xavfsiz bo'lmagan manzilga yo'naltirish rad etildi." });
        }

        const clientLib = curParsed.protocol === 'http:' ? http : https;
        clientLib.get(currentUrl, (response) => {
          // Handle HTTP redirect (GitHub release assets redirect to AWS S3)
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return downloadWithRedirect(response.headers.location, redirectCount + 1);
          }

          if (response.statusCode !== 200) {
            file.close();
            fs.unlink(targetPath, () => { });
            return resolve({ success: false, message: `Server xatosi: HTTP ${response.statusCode}` });
          }

          const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
          let receivedBytes = 0;

          response.on('data', (chunk) => {
            receivedBytes += chunk.length;
            if (totalBytes > 0) {
              const percent = Math.round((receivedBytes / totalBytes) * 100);
              event.sender.send('update-download-progress', percent);
            }
          });

          response.pipe(file);

          file.on('finish', () => {
            file.close(() => {
              // Open directory or trigger installer safely
              try {
                shell.openPath(targetPath);
              } catch (e) { }
              resolve({ success: true, filePath: targetPath });
            });
          });
        }).on('error', (err) => {
          file.close();
          fs.unlink(targetPath, () => { });
          resolve({ success: false, message: err.message });
        });
      };

      downloadWithRedirect(url);
    } catch (e) {
      resolve({ success: false, message: e.message });
    }
  });
});
