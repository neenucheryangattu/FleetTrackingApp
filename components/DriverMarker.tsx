import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Driver, DriverStatus } from '../types';

interface DriverMarkerProps {
  driver: Driver;
  onPress: (driver: Driver) => void;
}

const DriverMarker = React.memo<DriverMarkerProps>(({ driver, onPress }) => {
  const getStatusColor = (status: DriverStatus): string => {
    switch (status) {
      case 'active':
        return '#00C853';
      case 'idle':
        return '#FF6D00';
      case 'offline':
        return '#616161';
      default:
        return '#2196F3';
    }
  };

  const getStatusIcon = (status: DriverStatus): string => {
    switch (status) {
      case 'active':
        return '▶'; 
      case 'idle':
        return '⏸'; 
      case 'offline':
        return '●';
      default:
        return '○';
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  const statusColor = useMemo(() => getStatusColor(driver.status), [driver.status]);
  const statusIcon = useMemo(() => getStatusIcon(driver.status), [driver.status]);
  const initials = useMemo(() => getInitials(driver.name), [driver.name]);
  const coordinate = useMemo(() => ({
    latitude: driver.lat,
    longitude: driver.lng,
  }), [driver.lat, driver.lng]);

  const handlePress = useMemo(() => () => onPress(driver), [driver, onPress]);
  const showSpeed = driver.status === 'active' && driver.speed > 0;

  return (
    <Marker
      coordinate={coordinate}
      onPress={handlePress}
      tracksViewChanges={true}
      zIndex={driver.status === 'active' ? 1000 : 500}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.markerWrapper}>
        {driver.status === 'active' && (
          <View style={[styles.glowRing, { borderColor: statusColor }]} />
        )}
        <View style={[styles.markerContainer, { 
          borderColor: statusColor, 
          shadowColor: statusColor,
          backgroundColor: driver.status === 'active' ? '#FFFFFF' : '#F5F5F5'
        }]}>
          <View style={[styles.avatar, { backgroundColor: statusColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={[styles.statusIconBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusIconText}>{statusIcon}</Text>
          </View>
          {showSpeed && (
            <View style={[styles.speedBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.speedText}>{Math.round(driver.speed)}</Text>
              <Text style={styles.speedUnit}>km/h</Text>
            </View>
          )}
        </View>
        {driver.status === 'active' && (
          <View style={[styles.directionIndicator, { borderTopColor: statusColor }]} />
        )}
      </View>
    </Marker>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.driver.id === nextProps.driver.id &&
    prevProps.driver.lat === nextProps.driver.lat &&
    prevProps.driver.lng === nextProps.driver.lng &&
    prevProps.driver.status === nextProps.driver.status &&
    prevProps.driver.speed === nextProps.driver.speed
  );
});

DriverMarker.displayName = 'DriverMarker';

const styles = StyleSheet.create({
  markerWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    opacity: 0.6,
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
  },
  markerContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderRadius: 30,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusIconBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  statusIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
  },
  speedBadge: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    marginLeft: -30,
    minWidth: 60,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  speedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  speedUnit: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
    marginTop: -2,
  },
  directionIndicator: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -3,
  },
});

export default DriverMarker;

