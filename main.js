const { app, BrowserWindow, ipcMain, nativeTheme, Tray, Menu, nativeImage, screen, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');

const SETTINGS_FILE = 'settings.json';

const DEFAULT_SETTINGS = {
  location: { lat: 40.7128, lon: -74.006, name: 'New York' },
  locationDetected: false,
  units: 'C',
  timeFormat: '24',
  theme: 'auto',
  secondHandStyle: 'sweep',
  launchAtStartup: false,
  refreshInterval: 15,
  showStemLine: false,
  chipPosition: { x: 100, y: 100 },
};

function getSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

function loadSettings() {
  const filePath = getSettingsPath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  const filePath = getSettingsPath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

let saveSettingsTimeout = null;
function debouncedSaveSettings(s) {
  if (saveSettingsTimeout) clearTimeout(saveSettingsTimeout);
  saveSettingsTimeout = setTimeout(() => {
    saveSettings(s);
  }, 500);
}

let settings = loadSettings();
let chipWindow = null;
let displayWindow = null;
let tray = null;
let cachedWeather = null;
let refreshTimer = null;

const CHIP_WIDTH = 180;
const CHIP_HEIGHT = 44;
const DISPLAY_SIZE = 260;

function getPreloadPath() {
  return path.join(__dirname, 'preload.js');
}

function createChipWindow() {
  const pos = clampToWorkArea(settings.chipPosition.x, settings.chipPosition.y, CHIP_WIDTH, CHIP_HEIGHT);

  chipWindow = new BrowserWindow({
    width: CHIP_WIDTH,
    height: CHIP_HEIGHT,
    minWidth: CHIP_WIDTH,
    minHeight: CHIP_HEIGHT,
    maxWidth: CHIP_WIDTH,
    maxHeight: CHIP_HEIGHT,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  chipWindow.loadFile(path.join(__dirname, 'dist/src/renderer/chip/index.html'));
  chipWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  chipWindow.setMinimumSize(CHIP_WIDTH, CHIP_HEIGHT);
  chipWindow.setMaximumSize(CHIP_WIDTH, CHIP_HEIGHT);

  return chipWindow;
}

function createDisplayWindow() {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.focus();
    return displayWindow;
  }

  const chipBounds = chipWindow?.getBounds();
  const displayWidth = DISPLAY_SIZE;
  const displayHeight = DISPLAY_SIZE;

  let displayX = chipBounds ? chipBounds.x + chipBounds.width / 2 - displayWidth / 2 : 300;
  let displayY = chipBounds ? chipBounds.y - displayHeight - 10 : 100;

  const primaryDisplay = require('electron').screen.getPrimaryDisplay();
  const { x: screenX, y: screenY, width: screenW, height: screenH } = primaryDisplay.workArea;

  if (displayY < screenY) displayY = chipBounds ? chipBounds.y + chipBounds.height + 10 : screenY + 10;
  if (displayX < screenX) displayX = screenX + 10;
  if (displayX + displayWidth > screenX + screenW) displayX = screenX + screenW - displayWidth - 10;
  if (displayY + displayHeight > screenY + screenH) displayY = screenY + screenH - displayHeight - 10;

  displayWindow = new BrowserWindow({
    width: displayWidth,
    height: displayHeight,
    minWidth: displayWidth,
    minHeight: displayHeight,
    maxWidth: displayWidth,
    maxHeight: displayHeight,
    x: Math.round(displayX),
    y: Math.round(displayY),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  displayWindow.loadFile(path.join(__dirname, 'dist/src/renderer/display/index.html'));
  displayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  return displayWindow;
}

function toggleDisplayWindow() {
  if (displayWindow && !displayWindow.isDestroyed() && displayWindow.isVisible()) {
    displayWindow.hide();
  } else {
    createDisplayWindow();
    displayWindow.show();
    displayWindow.focus();
  }
}

function destroyDisplayWindow() {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.destroy();
    displayWindow = null;
  }
}

function clampToWorkArea(x, y, width, height) {
  const displays = screen.getAllDisplays();
  let clampedX = x;
  let clampedY = y;

  for (const display of displays) {
    const { x: sx, y: sy, width: sw, height: sh } = display.workArea;
    if (clampedX >= sx && clampedX <= sx + sw && clampedY >= sy && clampedY <= sy + sh) {
      clampedX = Math.max(sx, Math.min(clampedX, sx + sw - width));
      clampedY = Math.max(sy, Math.min(clampedY, sy + sh - height));
      return { x: clampedX, y: clampedY };
    }
  }

  const primary = screen.getPrimaryDisplay().workArea;
  clampedX = Math.max(primary.x, Math.min(x, primary.x + primary.width - width));
  clampedY = Math.max(primary.y, Math.min(y, primary.y + primary.height - height));
  return { x: clampedX, y: clampedY };
}

function broadcastWeather(weather) {
  const chipWin = chipWindow;
  if (chipWin && !chipWin.isDestroyed()) {
    chipWin.webContents.send('weather:update', weather);
  }
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed() && win !== chipWin) {
      win.webContents.send('weather:update', weather);
    }
  });
}

function broadcastToAll(channel, data) {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, data);
    }
  });
}

