import React, { useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import PlayerModel3D from './PlayerModel3D';
import useGameStore from '../stores/gameStore';

// Hiệu ứng ánh sáng động bập bùng
const FireLight = () => {
  const lightRef = useRef();
  // Animation hook riêng của R3F để update 60 FPS
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(clock.elapsedTime * 15) * 0.3;
    }
  });

  return (
    <pointLight 
      ref={lightRef}
      position={[0, 1, 0]} 
      intensity={1.5} 
      distance={30} 
      color="#ffaa00" 
      castShadow 
      shadow-bias={-0.0001}
      shadow-mapSize={[1024, 1024]}
    />
  );
};

const CampfireLayout = () => {
  const playersMap = useGameStore(state => state.players);
  const players = useMemo(() => Object.values(playersMap), [playersMap]);
  const playerCount = players.length;
  
  // Bán kính tự rộng ra nếu đông người để tránh xếp đè lên nhau
  const radius = Math.max(5, playerCount * 0.45); 

  return (
    <View style={styles.container}>
      {/* Khởi tạo Canvas 3D */}
      <Canvas shadows camera={{ position: [0, 8, 14], fov: 60 }}>
        {/* Sương mù bóng đêm (Dark Forest Fog) */}
        <color attach="background" args={['#05080a']} />
        <fog attach="fog" args={['#05080a', 10, 40]} />

        {/* Ánh sáng mờ của không gian */}
        <ambientLight intensity={0.05} color="#223344" />
        
        {/* Nguồn sáng chính - Lửa */}
        <FireLight />

        {/* Mặt đất nền - Nơi nhận đổ bóng từ các nhân vật */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#1a1c1e" roughness={0.9} />
        </mesh>

        {/* Vật thể mồi lửa (Đại diện cho đống lửa chưa có model) */}
        <mesh position={[0, 0, 0]}>
          <coneGeometry args={[0.5, 1, 8]} />
          <meshBasicMaterial color="#ff4400" />
        </mesh>

        {/* Phân bổ các Player 3D thành vòng tròn */}
        {players.map((player, index) => {
          const angle = (index * 2 * Math.PI) / playerCount;
          return (
            <PlayerModel3D 
              key={player.id} 
              playerId={player.id} 
              angle={angle} 
              radius={radius} 
            />
          );
        })}

        {/* OrbitControls cho phép dùng ngón tay vuốt xoay cụm camera 3D quanh đống lửa */}
        <OrbitControls 
           enablePan={false}
           minPolarAngle={Math.PI / 4} // Giới hạn không lặn xuống lòng đất
           maxPolarAngle={Math.PI / 2.1} // Giới hạn không ngẩng ngửa lên trời
           minDistance={8}
           maxDistance={35}
           autoRotate={true} // Camera tự xoay nhẹ nhàng tạo cảm giác Cinematics
           autoRotateSpeed={0.5}
        />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    position: 'relative' // Khớp với SafeArea của GameScreen
  }
});

export default CampfireLayout;
