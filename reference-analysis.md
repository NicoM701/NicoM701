# Text circle reference inspection, 2026-11-12

Target: https://iansilber.com/ . Inspected the live DOM, stylesheet, inline script and canvas geometry through the shared browser. No Air Hockey implementation was requested or added.

Observed in the reference:

- `prepareRingLayout`: normal 400 weight, 26px Helvetica Neue / Helvetica / Arial; every glyph is measured. A gap of 0.75 font sizes is reserved, widths are scaled down only if required, and remaining circumference becomes tracking. Glyphs face the tangent of the contour.
- `renderCircularView`: base size follows 55.0469 viewport-height units; text-path radius is 42.5% of that size on desktop, 31.25% below 700px.
- `getRingPose`: rotation follows the tangent sampled on either side of each angle, not the original undeformed circle.
- `updateSoftBody`: 64 radial offsets and velocities, neighbor coupling, restoring springs, damping, zero mean displacement. The body has separate translation and velocity. It does not simulate independently wandering letter positions.
- Gravity 0.0004 px/ms², bounce 0.94, friction 0.971, rotation period 60s. Rotation pauses at rest.
- `updatePopCharge`: requires edge penetration beyond max(30px, 51% of text-path radius), continuously on the same edge for 900ms. Ordinary holding does not pop.
- `advanceColorTheme`: saturated backgrounds and contrasting text. The observed version changes theme on a bounce, rather than a timer. Burst pieces are words rather than dots.

Local correction:

`softbody.js` independently implements the measured typography and a radial spring model. Temporary German text has roughly the same density as the reference. Wall pressure drives deformation and pop charge. The circle can be thrown; collisions trigger contour waves and color changes. Burst words fall and fade before respawning.

Deliberate integration differences: the simulation is confined to the collage section; collage objects use approximate bounding rectangles. The original page has additional multi-ball, pinch, audio and Air Hockey code, which is outside this implementation. This is a tested behavioral reconstruction, not a claim of pixel-identical dynamics in every collision.

Validation: `node --test tests/text-ring.test.cjs` covers measured glyph spacing, free-hold versus pressure-hold, timer reset, floor restitution, wave stability, and object rebound. Shared-browser checks covered desktop/mobile rendering and an actual pointer drag from the upper collage area to its lower area, releasing without a stuck drag state. The restored original editor loaded all current images without failures.

Original editor found at:
`C:/Users/nicom/Documents/Codex/2026-05-30/files-mentioned-by-the-user-shedsgns/outputs/draggable-moodboard-template.html`

`editor.html` retains that editor's controls and script, with the current collage section and assets substituted. No archived files were changed. The replacement mouse-only editor was removed; `?editor` redirects to `editor.html`.


## Subsequent user corrections

The ball is now confined to its own full-height playground above the mockups. Collage collisions no longer distort it when picked up. Startup restitution is 0.15, later collisions 0.82, with a resting threshold. The renderer no longer discards most elapsed time on slow frames. A convex superellipse with area normalization replaces the corner-clamping collapse; text is sampled by arc length. The user requested random theme selection without immediate repeats instead of the reference version's fixed color sequence. These are deliberate behavior changes following the user's review, not a claim of identical source dynamics.

Regression tests cover the previously failing corner convexity/area, initial bounce height, slow-frame timing and latest throw velocity. Browser checks verified mobile Mac centering within 0.01px and equal viewport coordinates for both reference pairs. Native smooth-scroll animations were paused by the preview host during evaluation; destination geometry was checked with animation disabled in the QA tab only.


## Contact and spacing correction, v8

The initial fall now has a visible short rebound with startup restitution 0.38 through its settling phase. Ordinary throw restitution remains 0.82. Wall pressure now creates a local, rounded contact segment by clipping and smoothing a convex outline, preserving enclosed area and arc-length text spacing. It no longer morphs the entire ring into a symmetric squircle. Pressure relaxes after release.

Reference spacing is restored to the original 90px between desktop rows and 64px on mobile, with the original compact collage section height. Arrow destination alignment uses scroll margins rather than padding each row to a full viewport. Arrows are inactive during scrolling and hidden between those aligned positions. Browser geometry checks found a 90px gap and matching row positions within 0.1px; intermediate arrow count was zero.

## Release physics v9

Removed the startup restitution branch. Refresh and a stationary release from the spawn position now follow exactly the same trajectory. Compression release uses a radius-scaled spring calibrated to gravity 0.0004 and restitution 0.82. Spring energy follows the square of the visible contact depth, with its launch directed away from each compressed wall. Incoming velocity reflects with the same restitution; corner compression combines the two perpendicular components. Cancellation adds no launch. Model regressions cover all four edges, corner release, compression strength, cancellation, and matching initial/released trajectories on desktop and mobile at different frame intervals.

## Reference reinspection and polish v11, 2026-11-13

Inspected the current inline script and instrumented only an owned reference browser tab to advance its actual simulation in 60Hz steps. No reference implementation was copied into the project. The measured reference drop produced rebounds at 2266.667, 3100, 3600, 3950 and 4216.667ms. Its outgoing speeds were 0.205991, 0.117194, 0.077479, 0.057468 and 0.045063 px/ms. It settles rather than moving forever, with residual contour motion disappearing after the last bounce. The local model now matches these five times within one 60Hz step using observed restitution 0.94, gravity 0.0004, both-axis per-frame damping 0.971 and minimum bottom rebound speed 0.04. Local rotation additionally eases to rest over 160ms instead of stopping abruptly.

The inspected reference uses a fourth-power squeeze response normalized to 51% of radius, with launch strength depending on the available travel per axis. The local independent release implementation now follows that response instead of adding a small squared-pressure impulse to potentially stale drag velocity. Held contact geometry remains the local convex area-preserving implementation; it relaxes faster after release. This is not a claim that every contour matches the reference.

Removed the local 250ms global effect cooldown. Edge-entry detection prevents repeated contact events while holding the same edge; each separately entered edge emits one event. Browser pointer-event checks recorded 1 color/1 sound at the first edge, 2/2 at a second edge immediately afterward, no change while holding, and 3/3 on compressed release. Sound and color now have separate callbacks, so color suppression cannot mute collisions. Audio is independently synthesized and remains much quieter than the reference. A four-voice cap keeps total peak gain bounded even during rapid corner contacts.

SVGL had T3 Stack, not the T3 Code Nightly app. The exact installed Nightly icon was extracted from its packaged ICO, preserving the largest 256px RGBA image. Collage and editor place it in the old GitHub gap, 72px wide at -8 degrees; GitHub moves to the screenshot's right-hand gap, 48px at -12 degrees. Visual browser inspection confirmed no taskbar background or selection frame.

## User-directed refinement v12

The user approved squeeze launches but found the reference-parameter free flight too slow and the complete rest visually frozen. Free-flight gravity is now 0.00065 and per-frame damping 0.99, with unchanged 0.94 side-wall restitution. Only low-energy floor impacts receive additional damping. Squeeze-launch calculations retain their original independent 0.0004 gravity calibration, so wall/corner compression releases are unchanged. At rest, the text slowly rotates once per six minutes, easing down over 500ms without physical movement, sounds or theme changes. This is an explicit tuning deviation from the recorded reference, not a new claim of identical reference trajectories. Tests now check a 1.0-1.6s initial fall, retained throw momentum, stronger wall return and continuous silent idle rotation instead of the old timing trace.
