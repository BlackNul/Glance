export interface WeatherData {
  tempC: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
  sunrise: string;
  sunset: string;
  isDay: boolean;
}

export interface Settings {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  locationDetected: boolean;
  units: 'C' | 'F';
  timeFormat: '12' | '24';
  theme: 'light' | 'dark' | 'auto' | 'dynamic';
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
