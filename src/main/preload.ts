import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getWeather: (): Promise<any> => ipcRenderer.invoke('weather:update'),
  onWeatherUpdate: (callback: (weather: any) => void) => {
    ipcRenderer.on('weather:update', (_, weather) => callback(weather));
  },
  getSettings: (): Promise<any> => ipcRenderer.invoke('settings:get'),
  setSettings: (settings: any): Promise<void> =>
    ipcRenderer.invoke('settings:set', settings),
  onSettingsChanged: (callback: (settings: any) => void) => {
    ipcRenderer.on('settings:changed', (_, settings) => callback(settings));
  },
  toggleExpand: (): Promise<void> => ipcRenderer.invoke('window:expand'),
  expand: (): Promise<void> => ipcRenderer.invoke('widget:expand'),
  collapse: (): Promise<void> => ipcRenderer.invoke('widget:collapse'),
  isExpanded: (): Promise<boolean> => ipcRenderer.invoke('widget:is-expanded'),
  setChipPosition: (x: number, y: number): Promise<void> =>
    ipcRenderer.invoke('chip:position-changed', x, y),
  getChipPosition: (): Promise<[number, number]> => ipcRenderer.invoke('chip:get-position'),
  onThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme:changed', (_, theme) => callback(theme));
  },
};

contextBridge.exposeInMainWorld('api', api);

export type GlanceAPI = typeof api;
