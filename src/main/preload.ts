import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import { WeatherData, Settings } from '../shared/types';

const api = {
  getWeather: (): Promise<WeatherData | null> => ipcRenderer.invoke(IPC_CHANNELS.WEATHER_UPDATE),
  onWeatherUpdate: (callback: (weather: WeatherData) => void) => {
    ipcRenderer.on(IPC_CHANNELS.WEATHER_UPDATE, (_, weather) => callback(weather));
  },
  getSettings: (): Promise<Settings> => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSettings: (settings: Settings): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  onSettingsChanged: (callback: (settings: Settings) => void) => {
    ipcRenderer.on(IPC_CHANNELS.SETTINGS_CHANGED, (_, settings) => callback(settings));
  },
  toggleDisplay: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_EXPAND),
  onExpand: (callback: () => void) => {
    ipcRenderer.on(IPC_CHANNELS.WINDOW_EXPAND, () => callback());
  },
  onCollapse: (callback: () => void) => {
    ipcRenderer.on(IPC_CHANNELS.WINDOW_COLLAPSE, () => callback());
  },
  setChipPosition: (x: number, y: number): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.CHIP_POSITION_CHANGED, x, y),
  getChipPosition: (): Promise<[number, number]> => ipcRenderer.invoke('chip:get-position'),
  setDisplayPosition: (x: number, y: number): Promise<void> =>
    ipcRenderer.invoke('display:position-changed', x, y),
  getDisplayPosition: (): Promise<[number, number]> => ipcRenderer.invoke('display:get-position'),
  showContextMenu: (): Promise<void> => ipcRenderer.invoke('display:context-menu'),
  onThemeChanged: (callback: (theme: 'light' | 'dark') => void) => {
    ipcRenderer.on('theme:changed', (_, theme) => callback(theme));
  },
};

contextBridge.exposeInMainWorld('api', api);

export type GlanceAPI = typeof api;
