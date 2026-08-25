import { WeatherData, Settings } from './types';

export interface GlanceAPI {
  getWeather: () => Promise<WeatherData | null>;
  onWeatherUpdate: (callback: (weather: WeatherData) => void) => void;
  getSettings: () => Promise<Settings>;
  setSettings: (settings: Settings) => Promise<void>;
  onSettingsChanged: (callback: (settings: Settings) => void) => void;
  toggleExpand: () => Promise<void>;
  expand: () => Promise<void>;
  collapse: () => Promise<void>;
  isExpanded: () => Promise<boolean>;
  setChipPosition: (x: number, y: number) => Promise<void>;
  getChipPosition: () => Promise<[number, number]>;
  onThemeChanged: (callback: (theme: 'light' | 'dark') => void) => void;
}

declare global {
  interface Window {
    api: GlanceAPI;
  }
}

export {};
