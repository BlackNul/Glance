import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { Settings } from '../shared/types';

let chipWindow: BrowserWindow | null = null;
let displayWindow: BrowserWindow | null = null;

const CHIP_WIDTH = 180;
const CHIP_HEIGHT = 44;
const DISPLAY_SIZE = 260;

function getPreloadPath(): string {
  return path.join(__dirname, 'preload.js');
}

export function createChipWindow(settings: Settings): BrowserWindow {
  const { x, y } = settings.chipPosition;

  chipWindow = new BrowserWindow({
    width: CHIP_WIDTH,
    height: CHIP_HEIGHT,
    minWidth: CHIP_WIDTH,
    minHeight: CHIP_HEIGHT,
    maxWidth: CHIP_WIDTH,
    maxHeight: CHIP_HEIGHT,
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

  chipWindow.loadFile(path.join(__dirname, '../renderer/chip/index.html'));
  chipWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  return chipWindow;
}

export function createDisplayWindow(settings: Settings): BrowserWindow {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.focus();
    return displayWindow;
  }

  const chipBounds = chipWindow?.getBounds();
  const displayWidth = DISPLAY_SIZE;
  const displayHeight = DISPLAY_SIZE;

  let displayX = chipBounds ? chipBounds.x + chipBounds.width / 2 - displayWidth / 2 : 300;
  let displayY = chipBounds ? chipBounds.y - displayHeight - 10 : 100;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { x: screenX, y: screenY, width: screenW, height: screenH } = primaryDisplay.workArea;

  if (displayY < screenY) displayY = chipBounds ? chipBounds.y + chipBounds.height + 10 : screenY + 10;
  if (displayX < screenX) displayX = screenX + 10;
  if (displayX + displayWidth > screenX + screenW) displayX = screenX + screenW - displayWidth - 10;
  if (displayY + displayHeight > screenY + screenH) displayY = screenY + screenH - displayHeight - 10;

  displayWindow = new BrowserWindow({
    width: displayWidth,
    height: displayHeight,
    minWidth: displayWidth,
    minHeight: displayHeight,
    maxWidth: displayWidth,
    maxHeight: displayHeight,
    x: Math.round(displayX),
    y: Math.round(displayY),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  displayWindow.loadFile(path.join(__dirname, '../renderer/display/index.html'));
  displayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  return displayWindow;
}

export function showDisplayWindow(): void {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.show();
    displayWindow.focus();
  }
}

export function hideDisplayWindow(): void {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.hide();
  }
}

export function toggleDisplayWindow(settings: Settings): void {
  if (displayWindow && !displayWindow.isDestroyed() && displayWindow.isVisible()) {
    hideDisplayWindow();
  } else {
    createDisplayWindow(settings);
    showDisplayWindow();
  }
}

export function getChipWindow(): BrowserWindow | null {
  return chipWindow;
}

export function getDisplayWindow(): BrowserWindow | null {
  return displayWindow;
}

export function destroyDisplayWindow(): void {
  if (displayWindow && !displayWindow.isDestroyed()) {
    displayWindow.destroy();
    displayWindow = null;
  }
}
