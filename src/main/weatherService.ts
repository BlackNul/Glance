import { WeatherData } from '../shared/types';

let cachedWeather: WeatherData | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

function weatherCodeToCondition(code: number): { condition: string; icon: string } {
  const conditions: Record<number, { condition: string; icon: string }> = {
    0: { condition: 'Clear', icon: 'clear' },
    1: { condition: 'Mainly Clear', icon: 'clear' },
    2: { condition: 'Partly Cloudy', icon: 'partly-cloudy' },
    3: { condition: 'Overcast', icon: 'cloudy' },
    45: { condition: 'Fog', icon: 'fog' },
    48: { condition: 'Rime Fog', icon: 'fog' },
    51: { condition: 'Light Drizzle', icon: 'drizzle' },
    53: { condition: 'Drizzle', icon: 'drizzle' },
    55: { condition: 'Heavy Drizzle', icon: 'drizzle' },
    61: { condition: 'Light Rain', icon: 'rain' },
    63: { condition: 'Rain', icon: 'rain' },
    65: { condition: 'Heavy Rain', icon: 'rain' },
    71: { condition: 'Light Snow', icon: 'snow' },
    73: { condition: 'Snow', icon: 'snow' },
    75: { condition: 'Heavy Snow', icon: 'snow' },
    80: { condition: 'Light Showers', icon: 'rain' },
    81: { condition: 'Showers', icon: 'rain' },
    82: { condition: 'Heavy Showers', icon: 'rain' },
    95: { condition: 'Thunderstorm', icon: 'thunderstorm' },
    96: { condition: 'Thunderstorm w/ Hail', icon: 'thunderstorm' },
    99: { condition: 'Thunderstorm w/ Heavy Hail', icon: 'thunderstorm' },
  };
  return conditions[code] || { condition: 'Unknown', icon: 'clear' };
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data: OpenMeteoResponse = await response.json();
    const { condition, icon } = weatherCodeToCondition(data.current.weather_code);

    cachedWeather = {
      tempC: Math.round(data.current.temperature_2m),
      condition,
      icon,
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
    };
    return cachedWeather;
  } catch (error) {
    console.error('Weather fetch failed:', error);
    return cachedWeather;
  }
}

export function getCachedWeather(): WeatherData | null {
  return cachedWeather;
}

export function startWeatherPolling(
  lat: number,
  lon: number,
  intervalMinutes: number,
  onUpdate: (weather: WeatherData) => void
): void {
  stopWeatherPolling();

  fetchWeather(lat, lon).then((weather) => {
    if (weather) onUpdate(weather);
  });

  refreshTimer = setInterval(
    async () => {
      const weather = await fetchWeather(lat, lon);
      if (weather) onUpdate(weather);
    },
    intervalMinutes * 60 * 1000
  );
}

export function stopWeatherPolling(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
