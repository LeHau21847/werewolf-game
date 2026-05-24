/* ════════════════════════════════════════════════
   WEBRTC VOICE CHAT — Mesh P2P via Socket.IO signaling
════════════════════════════════════════════════ */
const VoiceChat = (() => {
  const peers = {};        // socketId -> { pc: RTCPeerConnection, playerId }
  let localStream = null;
  let socket = null;
  let mySocketId = null;
  let enabled = false;
  let muted = false;
  let vadInterval = null;
  let canUseVoice = true;  // false when dead

  const RTC_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // ── INIT (call once after socket connects) ──
  function init(sk) {
    socket = sk;
    mySocketId = sk.id;

    sk.on('signal:PEER_JOINED', ({ socketId, playerId }) => {
      if (!enabled || !localStream) return;
      createPeer(socketId, playerId, true);
    });

    sk.on('signal:OFFER', async ({ from, fromPlayerId, offer }) => {
      if (!enabled) return;
      const pc = await createPeer(from, fromPlayerId, false);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('signal:ANSWER', { to: from, answer });
    });

    sk.on('signal:ANSWER', async ({ from, answer }) => {
      const entry = peers[from];
      if (entry?.pc) await entry.pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    sk.on('signal:ICE', async ({ from, candidate }) => {
      const entry = peers[from];
      if (entry?.pc && candidate) {
        try { await entry.pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e){}
      }
    });

    sk.on('signal:PEER_LEFT', ({ socketId }) => {
      closePeer(socketId);
    });

    sk.on('signal:SPEAKING', ({ playerId, speaking }) => {
      setSpeakingIndicator(playerId, speaking);
    });
  }

  // ── START MIC ───────────────────────────────
  async function start() {
    if (!canUseVoice) { showMicToast('❌ Bạn đã bị loại — không thể dùng mic!'); return false; }
    if (enabled) return true;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      enabled = true;
      muted = false;
      socket.emit('signal:READY');
      setupVAD(localStream);
      updateMicBtn();
      showMicToast('🎙️ Mic đã bật!');
      return true;
    } catch(e) {
      showMicToast('❌ Không thể truy cập mic: ' + e.message);
      return false;
    }
  }

  // ── STOP MIC ────────────────────────────────
  function stop() {
    if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
    if (vadInterval) { clearInterval(vadInterval); vadInterval = null; }
    Object.keys(peers).forEach(closePeer);
    enabled = false;
    muted = false;
    updateMicBtn();
  }

  // ── TOGGLE MUTE ─────────────────────────────
  async function toggleMic() {
    if (!canUseVoice) { showMicToast('❌ Bạn đã bị loại — không thể dùng mic!'); return; }
    if (!enabled) { await start(); return; }
    muted = !muted;
    if (localStream) localStream.getAudioTracks().forEach(t => t.enabled = !muted);
    updateMicBtn();
    showMicToast(muted ? '🔇 Mic đã tắt tiếng' : '🎙️ Mic đã bật tiếng');
  }

  // ── DISABLE (when player dies) ──────────────
  function disable() {
    canUseVoice = false;
    stop();
    const btn = document.getElementById('mic-btn');
    if (btn) { btn.disabled = true; btn.title = 'Bạn đã bị loại'; btn.classList.add('dead'); }
  }

  // ── CREATE PEER ─────────────────────────────
  async function createPeer(socketId, playerId, initiator) {
    if (peers[socketId]) { peers[socketId].pc.close(); }
    const pc = new RTCPeerConnection(RTC_CONFIG);
    peers[socketId] = { pc, playerId };

    if (localStream) localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

    pc.onicecandidate = e => {
      if (e.candidate) socket.emit('signal:ICE', { to: socketId, candidate: e.candidate });
    };

    pc.ontrack = e => {
      playRemoteAudio(socketId, playerId, e.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (['failed','disconnected','closed'].includes(pc.connectionState)) closePeer(socketId);
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('signal:OFFER', { to: socketId, offer });
    }
    return pc;
  }

  function closePeer(socketId) {
    if (peers[socketId]) { try { peers[socketId].pc.close(); } catch(e){} delete peers[socketId]; }
    const audio = document.getElementById(`audio-${socketId}`);
    if (audio) audio.remove();
    const indicator = document.getElementById(`speaking-${socketId}`);
    if (indicator) indicator.classList.remove('speaking');
  }

  function playRemoteAudio(socketId, playerId, stream) {
    let audio = document.getElementById(`audio-${socketId}`);
    if (!audio) { audio = document.createElement('audio'); audio.id = `audio-${socketId}`; audio.autoplay = true; document.body.appendChild(audio); }
    audio.srcObject = stream;
  }

  // ── VOICE ACTIVITY DETECTION ─────────────────
  function setupVAD(stream) {
    if (vadInterval) clearInterval(vadInterval);
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);
      analyser.fftSize = 256;
      const data = new Uint8Array(analyser.frequencyBinCount);
      let lastSpeaking = false;

      vadInterval = setInterval(() => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        const speaking = !muted && avg > 15;
        if (speaking !== lastSpeaking) {
          lastSpeaking = speaking;
          socket.emit('signal:SPEAKING', { speaking });
          // Show own indicator
          setSpeakingIndicator(socket.playerId || '', speaking);
        }
      }, 150);
    } catch(e) {}
  }

  function setSpeakingIndicator(playerId, speaking) {
    // Add glow to all player cards with this playerId
    document.querySelectorAll(`[data-player-id="${playerId}"]`).forEach(el => {
      el.classList.toggle('speaking', speaking);
    });
  }

  // ── UI ───────────────────────────────────────
  function updateMicBtn() {
    const btn = document.getElementById('mic-btn');
    if (!btn) return;
    if (!enabled) { btn.textContent = '🎤'; btn.title = 'Bật mic'; btn.className = 'mic-btn'; }
    else if (muted) { btn.textContent = '🔇'; btn.title = 'Bỏ tắt tiếng'; btn.className = 'mic-btn muted'; }
    else { btn.textContent = '🎙️'; btn.title = 'Tắt mic'; btn.className = 'mic-btn active'; }
  }

  function showMicToast(msg) {
    if (typeof toast === 'function') toast(msg, 'info');
  }

  return { init, start, stop, toggleMic, disable, isEnabled: () => enabled };
})();
