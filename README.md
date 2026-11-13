# Portfolio

Static website. Local preview: `python -m http.server 8765`, then http://localhost:8765.

Original collage editor: http://localhost:8765/editor.html . Restored from the archived 2026-05-30 Layout Template, with current collage assets. Supports drag, wheel layers, Shift+wheel size, Ctrl+wheel rotation, Alt fine adjustments, image import, and JSON/CSS export.

`portfolio-config.js` contains one Minenachten LAN reference and three intentionally empty URL slots, the temporary circle text and device frame/screen geometry. Each configured URL loads independently in its Mac and phone. The destination must allow iframe embedding. Empty slots make no external website requests. Replace frame paths to add alternative device colors.

`softbody.js` runs the text ball in its own playground above the references. Physics uses elapsed time with fixed substeps, identical initial-drop and release physics, and 0.82 restitution for all wall bounces. Free holding leaves the ring circular. Wall pressure locally flattens the contact edge of a convex, approximately area-preserving contour; glyphs are spaced by arc length so corner compression does not pile them onto one point. Releasing wall compression converts the visible deformation into a spring recoil directed away from the contact. Its energy scales with compression squared and uses the same gravity and restitution as falling. Incoming wall-directed throw velocity reflects instead of cancelling the recoil. Pointer cancellation adds no recoil. Pressure beyond 51% of the radius held for 900ms triggers word fragments and respawn. Space on the focused canvas resets the ball. Reduced motion disables automatic falling, spin and theme changes. Bounce colors are selected randomly without immediate repetition.

References keep their compact original spacing and are grouped into two pairs. The down arrows navigate from playground to pair 1, pair 2 at the same viewport position, then the collage. They are hidden during scrolling and between aligned positions. Mobile keeps the Mac centered. Mac shell colors follow the background, with Space Grey on black. Photo-card borders and shadows are removed; the mouse uses a single small shadow.

Collage drag and alpha hit tests retain the original implementation. Only a moved drag ending in pointerup rolls the 10% fall chance. Fallen objects return on reload. The public page has no layout reset button; editing controls remain in editor.html.

## Assets

Device PNGs: https://github.com/pixelsign/html5-device-mockups , MIT license in `assets/device-frames/LICENSE`. The desktop is the supplied older iMac with a masked color layer on its chin and stand. The original shading is retained; black uses Space Grey. Screen coordinates are configurable; phone notch is masked separately.

`pulsar-sunset-haze.png` is the official Pulsar product image. `pulsar-perspective.png` is an AI-generated perspective reconstruction based on the official Sunset Haze top and side images, not an official product photograph. Source gallery: https://us.pulsar.gg/products/x2-crazylight-gaming-mouse .

`monster-ultra.png` is an AI-generated product illustration of Monster Energy Zero Ultra. Brand marks belong to their owners. No client work or live website references are invented.


Minenachten preview: `http://192.168.178.51:3810/` sends `frame-ancestors none`, so reference 1 uses real captured desktop and mobile screens instead of an iframe. `assets/minenachten-preview/manifest-v3.json` records the capture source, viewport dimensions and screenshot slices. Each device has an independently scrollable capture. This is a static visual preview, not a live embedded application. The LAN site was not changed. Captures show the main site after entering the Minecraft name through the normal visitor flow. The preview images are bundled locally and remain visible if the test server is shut down or its address changes. Future sites that allow embedding can still use a plain URL.

Capture v3 uses a paused, front-facing player pose and solid native text in place of the fine dither text masks for legibility at mockup size. These changes affect the captured portfolio images only, not the test server.

German browser locales use the German introduction; all other locales use the supplied English text. The ring fits either text to its circumference. Small vertical impacts below 0.18 px/ms settle immediately, and effects ignore impacts below 0.22 px/ms. After the first pointer or keyboard interaction, qualifying bounces play a 140ms sine bass tap at a maximum gain of 0.008, with soft attack/release and no overlapping taps. Audio remains silent before interaction and while the document is hidden.
