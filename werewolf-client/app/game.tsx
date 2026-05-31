import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

// Tự động lấy IP của máy chạy Expo để trỏ vào server cùng mạng LAN
function getServerUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3000`;
  }
  return 'http://192.168.1.7:3000'; // fallback
}

const SERVER_URL = getServerUrl();

export default function App() {
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorIcon}>🐺</Text>
          <Text style={styles.errorTitle}>Không thể kết nối Server</Text>
          <Text style={styles.errorMsg}>{SERVER_URL}</Text>
          <Text style={styles.errorHint}>
            Đảm bảo server đang chạy:{'\n'}
            {'  '}cd werewolf-server{'\n'}
            {'  '}npm start
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setError(false); setLoading(true); webRef.current?.reload(); }}
          >
            <Text style={styles.retryBtnText}>↺  Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: SERVER_URL }}
          style={styles.webview}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          onHttpError={() => { setLoading(false); setError(true); }}
          // Cho phép media (micro WebRTC)
          mediaCapturePermissionGrantType="grant"
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          // Giả mạo User-Agent desktop để tránh trang web hiển thị mobile layout lỗi
          applicationNameForUserAgent="WerewolfUIT/1.0"
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
        />
      )}

      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingIcon}>🐺</Text>
          <ActivityIndicator size="large" color="#c0a060" style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>Đang vào Ngôi Làng...</Text>
          <Text style={styles.loadingUrl}>{SERVER_URL}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  webview: { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0208',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: { fontSize: 72 },
  loadingText: { color: '#c0a060', fontSize: 18, fontWeight: 'bold', marginTop: 16 },
  loadingUrl: { color: '#555', fontSize: 12, marginTop: 8 },

  errorBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0a0208',
  },
  errorIcon: { fontSize: 72, marginBottom: 16 },
  errorTitle: { color: '#ff4444', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  errorMsg: { color: '#ff8a65', fontSize: 14, marginBottom: 16, fontFamily: 'monospace' },
  errorHint: { color: '#666', fontSize: 13, textAlign: 'left', lineHeight: 22, backgroundColor: '#111', padding: 16, borderRadius: 8, marginBottom: 24, fontFamily: 'monospace' },
  retryBtn: { backgroundColor: '#c0a060', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12 },
  retryBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
