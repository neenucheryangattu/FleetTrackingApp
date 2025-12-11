# Fleet Tracking App

A React Native app that displays real-time locations of 500+ delivery agents on a map, similar to Swiggy, Dunzo, or Uber's driver map.

## Features

✅ **Map View** - Shows 500+ driver markers on Google Maps  
✅ **Clustering** - Optimizes performance by clustering nearby drivers  
✅ **Real-time Updates** - Simulates WebSocket for live position updates  
✅ **Driver Details** - Bottom sheet showing driver info and route history  
✅ **Background Tracking** - Tracks user location every 60s or 50m  
✅ **Offline Support** - Caches data for offline viewing  
✅ **Error Handling** - Graceful handling of permissions and network errors  

---

## Setup Instructions

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** package manager
- **Expo CLI** (will be installed globally or via npx)
- **Google Maps API Key** (for map functionality)
- **iOS Simulator** (for iOS development) or **Android Emulator** (for Android development)
- **Expo Go app** (optional, for testing on physical devices)

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd FleetTrackingApp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Google Maps API Key**:
   - Get your Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Update `app.json` with your API key:
     ```json
     "ios": {
       "config": {
         "googleMapsApiKey": "YOUR_IOS_API_KEY"
       }
     },
     "android": {
       "config": {
         "googleMaps": {
           "apiKey": "YOUR_ANDROID_API_KEY"
         }
       }
     }
     ```

4. **Configure Location Permissions**:
   - iOS: Permissions are configured in `app.json` under `ios.infoPlist`
   - Android: Permissions are configured in `app.json` under `android.permissions`
   - Ensure location permissions are properly set for both foreground and background tracking

### Running the App

#### Development Mode

1. **Start the Expo development server**:
   ```bash
   npm start
   # or
   npx expo start
   ```

2. **Run on specific platform**:
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator
   npm run android
   
   # Web browser
   npm run web
   ```

3. **Using Expo Go** (for physical devices):
   - Scan the QR code with Expo Go app (iOS) or Camera app (Android)
   - The app will load on your device

#### Building for Production

1. **Prebuild native projects** (if needed):
   ```bash
   npm run prebuild
   ```

2. **Build standalone apps**:
   ```bash
   # iOS
   eas build --platform ios
   
   # Android
   eas build --platform android
   ```

### Troubleshooting

- **Location permissions not working**: Ensure permissions are properly configured in `app.json` and granted on the device
- **Maps not loading**: Verify Google Maps API key is correct and has proper restrictions/quotas
- **Background tracking issues**: Check that background location permissions are granted and the app has necessary capabilities
- **Cache issues**: Clear app data or reinstall the app to reset AsyncStorage cache

---

## Architecture Overview

### System Architecture

The app follows a **service-oriented architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    App.tsx (Root)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │         ErrorBoundary (Error Handling)           │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │         MapView Component                  │  │  │
│  │  │  ┌──────────────┐  ┌──────────────────┐   │  │  │
│  │  │  │ DriverMarker │  │DriverDetailsSheet│   │  │  │
│  │  │  └──────────────┘  └──────────────────┘   │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│  DriverService  │  │ LocationService  │
│  (WebSocket     │  │ (GPS Tracking,   │
│   Simulation)   │  │  Background)     │
└─────────────────┘  └──────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌──────────────────┐
│  AsyncStorage   │  │  Expo Location   │
│  (Caching)      │  │  (Native APIs)   │
└─────────────────┘  └──────────────────┘
```

### Component Structure

```
FleetTrackingApp/
├── components/
│   ├── MapView.tsx           # Main map component with clustering
│   ├── DriverMarker.tsx      # Individual driver marker component
│   ├── DriverDetailsSheet.tsx # Bottom sheet for driver details
│   └── ErrorBoundary.tsx     # Error boundary for graceful error handling
├── services/
│   ├── driverService.ts      # WebSocket simulation & driver data management
│   └── locationService.ts    # Location tracking & caching service
├── types/
│   └── index.ts              # TypeScript type definitions
├── App.tsx                   # Root component with ErrorBoundary
└── index.ts                  # Entry point
```

