import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import { router } from 'expo-router';
// import useGameStore from '../../src/stores/gameStore'; 
// import SocketManager from '../../src/services/SocketManager';

export default function CharacterEditScreen() {
    const [gender, setGender] = useState('MALE'); 
    const [bodyColor, setBodyColor] = useState('#ffdbac'); 
    const [outfitColor, setOutfitColor] = useState('#3c5e8b'); 
    const [headgearColor, setHeadgearColor] = useState('#8b4513'); 

    const handleSave = () => {
        const appearance = {
            gender,
            bodyColor,
            outfitColor,
            headgearColor
        };
        // TODO: useGameStore.getState().setPersonalAppearance(appearance);
        // TODO: SocketManager.emit('action:UPDATE_APPEARANCE', appearance);
        alert('Đã lưu Skin cá nhân!');
        router.back();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                     <Text style={styles.backBtn}>{'< BẢN ĐỒ'}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>CHARACTER EDIT</Text>
                <View style={{width: 50}} />
            </View>

            <View style={styles.content}>
                {/* Lớp hiển thị 2.5D (Color Box Mockup) */}
                <View style={styles.previewColumn}>
                    {/* Bouncing Animation để Game sinh động */}
                    <MotiView
                       from={{ translateY: 0, scaleY: 1 }}
                       animate={{ translateY: -15, scaleY: 0.95 }}
                       transition={{ type: 'timing', duration: 800, loop: true }}
                       style={styles.mockupContainer}
                    >
                        {/* 1. Base Body Layer */}
                        <View style={[
                            styles.baseBody, 
                            { 
                                backgroundColor: bodyColor,
                                borderRadius: gender === 'FEMALE' ? 60 : 20 // Bo tròn vóc dáng Nữ
                            }]} 
                        >
                            {/* 2. Outfit Layer (Hình thang ảo bằng border) */}
                            <View style={[styles.outfitLayer, { borderBottomColor: outfitColor }]} />
                            
                            {/* 3. Headgear Layer */}
                            <View style={[styles.headgearLayer, { backgroundColor: headgearColor }]} />
                        </View>
                        
                        <View style={styles.shadowBase} />
                    </MotiView>
                </View>

                {/* Bảng điều khiển màu sắc bên phải */}
                <ScrollView style={styles.controlColumn}>
                    <Text style={styles.label}>GENDER (GIỚI TÍNH)</Text>
                    <View style={styles.row}>
                        <TouchableOpacity 
                            style={[styles.btn, gender === 'MALE' && styles.activeBtn]} 
                            onPress={() => setGender('MALE')}
                        >
                            <Text style={styles.btnText}>NAM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.btn, gender === 'FEMALE' && styles.activeBtn]} 
                            onPress={() => setGender('FEMALE')}
                        >
                            <Text style={styles.btnText}>NỮ</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>SKIN TINT (MÀU DA)</Text>
                    <View style={styles.row}>
                        {['#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#c68642'].map(color => (
                            <TouchableOpacity key={color} style={[styles.colorBox, { backgroundColor: color }]} onPress={() => setBodyColor(color)} />
                        ))}
                    </View>

                    <Text style={styles.label}>OUTFIT LAYER (TRANG PHỤC)</Text>
                    <View style={styles.row}>
                        {['#3c5e8b', '#8b0000', '#2e8b57', '#4b0082', '#fff'].map(color => (
                            <TouchableOpacity key={color} style={[styles.colorBox, { backgroundColor: color }]} onPress={() => setOutfitColor(color)} />
                        ))}
                    </View>
                    
                    <Text style={styles.label}>HEADGEAR (MŨ/TÓC)</Text>
                    <View style={styles.row}>
                        {['#8b4513', '#d2b48c', '#000', '#ff0000', '#eee'].map(color => (
                            <TouchableOpacity key={color} style={[styles.colorBox, { backgroundColor: color }]} onPress={() => setHeadgearColor(color)} />
                        ))}
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>LƯU & ĐỒNG BỘ MẠNG</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d1117' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        padding: 20, paddingTop: 50, backgroundColor: '#161b22',
        borderBottomWidth: 1, borderColor: '#30363d'
    },
    title: { color: '#c9d1d9', fontSize: 18, fontWeight: 'bold' },
    backBtn: { color: '#58a6ff', fontSize: 16, fontWeight: 'bold' },
    content: { flex: 1, flexDirection: 'row' },
    
    // Cột Preview Mockup
    previewColumn: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#30363d' },
    mockupContainer: { width: 150, height: 200, alignItems: 'center', position: 'relative' },
    shadowBase: {
        width: 120, height: 30, backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 50, position: 'absolute', bottom: -15, zIndex: 1
    },
    baseBody: {
        width: 120, height: 180, zIndex: 2, position: 'relative',
        overflow: 'hidden', alignItems: 'center'
    },
    outfitLayer: {
        position: 'absolute', bottom: 0,
        // Dùng CSS Border Trick vẽ áo hình thang
        width: 0, height: 0, borderLeftWidth: 60, borderRightWidth: 60,
        borderBottomWidth: 100,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
    },
    headgearLayer: {
        position: 'absolute', top: -10,
        width: 140, height: 60, borderRadius: 30
    },

    // Cột Settings
    controlColumn: { flex: 1, padding: 30 },
    label: { color: '#8b949e', fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 20 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    btn: {
        paddingVertical: 10, paddingHorizontal: 20,
        borderRadius: 8, borderWidth: 1, borderColor: '#30363d', backgroundColor: '#21262d'
    },
    activeBtn: { borderColor: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.1)' },
    btnText: { color: '#c9d1d9', fontWeight: 'bold' },
    colorBox: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#30363d' },
    saveBtn: {
        marginTop: 50, backgroundColor: '#238636',
        paddingVertical: 15, borderRadius: 10, alignItems: 'center'
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
