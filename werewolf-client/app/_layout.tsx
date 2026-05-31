import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

function getServerUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `http://${hostUri.split(':')[0]}:3000`;
  }
  return 'http://192.168.1.7:3000';
}

export default function RootApp() {
  const [loading, setLoading] = React.useState(true);
  const url = getServerUrl();

  // Trên web browser: redirect thẳng sang localhost:3000, không cần WebView
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.location.replace(url);
    }
  }, []);

  // Web platform: chỉ hiện màn loading rồi tự redirect
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.loader, { flex: 1 }]}>
        <Text style={{ fontSize: 64 }}>🐺</Text>
        <ActivityIndicator size="large" color="#c0a060" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Đang chuyển hướng...</Text>
        <Text style={styles.urlText}>{url}</Text>
      </View>
    );
  }

  // Native (Android/iOS): dùng WebView để hiện game trong app
  return (
    <View style={{ flex: 1, backgroundColor: '#0a0208' }}>
      <StatusBar style="light" hidden />
      <WebView
        source={{ uri: url }}
        style={{ flex: 1 }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        mediaCapturePermissionGrantType="grant"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        applicationNameForUserAgent="WerewolfUIT/1.0"
        // Tắt zoom gesture để cảm giác như native app
        scalesPageToFit={false}
        bounces={false}
        overScrollMode="never"
      />
      {loading && (
        <View style={[StyleSheet.absoluteFillObject, styles.loader]}>
          <Text style={{ fontSize: 64 }}>🐺</Text>
          <ActivityIndicator size="large" color="#c0a060" style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>Đang vào Ngôi Làng...</Text>
          <Text style={styles.urlText}>{url}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    backgroundColor: '#0a0208',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#c0a060',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  urlText: {
    color: '#555',
    fontSize: 11,
    marginTop: 8,
    fontFamily: 'monospace',
  }
});
