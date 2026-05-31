import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Rect, Path, G, Ellipse, Defs, ClipPath } from 'react-native-svg';

export default function AvatarIcon({ appearance, size = 100 }) {
    const gender = appearance?.gender || 'MALE';
    const bodyColor = appearance?.bodyColor || '#ffdbac';
    const outfitColor = appearance?.outfitColor || '#3c5e8b';
    const headgearColor = appearance?.headgearColor || '#8b4513';
    const outfitType = appearance?.outfitType || 'TSHIRT';
    const headgearType = appearance?.headgearType || 'HAIR';
    
    const isFemale = gender === 'FEMALE';
    const baseHairColor = headgearType === 'HAIR' ? headgearColor : '#2c3e50';

    return (
        <View style={{ 
            width: size, 
            height: size, 
            borderRadius: size / 2, 
            backgroundColor: '#1a1d24', 
            borderWidth: 2, 
            borderColor: '#30363d',
            overflow: 'hidden',
            alignItems: 'center', 
            justifyContent: 'center' 
        }}>
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
                {/* --- BACK HAIR (FEMALE) --- */}
                {isFemale && (
                    <Path d="M 25 40 Q 15 75 30 90 L 70 90 Q 85 75 75 40 Z" fill={baseHairColor} />
                )}

                {/* --- BODY / CLOTHES --- */}
                <G id="body-group">
                    {/* Base Neck */}
                    <Rect x="40" y="55" width="20" height="25" fill={bodyColor} />
                    <Rect x="40" y="58" width="20" height="6" fill="#000" opacity="0.15" />

                    {/* Shoulders / Torso */}
                    {outfitType === 'TSHIRT' && (
                        <G>
                            <Path d="M 15 100 L 20 75 Q 35 60 50 60 Q 65 60 80 75 L 85 100 Z" fill={outfitColor} />
                            {/* Collar */}
                            <Path d="M 38 63 Q 50 78 62 63 Z" fill={bodyColor} />
                            <Path d="M 38 63 Q 50 78 62 63" fill="none" stroke="#111" strokeWidth="2" opacity="0.3" />
                        </G>
                    )}

                    {outfitType === 'SUIT' && (
                        <G>
                            {/* Jacket Base */}
                            <Path d="M 15 100 L 20 75 Q 35 60 50 60 Q 65 60 80 75 L 85 100 Z" fill={outfitColor} />
                            {/* Inner Shirt */}
                            <Path d="M 40 60 L 50 85 L 60 60 Z" fill="#ffffff" />
                            {/* Tie */}
                            <Path d="M 47 68 L 53 68 L 50 95 Z" fill="#cc0000" />
                            {/* Lapels */}
                            <Path d="M 40 60 L 46 80 L 30 100 Z" fill="#111" opacity="0.3" />
                            <Path d="M 60 60 L 54 80 L 70 100 Z" fill="#111" opacity="0.3" />
                        </G>
                    )}

                    {outfitType === 'HOODIE' && (
                        <G>
                            <Path d="M 12 100 L 15 70 Q 30 55 50 55 Q 70 55 85 70 L 88 100 Z" fill={outfitColor} />
                            {/* Hoodie Strings */}
                            <Path d="M 42 65 L 42 85" fill="none" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
                            <Path d="M 58 65 L 58 85" fill="none" stroke="#ddd" strokeWidth="2" strokeLinecap="round" />
                            {/* Pocket */}
                            <Path d="M 30 85 L 70 85 L 75 100 L 25 100 Z" fill="#000" opacity="0.1" />
                        </G>
                    )}

                    {outfitType === 'ARMOR' && (
                        <G>
                            <Path d="M 15 100 L 20 70 Q 35 60 50 60 Q 65 60 80 70 L 85 100 Z" fill="#7f8c8d" />
                            {/* Chest Plate */}
                            <Path d="M 25 75 L 75 75 L 65 95 L 35 95 Z" fill="#95a5a6" />
                            {/* Core Crystal */}
                            <Circle cx="50" cy="85" r="5" fill="#3498db" />
                            <Circle cx="50" cy="85" r="2" fill="#e0f7fa" />
                            {/* Shoulder Pads */}
                            <Path d="M 10 85 L 20 70 L 25 75 L 12 90 Z" fill="#bdc3c7" />
                            <Path d="M 90 85 L 80 70 L 75 75 L 88 90 Z" fill="#bdc3c7" />
                        </G>
                    )}
                </G>

                {/* --- HEAD --- */}
                <G id="head-group">
                    {/* Face Shape */}
                    {isFemale ? (
                        <Path d="M 28 35 Q 28 10 50 10 Q 72 10 72 35 Q 72 55 50 65 Q 28 55 28 35 Z" fill={bodyColor} />
                    ) : (
                        <Path d="M 28 30 Q 28 10 50 10 Q 72 10 72 30 L 72 45 Q 72 62 50 62 Q 28 62 28 45 Z" fill={bodyColor} />
                    )}
                    
                    {/* Ears */}
                    <Circle cx="26" cy="40" r="5" fill={bodyColor} />
                    <Circle cx="74" cy="40" r="5" fill={bodyColor} />
                    {/* Ear shadows */}
                    <Circle cx="26" cy="40" r="3" fill="#000" opacity="0.1" />
                    <Circle cx="74" cy="40" r="3" fill="#000" opacity="0.1" />

                    {/* Eyes */}
                    {isFemale ? (
                        <G>
                            {/* Eyelashes */}
                            <Path d="M 33 36 Q 38 33 43 36" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                            <Path d="M 57 36 Q 62 33 67 36" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
                            <Circle cx="38" cy="38" r="4.5" fill="#111" />
                            <Circle cx="62" cy="38" r="4.5" fill="#111" />
                        </G>
                    ) : (
                        <G>
                            <Circle cx="38" cy="37" r="4" fill="#111" />
                            <Circle cx="62" cy="37" r="4" fill="#111" />
                        </G>
                    )}

                    {/* Eye Catchlights (Anime style sparkle) */}
                    <Circle cx="39" cy="36" r="1.5" fill="#fff" />
                    <Circle cx="63" cy="36" r="1.5" fill="#fff" />

                    {/* Cheeks */}
                    <Ellipse cx="32" cy="45" rx="5" ry="3" fill="#ff7b7b" opacity="0.4" />
                    <Ellipse cx="68" cy="45" rx="5" ry="3" fill="#ff7b7b" opacity="0.4" />

                    {/* Mouth */}
                    {isFemale ? (
                        <Path d="M 46 52 Q 50 56 54 52" fill="none" stroke="#ff5c5c" strokeWidth="2.5" strokeLinecap="round" />
                    ) : (
                        <Path d="M 45 52 L 55 52" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round" />
                    )}

                    {/* Nose */}
                    <Path d="M 50 43 L 48 47 L 50 47" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.15" />
                </G>

                {/* --- FRONT HAIR (Always rendered to avoid baldness) --- */}
                <G id="front-hair">
                    {isFemale ? (
                        <Path d="M 27 30 Q 30 10 50 8 Q 70 10 73 30 Q 65 15 50 18 Q 35 15 27 30 Z" fill={baseHairColor} />
                    ) : (
                        <Path d="M 26 30 Q 28 5 50 5 Q 72 5 74 30 L 76 25 Q 74 2 50 2 Q 26 2 24 25 Z" fill={baseHairColor} />
                    )}
                    {/* Bangs */}
                    {isFemale ? (
                        <Path d="M 28 20 Q 40 28 50 20 Q 60 28 72 20 Q 65 5 50 8 Q 35 5 28 20 Z" fill={baseHairColor} />
                    ) : (
                        <Path d="M 26 15 Q 40 25 50 15 Q 60 25 74 15 Q 65 5 50 5 Q 35 5 26 15 Z" fill={baseHairColor} />
                    )}
                </G>

                {/* --- ACCESSORIES / HEADGEAR --- */}
                <G id="accessories">
                    {headgearType === 'HAT' && (
                        <G>
                            {/* Brim */}
                            <Ellipse cx="50" cy="18" rx="35" ry="8" fill={headgearColor} />
                            <Ellipse cx="50" cy="17" rx="35" ry="8" fill="#000" opacity="0.2" />
                            {/* Top Cone */}
                            <Path d="M 32 15 L 45 -5 L 55 -5 L 68 15 Z" fill={headgearColor} />
                            <Path d="M 32 15 L 68 15 L 68 12 L 32 12 Z" fill="#222" opacity="0.6" />
                        </G>
                    )}

                    {headgearType === 'CAP' && (
                        <G>
                            {/* Dome */}
                            <Path d="M 28 18 Q 50 -2 72 18 Z" fill={headgearColor} />
                            {/* Visor */}
                            <Path d="M 24 16 Q 50 28 85 16 L 82 12 Q 50 22 26 12 Z" fill={headgearColor} />
                            {/* Button */}
                            <Circle cx="50" cy="7" r="2.5" fill="#111" opacity="0.5" />
                        </G>
                    )}

                    {headgearType === 'GLASSES' && (
                        <G transform="translate(0, 0)">
                            {/* Left Lens */}
                            <Rect x="28" y="32" width="18" height="12" rx="3" fill="none" stroke={headgearColor} strokeWidth="3" />
                            <Rect x="30" y="34" width="14" height="8" rx="2" fill="#fff" opacity="0.25" />
                            {/* Right Lens */}
                            <Rect x="54" y="32" width="18" height="12" rx="3" fill="none" stroke={headgearColor} strokeWidth="3" />
                            <Rect x="56" y="34" width="14" height="8" rx="2" fill="#fff" opacity="0.25" />
                            {/* Bridge */}
                            <Path d="M 46 36 Q 50 34 54 36" fill="none" stroke={headgearColor} strokeWidth="3" />
                            {/* Stems */}
                            <Path d="M 26 36 L 28 36" fill="none" stroke={headgearColor} strokeWidth="3" />
                            <Path d="M 74 36 L 72 36" fill="none" stroke={headgearColor} strokeWidth="3" />
                        </G>
                    )}

                    {headgearType === 'MASK' && (
                        <G>
                            <Path d="M 28 48 Q 50 42 72 48 L 70 60 Q 50 68 30 60 Z" fill={headgearColor} />
                            <Path d="M 28 48 L 24 45" stroke={headgearColor} strokeWidth="2" />
                            <Path d="M 72 48 L 76 45" stroke={headgearColor} strokeWidth="2" />
                            {/* Mask folds */}
                            <Path d="M 32 52 L 68 52" stroke="#000" strokeWidth="1" opacity="0.2" />
                            <Path d="M 34 56 L 66 56" stroke="#000" strokeWidth="1" opacity="0.2" />
                        </G>
                    )}

                    {headgearType === 'CROWN' && (
                        <G>
                            <Path d="M 25 15 L 20 -2 L 35 8 L 50 -5 L 65 8 L 80 -2 L 75 15 Z" fill="#ffd700" />
                            {/* Jewels */}
                            <Circle cx="20" cy="0" r="2.5" fill="#ff0000" />
                            <Circle cx="35" cy="10" r="2.5" fill="#00ff00" />
                            <Circle cx="50" cy="-3" r="3" fill="#00ffff" />
                            <Circle cx="65" cy="10" r="2.5" fill="#ff00ff" />
                            <Circle cx="80" cy="0" r="2.5" fill="#ff0000" />
                            {/* Base Band */}
                            <Rect x="26" y="11" width="48" height="4" fill="#d4af37" />
                        </G>
                    )}
                </G>
            </Svg>
        </View>
    );
}
