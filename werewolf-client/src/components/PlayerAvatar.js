import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useGameStore from '../stores/gameStore';

/**
 * PlayerAvatar - Optimized with React.memo
 * Principle: Granular Render (Only subscribe to specific player data)
 */
const PlayerAvatar = memo(({ playerId }) => {
  // SUBSCRIBING ONLY to this specific player to prevent excessive re-renders
  const player = useGameStore(state => state.players[playerId]);
  
  // Calculate if this player is the one being voted the most (for Glow effect)
  // This logic could be hoisted to the parent, but here we demonstrate granular selection.
  const isMostVoted = useGameStore(state => {
      const voteCounts = {};
      Object.values(state.players).forEach(p => {
          if (p.votes > 0) voteCounts[p.id] = p.votes;
      });
      const maxVotes = Math.max(0, ...Object.values(voteCounts));
      return player?.votes > 0 && player?.votes === maxVotes;
  });

  if (!player) return null;

  const appearance = player.appearance || {
    gender: 'MALE', bodyColor: '#ffdbac', outfitColor: '#3c5e8b', headgearColor: '#8b4513'
  };

  return (
    <View style={[
        styles.avatarCircle, 
        !player.isAlive && styles.deadAvatar,
        isMostVoted && styles.mostVotedGlow // Highlight Target
    ]}>
      {/* Tính năng mới: Layered Rendering Đồ họa */}
      <View style={styles.imagePlaceholder}>
          <View style={[
              styles.baseBody, 
              { 
                  backgroundColor: appearance.bodyColor,
                  borderRadius: appearance.gender === 'FEMALE' ? 50 : 10
              }
          ]}>
              <View style={[styles.outfitLayer, { borderBottomColor: appearance.outfitColor }]} />
              <View style={[styles.headgearLayer, { backgroundColor: appearance.headgearColor }]} />
          </View>
      </View>
      
      <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
      
      {player.votes > 0 && (
         <View style={styles.voteBadge}>
            <Text style={styles.voteText}>{player.votes}</Text>
         </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mostVotedGlow: {
    borderColor: '#ff0000',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  deadAvatar: {
    opacity: 0.3,
    backgroundColor: '#300',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'flex-end', // Đặt nhân vật nằm xuống đáy vòng tròn
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 5,
  },
  baseBody: {
    width: 30, 
    height: 45, 
    zIndex: 2, 
    position: 'relative',
    overflow: 'hidden', 
    alignItems: 'center'
  },
  outfitLayer: {
    position: 'absolute', bottom: 0,
    width: 0, height: 0, 
    borderLeftWidth: 15, borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  headgearLayer: {
    position: 'absolute', top: -5,
    width: 35, height: 15, borderRadius: 10
  },
  playerName: {
    position: 'absolute',
    bottom: -20,
    color: '#bbb',
    fontSize: 10,
    width: 80,
    textAlign: 'center',
  },
  voteBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default PlayerAvatar;