function getSystemTheme() {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
}

function getTimeOfDay(sunrise, sunset) {
  const now = Date.now();
  const rise = new Date(sunrise).getTime();
  const set = new Date(sunset).getTime();

  if (now < rise || now > set) return 'night';

  const hour = new Date().getHours();
  if (hour >= 11 && hour < 15) return 'midday';

  return 'day';
}

function getEffectiveTheme(weather) {
  if (settings.theme === 'auto') return getSystemTheme();
  if (settings.theme === 'dynamic' && weather && weather.sunrise && weather.sunset) {
    return getTimeOfDay(weather.sunrise, weather.sunset);
  }
  return settings.theme;
}

function broadcastTheme(weather) {
  const theme = getEffectiveTheme(weather || cachedWeather);
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('theme:changed', theme);
    }
  });
}

function weatherCodeToCondition(code) {
  const conditions = {
    0: { condition: 'Clear', icon: 'clear' },
    1: { condition: 'Mainly Clear', icon: 'clear' },
    2: { condition: 'Partly Cloudy', icon: 'partly-cloudy' },
    3: { condition: 'Overcast', icon: 'cloudy' },
    45: { condition: 'Fog', icon: 'fog' },
    48: { condition: 'Rime Fog', icon: 'fog' },
    51: { condition: 'Light Drizzle', icon: 'drizzle' },
    53: { condition: 'Drizzle', icon: 'drizzle' },
    55: { condition: 'Heavy Drizzle', icon: 'drizzle' },
    61: { condition: 'Light Rain', icon: 'rain' },
    63: { condition: 'Rain', icon: 'rain' },
    65: { condition: 'Heavy Rain', icon: 'rain' },
    71: { condition: 'Light Snow', icon: 'snow' },
    73: { condition: 'Snow', icon: 'snow' },
    75: { condition: 'Heavy Snow', icon: 'snow' },
    80: { condition: 'Light Showers', icon: 'rain' },
    81: { condition: 'Showers', icon: 'rain' },
    82: { condition: 'Heavy Showers', icon: 'rain' },
    95: { condition: 'Thunderstorm', icon: 'thunderstorm' },
    96: { condition: 'Thunderstorm w/ Hail', icon: 'thunderstorm' },
    99: { condition: 'Thunderstorm w/ Heavy Hail', icon: 'thunderstorm' },
  };
  return conditions[code] || { condition: 'Unknown', icon: 'clear' };
}

async function fetchWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${settings.location.lat}&longitude=${settings.location.lon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const { condition, icon } = weatherCodeToCondition(data.current.weather_code);

    cachedWeather = {
      tempC: Math.round(data.current.temperature_2m),
      condition,
      icon,
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
      isDay: data.current.is_day === 1,
    };
    return cachedWeather;
  } catch (error) {
    console.error('Weather fetch failed:', error);
    return cachedWeather;
  }
}

function startWeatherPolling() {
  stopWeatherPolling();

  fetchWeather().then((weather) => {
    if (weather) {
      broadcastWeather(weather);
      broadcastTheme(weather);
    }
  });

  refreshTimer = setInterval(async () => {
    const weather = await fetchWeather();
    if (weather) {
      broadcastWeather(weather);
      broadcastTheme(weather);
    }
  }, settings.refreshInterval * 60 * 1000);
}

function stopWeatherPolling() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets/tray-icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Glance - Weather Clock');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show', click: () => {
        chipWindow?.show();
        chipWindow?.focus();
      }
    },
    {
      label: 'Hide', click: () => {
        chipWindow?.hide();
      }
    },
    { type: 'separator' },
    {
      label: 'Settings', click: () => {
        toggleDisplayWindow();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit', click: () => {
        app.quit();
      }
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    chipWindow?.show();
    chipWindow?.focus();
  });
}

