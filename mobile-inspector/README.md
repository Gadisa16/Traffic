# Mobile Inspector App

A fast, reliable mobile application for transport inspectors in the **Sidama Region (Hawassa city), Ethiopia**. Inspectors use this app to quickly verify taxis by scanning QR codes and reviewing vehicle status.

## Features

- 🔐 **Secure Authentication** - Inspector login with token-based auth and automatic session refresh
- 📷 **QR Code Scanner** - Fast scanning with duplicate prevention (5s cooldown)
- ✅ **Vehicle Verification** - View vehicle status, license expiry, owner info, and flags
- 📶 **Offline Support** - Queue scans when offline, auto-sync when connected
- 🌙 **Light/Dark Themes** - System-following with manual override, dark blue tones
- 📋 **Recent Scans** - History of all inspections with sync status
- 📸 **Photo Evidence** - Capture and upload photos for inspections

## Tech Stack

- **Framework**: Expo + React Native (TypeScript)
- **Storage**: SecureStore (tokens) + AsyncStorage (recent scans & offline queue)
- **QR**: expo-barcode-scanner
- **Networking**: axios with centralized API client
- **Testing**: Jest with React Native Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator, or physical device with Expo Go

### Installation

```bash
cd mobile-inspector
npm install
```

### Running the App

```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run android
npm run ios
npm run web  # Note: Camera not available on web
```

### Running Tests

```bash
npm test
```

## Project Structure

```
mobile-inspector/
├── App.tsx                 # Root entry point
├── src/
│   ├── App.tsx             # Main app with navigation
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── FlagBadge.tsx
│   │   ├── Header.tsx
│   │   ├── StatusBadge.tsx
│   │   └── TextInput.tsx
│   ├── context/
│   │   └── ThemeContext.tsx  # Theme provider (light/dark)
│   ├── lib/
│   │   ├── api.ts          # API client with retry & auth
│   │   ├── errorMapping.ts # User-friendly error messages
│   │   ├── offline.ts      # Offline queue management
│   │   └── storage.ts      # SecureStore & AsyncStorage helpers
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── ScannerScreen.tsx
│   │   ├── VerifyScreen.tsx
│   │   ├── RecentScansScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── theme.ts            # Color palette & theme utilities
│   └── types.ts            # TypeScript type definitions
└── __tests__/              # Test files
```

## API Endpoints

The app expects these endpoints from the backend:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with username/password |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/vehicles/verify?code={code}` | Verify vehicle by QR/plate/side number |
| POST | `/inspections` | Record inspection (with optional photo) |

## Screens

### 1. Login
- Username/phone and password input
- Secure token storage
- Clear error feedback

### 2. Scanner (Primary)
- Large camera viewfinder
- Visual scan frame guide
- Manual code entry fallback
- 5-second duplicate prevention

### 3. Verify Result
- Large side number badge + plate number
- Color-coded status (Valid/Expiring/Expired)
- License expiry with days remaining
- Limited owner info (inspector-safe)
- Flags/warnings display
- Primary actions: "Mark OK" or "Raise Flag"

### 4. Recent Scans
- List of recent inspections
- Sync status indicators
- Pull to refresh
- Retry failed uploads

### 5. Settings
- Theme toggle (System/Light/Dark)
- Connection status
- Manual sync
- Clear cache
- Sign out

## Offline Behavior

1. When offline, scans are queued locally
2. User sees "Queued for sync" confirmation
3. Auto-sync attempts when connection restored
4. Retry with exponential backoff (1s, 2s, 4s... up to 30s)
5. Manual retry available for failed items

## Design System

### Colors
- **Ethiopian-inspired palette**:
  - Ethiopian Gold: `#f2c94c` (accent in dark mode)
  - Ethiopian Green: `#1f7a3a` (accent in light mode)
  - Hawassa Blue: `#1a3a5c` (dark backgrounds)

### Status Colors
- Valid: Green (`#1f7a3a`)
- Expiring Soon: Amber (`#e67e22`)
- Expired: Red (`#c0392b`)
- Warning: Gold (`#f39c12`)

### Accessibility
- Minimum 48px touch targets
- High contrast ratios
- Screen reader labels
- Color + icon + text for status (not color-only)

## Testing Retry/Backoff (Local)

To test retry and exponential-backoff behavior locally:

1. Start the test server:

```bash
cd test-server
npm install
node index.js
```

2. Point the API base URL to `http://<your-machine-ip>:4001` in `src/lib/api.ts`

3. Test flow:
   - Open the app and scan a vehicle
   - The test server returns 500 for first two attempts
   - Watch retry attempts increment and finally succeed on attempt 3

## Environment Variables

Configure the backend URL in `src/lib/api.ts`:

```typescript
const BACKEND_HOST = 'http://your-backend-url:8000'
```

## License

Private - Transport Authority of Ethiopia
