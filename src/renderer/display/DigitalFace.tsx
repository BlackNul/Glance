import { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData, Settings } from '../../shared/types';
import styles from './DigitalFace.module.css';

interface DigitalFaceProps {
  settings: Settings;
  weather: WeatherData | null;
  theme: string;
  isStale: boolean;
  onOpenSettings: () => void;
}

export function DigitalFace({ settings, weather, theme, isStale, onOpenSettings }: DigitalFaceProps) {
  const [time, setTime] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const windowPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  let hours24 = time.getHours();
  let period = '';
  if (settings.timeFormat === '12') {
    period = hours24 >= 12 ? 'PM' : 'AM';
    hours24 = hours24 % 12 || 12;
  }
  const hours = String(hours24).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const day = dayNames[time.getDay()];
  const date = String(time.getDate()).padStart(2, '0');
  const month = String(time.getMonth() + 1).padStart(2, '0');

  const formatTemp = (temp: number): string => {
    if (settings.units === 'F') {
      return `${Math.round(temp * 9 / 5 + 32)}°`;
    }
    return `${temp}°`;
  };

  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = await window.api.getDisplayPosition();
    windowPos.current = { x: pos[0], y: pos[1] };
    dragStart.current = { x: e.screenX, y: e.screenY };
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const dx = e.screenX - dragStart.current.x;
      const dy = e.screenY - dragStart.current.y;
      window.api.setDisplayPosition(
        windowPos.current.x + dx,
        windowPos.current.y + dy
      );
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.api.showContextMenu();
  }, []);

  return (
    <div
      className={`${styles.calculator} ${styles[theme]}`}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className={styles.screenBezel}>
        <div className={styles.screen}>
          <div className={styles.timeRow}>
            <span className={styles.digitGroup}>{hours}</span>
            <span className={styles.blinkColon}>:</span>
            <span className={styles.digitGroup}>{minutes}</span>
            {settings.timeFormat === '12' && (
              <span className={styles.period}>{period}</span>
            )}
          </div>
          <div className={styles.secondsRow}>
            <span className={styles.secondsText}>:{seconds}</span>
          </div>
          <div className={styles.dateRow}>
            <span className={styles.dateText}>{day} {date}/{month}</span>
          </div>
        </div>
      </div>
      {weather && (
        <div className={styles.weatherPanel}>
          <div className={styles.weatherIconTemp}>
            <span className={styles.weatherEmoji}>{getWeatherEmoji(weather.icon, weather.isDay)}</span>
            <span className={styles.weatherTemp}>{formatTemp(weather.tempC)}</span>
          </div>
          <div className={styles.weatherCondition}>{weather.condition}</div>
          <div className={styles.weatherHiLo}>H:{formatTemp(weather.high)} L:{formatTemp(weather.low)}</div>
        </div>
      )}
      {isStale && (
        <div className={styles.staleIndicator}>offline</div>
      )}
      <button
        className={styles.settingsBtn}
        onClick={(e) => {
          e.stopPropagation();
          onOpenSettings();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title="Settings"
      >
        &#9881;
      </button>
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