app.whenReady().then(() => {
  createChipWindow();
  createTray();

  if (chipWindow && !chipWindow.isDestroyed()) {
    chipWindow.webContents.session.setPermissionRequestHandler((_, permission, callback) => {
      if (permission === 'geolocation') {
        callback(true);
      } else {
        callback(false);
      }
    });
  }
  startWeatherPolling();
  broadcastTheme(cachedWeather);

  nativeTheme.on('updated', () => {
    if (settings.theme === 'auto') {
      broadcastTheme(cachedWeather);
    }
  });

  powerMonitor.on('resume', () => {
    startWeatherPolling();
    broadcastWeather(cachedWeather);
    broadcastTheme(cachedWeather);
  });

  powerMonitor.on('suspend', () => {
    stopWeatherPolling();
  });

  ipcMain.handle('weather:update', async () => {
    return await fetchWeather();
  });

  ipcMain.handle('settings:get', () => {
    return settings;
  });

  ipcMain.handle('settings:set', (_, newSettings) => {
    settings = newSettings;
    saveSettings(settings);
    stopWeatherPolling();
    startWeatherPolling();
    setAutoLaunch(settings.launchAtStartup);
    broadcastToAll('settings:changed', settings);
    broadcastTheme(cachedWeather);
  });

  ipcMain.handle('window:expand', () => {
    toggleDisplayWindow();
  });

  ipcMain.handle('chip:position-changed', (_, x, y) => {
    const pos = clampToWorkArea(x, y, CHIP_WIDTH, CHIP_HEIGHT);
    settings.chipPosition = pos;
    debouncedSaveSettings(settings);
    if (chipWindow && !chipWindow.isDestroyed()) {
      chipWindow.setBounds({ x: pos.x, y: pos.y, width: CHIP_WIDTH, height: CHIP_HEIGHT });
    }
  });

  ipcMain.handle('chip:get-position', () => {
    if (chipWindow && !chipWindow.isDestroyed()) {
      return chipWindow.getPosition();
    }
    return [settings.chipPosition.x, settings.chipPosition.y];
  });

  ipcMain.handle('display:position-changed', (event, x, y) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setBounds({ x, y, width: DISPLAY_SIZE, height: DISPLAY_SIZE });
    }
  });

  ipcMain.handle('display:get-position', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      return win.getPosition();
    }
    return [300, 100];
  });

  ipcMain.handle('display:context-menu', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Time Format: ${settings.timeFormat === '12' ? '12-Hour' : '24-Hour'}`,
        click: () => {
          settings.timeFormat = settings.timeFormat === '12' ? '24' : '12';
          saveSettings(settings);
          broadcastToAll('settings:changed', settings);
        }
      },
      {
        label: `Temperature: °${settings.units}`,
        click: () => {
          settings.units = settings.units === 'C' ? 'F' : 'C';
          saveSettings(settings);
          broadcastToAll('settings:changed', settings);
        }
      },
      {
        label: `Theme: ${settings.theme === 'auto' ? 'Auto' : settings.theme === 'dark' ? 'Dark' : 'Light'}`,
        click: () => {
          const order = ['auto', 'dark', 'light'];
          const idx = order.indexOf(settings.theme);
          settings.theme = order[(idx + 1) % order.length];
          saveSettings(settings);
          broadcastToAll('settings:changed', settings);
          broadcastTheme();
        }
      },
      { type: 'separator' },
      {
        label: 'Quit', click: () => {
          app.quit();
        }
      },
    ]);

    contextMenu.popup({ window: win });
  });

  ipcMain.handle('display:resize', (_, w, h) => {
    if (displayWindow && !displayWindow.isDestroyed()) {
      const clampedW = Math.min(Math.max(w, DISPLAY_SIZE), DISPLAY_SIZE);
      const clampedH = Math.min(Math.max(h, DISPLAY_SIZE), DISPLAY_SIZE);
      const bounds = displayWindow.getBounds();
      displayWindow.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: clampedW,
        height: clampedH,
      });
    }
  });

  chipWindow.on('closed', () => {
    destroyDisplayWindow();
  });
});

app.on('before-quit', () => {
  stopWeatherPolling();
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }
  destroyDisplayWindow();
});

function setAutoLaunch(enable) {
  app.setLoginItemSettings({
    openAtLogin: enable,
  });
}
