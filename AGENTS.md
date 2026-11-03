# Architecture rules

- Load feature pages lazily behind a route error boundary to isolate failures and reduce initial downloads.
- Preserve dedicated anime and outfitter routes as the authoritative implementations; generic studio handles only generic tools.
- Move account-owned data and credits to Cloud with RLS once the paused backend is restored; current local storage remains a legacy cache, not abuse protection.
- Real ads and rate limiting are deferred; never describe mock rewards as revenue or abuse protection.
- Load FFmpeg only for local media jobs, explicitly bundle its module worker with a matching ESM core, serialize its shared filesystem operations, and host oversized WASM through project assets.
- Embed the local Arabic font in PDF exports so document generation does not depend on third-party font downloads.
- Size the home studio with bounded intrinsic flex/grid tracks and safe-area clearance; short viewports scroll rather than hide controls.
- Keep app-link sharing inline below home utilities and scanner discovery inside the office; preserve direct scanner routes for compatibility.
- Use the shared BackButton for page and step-back controls, deriving its icon direction and accessible name from the selected language; preserve each screen's existing navigation action and keep dismiss/media icons separate.
- Theme file-sharing screens with semantic UI tokens; keep QR ink/paper as fixed high-contrast document tokens so changing the app theme cannot reduce scan contrast.
- Show voice presets independently of recording state; draw recording previews from actual audio buffers and label converted playback with the preset used for that render, not the current selection.
- Apply card depth through the shared depth-card class, animating the independent `translate` property so press-scale feedback still works and reduced-motion disables it.
