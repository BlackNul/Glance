# PRD — Chip Weather Clock Widget (Windows Desktop)

## 1. Summary

A lightweight, always-on-top Windows desktop widget made of two connected parts:

1. **The Chip** — a small, pill-shaped bar that sits on the desktop. Shows a compact glance-view: current time (digital, short) + weather icon + temperature.
2. **The Display** — a circular panel, visually "docked" to the chip (connected by a thin line/stem or a magnetic-snap animation), that expands on interaction. It shows:
   - An **analog watch face** (hour/minute/second hands, tick marks) as the primary visual.
   - **Weather** overlaid or ringed around the watch face (condition icon, temperature, high/low, condition text).

Inspiration: Apple's Dynamic Island (chip → expanded capsule interaction pattern) crossed with a classic analog watch complication (weather complications on watch faces).

## 2. Problem / Motivation

- Existing Windows widgets (Widgets Board, third-party Rainmeter skins) are either locked behind the OS widget panel or heavy/cluttered.
- User wants something minimal, always visible, aesthetically deliberate (analog watch, not digital dashboard), and self-contained (no forced Store install, no cloud account).

## 3. Goals

- G1: A chip that sits on the desktop at all times, low visual/CPU footprint.
- G2: One clear interaction (click / hover) expands the chip into the full analog+weather display.
- G3: Time is always accurate (synced to system clock, updates smoothly — sweeping or ticking second hand, user choice).
- G4: Weather refreshes on a sane interval (not real-time-polling), shows current condition + temp at minimum.
- G5: Feels hand-designed — not a generic Electron window. Rounded chip, soft shadow, smooth expand/collapse animation.

## 4. Non-Goals (v1)

- No multi-city / multi-widget management (single widget instance, single location).
- No alarms, timers, stopwatch, or calendar features.
- No cloud sync, accounts, or telemetry.
- No macOS/Linux build in v1 (Windows-only; architecture should not preclude it later).
- No Windows Store distribution requirement (packaged as a standalone installer/portable exe).

## 5. Target User

Just you (solo/personal-use project), optimized for:
- Windows 10/11 desktop.
- Runs at startup, stays out of the way, glanceable.

## 6. Core Features (v1 — MVP)

| # | Feature | Detail |
|---|---|---|
| F1 | Chip (collapsed state) | Draggable, pill shape, shows time (HH:MM), weather icon, temp. Always-on-top, frameless, transparent background. |
| F2 | Expand/collapse | Click (or hover, configurable) chip → animates into circular display; click outside / re-click to collapse. |
| F3 | Analog watch face | Hour, minute, second hands; tick marks for 12/60; numerals optional (toggle). Smooth or ticking second hand (setting). |
| F4 | Weather overlay | Condition icon + current temp shown on/around the watch face; short condition text (e.g. "Partly Cloudy"); high/low for the day. |
| F5 | Location | Set once via city search or geolocation (IP-based or Windows location API); stored locally. |
| F6 | Position memory | Widget remembers last screen position across restarts. |
| F7 | System tray control | Tray icon: show/hide, quit, open settings, "run at startup" toggle. |
| F8 | Theming | Light / dark / auto (follow system) chip & display themes. |
| F9 | Settings panel | Small panel for: location, units (°C/°F), theme, second-hand style, launch-at-startup, refresh interval. |

## 7. Stretch Features (v2+, not in v1 scope)

- Multiple chips (e.g., separate weather-only and clock-only chips).
- Hourly/weekly forecast on long-press.
- Custom watch face skins (minimal, sport, classic).
- Sound/haptic-style micro-animations on hour change.
- Widget "docking" to screen edges with magnetic snap.

## 8. Success Criteria

- Widget idle CPU usage stays negligible (target: <1% average on a modern desktop CPU when idle).
- Time display never drifts from system clock (re-synced each render tick).
- Weather data refresh does not block UI or animation.
- Expand/collapse animation feels immediate (<200ms perceived latency).
- Survives sleep/wake and display resolution/DPI changes without visual glitches.

## 9. Constraints & Assumptions

- Requires internet access for weather data (falls back to "last known" data + a subtle offline indicator if unreachable).
- Weather data from a free-tier external API (e.g., OpenWeatherMap / Open-Meteo) — API key stored locally, never bundled in source control.
- Single monitor primary use case; multi-monitor should not break positioning (nice-to-have: remember which monitor).

## 10. Open Questions

- Preferred weather data provider (Open-Meteo has no API key requirement — simplest for a personal project; OpenWeatherMap needs a free key but has richer data).
- Hover-to-expand vs click-to-expand as the default interaction.
- Whether "connected" chip↔display means a persistent visual tether (line/stem) or purely an expand animation with no persistent link once open.
