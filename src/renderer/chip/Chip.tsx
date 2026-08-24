import { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData, Settings } from '../../shared/types';
import styles from './Chip.module.css';

interface ChipProps {
  weather: WeatherData | null;
  settings: Settings;
  theme: string;
}

export function Chip({ weather, settings, theme }: ChipProps) {
  const [time, setTime] = useState(new Date());
  const isDraggingRef = useRef(false);
  const dragStartScreen = useRef({ x: 0, y: 0 });
  const mouseOffsetInWindow = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: settings.timeFormat === '12',
    });
  };

  const formatTemp = (temp: number): string => {
    if (settings.units === 'F') {
      return `${Math.round((temp * 9) / 5 + 32)}°`;
    }
    return `${temp}°`;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragStartScreen.current = { x: e.screenX, y: e.screenY };
    mouseOffsetInWindow.current = {
      x: e.screenX - (window.screenX ?? 0),
      y: e.screenY - (window.screenY ?? 0),
    };
    didDrag.current = false;
    isDraggingRef.current = true;
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.screenX - dragStartScreen.current.x;
      const dy = e.screenY - dragStartScreen.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didDrag.current = true;
      }
      if (!didDrag.current) return;
      const newX = e.screenX - mouseOffsetInWindow.current.x;
      const newY = e.screenY - mouseOffsetInWindow.current.y;
      window.api.setChipPosition(Math.round(newX), Math.round(newY));
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    window.api.toggleDisplay();
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
