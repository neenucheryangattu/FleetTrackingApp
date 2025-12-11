export type DriverStatus = 'active' | 'idle' | 'offline';

export interface RouteHistoryItem {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Driver {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: DriverStatus;
  speed: number;
  routeHistory: RouteHistoryItem[];
  city?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface CachedDriverData {
  drivers: Driver[];
  timestamp: number;
}

export interface CachedLocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}


export type DriverUpdateCallback = (drivers: Driver[]) => void;
export type LocationUpdateCallback = (location: Location) => void;

export interface DriverMarkerProps {
  driver: Driver;
  onPress: (driver: Driver) => void;
}

export interface DriverDetailsSheetProps {
  driver: Driver | null;
  onClose: () => void;
}

export interface DriverDetailsSheetRef {
  snapToIndex: (index: number) => void;
  close: () => void;
}

