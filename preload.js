const { contextBridge, ipcRenderer } = require('electron');

const IPC_CHANNELS = {
  WEATHER_UPDATE: 'weather:update',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_CHANGED: 'settings:changed',
  CHIP_EXPAND: 'chip:expand',
  CHIP_COLLAPSE: 'chip:collapse',
  CHIP_POSITION_CHANGED: 'chip:position-changed',
  WINDOW_EXPAND: 'window:expand',
  WINDOW_COLLAPSE: 'window:collapse',
  DISPLAY_POSITION_CHANGED: 'display:position-changed',
  DISPLAY_CONTEXT_MENU: 'display:context-menu',
};

const api = {
  getWeather: () => ipcRenderer.invoke(IPC_CHANNELS.WEATHER_UPDATE),
  onWeatherUpdate: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.WEATHER_UPDATE, (_, weather) => callback(weather));
  },
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
  setSettings: (settings) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  onSettingsChanged: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.SETTINGS_CHANGED, (_, settings) => callback(settings));
  },
  toggleDisplay: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_EXPAND),
  onExpand: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.WINDOW_EXPAND, () => callback());
  },
  onCollapse: (callback) => {
    ipcRenderer.on(IPC_CHANNELS.WINDOW_COLLAPSE, () => callback());
  },
  setChipPosition: (x, y) => ipcRenderer.invoke(IPC_CHANNELS.CHIP_POSITION_CHANGED, x, y),
  setDisplayPosition: (x, y) => ipcRenderer.invoke(IPC_CHANNELS.DISPLAY_POSITION_CHANGED, x, y),
  getDisplayPosition: () => ipcRenderer.invoke('display:get-position'),
  showContextMenu: () => ipcRenderer.invoke(IPC_CHANNELS.DISPLAY_CONTEXT_MENU),
  onThemeChanged: (callback) => {
    ipcRenderer.on('theme:changed', (_, theme) => callback(theme));
  },
};

contextBridge.exposeInMainWorld('api', api);
