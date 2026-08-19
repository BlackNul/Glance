export const IPC_CHANNELS = {
  WEATHER_UPDATE: 'weather:update',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_CHANGED: 'settings:changed',
  CHIP_EXPAND: 'chip:expand',
  CHIP_COLLAPSE: 'chip:collapse',
  CHIP_POSITION_CHANGED: 'chip:position-changed',
  WINDOW_EXPAND: 'window:expand',
  WINDOW_COLLAPSE: 'window:collapse',
  TRAY_SHOW: 'tray:show',
  TRAY_HIDE: 'tray:hide',
  TRAY_QUIT: 'tray:quit',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
