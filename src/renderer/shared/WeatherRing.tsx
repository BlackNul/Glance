import { WeatherData, Settings } from '../../shared/types';
import styles from './WeatherRing.module.css';

interface WeatherRingProps {
  weather: WeatherData | null;
  settings: Settings;
  theme: 'light' | 'dark';
}

export function WeatherRing({ weather, settings, theme }: WeatherRingProps) {
  const formatTemp = (temp: number): string => {
    if (settings.units === 'F') {
      return `${Math.round(temp * 9 / 5 + 32)}°`;
    }
    return `${temp}°`;
  };

  if (!weather) {
    return (
      <div className={`${styles.container} ${styles[theme]}`}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      <div className={styles.weatherIcon}>{getWeatherEmoji(weather.icon, weather.isDay)}</div>
      <div className={styles.temp}>{formatTemp(weather.tempC)}</div>
      <div className={styles.condition}>{weather.condition}</div>
      <div className={styles.highLow}>
        H:{formatTemp(weather.high)} L:{formatTemp(weather.low)}
      </div>
    </div>
  );
}

function getWeatherEmoji(icon: string, isDay: boolean): string {
  const dayIcons: Record<string, string> = {
    clear: '☀️',
    'partly-cloudy': '⛅',
    cloudy: '☁️',
    rain: '🌧️',
    drizzle: '🌦️',
    snow: '❄️',
    thunderstorm: '⛈️',
    fog: '🌫️',
  };
  const nightIcons: Record<string, string> = {
    clear: '🌙',
    'partly-cloudy': '🌙',
    cloudy: '☁️',
    rain: '🌧️',
    drizzle: '🌧️',
    snow: '🌨️',
    thunderstorm: '⛈️',
    fog: '🌫️',
  };
  const icons = isDay ? dayIcons : nightIcons;
  return icons[icon] || (isDay ? '☀️' : '🌙');
}
