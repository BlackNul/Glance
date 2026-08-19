# Design — Chip Weather Clock Widget

## 1. Design Principles

- **Glanceable first.** The chip must be readable in under a second, from a normal desktop viewing distance.
- **One clean gesture.** Chip → Display is a single, obvious interaction (click or hover) — no menus to get to the main view.
- **Analog over digital** as the hero visual — the watch face is the centerpiece; weather is a supporting element, not competing for attention.
- **Feels native to Windows, not like a floating browser tab.** Rounded corners, soft shadows, subtle blur/acrylic background rather than a flat rectangle.

## 2. States

### 2.1 Chip (collapsed)
- Shape: pill / capsule, rounded-full corners.
- Approx size: ~140×36 px (tunable).
- Content, left to right: small weather icon → temperature ("21°") → thin divider → time ("14:32").
- Background: translucent dark or light (theme-dependent), subtle acrylic/blur, 1px hairline border at low opacity.
- No seconds shown in chip (keeps it calm, avoids 1Hz flicker distraction).

### 2.2 Display (expanded)
- Shape: circle, diameter ~220–260px.
- Center: analog watch face — hour/minute/second hands, minimal tick marks (12 hour ticks, optional 60 minute ticks at lower opacity).
- Weather: condition icon + temp placed as a "complication" at the 12 or 6 o'clock position inside the face (like a watch complication), with high/low as smaller text beneath it.
- Background: circular acrylic panel, soft drop shadow, subtle radial gradient (barely-there) so it doesn't look like a flat sticker on the desktop.
- Optional thin "stem" line connecting the chip's last position to the display, fading out — reinforces the "connected structure" concept from the brief.

### 2.3 Settings panel
- Small rounded rectangle panel, opens from the Display (e.g., gear icon at the display's edge).
- Grouped fields: Location, Units (°C/°F), Theme (Light/Dark/Auto), Second-hand style (Sweep/Tick), Launch at startup (toggle), Refresh interval.

## 3. Motion

- Chip → Display expand: scale + fade, ~180–220ms, ease-out. Chip shrinks/fades as display grows from the same anchor point.
- Second hand: two selectable styles —
  - **Sweep**: continuous motion via `requestAnimationFrame`, mechanical-watch feel.
  - **Tick**: discrete 1-second jumps with a tiny overshoot/settle, quartz-watch feel.
- Weather icon changes (e.g., cloud → rain) cross-fade rather than hard-cut.
- Collapse: reverse of expand, slightly faster (~150ms) so it feels responsive to dismiss.

## 4. Color & Theming

Two themes, both following the same structure:

| Token | Light | Dark |
|---|---|---|
| Chip background | rgba(255,255,255,0.72) blur | rgba(20,20,24,0.72) blur |
| Chip text | #1C1C1E | #F2F2F2 |
| Display background | rgba(255,255,255,0.85) blur | rgba(18,18,22,0.85) blur |
| Watch hands | #1C1C1E | #F2F2F2 |
| Hour ticks | rgba(0,0,0,0.35) | rgba(255,255,255,0.35) |
| Accent (seconds hand, weather temp) | system accent color (read from Windows) or a fixed warm orange (#FF8A3D) fallback | same |
| Border hairline | rgba(0,0,0,0.08) | rgba(255,255,255,0.10) |

"Auto" theme follows Windows light/dark app mode setting.

## 5. Typography

- System font stack: Segoe UI Variable (native Windows 11 font) → falls back to Segoe UI → system-ui.
- Chip time: medium weight, tabular numerals (so digits don't jitter width as they change).
- Display temp/condition: regular weight, slightly larger for temp, smaller/muted for condition text and high/low.

## 6. Iconography

- Weather icons: a small consistent SVG icon set (line-style, not skeuomorphic/emoji) covering: clear, partly cloudy, cloudy, rain, thunderstorm, snow, fog — day and night variants.
- Keep icon set self-contained in the repo (no external icon CDN at runtime) so the widget works fully offline for rendering, even if data itself needs network.

## 7. Layout & Positioning Behavior

- Chip is draggable anywhere on the desktop; snaps to nothing by default (free placement), v2 stretch: edge-snap.
- Display always opens anchored to the chip's current position, biased to stay within the visible monitor bounds (flip up/down/left/right if near an edge).

## 8. Accessibility & Readability

- Minimum contrast ratio 4.5:1 for chip text against its background in both themes (verify against the translucent/blur background at rest, not just the flat token color).
- Respect Windows "reduce motion" system setting: if enabled, expand/collapse becomes an instant cut instead of an animated scale/fade, and the second hand defaults to Tick instead of Sweep.

## 9. Deferred (v2 design ideas)

- Alternate watch face skins (minimal / sport / classic numerals).
- Weekly forecast strip on long-press of the display.
- Multiple accent color presets independent of system accent.
