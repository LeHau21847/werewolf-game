import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ImageBackground } from 'react-native';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import useGameStore from '../../src/stores/gameStore';
import SocketManager from '../../src/services/SocketManager';

export default function MainScreen() {
    const [ipAddress, setIpAddress] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const handleJoinRoom = () => {
        setIsConnecting(true);
        // Fallback localhost:3000 nếu để trống
        const targetIp = ipAddress.trim() === '' ? 'http://localhost:3000' : 
                         ipAddress.startsWith('http') ? ipAddress : `http://${ipAddress}`;
        
        SocketManager.connect(targetIp);
        
        // Timeout chờ connect thành công (Mock flow)
        setTimeout(() => {
            const playerId = 'player_' + Math.floor(Math.random() * 1000);
            const appearance = useGameStore.getState().localPlayerAppearance;
            
            SocketManager.emit('JOIN_ROOM', { 
                roomId: 'ROOM_1', 
                playerId, 
                playerName: `Sói ${playerId.slice(-3)}`,
                appearance: appearance // Gửi Appearance lên Server khi cấu trúc socket sẵn sàng
            });

            // Chuyển Data Mock vào Store nếu chạy mode UI test
            useGameStore.getState().seedMockPlayers();
            
            // Push Fade Transition sang Game
            router.push('/game');
            setIsConnecting(false);
        }, 800);
    };

    return (
        <ImageBackground source={require('../../assets/images/lobby_bg.png')} style={styles.container} resizeMode="cover">
            {/* Fade in Transition (Mở bài ấn tượng) */}
            <MotiView 
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 1500 }}
                style={styles.menuBox}
            >
                <Text style={styles.gameTitle}>WEREWOLF UIT</Text>
                <Text style={styles.subtitle}>Dark Forest Edition 2.5D</Text>

                <View style={[styles.inputWrapper, isFocused && styles.inputFocused]}>
                    <Text style={styles.inputLabel}>SERVER IP (LAN):</Text>
                    <TextInput 
                        style={styles.input}
                        placeholder="Bỏ trống = localhost:3000"
                        placeholderTextColor="#666"
                        value={ipAddress}
                        onChangeText={setIpAddress}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.joinBtn} 
                    onPress={handleJoinRoom}
                    disabled={isConnecting}
                >
                    <Text style={styles.joinBtnText}>
                        {isConnecting ? 'ĐANG KẾT NỐI SERVER...' : 'VÀO PHÒNG (START)'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(menu)/edit')}>
                    <Text style={styles.secondaryBtnText}>CHỈNH NHÂN VẬT</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.ghostBtn}>
                    <Text style={styles.ghostBtnText}>HƯỚNG DẪN CHƠI</Text>
                </TouchableOpacity>
            </MotiView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuBox: {
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
    },
    gameTitle: {
        fontSize: 42,
        fontWeight: '900',
        color: '#ff4444',
        textShadowColor: 'rgba(255, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
        marginBottom: 5,
        letterSpacing: 2
    },
    subtitle: {
        color: '#8b949e',
        fontSize: 16,
        marginBottom: 40,
        fontStyle: 'italic',
    },
    inputWrapper: {
        width: '100%',
        backgroundColor: '#161b22',
        borderWidth: 2,
        borderColor: '#30363d',
        borderRadius: 12,
        padding: 15,
        marginBottom: 25,
    },
    inputFocused: {
        borderColor: '#58a6ff',
        shadowColor: '#58a6ff',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
        elevation: 5
    },
    inputLabel: {
        color: '#8b949e',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        color: '#c9d1d9',
        fontSize: 16,
        fontWeight: '500',
    },
    joinBtn: {
        width: '100%',
        backgroundColor: '#238636',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
    },
    joinBtnText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    secondaryBtn: {
        width: '100%',
        backgroundColor: '#1f2e46',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#58a6ff'
    },
    secondaryBtnText: {
        color: '#58a6ff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    ghostBtn: {
        marginTop: 10,
        padding: 10,
    },
    ghostBtnText: {
        color: '#6e7681',
        fontSize: 14,
        textDecorationLine: 'underline'
    }
});
