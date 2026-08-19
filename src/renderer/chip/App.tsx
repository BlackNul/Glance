import { useState, useEffect } from 'react';
import { WeatherData, Settings } from '../../shared/types';
import { Chip } from './Chip';

export function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    window.api.getSettings().then(setSettings);
    window.api.getWeather().then(setWeather);

    window.api.onWeatherUpdate(setWeather);
    window.api.onSettingsChanged((newSettings) => {
      setSettings(newSettings);
    });
    window.api.onThemeChanged(setTheme);
  }, []);

  if (!settings) return null;

  return <Chip weather={weather} settings={settings} theme={theme} />;
}
