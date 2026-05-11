import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import CampfireLayout from '../src/components/CampfireLayout';
import useGameStore from '../src/stores/gameStore';

export default function GameScreen() {
    const isConnected = useGameStore(state => state.isConnected);

    return (
        <View style={styles.container}>
            {/* Hiệu ứng Fade In kết hợp Scale nhẹ từ dưới lên tạo cảm giác "Bước vào rừng" */}
            <MotiView
                from={{ opacity: 0, scale: 1.1, translateY: 30 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 2500 }}
                style={StyleSheet.absoluteFillObject}
            >
                {/* 2.5D Ring */}
                <CampfireLayout />
            </MotiView>

            {/* Offline Shield: Lớp phủ chống văng */}
            {!isConnected && (
               <View style={styles.offlineOverlay}>
                   <ActivityIndicator size="large" color="#ff4444" />
                   <Text style={styles.offlineText}>Đang kết nối lại với rừng sâu...</Text>
               </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    offlineOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(5, 5, 5, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    },
    offlineText: {
        color: '#ff4444',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5
    }
});
