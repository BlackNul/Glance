import { useState, useEffect, useCallback } from 'react';
import { WeatherData, Settings } from '../../shared/types';
import { DigitalFace } from './DigitalFace';
import { SettingsPanel } from './SettingsPanel';

const STALE_THRESHOLD_MS = 30 * 60 * 1000;

export function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [theme, setTheme] = useState<string>('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [lastWeatherTime, setLastWeatherTime] = useState<number>(Date.now());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

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

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isStale = weather !== null && Date.now() - lastWeatherTime > STALE_THRESHOLD_MS;

  const handleSaveSettings = useCallback((newSettings: Settings) => {
    window.api.setSettings(newSettings);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  if (!settings) return null;

  const effectiveSecondHandStyle = prefersReducedMotion ? 'tick' : settings.secondHandStyle;

  const settingsWithReducedMotion = {
    ...settings,
    secondHandStyle: effectiveSecondHandStyle as 'sweep' | 'tick',
  };

  return (
    <div className={`display-container ${theme}`}>
      <DigitalFace
        settings={settingsWithReducedMotion}
        weather={weather}
        theme={theme}
        isStale={isStale}
        onOpenSettings={handleOpenSettings}
      />
      {showSettings && (
        <SettingsPanel
          settings={settings}
          theme={theme}
          onClose={handleCloseSettings}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
