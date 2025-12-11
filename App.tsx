import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import ErrorBoundary from './components/ErrorBoundary';
import MapViewComponent from './components/MapView';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <MapViewComponent />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

