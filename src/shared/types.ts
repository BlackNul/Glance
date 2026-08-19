export interface WeatherData {
  tempC: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
}

export interface Settings {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  units: 'C' | 'F';
  timeFormat: '12' | '24';
  theme: 'light' | 'dark' | 'auto';
  secondHandStyle: 'sweep' | 'tick';
  launchAtStartup: boolean;
  refreshInterval: number;
  showStemLine: boolean;
  chipPosition: {
    x: number;
    y: number;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  location: { lat: 40.7128, lon: -74.006, name: 'New York' },
  units: 'C',
  timeFormat: '24',
  theme: 'auto',
  secondHandStyle: 'sweep',
  launchAtStartup: false,
  refreshInterval: 15,
  showStemLine: false,
  chipPosition: { x: 100, y: 100 },
};
