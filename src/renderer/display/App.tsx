import { useState, useEffect, useCallback } from 'react';
import { WeatherData, Settings } from '../../shared/types';
import { DigitalFace } from './DigitalFace';
import { SettingsPanel } from './SettingsPanel';

const STALE_THRESHOLD_MS = 30 * 60 * 1000;

export function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [lastWeatherTime, setLastWeatherTime] = useState<number>(Date.now());

  useEffect(() => {
    window.api.getSettings().then(setSettings);
    window.api.getWeather().then((w) => {
      if (w) setWeather(w);
      setLastWeatherTime(Date.now());
    });

    window.api.onWeatherUpdate((w) => {
      setWeather(w);
      setLastWeatherTime(Date.now());
    });
    window.api.onSettingsChanged((newSettings) => {
      setSettings(newSettings);
    });
    window.api.onThemeChanged(setTheme);
  }, []);

  const isStale = weather !== null && Date.now() - lastWeatherTime > STALE_THRESHOLD_MS;

  const handleSaveSettings = useCallback((newSettings: Settings) => {
    window.api.setSettings(newSettings);
  }, []);

  if (!settings) return null;

  return (
    <div className={`display-container ${theme}`}>
      <DigitalFace
        settings={settings}
        weather={weather}
        theme={theme}
        isStale={isStale}
        onOpenSettings={() => setShowSettings(true)}
      />
      {showSettings && (
        <SettingsPanel
          settings={settings}
          theme={theme}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
