import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Polyline, Region } from 'react-native-maps';
import DriverMarker from './DriverMarker';
import DriverDetailsSheet from './DriverDetailsSheet';
import driverService from '../services/driverService';
import locationService from '../services/locationService';
import { Driver, Location, MapRegion, DriverDetailsSheetRef } from '../types';

let ClusteredMapView: typeof MapView | null = null;
try {
  ClusteredMapView = require('react-native-map-clustering').default;
} catch (e) {
  console.log('Clustering not available, using regular MapView');
}

const MapViewComponent: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);

  const mapRef = useRef<MapView>(null);
  const sheetRef = useRef<DriverDetailsSheetRef>(null);

  useEffect(() => {
    initialize();

    return () => {
      driverService.disconnect();
      locationService.stopWatchingLocation();
    };
  }, []);
  const initialize = async (): Promise<void> => {
    try {
      const cached = await driverService.getCachedData();
      if (cached && cached.drivers && cached.drivers.length > 0) {
        setDrivers(cached.drivers);
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }

    driverService.subscribe((updatedDrivers) => {
      setDrivers(updatedDrivers);
    });
    driverService.connect().catch((error) => {
      console.error('Error connecting to driver service:', error);
      Alert.alert('Error', 'Failed to load drivers. Using cached data.');
    });
    try {
      const hasPermission = await locationService.requestPermissions();
      if (hasPermission) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setUserLocation(location);
          locationService.watchLocation((loc) => {
            setUserLocation(loc);
          });
          try {
            await locationService.startBackgroundTracking();
          } catch (error) {
            console.log('Background tracking not available');
          }
        } else {
          console.log('Location unavailable - app will use default map region');
        }
      } else {
        console.log('Location permission not granted - app will use default map region');
      }
    } catch (error: any) {
      console.log('Location setup error:', error.message);
    }
  };

  const handleDriverPress = useCallback((driver: Driver) => {
    setSelectedDriver(driver);
    sheetRef.current?.snapToIndex(0);
  }, []);


  const handleSheetClose = useCallback(() => {
    setSelectedDriver(null);
  }, []);




  const initialRegion = useMemo((): MapRegion => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    return {
      latitude: 12.9716,
      longitude: 77.5946,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }, [userLocation]);



  const getVisibleDrivers = useCallback((allDrivers: Driver[], region: MapRegion): Driver[] => {
    if (!region || allDrivers.length === 0) return [];

    const minLat = region.latitude - region.latitudeDelta / 2;
    const maxLat = region.latitude + region.latitudeDelta / 2;
    const minLng = region.longitude - region.longitudeDelta / 2;
    const maxLng = region.longitude + region.longitudeDelta / 2;

    const visible = allDrivers.filter((driver) => {
      return (
        driver.lat >= minLat &&
        driver.lat <= maxLat &&
        driver.lng >= minLng &&
        driver.lng <= maxLng
      );
    });

    const statusPriority: Record<string, number> = { active: 3, idle: 2, offline: 1 };
    visible.sort((a, b) => {
      return (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0);
    });

    const maxDrivers = region.latitudeDelta > 1 ? 100 : 250;
    return visible.slice(0, maxDrivers);
  }, []);


  const visibleDrivers = useMemo((): Driver[] => {
    const region = mapRegion || initialRegion;
    return getVisibleDrivers(drivers, region);
  }, [drivers, mapRegion, initialRegion, getVisibleDrivers]);



  const routeCoordinates = useMemo(() => {
    if (!selectedDriver?.routeHistory?.length) return [];

    return selectedDriver.routeHistory.map((loc) => ({
      latitude: loc.lat,
      longitude: loc.lng,
    }));
  }, [selectedDriver]);


 
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setMapRegion(region as MapRegion);
  }, []);

  const handleMapReady = useCallback(() => {
    if (!mapRegion) {
      setMapRegion(initialRegion);
    }
  }, [mapRegion, initialRegion]);
  const MapComponent = ClusteredMapView || MapView;
  const clusteringProps = ClusteredMapView
    ? {
        clusterColor: '#2196F3',
        clusterTextColor: '#fff',
        radius: 50,
      }
    : {};

  return (
    <View style={styles.container}>
      <MapComponent
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        onRegionChangeComplete={handleRegionChangeComplete}
        {...clusteringProps}
      >
        {visibleDrivers.map((driver) => (
          <DriverMarker
            key={driver.id}
            driver={driver}
            onPress={handleDriverPress}
          />
        ))}

        {selectedDriver && routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#2196F3"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        )}
      </MapComponent>

      <DriverDetailsSheet
        ref={sheetRef}
        driver={selectedDriver}
        onClose={handleSheetClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default MapViewComponent;
