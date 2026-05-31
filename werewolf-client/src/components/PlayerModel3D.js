/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo } from 'react';
import useGameStore from '../stores/gameStore';

const PlayerModel3D = ({ playerId, angle, radius = 5 }) => {
  const meshRef = useRef();
  
  // Tối ưu hóa: Chỉ render lại nếu trạng thái của chính player này thay đổi
  const player = useGameStore(state => state.players[playerId]);
  
  const isMostVoted = useGameStore(state => {
      const voteCounts = {};
      Object.values(state.players).forEach(p => {
          if (p.votes > 0) voteCounts[p.id] = p.votes;
      });
      const maxVotes = Math.max(0, ...Object.values(voteCounts));
      return player?.votes > 0 && player?.votes === maxVotes;
  });

  // Calculate 3D position (X, 0, Z)
  const position = useMemo(() => {
    return [
      Math.cos(angle) * radius,
      0.5, // Lifted slightly above ground
      Math.sin(angle) * radius
    ];
  }, [angle, radius]);

  // Pointing towards center (0,0,0)
  const rotationY = -angle + Math.PI / 2;

  if (!player) return null;

  const appearance = player.appearance || { bodyColor: '#ffdbac' };
  const baseColor = player.isAlive ? appearance.bodyColor : '#333333';
  const glowColor = isMostVoted ? '#ff0000' : 'black';

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Thân nhân vật (Box đơn giản làm Placeholder) */}
      <mesh ref={meshRef} castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[1, 1.5, 0.5]} /> {/* W, H, D */}
        <meshLambertMaterial color={baseColor} emissive={glowColor} emissiveIntensity={isMostVoted ? 0.5 : 0} />
      </mesh>
      
      {/* Đầu nhân vật */}
      <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshLambertMaterial color={baseColor} />
      </mesh>

      {/* Mũi/Mặt chỉ hướng */}
      <mesh castShadow receiveShadow position={[0, 1.2, 0.4]}>
        <coneGeometry args={[0.1, 0.3, 16]} />
        <meshLambertMaterial color={"#555"} />
      </mesh>

    </group>
  );
};

export default React.memo(PlayerModel3D);
