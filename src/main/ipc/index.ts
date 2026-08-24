import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { Settings, WeatherData } from '../../shared/types';

export function registerWeatherHandlers(
  fetchWeather: (lat: number, lon: number) => Promise<WeatherData | null>,
  getSettings: () => Settings
): void {
  ipcMain.handle(IPC_CHANNELS.WEATHER_UPDATE, async () => {
    const settings = getSettings();
    return await fetchWeather(settings.location.lat, settings.location.lon);
  });
}

export function registerSettingsHandlers(
  getSettings: () => Settings,
  setSettings: (settings: Settings) => void,
  broadcastSettings: () => void
): void {
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, () => {
    return getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_, newSettings: Settings) => {
    setSettings(newSettings);
    broadcastSettings();
  });
}

export function registerWindowHandlers(
  toggleDisplayWindow: () => void,
  setChipPosition: (x: number, y: number) => void
): void {
  ipcMain.handle(IPC_CHANNELS.WINDOW_EXPAND, () => {
    toggleDisplayWindow();
  });

  ipcMain.handle(IPC_CHANNELS.CHIP_POSITION_CHANGED, (_, x: number, y: number) => {
    setChipPosition(x, y);
  });

  ipcMain.handle('display:position-changed', (event, x: number, y: number) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setPosition(x, y);
    }
  });

  ipcMain.handle('display:get-position', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      return win.getPosition();
    }
    return [300, 100];
  });
}

export function registerContextMenuHandler(
  getSettings: () => Settings,
  setSettings: (settings: Settings) => void,
  broadcastSettings: () => void,
  quitApp: () => void
): void {
  ipcMain.handle('display:context-menu', (event) => {
    const settings = getSettings();
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || win.isDestroyed()) return;

    const { Menu } = require('electron');
    const contextMenu = Menu.buildFromTemplate([
      {
        label: `Time Format: ${settings.timeFormat === '12' ? '12-Hour' : '24-Hour'}`,
        click: () => {
          settings.timeFormat = settings.timeFormat === '12' ? '24' : '12';
          setSettings(settings);
          broadcastSettings();
        }
      },
      {
        label: `Temperature: °${settings.units}`,
        click: () => {
          settings.units = settings.units === 'C' ? 'F' : 'C';
          setSettings(settings);
          broadcastSettings();
        }
      },
      {
        label: `Theme: ${settings.theme === 'auto' ? 'Auto' : settings.theme === 'dark' ? 'Dark' : 'Light'}`,
        click: () => {
          const order = ['auto', 'dark', 'light'];
          const idx = order.indexOf(settings.theme);
          settings.theme = order[(idx + 1) % order.length] as 'auto' | 'dark' | 'light';
          setSettings(settings);
          broadcastSettings();
        }
      },
      { type: 'separator' },
      {
        label: 'Quit', click: () => {
          quitApp();
        }
      },
    ]);

    contextMenu.popup({ window: win });
  });
}
