import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { Settings } from '../shared/types';

let widgetWindow: BrowserWindow | null = null;

const CHIP_WIDTH = 180;
const CHIP_HEIGHT = 40;
const DISPLAY_WIDTH = 260;
const DISPLAY_HEIGHT = 260;
const GAP = 6;

export const COLLAPSED_WIDTH = CHIP_WIDTH;
export const COLLAPSED_HEIGHT = CHIP_HEIGHT;
export const EXPANDED_WIDTH = DISPLAY_WIDTH;
export const EXPANDED_HEIGHT = CHIP_HEIGHT + GAP + DISPLAY_HEIGHT;

function getPreloadPath(): string {
  return path.join(__dirname, 'preload.js');
}

export function createWidgetWindow(settings: Settings): BrowserWindow {
  const { x, y } = settings.chipPosition;

  widgetWindow = new BrowserWindow({
    width: CHIP_WIDTH,
    height: CHIP_HEIGHT,
    minWidth: CHIP_WIDTH,
    minHeight: CHIP_HEIGHT,
    maxWidth: CHIP_WIDTH,
    maxHeight: EXPANDED_HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  widgetWindow.loadFile(path.join(__dirname, '../../dist/src/renderer/widget/index.html'));
  widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  return widgetWindow;
}

export function expandWidgetWindow(): void {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    const bounds = widgetWindow.getBounds();
    widgetWindow.setResizable(true);
    widgetWindow.setBounds({
      x: bounds.x + Math.round((bounds.width - DISPLAY_WIDTH) / 2),
      y: bounds.y,
      width: DISPLAY_WIDTH,
      height: EXPANDED_HEIGHT,
    });
    widgetWindow.setResizable(false);
  }
}

export function collapseWidgetWindow(): void {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    const bounds = widgetWindow.getBounds();
    widgetWindow.setResizable(true);
    widgetWindow.setBounds({
      x: bounds.x + Math.round((DISPLAY_WIDTH - CHIP_WIDTH) / 2),
      y: bounds.y,
      width: CHIP_WIDTH,
      height: CHIP_HEIGHT,
    });
    widgetWindow.setResizable(false);
  }
}

export function showWidgetWindow(): void {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.show();
    widgetWindow.focus();
  }
}

export function hideWidgetWindow(): void {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.hide();
  }
}

export function getWidgetWindow(): BrowserWindow | null {
  return widgetWindow;
}

export function destroyWidgetWindow(): void {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.destroy();
    widgetWindow = null;
  }
}
