import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location as LocationType, CachedLocationData, LocationUpdateCallback } from '../types';

const TASK_NAME = 'background-location-task';
const CACHE_KEY = 'user_location_cache';


TaskManager.defineTask(TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data?.locations?.[0]) {
    await cacheLocation(data.locations[0]);
  }
});


const cacheLocation = async (location: Location.LocationObject): Promise<void> => {
  try {
    const data: CachedLocationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      accuracy: location.coords.accuracy ?? undefined,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error caching location:', error);
  }
};

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        console.warn('Location services disabled');
        return false;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Foreground permission denied');
        return false;
      }
      try {
        await Location.requestBackgroundPermissionsAsync();
      } catch (error) {
        console.log('Background permission not available');
      }

      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }
  async startBackgroundTracking(): Promise<void> {
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
      if (isRunning) return;

      await Location.startLocationUpdatesAsync(TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, 
        distanceInterval: 50, 
        foregroundService: {
          notificationTitle: 'Fleet Tracking',
          notificationBody: 'Tracking location in background',
        },
      });
    } catch (error) {
      console.error('Error starting background tracking:', error);
      throw error;
    }
  }
  async stopBackgroundTracking(): Promise<void> {
    try {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(TASK_NAME);
      }
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  }

  async getCurrentLocation(): Promise<LocationType | null> {
    try {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        console.log('Location services disabled - using cached or default location');
        const cached = await this.getCachedLocation();
        return cached ? {
          latitude: cached.latitude,
          longitude: cached.longitude,
          accuracy: cached.accuracy,
        } : null;
      }
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        if (newStatus !== 'granted') {
          console.log('Location permission denied - using cached or default location');
          const cached = await this.getCachedLocation();
          return cached ? {
            latitude: cached.latitude,
            longitude: cached.longitude,
            accuracy: cached.accuracy,
          } : null;
        }
      }
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!location?.coords) {
          throw new Error('Invalid location data');
        }

        const locationData: LocationType = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
        };
        await cacheLocation(location);
        return locationData;
      } catch (locationError: any) {
        console.log('Current location unavailable:', locationError.message);
        const cached = await this.getCachedLocation();
        if (cached) {
          console.log('Using cached location');
          return {
            latitude: cached.latitude,
            longitude: cached.longitude,
            accuracy: cached.accuracy,
          };
        }
        return null;
      }
    } catch (error: any) {
      console.log('Location error:', error.message);
      const cached = await this.getCachedLocation();
      return cached ? {
        latitude: cached.latitude,
        longitude: cached.longitude,
        accuracy: cached.accuracy,
      } : null;
    }
  }

  async getCachedLocation(): Promise<CachedLocationData | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) as CachedLocationData : null;
    } catch (error) {
      console.error('Error getting cached location:', error);
      return null;
    }
  }

  watchLocation(callback: LocationUpdateCallback): void {
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10, 
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
        });
        cacheLocation(location);
      }
    ).then((subscription) => {
      this.watchSubscription = subscription;
    });
  }

  stopWatchingLocation(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }
}

export default new LocationService();
