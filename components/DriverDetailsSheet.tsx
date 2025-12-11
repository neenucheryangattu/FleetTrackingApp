import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { DriverDetailsSheetProps, DriverDetailsSheetRef, Driver } from '../types';

const DriverDetailsSheet = forwardRef<DriverDetailsSheetRef, DriverDetailsSheetProps>(
  ({ driver, onClose }, ref) => {
    const [visible, setVisible] = useState(false);

    useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => {
        setVisible(true);
      },
      close: () => {
        setVisible(false);
        onClose();
      },
    }));

    useEffect(() => {
      if (driver) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }, [driver]);

    const handleClose = () => {
      setVisible(false);
      onClose();
    };

    if (!driver) {
      return null;
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active':
          return '#4CAF50';
        case 'idle':
          return '#FF9800';
        case 'offline':
          return '#9E9E9E';
        default:
          return '#9E9E9E';
      }
    };

    const formatSpeed = (speed: number) => {
      return `${speed.toFixed(1)} km/h`;
    };

    const formatTimestamp = (timestamp: number) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    };
    const last10Locations = driver.routeHistory?.slice(0, 10) || [];

    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.header}>
                  <Text style={styles.title}>{driver.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status) }]}>
                    <Text style={styles.statusText}>{driver.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.details}>
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Current Speed:</Text>
                    <Text style={styles.value}>{formatSpeed(driver.speed)}</Text>
                  </View>

                  {/* Current Location */}
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Current Location:</Text>
                    <Text style={styles.value}>
                      {driver.lat.toFixed(6)}, {driver.lng.toFixed(6)}
                    </Text>
                  </View>
                  {driver.city && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>City:</Text>
                      <Text style={styles.value}>{driver.city}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Route History (Last {last10Locations.length} locations)
                  </Text>
                  
                  <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
                    {last10Locations.length > 0 ? (
                      <View style={styles.routeList}>
                        {last10Locations.map((location, index) => (
                          <View key={index} style={styles.routeItem}>
                            <View style={styles.routeItemHeader}>
                              <Text style={styles.routeIndex}>#{index + 1}</Text>
                              <Text style={styles.routeTime}>
                                {formatTimestamp(location.timestamp)}
                              </Text>
                            </View>
                            <Text style={styles.routeCoordinates}>
                              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noRouteText}>No route history available</Text>
                    )}
                  </ScrollView>
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }
);

DriverDetailsSheet.displayName = 'DriverDetailsSheet';

export default DriverDetailsSheet;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  scrollView: {
    maxHeight: 250,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 5,
  },
  label: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  routeList: {
  },
  routeItem: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  routeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  routeTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  routeCoordinates: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'monospace',
  },
  noRouteText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  closeButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