### Key Services

#### DriverService
- **Purpose**: Manages driver data and simulates real-time WebSocket updates
- **Features**:
  - Generates 500 drivers across 8 Indian cities
  - Updates 30% of drivers every 3 seconds
  - Maintains route history (last 10 points)
  - Caches data to AsyncStorage for offline support
  - Implements observer pattern for updates

#### LocationService
- **Purpose**: Handles location tracking and permissions
- **Features**:
  - Requests foreground and background location permissions
  - Tracks location in foreground (10s interval or 10m distance)
  - Background tracking via TaskManager (60s interval or 50m distance)
  - Caches location data for offline use
  - Graceful fallback to cached location on errors

---

## Key Design Decisions

### 1. Performance Optimizations

**Visible Driver Filtering**:
- Only renders drivers within the visible map region
- Limits rendering to 100-250 drivers based on zoom level
- Reduces React Native rendering overhead significantly

**Clustering**:
- Uses `react-native-map-clustering` to group nearby drivers
- Reduces marker count when zoomed out
- Improves performance and user experience

**Memoization**:
- Uses `useMemo` and `useCallback` extensively to prevent unnecessary re-renders
- Computes visible drivers and route coordinates only when dependencies change

### 2. Caching Strategy

**Driver Data Caching**:
- Caches all 500 drivers to AsyncStorage
- Cache expires after 1 hour
- Periodic cache updates (20% chance on each update cycle)
- Loads cached data immediately on app start for instant UI

**Location Caching**:
- Caches user location after each update
- Used as fallback when GPS is unavailable
- Enables offline functionality

### 3. Real-time Updates Simulation

**WebSocket Simulation**:
- Uses `setInterval` to simulate WebSocket updates
- Updates 30% of drivers every 3 seconds (realistic update rate)
- Maintains route history for each driver
- Observer pattern for decoupled updates

### 4. Error Handling

**ErrorBoundary**:
- Catches React component errors
- Prevents app crashes
- Provides graceful error UI

**Permission Handling**:
- Graceful degradation when permissions denied
- Falls back to cached/default location
- Continues functioning with limited features

**Network Error Handling**:
- Uses cached data when network unavailable
- Continues operation in offline mode

### 5. Background Location Tracking

**TaskManager Integration**:
- Uses Expo TaskManager for background location updates

### 6. TypeScript Type Safety

**Comprehensive Type Definitions**:
- All data structures are typed
- Prevents runtime errors

### 7. Component Architecture

**Separation of Concerns**:
- Services handle business logic
- Components handle UI rendering
- Types ensure data consistency
- Clear boundaries between layers

**Reusable Components**:
- DriverMarker: Reusable marker component
- DriverDetailsSheet: Reusable bottom sheet
- ErrorBoundary: Reusable error handling

---

## Future Improvements

### 1. Real WebSocket Integration
- Replace simulation with actual WebSocket connection

### 2. Authentication
- Token-based authentication

### 3. Advanced Features
- **Driver Search & Filtering**: Search by name, status
---

## Project Structure

```
FleetTrackingApp/
├── components/
│   ├── MapView.tsx           # Main map component
│   ├── DriverMarker.tsx      # Individual driver marker
│   ├── DriverDetailsSheet.tsx # Bottom sheet for driver details
│   └── ErrorBoundary.tsx     # Error boundary component
├── services/
│   ├── driverService.ts      # WebSocket simulation & driver data
│   └── locationService.ts    # Location tracking & caching
├── types/
│   └── index.ts              # TypeScript type definitions
├── App.tsx                   # Root component
├── index.ts                  # Entry point
├── app.json                  # Expo configuration
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript configuration
```

## Technologies

- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe JavaScript
- **react-native-maps** - Map component for React Native
- **react-native-map-clustering** - Marker clustering library
- **@react-native-async-storage/async-storage** - Local storage
- **expo-location** - Location services
- **expo-task-manager** - Background task management

---

