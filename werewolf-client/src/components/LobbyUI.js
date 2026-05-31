import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import useGameStore from '../stores/gameStore';
import SocketManager from '../services/SocketManager';
import AvatarIcon from './AvatarIcon';

export default function LobbyUI() {
    const { players, roomId, hostId, localPlayerId } = useGameStore();

    const handleStartGame = () => {
        SocketManager.emit('action:START_GAME', {});
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>PHÒNG CHỜ</Text>
                <View style={styles.roomBadge}>
                    <Text style={styles.roomCodeLabel}>MÃ PHÒNG:</Text>
                    <Text style={styles.roomCode}>{roomId}</Text>
                </View>
            </View>

            <View style={styles.playerListContainer}>
                <Text style={styles.playerCount}>
                    Người chơi: {Object.keys(players).length}/20
                </Text>
                <FlatList 
                    data={Object.values(players)}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.playerRow}>
                            <View style={styles.playerInfo}>
                                <View style={styles.avatarWrapper}>
                                    <AvatarIcon appearance={item.appearance} size={40} />
                                </View>
                                <Text style={[styles.playerName, item.id === localPlayerId && styles.localPlayer]}>
                                    {item.name}
                                </Text>
                                {item.id === hostId && (
                                    <FontAwesome5 name="crown" size={14} color="#ffd700" style={{ marginLeft: 8 }} />
                                )}
                            </View>
                            {item.isOffline && <Text style={styles.offlineTag}>Offline</Text>}
                        </View>
                    )}
                />
            </View>

            {localPlayerId === hostId ? (
                <TouchableOpacity style={styles.startBtn} onPress={handleStartGame}>
                    <Text style={styles.startBtnText}>BẮT ĐẦU GAME</Text>
                </TouchableOpacity>
            ) : (
                <View style={[styles.startBtn, { backgroundColor: '#555' }]}>
                    <Text style={styles.startBtnText}>CHỜ CHỦ PHÒNG BẮT ĐẦU...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#ff4444',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
        marginBottom: 10,
    },
    roomBadge: {
        backgroundColor: '#1f2e46',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#58a6ff',
        alignItems: 'center',
    },
    roomCodeLabel: {
        color: '#8b949e',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    roomCode: {
        color: '#ffffff',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 4,
    },
    playerListContainer: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'rgba(22, 27, 34, 0.8)',
        borderRadius: 12,
        padding: 15,
        maxHeight: '40%',
        marginBottom: 30,
    },
    playerCount: {
        color: '#c9d1d9',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#30363d',
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarWrapper: {
        width: 40,
        height: 40,
        marginRight: 12,
    },
    playerName: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    localPlayer: {
        color: '#58a6ff',
    },
    offlineTag: {
        color: '#ff4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    startBtn: {
        backgroundColor: '#238636',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 12,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#238636',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    startBtnText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
