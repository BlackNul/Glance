import { WeatherData, Settings } from './types';

export interface GlanceAPI {
  getWeather: () => Promise<WeatherData | null>;
  onWeatherUpdate: (callback: (weather: WeatherData) => void) => void;
  getSettings: () => Promise<Settings>;
  setSettings: (settings: Settings) => Promise<void>;
  onSettingsChanged: (callback: (settings: Settings) => void) => void;
  toggleDisplay: () => Promise<void>;
  onExpand: (callback: () => void) => void;
  onCollapse: (callback: () => void) => void;
  setChipPosition: (x: number, y: number) => Promise<void>;
  getChipPosition: () => Promise<[number, number]>;
  setDisplayPosition: (x: number, y: number) => Promise<void>;
  getDisplayPosition: () => Promise<[number, number]>;
  showContextMenu: () => Promise<void>;
  resizeDisplay: (w: number, h: number) => Promise<void>;
  onThemeChanged: (callback: (theme: 'light' | 'dark') => void) => void;
}

declare global {
  interface Window {
    api: GlanceAPI;
  }
}

export {};
