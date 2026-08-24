import { useState, useEffect } from 'react';
import { WeatherData, Settings } from '../../shared/types';
import { Chip } from './Chip';

async function detectLocation(setSettings: (s: Settings) => void, currentSettings: Settings): Promise<void> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let name = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        try {
          const reverseRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          );
          const reverseData = await reverseRes.json();
          if (reverseData.address) {
            const city = reverseData.address.city || reverseData.address.town || reverseData.address.village || reverseData.address.suburb || '';
            const state = reverseData.address.state || '';
            const country = reverseData.address.country || '';
            name = [city, state, country].filter(Boolean).join(', ');
          }
        } catch {}

        const newSettings: Settings = {
          ...currentSettings,
          location: { lat: latitude, lon: longitude, name },
          locationDetected: true,
        };
        setSettings(newSettings);
        resolve();
      },
      () => {
        const newSettings: Settings = {
          ...currentSettings,
          locationDetected: true,
        };
        setSettings(newSettings);
        resolve();
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });
}

export function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [theme, setTheme] = useState<string>('dark');

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setSettings(s);
      if (!s.locationDetected) {
        detectLocation((newSettings) => {
          setSettings(newSettings);
          window.api.setSettings(newSettings);
        }, s);
      }
    });
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
