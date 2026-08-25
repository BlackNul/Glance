import { app, ipcMain, BrowserWindow, nativeTheme, screen, powerMonitor } from 'electron';
import {
  createWidgetWindow,
  expandWidgetWindow,
  collapseWidgetWindow,
  showWidgetWindow,
  hideWidgetWindow,
  getWidgetWindow,
  destroyWidgetWindow,
  COLLAPSED_WIDTH,
  COLLAPSED_HEIGHT,
  EXPANDED_WIDTH,
} from './windowManager';
import { createTray, destroyTray } from './tray';
import { loadSettings, saveSettings } from './settingsStore';
import { startWeatherPolling, stopWeatherPolling, fetchWeather, getCachedWeather } from './weatherService';
import { setAutoLaunch } from './autoLaunch';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import { Settings, WeatherData } from '../shared/types';

let settings: Settings = loadSettings();

function broadcastWeather(weather: WeatherData): void {
  const widgetWin = getWidgetWindow();
  if (widgetWin && !widgetWin.isDestroyed()) {
    widgetWin.webContents.send(IPC_CHANNELS.WEATHER_UPDATE, weather);
  }
}

function broadcastSettings(): void {
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.SETTINGS_CHANGED, settings);
    }
  });
}

function getSystemTheme(): 'light' | 'dark' {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
}

function getTimeOfDay(sunrise: string, sunset: string): 'day' | 'midday' | 'night' {
  const now = Date.now();
  const rise = new Date(sunrise).getTime();
  const set = new Date(sunset).getTime();

  if (now < rise || now > set) return 'night';

  const hour = new Date().getHours();
  if (hour >= 11 && hour < 15) return 'midday';

  return 'day';
}

function getEffectiveTheme(weather?: WeatherData | null): string {
  if (settings.theme === 'auto') return getSystemTheme();
  if (settings.theme === 'dynamic' && weather?.sunrise && weather?.sunset) {
    return getTimeOfDay(weather.sunrise, weather.sunset);
  }
  return settings.theme;
}

function broadcastTheme(weather?: WeatherData | null): void {
  const theme = getEffectiveTheme(weather);
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) {
      win.webContents.send('theme:changed', theme);
    }
  });
}

function clampToWorkArea(x: number, y: number, width: number, height: number): { x: number; y: number } {
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

app.whenReady().then(() => {
  const widgetWindow = createWidgetWindow(settings);

  widgetWindow.webContents.session.setPermissionRequestHandler((_, permission, callback) => {
    if (permission === 'geolocation') {
      callback(true);
    } else {
      callback(false);
    }
  });

  createTray(
    () => {
      widgetWindow.show();
      widgetWindow.focus();
    },
    () => {
      widgetWindow.hide();
    },
    () => {
      // Toggle expand/collapse
      if (widgetWindow && !widgetWindow.isDestroyed() && widgetWindow.isVisible()) {
        const bounds = widgetWindow.getBounds();
        const isExpanded = bounds.height > COLLAPSED_HEIGHT;
        if (isExpanded) {
          collapseWidgetWindow();
        } else {
          expandWidgetWindow();
        }
      }
    },
    () => {
      app.quit();
    }
  );

  startWeatherPolling(
    settings.location.lat,
    settings.location.lon,
    settings.refreshInterval,
    (weather) => {
      broadcastWeather(weather);
      broadcastTheme(weather);
    }
  );

  setAutoLaunch(settings.launchAtStartup);
  broadcastTheme(getCachedWeather());

  nativeTheme.on('updated', () => {
    if (settings.theme === 'auto') {
      broadcastTheme(getCachedWeather());
    }
  });

  powerMonitor.on('resume', () => {
    startWeatherPolling(
      settings.location.lat,
      settings.location.lon,
      settings.refreshInterval,
      (weather) => {
        broadcastWeather(weather);
        broadcastTheme(weather);
      }
    );
  });

  powerMonitor.on('suspend', () => {
    stopWeatherPolling();
  });

  ipcMain.handle(IPC_CHANNELS.WEATHER_UPDATE, async () => {
    return await fetchWeather(settings.location.lat, settings.location.lon);
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_, newSettings: Settings) => {
    settings = newSettings;
    saveSettings(settings);
    stopWeatherPolling();
    startWeatherPolling(
      settings.location.lat,
      settings.location.lon,
      settings.refreshInterval,
      (weather) => {
        broadcastWeather(weather);
        broadcastTheme(weather);
      }
    );
    setAutoLaunch(settings.launchAtStartup);
    broadcastSettings();
    broadcastTheme(getCachedWeather());
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_EXPAND, () => {
    const widgetWin = getWidgetWindow();
    if (widgetWin && !widgetWin.isDestroyed() && widgetWin.isVisible()) {
      const bounds = widgetWin.getBounds();
      const isExpanded = bounds.height > COLLAPSED_HEIGHT;
      if (isExpanded) {
        collapseWidgetWindow();
      } else {
        expandWidgetWindow();
      }
    }
  });

  ipcMain.handle('widget:expand', () => {
    expandWidgetWindow();
  });

  ipcMain.handle('widget:collapse', () => {
    collapseWidgetWindow();
  });

  ipcMain.handle('widget:is-expanded', () => {
    const widgetWin = getWidgetWindow();
    if (widgetWin && !widgetWin.isDestroyed()) {
      const bounds = widgetWin.getBounds();
      return bounds.height > COLLAPSED_HEIGHT;
    }
    return false;
  });

  let saveSettingsTimeout: NodeJS.Timeout | null = null;
  const debouncedSaveSettings = (s: Settings) => {
    if (saveSettingsTimeout) clearTimeout(saveSettingsTimeout);
    saveSettingsTimeout = setTimeout(() => {
      saveSettings(s);
    }, 500);
  };

  ipcMain.handle(IPC_CHANNELS.CHIP_POSITION_CHANGED, (_, x: number, y: number) => {
    const widgetWin = getWidgetWindow();
    if (widgetWin && !widgetWin.isDestroyed()) {
      const bounds = widgetWin.getBounds();
      const height = bounds.height;
      const isExpanded = height > COLLAPSED_HEIGHT;
      const width = isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;
      const pos = clampToWorkArea(x, y, width, height);
      settings.chipPosition = pos;
      debouncedSaveSettings(settings);
      widgetWin.setBounds({ x: pos.x, y: pos.y, width, height });
    }
  });

  ipcMain.handle('chip:get-position', () => {
    const widgetWin = getWidgetWindow();
    if (widgetWin && !widgetWin.isDestroyed()) {
      return widgetWin.getPosition();
    }
    return [settings.chipPosition.x, settings.chipPosition.y];
  });

  widgetWindow.on('closed', () => {
    destroyWidgetWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
});

app.on('before-quit', () => {
  stopWeatherPolling();
  destroyTray();
  destroyWidgetWindow();
});
