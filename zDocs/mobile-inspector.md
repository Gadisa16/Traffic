Creating a concise implementation todo list for the mobile-inspector app, then providing a ready-to-use developer prompt.

Added 9 todos

Progress: added a 13-step implementation plan to the TODO list. Next I can scaffold the Expo app and implement the auth + scanner flows — would you like me to start scaffolding now?

Developer prompt to implement the mobile-inspector app
- Goal: Build a fast, reliable inspector mobile app (Sidama / Hawassa workflow) for scanning vehicle QR codes and verifying vehicle info. Deliver a production-ready Expo React Native app (TypeScript) with offline-first behavior, secure auth, a QR scanner, a verification UI, recent-scans history, and system-following light/dark themes (dark = dark-blue tones).

Technical stack (recommended)
- Framework: Expo + React Native (TypeScript).
- Storage: SecureStore (tokens) + AsyncStorage or SQLite (recent scans & offline queue).
- QR: expo-barcode-scanner (or react-native-vision-camera if native required).
- Networking: axios with centralized API client, request retries/backoff.
- Testing: Jest (unit) + Detox or Playwright Mobile for E2E.
- CI: GitHub Actions for Android/iOS build pipeline.

Screens & behavior (one primary action per screen)
1. Launch / Splash
  - Restore session; show progress.
2. Login
  - Phone/email + password + OTP optional.
  - Persist token securely; clear logout.
3. Scanner (primary)
  - Big scanner view with a single large “Scan” target area.
  - Prevent duplicate scans for N seconds; allow manual code entry fallback.
  - On unreadable/invalid code show clear retry/help UI.
4. Verify Result
  - Large header: Side number badge + Plate number.
  - Vehicle status: color-coded (Valid / Expiring soon / Expired).
  - License expiry date, days remaining.
  - Limited owner info (first name, partial phone) — inspector-safe.
  - Flags/warnings (e.g., suspended, stolen, fines).
  - One primary action: “Mark OK” or “Raise Flag” with optional note.
5. Recent Scans
  - List of last N scans (timestamp, plate, side number, result summary).
  - Tap to re-open full verification details.
6. Settings / Logout
  - Theme toggle, manual sync, clear cache, logout.

API contract (example)
- Auth: POST /api/auth/login -> { token, refreshToken, expiresAt }
- Refresh: POST /api/auth/refresh -> { token, expiresAt }
- Verify: GET /api/vehicles/verify?code={qrOrSideOrPlate} -> {
    plate_number, side_number, status, license_expiry, owner: { name, mask_phone }, flags: []
  }
- Acknowledge/report: POST /api/vehicles/{id}/inspect -> { action: 'ok'|'flag', note? }
- All endpoints should return helpful error codes and message fields. Client must surface clear messages.

Offline & resilience rules
- If offline when scanning: cache the scanned code + timestamp + photo(optional) in local queue and show immediate local result: “Queued for verification — will sync when online.”
- Retry policy: queued sync with exponential backoff; show sync state in Settings.
- Graceful error UX: map HTTP failures to friendly messages (network down / server error / auth expired). Offer “Retry” and “Save for later.”

UX / Design & accessibility
- High-contrast UI, large touch targets (min 44–48px).
- Minimal visual density; use readable fonts, large plate/side-number typography.
- Dark theme palette: dark-blue background tones; accent from Ethiopian nature (deep green or gold).
- Respect system theme by default with manual override.
- Localized strings (English + Amharic/Sidama if needed) and RTL-safe design if required.
- Use color + icons + text for status (avoid color-only signals).

Security & privacy
- Store tokens in SecureStore; use short-lived access tokens + refresh.
- Limit owner data shown to inspector-safe subset.
- Encrypt any sensitive persisted queues where possible.
- Add audit event when inspector views or flags a vehicle.

Acceptance criteria
- Inspector can login, scan a QR, and view verification in <2s on typical mobile network.
- App handles offline scans (saved locally) and synchronizes automatically when online.
- Duplicate scans within 5s are suppressed.
- Verification screen shows all listed fields and primary action.
- Theme follows system preference; dark theme uses dark-blue tones.
- Basic unit tests for API client and QR handler; at least 1 E2E for scan->verify->acknowledge.

Deliverables
- A runnable Expo project in mobile-inspector with README (setup, build, run).
- Components: `Auth`, `Scanner`, `VerifyDetail`, `RecentScans`, `Settings`.
- API client in `lib/api.ts` with error mapping helpers.
- Storage helpers `lib/storage.ts` for SecureStore + AsyncStorage/SQLite.
- Tests and GitHub Actions workflow for CI builds.

Optional enhancements (phase 2)
- Photo capture for evidence, OCR to validate plate automatically, geolocation tag with scan (respect privacy), role-based inspector privileges, push notifications for admin replies.

Would you like me to scaffold the Expo project now (create files, example screens, and stub API client), or produce a more compact ticket set for handing to a developer/agency?