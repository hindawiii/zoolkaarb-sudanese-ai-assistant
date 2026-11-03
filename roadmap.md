# Approved release development

- [x] Phase 1: unified 21 page/step back controls; browser verified right arrows in Arabic, left arrows in English, original destinations and live language switching; two direction tests passed
- [x] Phase 2: Rasma Share now follows light/dark tokens; browser verified role/mode selection, code input, reset and back. Transfer between devices remains unverified; transport logic unchanged.
- [x] Phase 3: reorganized Audio Studio and Voice Changer; presets/settings visible before recording; browser verified real MediaRecorder input → decoded buffer → playable WAV, accurate preview name and layouts at 320/390/686px; credit regression tests passed
- [x] Phase 4: share bar adds Telegram, Instagram, phone share sheet (when supported); Al-Khal chat prompt updated to Rasma sections — prompt deployment blocked: Lovable Cloud paused
- [x] Phase 5: home cards have layered depth, gentle staggered float and hover lift; reduced-motion respected; verified at 390px with no overflow
- [x] Section upgrades: Al-Khal chat quick-question pills; Status Maker cards have depth
- [ ] Section upgrades: Fake Call and Al-Khal notes visual polish — waiting for permission

- [x] Adapt home content to viewport height with bounded sizing and short-screen scrolling; verified 320–686px mobile widths
- [x] Group scanner access under the digital office, preserving existing scanner links; office → scanner → office verified
- [x] Replace home share modal with a separate inline expanding share control; expansion, copy and keyboard collapse verified

- [ ] Account sign-in, name/photo profile, reset password — blocked: Lovable Cloud paused
- [ ] Server credit ledger (3 initial uses per tool) — blocked: Lovable Cloud paused; local ledger preserved
- [ ] Sync notes, reminders and saved statuses — blocked: Lovable Cloud paused; local data preserved
- [x] Error recovery, route-level loading, Cairo and deferred editor fonts
- [x] Reachable office, remove obsolete remix route and placeholder sections
- [ ] Activate and verify function CORS, safe errors and valid failure status — code prepared; deployment blocked: Lovable Cloud paused
- [ ] Activate and verify stable chat model — code prepared; deployment blocked: Lovable Cloud paused
- [x] In-app reminder recovery and notification helper; no closed-app scheduling promised
- [x] Local media engine: explicit module worker, matching ESM core, queued jobs and cleanup; video-to-audio and photo/audio export verified
- [x] App icon and page metadata
- [x] Seven rule tests passed; browser verified office PDF export, balances, deferred fonts and media downloads
- Deferred: real ad integration and temporary rate limiting (user decision)