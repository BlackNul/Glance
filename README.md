# Glance — Chip Weather Clock Widget

A lightweight, always-on-top Windows desktop widget that combines a compact chip bar with a full analog watch face and live weather data.

## What It Does

**Chip** — A small, draggable pill-shaped bar that sits on your desktop showing the current time, weather icon, and temperature at a glance.

**Display** — Click the chip to expand into a circular panel with an analog watch face (sweep or ticking second hand) and a weather complication showing condition, temperature, and high/low for the day.

## Features

- Always-on-top, frameless, transparent windows
- Draggable chip with position memory across restarts
- Analog watch face with sweep or tick second-hand modes
- Live weather from Open-Meteo (no API key required)
- Settings panel: location search, °C/°F, 12h/24h, theme (light/dark/auto), refresh interval
- System tray control (show/hide/quit)
- Auto-launch at startup option
- Sleep/wake handling (auto-refreshes on wake)
- Offline indicator when weather data goes stale
- Multi-monitor position clamping

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- Windows 10/11

## Getting Started

```bash
# Clone the repo
git clone https://github.com/BlackNul/Glance.git
cd Glance

# Install dependencies
npm install

# Build the renderer and launch
npm run dev
```

The `dev` script runs `vite build` then starts Electron. The chip widget will appear on your desktop.

## Usage

- **Drag** the chip to reposition it anywhere on screen
- **Click** the chip to open the full analog display
- **Click** the display to collapse back to the chip
- **Right-click** the display for quick settings (time format, units, theme)
- **Gear icon** (top-right on display) opens the full settings panel
- **System tray icon** — right-click for show/hide, settings, quit

## Project Structure

```
Glance/
├── main.js                 # Electron main process (runtime entry)
├── preload.js              # Context bridge for renderer ↔ main IPC
├── src/
│   ├── main/               # TypeScript source (main process)
│   │   ├── main.ts
│   │   ├── windowManager.ts
│   │   ├── weatherService.ts
│   │   ├── settingsStore.ts
│   │   ├── tray.ts
│   │   ├── autoLaunch.ts
│   │   └── preload.ts
│   ├── renderer/
│   │   ├── chip/           # Chip window (React)
│   │   │   ├── App.tsx
│   │   │   ├── Chip.tsx
│   │   │   └── ...
│   │   └── display/        # Display window (React)
│   │       ├── App.tsx
│   │       ├── DigitalFace.tsx
│   │       ├── AnalogFace.tsx
│   │       ├── SettingsPanel.tsx
│   │       └── ...
│   └── shared/             # Types and IPC channel definitions
│       ├── types.ts
│       ├── ipc-channels.ts
│       └── global.d.ts
├── assets/                 # Tray icon
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Tech Stack

- **Electron** — Desktop shell, window management, system tray
- **React 19** — UI rendering
- **TypeScript** — Strict mode
- **Vite** — Bundler
- **Open-Meteo API** — Free weather data (no API key)

## License

ISC
