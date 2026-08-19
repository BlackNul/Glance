import { Tray, Menu, app, nativeImage } from 'electron';
import * as path from 'path';

let tray: Tray | null = null;

function createTrayIcon(): ReturnType<typeof nativeImage.createEmpty> {
  const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
  try {
    return nativeImage.createFromPath(iconPath);
  } catch {
    return nativeImage.createEmpty();
  }
}

export function createTray(
  onShow: () => void,
  onHide: () => void,
  onSettings: () => void,
  onQuit: () => void
): Tray {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('Glance - Weather Clock');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: onShow },
    { label: 'Hide', click: onHide },
    { type: 'separator' },
    { label: 'Settings', click: onSettings },
    { type: 'separator' },
    { label: 'Quit', click: onQuit },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    onShow();
  });

  return tray;
}

export function destroyTray(): void {
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }
}
