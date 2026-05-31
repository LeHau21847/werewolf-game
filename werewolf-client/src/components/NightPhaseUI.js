import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import useGameStore from '../stores/gameStore';
import SocketManager from '../services/SocketManager';
import AvatarIcon from './AvatarIcon';
import { FontAwesome5 } from '@expo/vector-icons';

export default function NightPhaseUI() {
  const { phase, localRole, localRoleData, players, localPlayerId, hostId,
    nightActionDone, seerChecked, wolfTargetId, wolfTargetName,
    witchUsedHeal, witchUsedPoison, seerResult, pendingDeaths,
    votes, executionResult, gameOverResult, chatMessages } = useGameStore();
  const [witchMode, setWitchMode] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const alive = Object.values(players).filter(p => p.isAlive !== false);
  const others = alive.filter(p => p.id !== localPlayerId);

  const nightAction = (type, targetId) => {
    SocketManager.emit('action:NIGHT_ACTION', { type, targetId, skillType: witchMode });
    if (type === 'WITCH') {
      if (witchMode === 'HEAL') useGameStore.getState().setWitchUsedHeal();
      if (witchMode === 'POISON') useGameStore.getState().setWitchUsedPoison();
      setWitchMode(null);
    }
    useGameStore.getState().setNightActionDone();
  };

  const seerCheck = (targetId) => {
    SocketManager.emit('action:SEER_CHECK', { targetId });
    useGameStore.getState().setSeerChecked();
  };

  const castVote = (targetId) => {
    SocketManager.emit('action:VOTE_PLAYER', { targetId });
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    SocketManager.emit('action:CHAT_MSG', { message: chatInput.trim() });
    setChatInput('');
  };

  const ROLE_COLOR = { WOLF: '#e53935', VILLAGER: '#43a047', SEER: '#ab47bc', WITCH: '#7e57c2', BODYGUARD: '#42a5f5', HUNTER: '#ff7043' };
  const PHASE_LABELS = { NIGHT_PHASE: '🌙 Màn Đêm', DAY_DISCUSSION: '☀️ Thảo Luận', VOTING_PHASE: '⚔️ Bầu Chọn', EXECUTION_PHASE: '⚰️ Hành Quyết' };

  const PlayerCard = ({ item, onPress, disabled, voteCount }) => (
    <TouchableOpacity
      style={[styles.playerCard, disabled && styles.playerCardDead]}
      onPress={() => !disabled && onPress && onPress(item.id)}
      disabled={disabled}
    >
      <AvatarIcon appearance={item.appearance} size={52} />
      <Text style={styles.playerCardName}>{item.name}</Text>
      {voteCount > 0 && <View style={styles.voteBadge}><Text style={styles.voteBadgeText}>{voteCount}</Text></View>}
      {!item.isAlive && <Text style={styles.deadLabel}>💀</Text>}
    </TouchableOpacity>
  );

  // ── ROLE REVEAL ─────────────────────────────────
  if (phase === 'ROLE_REVEAL') {
    const rd = localRoleData || {};
    return (
      <View style={[styles.fullScreen, { backgroundColor: '#0a0a0f' }]}>
        <Text style={styles.phaseTitle}>Vai Trò Của Bạn</Text>
        <View style={[styles.roleCard, { borderColor: ROLE_COLOR[localRole] || '#555' }]}>
          <Text style={styles.roleIcon}>{rd.icon || '❓'}</Text>
          <Text style={[styles.roleName, { color: ROLE_COLOR[localRole] || '#fff' }]}>{rd.name || localRole}</Text>
          <Text style={styles.roleSide}>{rd.side === 'WEREWOLF' ? '🩸 Phe Sói Ma' : '🌿 Phe Dân Làng'}</Text>
          <Text style={styles.roleDesc}>{rd.description || ''}</Text>
        </View>
        <Text style={styles.hintText}>✨ Ghi nhớ vai của bạn và giữ bí mật!</Text>
      </View>
    );
  }

  // ── NIGHT ───────────────────────────────────────
  if (phase === 'NIGHT_PHASE') {
    return (
      <View style={[styles.fullScreen, { backgroundColor: '#05050d' }]}>
        <Text style={styles.phaseTitle}>🌙 Màn Đêm</Text>
        <Text style={styles.roleLabel} numberOfLines={1}>
          Vai: <Text style={{ color: ROLE_COLOR[localRole] || '#fff' }}>{localRoleData?.name || localRole}</Text>
        </Text>

        {/* WOLF */}
        {localRole === 'WOLF' && (
          nightActionDone
            ? <Text style={styles.doneText}>✅ Đã chọn mục tiêu. Chờ đêm kết thúc...</Text>
            : <>
              <Text style={styles.subtitle}>Chọn người để tấn công:</Text>
              <FlatList data={others} keyExtractor={i => i.id} numColumns={3}
                renderItem={({ item }) => <PlayerCard item={item} onPress={(id) => nightAction('WOLF', id)} />} />
            </>
        )}

        {/* SEER */}
        {localRole === 'SEER' && (
          seerChecked
            ? <>
              <Text style={styles.doneText}>✅ Đã điều tra.</Text>
              {seerResult && <View style={styles.seerResultBox}>
                <Text style={styles.seerName}>{seerResult.targetName}</Text>
                <Text style={[styles.seerSide, { color: seerResult.side === 'WEREWOLF' ? '#e53935' : '#43a047' }]}>
                  {seerResult.side === 'WEREWOLF' ? '🐺 SÓI MA' : '🌿 DÂN LÀNG'}
                </Text>
              </View>}
            </>
            : <>
              <Text style={styles.subtitle}>Chọn người để điều tra:</Text>
              <FlatList data={others} keyExtractor={i => i.id} numColumns={3}
                renderItem={({ item }) => <PlayerCard item={item} onPress={seerCheck} />} />
            </>
        )}

        {/* BODYGUARD */}
        {localRole === 'BODYGUARD' && (
          nightActionDone
            ? <Text style={styles.doneText}>✅ Đã bảo vệ. Chờ đêm kết thúc...</Text>
            : <>
              <Text style={styles.subtitle}>Chọn người để bảo vệ:</Text>
              <FlatList data={alive} keyExtractor={i => i.id} numColumns={3}
                renderItem={({ item }) => <PlayerCard item={item} onPress={(id) => nightAction('BODYGUARD', id)} />} />
            </>
        )}

        {/* WITCH */}
        {localRole === 'WITCH' && (
          nightActionDone
            ? <Text style={styles.doneText}>✅ Đã dùng phép. Chờ đêm kết thúc...</Text>
            : <>
              <Text style={styles.subtitle}>Dùng phép thuật:</Text>
              <View style={styles.witchBtns}>
                <TouchableOpacity style={[styles.witchBtn, witchUsedHeal && styles.disabledBtn]}
                  disabled={witchUsedHeal} onPress={() => setWitchMode('HEAL')}>
                  <Text style={styles.witchBtnText}>💚 Cứu Sống</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.witchBtn, witchUsedPoison && styles.disabledBtn]}
                  disabled={witchUsedPoison} onPress={() => setWitchMode('POISON')}>
                  <Text style={styles.witchBtnText}>☠️ Hạ Độc</Text>
                </TouchableOpacity>
              </View>
              {wolfTargetId && <Text style={styles.wolfInfo}>🐺 Sói đang tấn công: {wolfTargetName}</Text>}
              {witchMode === 'HEAL' && wolfTargetId && players[wolfTargetId] && (
                <PlayerCard item={players[wolfTargetId]} onPress={(id) => nightAction('WITCH', id)} />
              )}
              {witchMode === 'POISON' && (
                <FlatList data={others} keyExtractor={i => i.id} numColumns={3}
                  renderItem={({ item }) => <PlayerCard item={item} onPress={(id) => nightAction('WITCH', id)} />} />
              )}
              <TouchableOpacity style={styles.skipBtn} onPress={() => useGameStore.getState().setNightActionDone()}>
                <Text style={styles.skipBtnText}>Bỏ qua lượt</Text>
              </TouchableOpacity>
            </>
        )}

        {/* VILLAGER / others */}
        {(!localRole || localRole === 'VILLAGER' || !['WOLF','SEER','BODYGUARD','WITCH'].includes(localRole)) && (
          <View style={styles.sleepBox}>
            <Text style={{ fontSize: 60 }}>😴</Text>
            <Text style={styles.doneText}>Hãy ngủ ngon và tin tưởng dân làng...</Text>
          </View>
        )}
      </View>
    );
  }

  // ── DAY DISCUSSION ──────────────────────────────
  if (phase === 'DAY_DISCUSSION') {
    return (
      <View style={styles.fullScreen}>
        <Text style={styles.phaseTitle}>☀️ Thảo Luận</Text>
        {pendingDeaths.length > 0
          ? pendingDeaths.map(d => (
            <View key={d.id} style={styles.deathCard}>
              <AvatarIcon appearance={d.appearance} size={44} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.deathName}>{d.name}</Text>
                <Text style={styles.deathReason}>💀 {d.deathReason === 'KILLED_BY_WEREWOLF' ? 'bị Sói Ma cắn' : d.deathReason === 'POISONED' ? 'bị Phù Thủy đầu độc' : 'đã ra đi'}</Text>
              </View>
            </View>
          ))
          : <Text style={styles.safeBanner}>🌅 Đêm qua yên bình — không ai bị hại!</Text>
        }
        <Text style={styles.subtitle}>Người chơi còn sống:</Text>
        <FlatList data={Object.values(players)} keyExtractor={i => i.id} numColumns={3}
          renderItem={({ item }) => (
            <View style={[styles.playerCard, !item.isAlive && styles.playerCardDead]}>
              <AvatarIcon appearance={item.appearance} size={52} />
              <Text style={styles.playerCardName}>{item.name}</Text>
              <Text style={{ fontSize: 11, color: item.isAlive ? '#43a047' : '#888' }}>{item.isAlive ? '💚' : '💀'}</Text>
            </View>
          )} />
        {/* Chat */}
        <View style={styles.chatBox}>
          <TextInput style={styles.chatInput} value={chatInput} onChangeText={setChatInput}
            placeholder="Nhắn tin..." placeholderTextColor="#666"
            onSubmitEditing={sendChat} returnKeyType="send" />
          <TouchableOpacity style={styles.chatSendBtn} onPress={sendChat}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── VOTING ──────────────────────────────────────
  if (phase === 'VOTING_PHASE') {
    const voteCounts = {};
    Object.values(votes).forEach(t => { voteCounts[t] = (voteCounts[t] || 0) + 1; });
    const myVoteTarget = votes[localPlayerId];

    return (
      <View style={styles.fullScreen}>
        <Text style={styles.phaseTitle}>⚔️ Bầu Chọn Kẻ Tình Nghi</Text>
        {myVoteTarget && <Text style={styles.myVoteBanner}>✅ Bạn đã bầu!</Text>}
        <FlatList data={Object.values(players)} keyExtractor={i => i.id} numColumns={3}
          renderItem={({ item }) => {
            const isMe = item.id === localPlayerId;
            const isDead = !item.isAlive;
            return (
              <PlayerCard item={item}
                voteCount={voteCounts[item.id] || 0}
                disabled={isMe || isDead}
                onPress={castVote} />
            );
          }} />
      </View>
    );
  }

  // ── EXECUTION ───────────────────────────────────
  if (phase === 'EXECUTION_PHASE' && executionResult) {
    const r = executionResult;
    const ROLE_NAMES = { WOLF: 'Sói Ma', VILLAGER: 'Dân Làng', SEER: 'Tiên Tri', WITCH: 'Phù Thủy', BODYGUARD: 'Bảo Vệ', HUNTER: 'Thợ Săn' };
    return (
      <View style={[styles.fullScreen, { backgroundColor: '#1a0000' }]}>
        <Text style={styles.execIcon}>{r.type === 'TIE' ? '⚖️' : '☠️'}</Text>
        <Text style={styles.execHeadline}>{r.type === 'TIE' ? 'Hoà Phiếu!' : 'Tử Hình!'}</Text>
        {r.executedName && <Text style={styles.execName}>{r.executedName}</Text>}
        {r.executedRole && <Text style={styles.execRole}>Vai: {ROLE_NAMES[r.executedRole] || r.executedRole}</Text>}
        <Text style={styles.execMsg}>{r.message || ''}</Text>
        {r.type === 'HUNTER_EXECUTED' && localRole === 'HUNTER' && (
          <>
            <Text style={styles.subtitle}>🏹 Chọn người để bắn trước khi chết:</Text>
            <FlatList data={others} keyExtractor={i => i.id} numColumns={3}
              renderItem={({ item }) => (
                <PlayerCard item={item} onPress={(id) => SocketManager.emit('action:HUNTER_SHOOT', { targetId: id })} />
              )} />
          </>
        )}
      </View>
    );
  }

  // ── GAME OVER ───────────────────────────────────
  if (phase === 'GAME_OVER' && gameOverResult) {
    const r = gameOverResult;
    const isWolf = r.winner === 'WEREWOLVES';
    return (
      <View style={[styles.fullScreen, { backgroundColor: '#0a0a0a' }]}>
        <Text style={{ fontSize: 72, textAlign: 'center', marginBottom: 10 }}>{isWolf ? '🐺' : '🎉'}</Text>
        <Text style={[styles.gameOverTitle, { color: isWolf ? '#e53935' : '#43a047' }]}>
          {isWolf ? 'Sói Ma Chiến Thắng!' : 'Dân Làng Chiến Thắng!'}
        </Text>
        <Text style={styles.execMsg}>{r.message}</Text>
        {r.allPlayers && (
          <FlatList data={r.allPlayers} keyExtractor={i => i.id || i.name} numColumns={3}
            renderItem={({ item }) => (
              <View style={[styles.playerCard, item.roleData?.side === 'WEREWOLF' ? styles.wolfSide : styles.villagerSide, !item.isAlive && styles.playerCardDead]}>
                <Text style={{ fontSize: 28 }}>{item.roleData?.icon || '❓'}</Text>
                <Text style={styles.playerCardName}>{item.name}</Text>
                <Text style={{ fontSize: 11, color: '#aaa' }}>{item.roleData?.name || item.role}</Text>
                <Text style={{ fontSize: 11, color: item.isAlive ? '#43a047' : '#888' }}>{item.isAlive ? '💚' : '💀'}</Text>
              </View>
            )} />
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, padding: 16, paddingTop: 50 },
  phaseTitle: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 12, textShadowColor: '#000', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  roleLabel: { textAlign: 'center', fontSize: 14, color: '#aaa', marginBottom: 16 },
  subtitle: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  doneText: { color: '#43a047', fontSize: 16, textAlign: 'center', marginTop: 20, padding: 16, backgroundColor: 'rgba(67,160,71,0.1)', borderRadius: 12 },
  sleepBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 },

  roleCard: { borderWidth: 2, borderRadius: 20, padding: 28, margin: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  roleIcon: { fontSize: 64, marginBottom: 12 },
  roleName: { fontSize: 28, fontWeight: '900', marginBottom: 6 },
  roleSide: { color: '#aaa', fontSize: 14, marginBottom: 12 },
  roleDesc: { color: '#ccc', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  hintText: { color: '#888', textAlign: 'center', fontSize: 14, marginTop: 12 },

  playerCard: { flex: 1, margin: 4, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 10, alignItems: 'center', maxWidth: '32%', position: 'relative' },
  playerCardDead: { opacity: 0.4 },
  playerCardName: { color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 6 },
  deadLabel: { position: 'absolute', top: 4, right: 4, fontSize: 16 },
  voteBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#e53935', borderRadius: 12, minWidth: 22, padding: 2, alignItems: 'center' },
  voteBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  myVoteBanner: { color: '#43a047', textAlign: 'center', fontSize: 14, marginBottom: 10, fontWeight: 'bold' },

  witchBtns: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
  witchBtn: { backgroundColor: '#7e57c2', borderRadius: 12, padding: 14, minWidth: 120, alignItems: 'center' },
  witchBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  disabledBtn: { opacity: 0.4 },
  wolfInfo: { color: '#ff8a65', textAlign: 'center', fontSize: 14, marginBottom: 12 },
  skipBtn: { marginTop: 16, alignSelf: 'center', padding: 10 },
  skipBtnText: { color: '#666', fontSize: 13, textDecorationLine: 'underline' },

  seerResultBox: { margin: 20, padding: 20, borderRadius: 16, backgroundColor: 'rgba(171,71,188,0.15)', borderWidth: 1, borderColor: '#ab47bc', alignItems: 'center' },
  seerName: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  seerSide: { fontSize: 20, fontWeight: 'bold' },

  deathCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(192,57,43,0.15)', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(192,57,43,0.4)' },
  deathName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  deathReason: { color: '#ff8a80', fontSize: 13, marginTop: 4 },
  safeBanner: { color: '#43a047', fontSize: 16, textAlign: 'center', padding: 16, backgroundColor: 'rgba(67,160,71,0.1)', borderRadius: 12, marginBottom: 16 },

  chatBox: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 8, marginTop: 12, gap: 8 },
  chatInput: { flex: 1, color: '#fff', fontSize: 14, padding: 8 },
  chatSendBtn: { backgroundColor: '#e53935', borderRadius: 8, padding: 10, justifyContent: 'center' },

  execIcon: { fontSize: 72, textAlign: 'center', marginBottom: 8 },
  execHeadline: { fontSize: 28, fontWeight: '900', color: '#fff', textAlign: 'center' },
  execName: { fontSize: 22, fontWeight: 'bold', color: '#ff8a65', textAlign: 'center', marginTop: 8 },
  execRole: { fontSize: 14, color: '#aaa', textAlign: 'center', marginTop: 4 },
  execMsg: { fontSize: 14, color: '#ccc', textAlign: 'center', marginTop: 12, marginHorizontal: 20 },

  gameOverTitle: { fontSize: 30, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  wolfSide: { borderWidth: 1, borderColor: '#e53935' },
  villagerSide: { borderWidth: 1, borderColor: '#43a047' },
});
