import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import useGameStore from '../../src/stores/gameStore';
import AvatarIcon from '../../src/components/AvatarIcon';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function CharacterEditScreen() {
    const localApp = useGameStore(state => state.localPlayerAppearance);
    
    const [gender, setGender] = useState(localApp?.gender || 'MALE'); 
    const [bodyColor, setBodyColor] = useState(localApp?.bodyColor || '#ffdbac'); 
    const [outfitColor, setOutfitColor] = useState(localApp?.outfitColor || '#3c5e8b'); 
    const [headgearColor, setHeadgearColor] = useState(localApp?.headgearColor || '#8b4513'); 
    const [outfitType, setOutfitType] = useState(localApp?.outfitType || 'TSHIRT');
    const [headgearType, setHeadgearType] = useState(localApp?.headgearType || 'HAIR');

    const handleSave = () => {
        const appearance = {
            gender,
            bodyColor,
            outfitColor,
            headgearColor,
            outfitType,
            headgearType
        };
        useGameStore.getState().setLocalAppearance(appearance);
        alert('Đã lưu Skin cá nhân!');
        router.back();
    };

    const appearance = { gender, bodyColor, outfitColor, headgearColor, outfitType, headgearType };

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
                {/* Lớp hiển thị 2.5D (AvatarIcon) */}
                <View style={styles.previewColumn}>
                    {/* Bouncing Animation để Game sinh động */}
                    <MotiView
                       from={{ translateY: 0, scaleY: 1 }}
                       animate={{ translateY: -15, scaleY: 0.95 }}
                       transition={{ type: 'timing', duration: 800, loop: true }}
                       style={styles.mockupContainer}
                    >
                        <AvatarIcon appearance={appearance} size={150} />
                        <View style={styles.shadowBase} />
                    </MotiView>
                </View>

                {/* Bảng điều khiển màu sắc và loại phụ kiện bên phải */}
                <ScrollView style={styles.controlColumn} showsVerticalScrollIndicator={false}>
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
                        {['#ffdbac', '#f1c27d', '#e0ac69', '#8d5524', '#4a2f1d'].map(color => (
                            <TouchableOpacity key={color} style={[styles.colorBox, { backgroundColor: color }, bodyColor === color && styles.activeColorBox]} onPress={() => setBodyColor(color)} />
                        ))}
                    </View>

                    <Text style={styles.label}>OUTFIT (KIỂU TRANG PHỤC)</Text>
                    <View style={styles.row}>
                        {['TSHIRT', 'SUIT', 'HOODIE', 'ARMOR'].map(type => (
                            <TouchableOpacity key={type} style={[styles.btnType, outfitType === type && styles.activeBtn]} onPress={() => setOutfitType(type)}>
                                <Text style={styles.btnTextSmall}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>OUTFIT COLOR (MÀU ÁO)</Text>
                    <View style={styles.row}>
                        {['#3c5e8b', '#8b0000', '#2e8b57', '#4b0082', '#ffaa00', '#333333'].map(color => (
                            <TouchableOpacity key={color} style={[styles.colorBox, { backgroundColor: color }, outfitColor === color && styles.activeColorBox]} onPress={() => setOutfitColor(color)} />
                        ))}
                    </View>
                    
                    <Text style={styles.label}>HEADGEAR (KIỂU PHỤ KIỆN)</Text>
                    <View style={styles.row}>
                        {['HAIR', 'HAT', 'CAP', 'GLASSES', 'MASK', 'CROWN'].map(type => (
                            <TouchableOpacity key={type} style={[styles.btnType, headgearType === type && styles.activeBtn]} onPress={() => setHeadgearType(type)}>
                                <Text style={styles.btnTextSmall}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>HEADGEAR COLOR (MÀU PHỤ KIỆN)</Text>
                    <View style={styles.row}>
                        {['#8b4513', '#d2b48c', '#111111', '#ff3333', '#dddddd', '#228822'].map(color => (
                            <TouchableOpacity key={color} style={[styles.colorBox, { backgroundColor: color }, headgearColor === color && styles.activeColorBox]} onPress={() => setHeadgearColor(color)} />
                        ))}
                    </View>

                    <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                        <Text style={styles.saveBtnText}>LƯU & ĐỒNG BỘ MẠNG</Text>
                    </TouchableOpacity>
                    
                    <View style={{height: 50}} />
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
    previewColumn: { flex: 0.8, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: '#30363d' },
    mockupContainer: { width: 150, height: 200, alignItems: 'center', position: 'relative' },
    shadowBase: {
        width: 100, height: 20, backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 50, position: 'absolute', bottom: 10, zIndex: -1
    },

    // Cột Settings
    controlColumn: { flex: 1.2, padding: isSmallScreen ? 15 : 30 },
    label: { color: '#8b949e', fontSize: 11, fontWeight: 'bold', marginBottom: 10, marginTop: 15 },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    btn: {
        paddingVertical: 10, paddingHorizontal: 20,
        borderRadius: 8, borderWidth: 1, borderColor: '#30363d', backgroundColor: '#21262d'
    },
    btnType: {
        paddingVertical: 8, paddingHorizontal: 12,
        borderRadius: 6, borderWidth: 1, borderColor: '#30363d', backgroundColor: '#161b22'
    },
    activeBtn: { borderColor: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.15)' },
    btnText: { color: '#c9d1d9', fontWeight: 'bold' },
    btnTextSmall: { color: '#c9d1d9', fontSize: 12, fontWeight: 'bold' },
    colorBox: { width: 35, height: 35, borderRadius: 18, borderWidth: 2, borderColor: '#30363d' },
    activeColorBox: { borderColor: '#58a6ff', borderWidth: 3 },
    saveBtn: {
        marginTop: 40, backgroundColor: '#238636',
        paddingVertical: 15, borderRadius: 10, alignItems: 'center',
        shadowColor: '#2ea043', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
