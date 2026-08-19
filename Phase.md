# Phase.md — Chip Weather Clock Widget Roadmap

Estimated total: ~6–7 weeks for a solo/personal-project pace (part-time). Adjust freely — this is a personal build, not a team sprint plan.

## Phase 0 — Spike & Decisions (Week 1, first few days) ✅ COMPLETED

Goal: resolve the open architecture/design questions before building on top of them.

- [x] Prototype two-window (Chip + Display) Electron setup: confirm transparency, always-on-top, and frameless rendering actually look right on Windows 10 and 11.
- [x] Decide: click vs hover to expand. → **Decision: Click to expand**
- [x] Decide: persistent connective "stem" line vs simple expand animation with no visual tether. → **Decision: Configurable (setting in settings panel, default off)**
- [x] Confirm weather provider (default: Open-Meteo, no key required) and validate a sample API call for your location.
- [ ] Confirm target Windows versions (10 + 11) and test transparency/acrylic behavior on both if possible.

Exit criteria: a throwaway prototype window that is transparent, frameless, always-on-top, and draggable — proves the platform choice holds up before real feature work starts.

## Phase 1 — Chip MVP (Week 1–2) ✅ COMPLETED

Goal: the chip alone is fully functional.

- [x] Project scaffold: Electron + Vite + React + TypeScript, strict mode, folder structure per Architecture.md.
- [x] Chip window: pill shape, drag-to-move, position persisted to settings store.
- [x] Digital time in chip, updating every second, tabular numerals.
- [x] Weather service in main process (Open-Meteo call, caching, interval refresh) wired to chip via IPC.
- [x] Weather icon + temp rendering in chip (icon set from Design.md).
- [x] System tray: show/hide, quit, run-at-startup toggle.
- [x] Light/dark theme (manual toggle first; "auto" can wait for Phase 2).

Exit criteria: chip runs standalone, shows live time + weather, survives restart with position/settings intact.

## Phase 2 — Display & Expand Interaction (Week 3–4) ✅ COMPLETED

Goal: the analog watch + weather display, and the chip↔display interaction.

- [x] Display window: circular frameless transparent window.
- [x] Analog watch face (SVG): hour/minute/second hands, tick marks.
- [x] Sweep vs Tick second-hand modes (setting).
- [x] Weather complication overlay on the display (icon, temp, condition, high/low).
- [x] Expand/collapse animation between chip and display per the decision from Phase 0.
- [x] Auto theme (follow Windows light/dark mode).
- [ ] Respect Windows "reduce motion" setting.

Exit criteria: clicking/hovering the chip smoothly reveals the full analog+weather display; collapsing returns cleanly to the chip.

## Phase 3 — Settings, Polish, Persistence (Week 5)

Goal: everything configurable, nothing janky.

- [ ] Settings panel UI (location search or geolocation, units, theme, second-hand style, refresh interval, launch-at-startup).
- [ ] Location change flow (re-fetch weather immediately on save).
- [ ] Multi-monitor position clamping (widget never opens off-screen if a monitor was unplugged).
- [ ] Sleep/wake handling — verify clock/weather recover cleanly after system sleep.
- [ ] Offline handling — show last-known weather + a subtle "stale" indicator if the network call fails.
- [ ] Visual QA pass against Design.md (contrast, spacing, animation timing) on both themes.

Exit criteria: you could hand this to yourself on a fresh Windows machine and configure it fully through the UI, no config file editing needed.

## Phase 4 — Packaging & Personal Release (Week 6)

Goal: a real installable build.

- [ ] `electron-builder` config: NSIS installer + portable exe targets.
- [ ] App icon, installer branding (name, version).
- [ ] Verify auto-launch registration works from the packaged build (not just `npm run dev`).
- [ ] Smoke test the packaged installer on a clean Windows user account.
- [ ] Write a short README (what it is, how to install, how to change settings, how to uninstall).

Exit criteria: a double-click-installable `.exe` that runs the widget end-to-end with no dev environment needed.

## Phase 5 — Stretch (post-v1, unscheduled)

- Multiple/independent chips.
- Hourly/weekly forecast on long-press.
- Alternate watch face skins.
- Edge-snapping for the chip.
- Auto-update via `electron-updater`.

## Milestone Checkpoints

| End of | You should have |
|---|---|
| Phase 0 | ✅ Proof the transparent/frameless/always-on-top approach works on your machine |
| Phase 1 | ✅ A working, live chip (time + weather) you actually use daily |
| Phase 2 | ✅ The full expand → analog watch + weather display experience |
| Phase 3 | A fully configurable, polished widget |
| Phase 4 | An installable build you could give to someone else |
