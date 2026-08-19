import { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData, Settings } from '../../shared/types';
import styles from './Chip.module.css';

interface ChipProps {
  weather: WeatherData | null;
  settings: Settings;
  theme: 'light' | 'dark';
}

export function Chip({ weather, settings, theme }: ChipProps) {
  const [time, setTime] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatTemp = (temp: number): string => {
    if (settings.units === 'F') {
      return `${Math.round(temp * 9 / 5 + 32)}°`;
    }
    return `${temp}°`;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    didDrag.current = false;
    dragStart.current = { x: e.screenX, y: e.screenY };
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const dx = e.screenX - dragStart.current.x;
      const dy = e.screenY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didDrag.current = true;
      }
      if (!isDragging) return;
      dragStart.current = { x: e.screenX, y: e.screenY };
      window.api.setChipPosition(
        settings.chipPosition.x + dx,
        settings.chipPosition.y + dy
      );
    },
    [isDragging, settings.chipPosition]
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

  const handleClick = () => {
    if (!didDrag.current) {
      window.api.toggleDisplay();
    }
  };

  return (
    <div
      className={`${styles.chip} ${styles[theme]}`}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <div className={styles.weatherSection}>
        <WeatherIcon icon={weather?.icon || 'clear'} />
        <span className={styles.temp}>
          {weather ? formatTemp(weather.tempC) : '--°'}
        </span>
      </div>
      <div className={styles.divider} />
      <div className={styles.timeSection}>
        <span className={styles.time}>{formatTime(time)}</span>
      </div>
    </div>
  );
}

function WeatherIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, string> = {
    clear: '☀️',
    'partly-cloudy': '⛅',
    cloudy: '☁️',
    rain: '🌧️',
    drizzle: '🌦️',
    snow: '❄️',
    thunderstorm: '⛈️',
    fog: '🌫️',
  };
  return <span className={styles.icon}>{iconMap[icon] || '☀️'}</span>;
}
