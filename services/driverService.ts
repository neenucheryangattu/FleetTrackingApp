import AsyncStorage from '@react-native-async-storage/async-storage';
import { Driver, CachedDriverData, DriverUpdateCallback } from '../types';

const CACHE_KEY = 'driver_positions_cache';
const DRIVER_COUNT = 500;
const UPDATE_INTERVAL = 3000;
const CITIES = [
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
];
const createDriver = (id: number, lat: number, lng: number, city: string): Driver => {
  const statuses: Driver['status'][] = ['active', 'idle', 'offline'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  return {
    id,
    name: `Driver ${String(id).padStart(3, '0')}`,
    lat: lat + (Math.random() - 0.5) * 0.15, 
    lng: lng + (Math.random() - 0.5) * 0.15,
    status,
    speed: status === 'active' ? Math.floor(Math.random() * 60) + 10 : 0,
    routeHistory: [],
    city,
  };
};
const generateDrivers = (): Driver[] => {
  const drivers: Driver[] = [];
  const driversPerCity = Math.floor(DRIVER_COUNT / CITIES.length);
  let driverId = 1;

  CITIES.forEach((city) => {
    for (let i = 0; i < driversPerCity; i++) {
      drivers.push(createDriver(driverId++, city.lat, city.lng, city.name));
    }
  });
  const remaining = DRIVER_COUNT - drivers.length;
  for (let i = 0; i < remaining; i++) {
    drivers.push(createDriver(driverId++, CITIES[0].lat, CITIES[0].lng, CITIES[0].name));
  }

  return drivers;
};

class DriverService {
  private drivers: Driver[] = [];
  private subscribers: DriverUpdateCallback[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  async connect(): Promise<void> {

    await this.loadCachedData();
    if (this.drivers.length === 0) {
      this.drivers = generateDrivers();
      await this.cacheData();
    }
    this.notifySubscribers();
    if (!this.updateInterval) {
      this.updateInterval = setInterval(() => {
        this.updatePositions();
      }, UPDATE_INTERVAL);
    }
  }

  disconnect(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  subscribe(callback: DriverUpdateCallback): void {
    this.subscribers.push(callback);
    if (this.drivers.length > 0) {
      callback(this.drivers);
    } else {
      setTimeout(() => {
        this.drivers = generateDrivers();
        this.cacheData();
        callback(this.drivers);
      }, 100);
    }
  }

  unsubscribe(callback: DriverUpdateCallback): void {
    this.subscribers = this.subscribers.filter(cb => cb !== callback);
  }

  private updatePositions(): void {
    const updateCount = Math.floor(this.drivers.length * 0.3);
    const indicesToUpdate = new Set<number>();
    while (indicesToUpdate.size < updateCount) {
      indicesToUpdate.add(Math.floor(Math.random() * this.drivers.length));
    }
    this.drivers = this.drivers.map((driver, index) => {
      if (!indicesToUpdate.has(index) || driver.status === 'offline') {
        return driver; 
      }


      const latChange = (Math.random() - 0.5) * 0.001;
      const lngChange = (Math.random() - 0.5) * 0.001;

      const newLat = driver.lat + latChange;
      const newLng = driver.lng + lngChange;
      const routeHistory = [
        { lat: newLat, lng: newLng, timestamp: Date.now() },
        ...driver.routeHistory.slice(0, 9),
      ];

      return {
        ...driver,
        lat: newLat,
        lng: newLng,
        speed: driver.status === 'active' ? Math.floor(Math.random() * 60) + 10 : 0,
        routeHistory,
      };
    });
    if (Math.random() < 0.2) {
      this.cacheData();
    }

    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.drivers);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  getDriverById(id: number): Driver | undefined {
    return this.drivers.find(d => d.id === id);
  }

  private async cacheData(): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
        drivers: this.drivers,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error caching drivers:', error);
    }
  }

  private async loadCachedData(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CachedDriverData = JSON.parse(cached);
        const cacheAge = Date.now() - (data.timestamp || 0);
       
        if (data.drivers && data.drivers.length > 0 && cacheAge < 60 * 60 * 1000) {
          this.drivers = data.drivers;
        }
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
  }
  async getCachedData(): Promise<CachedDriverData | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) as CachedDriverData : null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }
}

export default new DriverService();
