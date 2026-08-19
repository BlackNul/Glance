import { useState, useEffect } from 'react';
import { WeatherData, Settings } from '../../shared/types';
import styles from './AnalogFace.module.css';

interface AnalogFaceProps {
  settings: Settings;
  weather: WeatherData | null;
  theme: 'light' | 'dark';
}

export function AnalogFace({ settings, weather, theme }: AnalogFaceProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    let animationFrame: number;

    const tick = () => {
      setTime(new Date());
      animationFrame = requestAnimationFrame(tick);
    };

    if (settings.secondHandStyle === 'sweep') {
      animationFrame = requestAnimationFrame(tick);
    } else {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [settings.secondHandStyle]);

  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const ms = time.getMilliseconds();

  const secondAngle = settings.secondHandStyle === 'sweep'
    ? (seconds + ms / 1000) * 6
    : seconds * 6;

  const minuteAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = hours * 30 + minutes * 0.5;

  const formatTemp = (temp: number): string => {
    if (settings.units === 'F') {
      return `${Math.round(temp * 9 / 5 + 32)}°`;
    }
    return `${temp}°`;
  };

  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      <svg viewBox="0 0 260 260" className={styles.clockFace}>
        {/* Clock background */}
        <circle cx="130" cy="130" r="125" className={styles.faceCircle} />

        {/* Hour ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 130 + 110 * Math.sin(angle);
          const y1 = 130 - 110 * Math.cos(angle);
          const x2 = 130 + 120 * Math.sin(angle);
          const y2 = 130 - 120 * Math.cos(angle);
          return (
            <line
              key={`hour-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={styles.hourTick}
              strokeWidth="2"
            />
          );
        })}

        {/* Minute ticks */}
        {Array.from({ length: 60 }).map((_, i) => {
          if (i % 5 === 0) return null;
          const angle = (i * 6 * Math.PI) / 180;
          const x1 = 130 + 115 * Math.sin(angle);
          const y1 = 130 - 115 * Math.cos(angle);
          const x2 = 130 + 120 * Math.sin(angle);
          const y2 = 130 - 120 * Math.cos(angle);
          return (
            <line
              key={`min-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={styles.minuteTick}
              strokeWidth="1"
            />
          );
        })}

        {/* Hour hand */}
        <line
          x1="130"
          y1="130"
          x2="130"
          y2="65"
          className={styles.hourHand}
          strokeWidth="4"
          strokeLinecap="round"
          transform={`rotate(${hourAngle}, 130, 130)`}
        />

        {/* Minute hand */}
        <line
          x1="130"
          y1="130"
          x2="130"
          y2="40"
          className={styles.minuteHand}
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle}, 130, 130)`}
        />

        {/* Second hand */}
        <line
          x1="130"
          y1="150"
          x2="130"
          y2="35"
          className={styles.secondHand}
          strokeWidth="1.5"
          strokeLinecap="round"
          transform={`rotate(${secondAngle}, 130, 130)`}
        />

        {/* Center dot */}
        <circle cx="130" cy="130" r="4" className={styles.centerDot} />

        {/* Weather complication */}
        {weather && (
          <g className={styles.weatherComplication}>
            <text x="130" y="200" textAnchor="middle" className={styles.weatherIcon}>
              {getWeatherEmoji(weather.icon)}
            </text>
            <text x="130" y="218" textAnchor="middle" className={styles.weatherTemp}>
              {formatTemp(weather.tempC)}
            </text>
            <text x="130" y="232" textAnchor="middle" className={styles.weatherCondition}>
              {weather.condition}
            </text>
            <text x="130" y="246" textAnchor="middle" className={styles.weatherHighLow}>
              H:{formatTemp(weather.high)} L:{formatTemp(weather.low)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function getWeatherEmoji(icon: string): string {
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
  return iconMap[icon] || '☀️';
}
