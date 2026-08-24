import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings } from '../../shared/types';
import styles from './SettingsPanel.module.css';

interface SettingsPanelProps {
  settings: Settings;
  theme: string;
  onClose: () => void;
  onSave: (settings: Settings) => void;
}

interface LocationResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

export function SettingsPanel({ settings, theme, onClose, onSave }: SettingsPanelProps) {
  const [local, setLocal] = useState<Settings>({ ...settings });
  const [locationQuery, setLocationQuery] = useState(settings.location.name);
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
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
    if (query.length < 2) {
      setLocationResults([]);
      return;
    }
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

  const selectLocation = (loc: LocationResult) => {
    const name = [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ');
    setLocationQuery(name);
    setLocal((prev) => ({
      ...prev,
      location: { lat: loc.latitude, lon: loc.longitude, name },
    }));
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
        setLocal((prev) => ({
          ...prev,
          location: { lat: latitude, lon: longitude, name },
        }));
        setIsSearching(false);
      },
      () => {
        setIsSearching(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSave = () => {
    onSave({ ...local, locationDetected: true });
    onClose();
  };

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`${styles.overlay} ${styles[theme]}`} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>Settings</span>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.body}>
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
                    <button
                      key={i}
                      className={styles.resultItem}
                      onClick={() => selectLocation(loc)}
                    >
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
              <button
                className={`${styles.toggleBtn} ${local.units === 'C' ? styles.active : ''}`}
                onClick={() => update('units', 'C')}
              >
                °C
              </button>
              <button
                className={`${styles.toggleBtn} ${local.units === 'F' ? styles.active : ''}`}
                onClick={() => update('units', 'F')}
              >
                °F
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Time Format</label>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleBtn} ${local.timeFormat === '24' ? styles.active : ''}`}
                onClick={() => update('timeFormat', '24')}
              >
                24h
              </button>
              <button
                className={`${styles.toggleBtn} ${local.timeFormat === '12' ? styles.active : ''}`}
                onClick={() => update('timeFormat', '12')}
              >
                12h
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Theme</label>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleBtn} ${local.theme === 'auto' ? styles.active : ''}`}
                onClick={() => update('theme', 'auto')}
              >
                Auto
              </button>
              <button
                className={`${styles.toggleBtn} ${local.theme === 'dynamic' ? styles.active : ''}`}
                onClick={() => update('theme', 'dynamic')}
              >
                Dynamic
              </button>
              <button
                className={`${styles.toggleBtn} ${local.theme === 'dark' ? styles.active : ''}`}
                onClick={() => update('theme', 'dark')}
              >
                Dark
              </button>
              <button
                className={`${styles.toggleBtn} ${local.theme === 'light' ? styles.active : ''}`}
                onClick={() => update('theme', 'light')}
              >
                Light
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Second Hand</label>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleBtn} ${local.secondHandStyle === 'sweep' ? styles.active : ''}`}
                onClick={() => update('secondHandStyle', 'sweep')}
              >
                Sweep
              </button>
              <button
                className={`${styles.toggleBtn} ${local.secondHandStyle === 'tick' ? styles.active : ''}`}
                onClick={() => update('secondHandStyle', 'tick')}
              >
                Tick
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Refresh Interval</label>
            <select
              className={styles.select}
              value={local.refreshInterval}
              onChange={(e) => update('refreshInterval', Number(e.target.value))}
            >
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={60}>60 min</option>
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Launch at Startup</label>
            <button
              className={`${styles.toggleBtn} ${local.launchAtStartup ? styles.active : ''}`}
              onClick={() => update('launchAtStartup', !local.launchAtStartup)}
            >
              {local.launchAtStartup ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
