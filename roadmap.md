# Approved release development

- [x] Phase 1: unified 21 page/step back controls; browser verified right arrows in Arabic, left arrows in English, original destinations and live language switching; two direction tests passed
- [x] Phase 2: Rasma Share now follows light/dark tokens; browser verified role/mode selection, code input, reset and back. Transfer between devices remains unverified; transport logic unchanged.
- [ ] Phase 3: reorganize Audio Studio and Voice Changer; show presets/settings before recording and verify real recording → conversion → playback with existing credits
- [ ] Later visual/content improvement phases — waiting for phase-specific permission; no changes in Phase 1

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