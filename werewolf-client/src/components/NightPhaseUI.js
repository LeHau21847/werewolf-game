import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// In a real Expo project we would use expo-haptics
// import * as Haptics from 'expo-haptics';

const NightPhaseUI = ({ myRole, isMyTurn, actionHandler }) => {
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (isMyTurn) {
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('VIBRATE: Wake up, it is your turn');
      setShowOptions(true);
    } else {
      setShowOptions(false);
    }
  }, [isMyTurn]);

  // Anti-Screen Peeking design: Pure black unless it's explicitly your turn.
  if (!isMyTurn) {
    return (
      <View style={styles.blackoutContainer}>
        <Text style={styles.blackoutText}>Trời tối. Nhắm mắt lại.</Text>
      </View>
    );
  }

  return (
    <View style={styles.blackoutContainer}>
       <Text style={styles.roleTitle}>Bạn là {myRole}</Text>
       <Text style={styles.instruction}>Đã đến lượt của bạn, hãy chọn mục tiêu!</Text>
       {/* Actions would be rendered here, e.g., grid of avatars to click */}
    </View>
  );
};

const styles = StyleSheet.create({
  blackoutContainer: {
    flex: 1,
    backgroundColor: '#000000', // Pitch black
    justifyContent: 'center',
    alignItems: 'center',
  },
  blackoutText: {
    color: '#333333', // Very dark grey so others can't see it from afar
    fontSize: 24,
    fontWeight: 'bold',
  },
  roleTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  instruction: {
    color: '#FF4444',
    fontSize: 18,
  }
});

export default NightPhaseUI;
