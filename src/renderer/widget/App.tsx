import { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData, Settings } from '../../shared/types';
import styles from './Widget.module.css';

const STALE_THRESHOLD_MS = 30 * 60 * 1000;

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
  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lastWeatherTime, setLastWeatherTime] = useState<number>(Date.now());
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isDraggingRef = useRef(false);
  const dragStartScreen = useRef({ x: 0, y: 0 });
  const windowPos = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setSettings(s);
      if (!s.locationDetected) {
        detectLocation((newSettings: Settings) => {
          setSettings(newSettings);
          window.api.setSettings(newSettings);
        }, s);
      }
    });
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

  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const pos = await window.api.getChipPosition();
    windowPos.current = { x: pos[0], y: pos[1] };
    dragStartScreen.current = { x: e.screenX, y: e.screenY };
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
      window.api.setChipPosition(
        Math.round(windowPos.current.x + dx),
        Math.round(windowPos.current.y + dy)
      );
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

  const handleChipClick = useCallback(() => {
    if (didDrag.current) return;
    window.api.toggleExpand();
  }, []);

  const handleSettingsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings(true);
  }, []);

  if (!settings) return null;

  const effectiveSecondHandStyle = prefersReducedMotion ? 'tick' : settings.secondHandStyle;
  const settingsWithReducedMotion = {
    ...settings,
    secondHandStyle: effectiveSecondHandStyle as 'sweep' | 'tick',
  };

  return (
    <div
      className={`${styles.widget} ${styles[theme]} ${expanded ? styles.expanded : ''}`}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'grab' }}
    >
      {/* Chip bar */}
      <div className={styles.chip} onClick={handleChipClick}>
        <div className={styles.weatherSection}>
          <span className={styles.icon}>
            {getWeatherEmoji(weather?.icon || 'clear', weather?.isDay ?? true)}
          </span>
          <span className={styles.temp}>
            {weather ? formatTemp(weather.tempC, settings.units) : '--°'}
          </span>
        </div>
        <div className={styles.divider} />
        <div className={styles.timeSection}>
          <span className={styles.time}>{formatTime(time, settings.timeFormat)}</span>
        </div>
      </div>

      {/* Display panel - conditionally shown */}
      {expanded && (
        <div className={styles.displayPanel}>
          <div className={styles.screenBezel}>
            <div className={styles.screen}>
              <div className={styles.timeRow}>
                <span className={styles.digitGroup}>{formatHours(time, settings.timeFormat)}</span>
                <span className={styles.blinkColon}>:</span>
                <span className={styles.digitGroup}>{String(time.getMinutes()).padStart(2, '0')}</span>
                {settings.timeFormat === '12' && (
                  <span className={styles.period}>{time.getHours() >= 12 ? 'PM' : 'AM'}</span>
                )}
              </div>
              <div className={styles.secondsRow}>
                <span className={styles.secondsText}>:{String(time.getSeconds()).padStart(2, '0')}</span>
              </div>
              <div className={styles.dateRow}>
                <span className={styles.dateText}>{formatDate(time)}</span>
              </div>
            </div>
          </div>
          {weather && (
            <div className={styles.weatherPanel}>
              <div className={styles.weatherIconTemp}>
                <span className={styles.weatherEmoji}>{getWeatherEmoji(weather.icon, weather.isDay)}</span>
                <span className={styles.weatherTemp}>{formatTemp(weather.tempC, settings.units)}</span>
              </div>
              <div className={styles.weatherCondition}>{weather.condition}</div>
              <div className={styles.weatherHiLo}>H:{formatTemp(weather.high, settings.units)} L:{formatTemp(weather.low, settings.units)}</div>
            </div>
          )}
          {isStale && (
            <div className={styles.staleIndicator}>offline</div>
          )}
          <button
            className={styles.settingsBtn}
            onClick={handleSettingsClick}
            onMouseDown={(e) => e.stopPropagation()}
            title="Settings"
          >
            &#9881;
          </button>
        </div>
      )}

      {showSettings && (
        <SettingsPanelInline
          settings={settings}
          theme={theme}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}

function SettingsPanelInline({
  settings,
  theme,
  onClose,
  onSave,
}: {
  settings: Settings;
  theme: string;
  onClose: () => void;
  onSave: (s: Settings) => void;
}) {
  const [local, setLocal] = useState<Settings>({ ...settings });
  const [locationQuery, setLocationQuery] = useState(settings.location.name);
  const [locationResults, setLocationResults] = useState<Array<{ name: string; latitude: number; longitude: number; country?: string; admin1?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocation = useCallback(async (query: string) => {
    if (query.length < 2) { setLocationResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
      );
      const data = await res.json();
      setLocationResults(data.results || []);
    } catch {
      setLocationResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleLocationInput = (value: string) => {
    setLocationQuery(value);
    setShowResults(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocation(value), 300);
  };

  const selectLocation = (loc: { name: string; latitude: number; longitude: number; country?: string; admin1?: string }) => {
    const name = [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ');
    setLocationQuery(name);
    setLocal((prev) => ({ ...prev, location: { lat: loc.latitude, lon: loc.longitude, name } }));
    setShowResults(false);
    setLocationResults([]);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return;
    setIsSearching(true);
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
        setLocationQuery(name);
        setLocal((prev) => ({ ...prev, location: { lat: latitude, lon: longitude, name } }));
        setIsSearching(false);
      },
      () => { setIsSearching(false); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`${styles.overlay} ${styles[theme]}`} onClick={onClose} onMouseDown={(e) => e.stopPropagation()}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Settings</span>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.panelBody}>
          <div className={styles.field}>
            <label className={styles.label}>Location</label>
            <div className={styles.searchWrap} ref={searchRef}>
              <input
                className={styles.input}
                type="text"
                value={locationQuery}
                onChange={(e) => handleLocationInput(e.target.value)}
                onFocus={() => setShowResults(true)}
                placeholder="Search city..."
              />
              {isSearching && <span className={styles.spinner} />}
              {showResults && locationResults.length > 0 && (
                <div className={styles.results}>
                  {locationResults.map((loc, i) => (
                    <button key={i} className={styles.resultItem} onClick={() => selectLocation(loc)}>
                      {[loc.name, loc.admin1, loc.country].filter(Boolean).join(', ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className={styles.detectBtn} onClick={handleDetectLocation} disabled={isSearching}>
              {isSearching ? 'Detecting...' : '📍 Use my location'}
            </button>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Units</label>
            <div className={styles.toggleGroup}>
              <button className={`${styles.toggleBtn} ${local.units === 'C' ? styles.active : ''}`} onClick={() => update('units', 'C')}>°C</button>
              <button className={`${styles.toggleBtn} ${local.units === 'F' ? styles.active : ''}`} onClick={() => update('units', 'F')}>°F</button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Time Format</label>
            <div className={styles.toggleGroup}>
              <button className={`${styles.toggleBtn} ${local.timeFormat === '24' ? styles.active : ''}`} onClick={() => update('timeFormat', '24')}>24h</button>
              <button className={`${styles.toggleBtn} ${local.timeFormat === '12' ? styles.active : ''}`} onClick={() => update('timeFormat', '12')}>12h</button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Theme</label>
            <div className={styles.toggleGroup}>
              <button className={`${styles.toggleBtn} ${local.theme === 'auto' ? styles.active : ''}`} onClick={() => update('theme', 'auto')}>Auto</button>
              <button className={`${styles.toggleBtn} ${local.theme === 'dynamic' ? styles.active : ''}`} onClick={() => update('theme', 'dynamic')}>Dynamic</button>
              <button className={`${styles.toggleBtn} ${local.theme === 'dark' ? styles.active : ''}`} onClick={() => update('theme', 'dark')}>Dark</button>
              <button className={`${styles.toggleBtn} ${local.theme === 'light' ? styles.active : ''}`} onClick={() => update('theme', 'light')}>Light</button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Second Hand</label>
            <div className={styles.toggleGroup}>
              <button className={`${styles.toggleBtn} ${local.secondHandStyle === 'sweep' ? styles.active : ''}`} onClick={() => update('secondHandStyle', 'sweep')}>Sweep</button>
              <button className={`${styles.toggleBtn} ${local.secondHandStyle === 'tick' ? styles.active : ''}`} onClick={() => update('secondHandStyle', 'tick')}>Tick</button>
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Refresh Interval</label>
            <select className={styles.select} value={local.refreshInterval} onChange={(e) => update('refreshInterval', Number(e.target.value))}>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Launch at Startup</label>
            <button className={`${styles.toggleBtn} ${local.launchAtStartup ? styles.active : ''}`} onClick={() => update('launchAtStartup', !local.launchAtStartup)}>
              {local.launchAtStartup ? 'On' : 'Off'}
            </button>
          </div>
        </div>
        <div className={styles.panelFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={() => { onSave({ ...local, locationDetected: true }); onClose(); }}>Save</button>
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date, timeFormat: string): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12',
  });
}

function formatTemp(temp: number, units: string): string {
  if (units === 'F') return `${Math.round(temp * 9 / 5 + 32)}°`;
  return `${temp}°`;
}

function formatHours(date: Date, timeFormat: string): string {
  let h = date.getHours();
  if (timeFormat === '12') h = h % 12 || 12;
  return String(h).padStart(2, '0');
}

function formatDate(date: Date): string {
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const day = dayNames[date.getDay()];
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${day} ${d}/${m}`;
}

function getWeatherEmoji(icon: string, isDay: boolean): string {
  const dayIcons: Record<string, string> = {
    clear: '☀️', 'partly-cloudy': '⛅', cloudy: '☁️', rain: '🌧️',
    drizzle: '🌦️', snow: '❄️', thunderstorm: '⛈️', fog: '🌫️',
  };
  const nightIcons: Record<string, string> = {
    clear: '🌙', 'partly-cloudy': '🌙', cloudy: '☁️', rain: '🌧️',
    drizzle: '🌧️', snow: '🌨️', thunderstorm: '⛈️', fog: '🌫️',
  };
  return (isDay ? dayIcons : nightIcons)[icon] || (isDay ? '☀️' : '🌙');
}
