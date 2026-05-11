import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { MotiView, MotiImage } from 'moti';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Tính tọa độ trung tâm màn hình (Cần trừ đi kích thước 1 nửa của Avatar để vào đúng tâm)
const CENTER_X = width / 2 - 50; 
const CENTER_Y = height / 2 - 50;

/**
 * ExecutionCinema
 * @param {Object} player - Thông tin người bị xử tử
 * @param {number} sourceX - Tọa độ X tuyệt đối ban đầu của khung Avatar trên hình Elip
 * @param {number} sourceY - Tọa độ Y tuyệt đối ban đầu của khung Avatar trên hình Elip
 * @param {Function} onFinish - Callback khi hoàn thành chuỗi Cinematic
 */
const ExecutionCinema = ({ player, sourceX, sourceY, onFinish }) => {
  const [step, setStep] = useState('FLY_TO_CENTER'); // FLY_TO_CENTER | SHOCK | DISSOLVE

  useEffect(() => {
    // 2s đầu: Rung liên tục tạo kịch tính lúc Avatar bay ra tâm
    const hapticInterval = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 400);

    const shockTimer = setTimeout(() => {
      clearInterval(hapticInterval);
      setStep('SHOCK');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 2000); // Sau 2s -> show Text Death + Role

    const dissolveTimer = setTimeout(() => {
      setStep('DISSOLVE');
    }, 5000); // 2s bay + 3s chiếu thông báo -> hóa Bia Mộ

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 6000); // 5s + 1s bia mộ => Hoàn tất

    return () => {
      clearInterval(hapticInterval);
      clearTimeout(shockTimer);
      clearTimeout(dissolveTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Nền đen mờ bao phủ Cinematic */}
      <MotiView 
        from={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={styles.overlay}
      />

      {/* Avatar Animation */}
      <MotiView
        from={{
          translateX: sourceX,
          translateY: sourceY,
          scale: 0.8,
        }}
        animate={{
          translateX: CENTER_X,
          translateY: CENTER_Y,
          scale: step !== 'DISSOLVE' ? 2.5 : 0, // Zoom in rồi thu nhỏ biến mất
          opacity: step !== 'DISSOLVE' ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          damping: 12,
          stiffness: 100, // Overshoot nảy tạo lực quán tính
        }}
        style={styles.avatarContainer}
      >
        <MotiImage
          source={{ uri: player?.avatar || 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
      </MotiView>

      {/* Haptic Rung và Bão Thông Báo Tử Hình */}
      {step === 'SHOCK' && (
        <MotiView
          from={{ opacity: 0, scale: 0.5, rotate: '-10deg' }}
          animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
          transition={{ type: 'spring', damping: 8 }}
          style={styles.deathNotice}
        >
          <Text style={styles.deathText}>{player?.name} ĐÃ BỊ XỬ TỬ!</Text>
          {player?.roleName && <Text style={styles.roleText}>Phe: {player.roleName}</Text>}
        </MotiView>
      )}

      {/* Bias Mộ Hiện Ra */}
      {step === 'DISSOLVE' && (
        <MotiView
          from={{ opacity: 0, scale: 0.8, translateY: CENTER_Y + 50, translateX: CENTER_X }}
          animate={{ opacity: 1, scale: 2, translateY: CENTER_Y, translateX: CENTER_X }}
          style={styles.tombstone}
        >
          <Text style={{ fontSize: 50 }}>🪦</Text>
        </MotiView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: 10,
  },
  avatarContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'red',
  },
  deathNotice: {
    position: 'absolute',
    top: height / 2 - 150,
    width: '100%',
    alignItems: 'center',
    zIndex: 25,
  },
  deathText: {
    color: '#ff4444',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  roleText: {
    color: '#ffaa00',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  tombstone: {
    position: 'absolute',
    zIndex: 15,
  }
});

export default ExecutionCinema;
