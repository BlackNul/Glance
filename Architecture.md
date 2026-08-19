# Architecture — Chip Weather Clock Widget

## 1. Platform Decision

**Chosen approach: Electron + TypeScript + React**, packaged for Windows.

Rationale:
- Matches your existing stack (Node/TypeScript/React used across other projects).
- Electron supports frameless, transparent, always-on-top, click-through-configurable windows — exactly what a "chip + expanding display" needs.
- Fast iteration on animation/design (CSS/SVG) vs. native WinUI/WPF XAML.

Trade-off to flag: Electron has a higher baseline memory footprint (~80–150MB) than a native WinUI/WPF app (~20–40MB). If idle resource usage becomes a real problem, v2 could revisit a native rewrite (WinUI 3 + C#) using this same architecture doc as the spec. Not a v1 blocker for a personal-use widget.

## 2. High-Level Structure

Two-window model, both frameless/transparent/always-on-top:

```
┌─────────────────────────────┐
│  Main Process (Electron)     │
│  - Window lifecycle           │
│  - Tray icon & menu           │
│  - Settings persistence       │
│  - Weather polling scheduler  │
│  - Auto-launch registration   │
└───────────┬───────────────────┘
            │ IPC (contextBridge, typed channels)
┌───────────┴───────────────────┐
│  Renderer: Chip Window         │
│  - React (small bundle)        │
│  - Digital time + weather icon │
│  - Drag handling                │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  Renderer: Display Window        │
│  - React + SVG                   │
│  - Analog watch face              │
│  - Weather overlay                │
│  - Settings panel (modal)         │
└───────────────────────────────────┘
```

- **Chip window** and **Display window** are two separate `BrowserWindow`s (both transparent, frameless, `alwaysOnTop`) so the expand animation can be a real window resize/reposition rather than faking it inside one canvas — simpler hit-testing and z-order control.
- Alternative considered: single window that resizes its content. Rejected because Windows compositing looks cleaner with two purpose-sized windows and it avoids reflow jank during expand/collapse.

## 3. Process Responsibilities

### Main process (`/src/main`)
- `windowManager.ts` — creates/positions/destroys Chip and Display windows; handles expand/collapse transitions (position math, monitor bounds).
- `tray.ts` — system tray icon + context menu (show/hide, settings, run at startup, quit).
- `settingsStore.ts` — reads/writes local settings file (JSON, via `electron-store` or hand-rolled with `fs` + userData path).
- `weatherService.ts` — polls weather API on interval, caches last successful response, exposes result via IPC.
- `autoLaunch.ts` — registers/unregisters app in Windows startup (via Electron's `app.setLoginItemSettings`).
- `ipc/` — typed IPC channel definitions shared with renderers (no `any`).

### Renderer: Chip (`/src/renderer/chip`)
- Pure presentational + drag logic. Subscribes to time (local `setInterval`, not IPC, to avoid render-loop overhead) and weather (via IPC push from main).
- Emits `expand-requested` IPC event on click/hover.

### Renderer: Display (`/src/renderer/display`)
- `AnalogFace.tsx` — SVG clock face, hands computed from `Date` each animation frame (via `requestAnimationFrame`, not `setInterval`, for a smooth sweep option).
- `WeatherRing.tsx` — weather icon/temp/condition positioned around or below the face.
- `SettingsPanel.tsx` — form bound to `settingsStore` via IPC.

## 4. Data Flow

1. Main process starts `weatherService` on launch: fetch → cache → broadcast to both renderer windows via IPC.
2. `weatherService` re-fetches on a timer (default: every 15 minutes; configurable, min 5 minutes to respect free-tier rate limits).
3. Renderers never call the weather API directly — only main process holds the API key and does network I/O. Renderers are pure consumers of IPC data.
4. Time is rendered client-side in each renderer from `new Date()` — no IPC round-trip needed for clock ticks.
5. Settings changes in the Display's settings panel → IPC → main process writes to disk → main re-broadcasts updated settings to both renderers.

## 5. Weather Provider

Default: **Open-Meteo** (no API key, generous free usage, good for a personal project). OpenWeatherMap listed as a swappable alternative behind a `WeatherProvider` interface so switching providers later doesn't touch UI code.

```ts
interface WeatherProvider {
  getCurrent(lat: number, lon: number): Promise<{
    tempC: number; condition: string; icon: string; high: number; low: number;
  }>;
}
```

## 6. Window Behavior Details

- Both windows: `frame: false`, `transparent: true`, `alwaysOnTop: true`, `resizable: false`, `skipTaskbar: true`.
- Chip window: `hasShadow: false` (custom CSS shadow instead, since native shadow on transparent windows looks wrong on Windows).
- Expand: Display window fades/scales in near the chip's last dragged position; Chip window either hides or stays visible as a "stem" anchor depending on final interaction design (open question from PRD, decide in Phase 1 spike).
- Position persistence: chip's `x, y` written to settings store on drag-end (debounced), restored on launch; clamp to visible monitor bounds on restore (handles monitor being unplugged).

## 7. Build & Packaging

- Bundler: Vite (fast dev server, small output) for both renderer bundles.
- Packaging: `electron-builder` → NSIS installer + portable `.exe` targets for Windows.
- Auto-update: out of scope for v1 (manual reinstall); leave `electron-updater` as a documented future hook, not implemented.

## 8. Tech Stack Summary

| Layer | Choice |
|---|---|
| Shell | Electron |
| Language | TypeScript (strict mode) |
| UI | React + SVG (no canvas needed at this complexity) |
| Styling | CSS Modules (no runtime CSS-in-JS overhead for a low-footprint widget) |
| Bundler | Vite |
| State (renderer) | React local state + a small context for settings/weather — no Redux needed at this scope |
| Local storage | JSON file via Electron `userData` path |
| Packaging | electron-builder |
| Weather | Open-Meteo (default), pluggable provider interface |

## 9. Non-Functional Requirements

- Strict TypeScript, no `any` in shared IPC types.
- No secrets committed to source control (`.env` + `.gitignore`, documented in `.opencoderules`).
- Idle CPU target enforced by using `requestAnimationFrame` only while Display window is open/visible; Chip window's digital clock uses a 1-second `setInterval` (cheap) rather than RAF.
- Crash isolation: renderer crash should not kill the tray/main process; main process should be able to recreate a crashed renderer window.

## 10. Open Architecture Decisions (flag for Phase 1)

- Two-window vs one-window-with-resize — leaning two-window (this doc), revisit if IPC/z-order proves fiddly.
- Hover vs click to expand — affects whether Chip window needs `mouseenter`/`mouseleave` IPC events wired from the start.
- Whether the "connective" chip↔display line is a persistent visual element (would need both windows' positions synced continuously) or a one-time animation.
