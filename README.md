# Portfolio

Static website. Local preview: `python -m http.server 8765`, then http://localhost:8765.

Original collage editor: http://localhost:8765/editor.html . Restored from the archived 2026-05-30 Layout Template, with current collage assets. Supports drag, wheel layers, Shift+wheel size, Ctrl+wheel rotation, Alt fine adjustments, image import, and JSON/CSS export.

`portfolio-config.js` contains one Minenachten LAN reference and three intentionally empty URL slots, the temporary circle text and device frame/screen geometry. Each configured URL loads independently in its Mac and phone. The destination must allow iframe embedding. Empty slots make no external website requests. Replace frame paths to add alternative device colors.

`softbody.js` runs the text ball in its own playground above the references. Physics uses elapsed time with fixed substeps, identical initial-drop and release physics, and 0.94 wall restitution, gravity 0.00065 and 0.99 per-frame velocity damping. Free holding leaves the ring circular. Wall pressure locally flattens the contact edge of a convex, approximately area-preserving contour; glyphs are spaced by arc length so corner compression does not pile them onto one point. Compression release follows the reference's measured response: shallow presses nudge, deeper presses launch with a fourth-power pressure response, scaled to the available travel in each axis. Spin eases to a very slow idle rotation at the final floor contact. Small floor rebounds lose extra energy to avoid a long bouncing tail. Pointer cancellation adds no recoil. Pressure beyond 51% of the radius held for 900ms triggers word fragments and respawn. Space on the focused canvas resets the ball. Reduced motion disables automatic falling, spin and theme changes. Bounce colors are selected randomly without immediate repetition.

References keep their compact original spacing and are grouped into two pairs. The down arrows navigate from playground to pair 1, pair 2 at the same viewport position, then the collage. They are hidden during scrolling and between aligned positions. Mobile keeps the Mac centered. Mac shell colors follow the background, with Space Grey on black. Photo-card borders and shadows are removed; the mouse uses a single small shadow.

Collage drag and alpha hit tests retain the original implementation. Only a moved drag ending in pointerup rolls the 10% fall chance. Fallen objects return on reload. The public page has no layout reset button; editing controls remain in editor.html.

## Assets

Device PNGs: https://github.com/pixelsign/html5-device-mockups , MIT license in `assets/device-frames/LICENSE`. The desktop is the supplied older iMac with a masked color layer on its chin and stand. The original shading is retained; black uses Space Grey. Screen coordinates are configurable; phone notch is masked separately.

`pulsar-sunset-haze.png` is the official Pulsar product image. `pulsar-perspective.png` is an AI-generated perspective reconstruction based on the official Sunset Haze top and side images, not an official product photograph. Source gallery: https://us.pulsar.gg/products/x2-crazylight-gaming-mouse .

`monster-ultra.png` is an AI-generated product illustration of Monster Energy Zero Ultra. Brand marks belong to their owners. No client work or live website references are invented.


Minenachten preview: `http://192.168.178.51:3810/` sends `frame-ancestors none`, so reference 1 uses real captured desktop and mobile screens instead of an iframe. `assets/minenachten-preview/manifest-v3.json` records the capture source, viewport dimensions and screenshot slices. Each device has an independently scrollable capture. This is a static visual preview, not a live embedded application. The LAN site was not changed. Captures show the main site after entering the Minecraft name through the normal visitor flow. The preview images are bundled locally and remain visible if the test server is shut down or its address changes. Future sites that allow embedding can still use a plain URL.

Capture v3 uses a paused, front-facing player pose and solid native text in place of the fine dither text masks for legibility at mockup size. These changes affect the captured portfolio images only, not the test server.

German browser locales use the German introduction; all other locales use the supplied English text. The ring fits either text to its circumference. Only bottom impacts below 0.04 px/ms settle. Each new edge contact or genuine bounce independently triggers audio and a random non-repeating color change, without a global time lock. Holding one edge does not retrigger. After the first pointer or keyboard interaction, bounces play a 140ms sine bass tap with soft attack/release. Up to four voices can overlap, each capped at gain 0.002, keeping their combined peak at or below 0.008. Audio remains silent before interaction and while the document is hidden.

The official T3 Code Nightly icon is extracted from the installed app icon, with transparent corners. It fills the old GitHub position at a slightly larger size; GitHub moves right with a counterclockwise tilt. Both changes are also included in the original editor.

## Visible bounds and performance v13

The hero canvas extends to the first iMac top. Its collision ceiling follows the visible viewport while scrolling, and its floor is the nearer of the viewport bottom and the first Mac top. If the remaining visible area is smaller than the ball, both boundaries squeeze its contour. The same 51%-radius pressure threshold and 900ms continuous hold cause a burst. Returning fully to the top resets the spawn position while retaining the current color. Physics coefficients and launch response are unchanged.

Embedded collage images and MP4 are now separate byte-identical files, preloaded on the first scroll or after 700ms, with an additional 300px visibility trigger. The original editor stays separate. The main page no longer loads the unused UI SDK script, since it contains no SDK components after removal of the reset button. Collage videos pause outside their region; audio suspends in background tabs. Tests and archived captures are not loaded by the page.

`node --test tests/text-ring.test.cjs` runs behavior checks. `node tests/performance.cjs` compares against the pre-optimization Git commit, verifies identical trajectories and 122880 contour samples, then benchmarks changing wall-pressure frames with warmup and nine-run medians. The contour optimization reuses unchanged shape data and scratch memory, precomputes smoothing weights and avoids redundant tangent computations; glyph geometry, audio envelope and physics constants are preserved.

Local measurements: HTML 8916538 to 53187 bytes. Initial decoded HTML plus resource representations 19301733 to 3543200 bytes, about 5.45x less. Local contour benchmark median 162.52 to 74.01ms for 120 held-pressure frames, about 2.20x faster. Browser timings were 1.99s before and 0.69s afterward but used the same browser cache and are not a controlled cold-network speed guarantee. The original image and video data is unchanged; eventual total media download is deferred, not eliminated.

## Compression and media readiness v14

Scroll compression uses the normal pressure charge, including reset when pressure is relieved. The ring remains visible in the shrinking gap and becomes word fragments after sustained deep compression. It waits for return to the page top before respawning at the original center/start height with its current color. Ordinary drag pops keep their existing automatic respawn.

17 static images use lossless WebP encodings of display-sized variants, capped at three times their configured collage width. These variants total 1886476 bytes versus 11963135 bytes for their original inputs. The editor and original media are unchanged. `tests/media-optimization.json` records each source, output and size. Preloading starts on the first scroll or after 700ms, rather than waiting until the collage is nearly visible; every deferred image is explicitly loaded eagerly once preloading begins. This deliberately trades some early background traffic for complete collage readiness.
