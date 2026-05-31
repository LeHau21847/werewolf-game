import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
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

export default function Index() {
  const [loading, setLoading] = React.useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0208' }}>
      <StatusBar style="light" hidden />
      <WebView
        source={{ uri: getServerUrl() }}
        style={{ flex: 1 }}
        onLoadEnd={() => setLoading(false)}
        mediaCapturePermissionGrantType="grant"
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
      />
      {loading && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0a0208', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 60 }}>🐺</Text>
          <ActivityIndicator size="large" color="#c0a060" style={{ marginTop: 16 }} />
          <Text style={{ color: '#c0a060', marginTop: 12, fontWeight: 'bold', fontSize: 16 }}>
            Đang vào Ngôi Làng...
          </Text>
        </View>
      )}
    </View>
  );
}
