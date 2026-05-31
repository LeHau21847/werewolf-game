/* ════════════════════════════════════════════════
   AUDIO SYSTEM (FILE-BASED) — Fixed v2
════════════════════════════════════════════════ */

const SFX = (() => {
  let enabled = true;
  const AUDIO_PATH = 'audio/';

  // Helper: tạo Audio, fallback về null nếu file không tồn tại
  function makeAudio(path) {
    const a = new Audio(path);
    a.onerror = () => console.warn('[SFX] File not found or broken:', path);
    return a;
  }

  // ── NHẠC NỀN (loop) ──────────────────────────────
  const bgmTracks = {
    lobby:  makeAudio(`${AUDIO_PATH}bgm_lobby.mp3`),
    day:    makeAudio(`${AUDIO_PATH}bgm_day.mp3`),
    // bgm_night.mp3 chưa có → dùng bgm_day làm fallback
    night:  makeAudio(`${AUDIO_PATH}bgm_day.mp3`),
    voting: makeAudio(`${AUDIO_PATH}bgm_voting.mp3`),
  };

  Object.values(bgmTracks).forEach(a => {
    a.loop   = true;
    a.volume = 0.35;
  });

  // ── HIỆU ỨNG ÂM THANH (sfx) ──────────────────────
  const sfxTracks = {
    day_start:      makeAudio(`${AUDIO_PATH}sfx_day_start.mp3`),
    night_start:    makeAudio(`${AUDIO_PATH}sfx_night_start.mp3`),
    execution:      makeAudio(`${AUDIO_PATH}sfx_execution.mp3`),
    death:          makeAudio(`${AUDIO_PATH}sfx_death.mp3`),
    vote_cast:      makeAudio(`${AUDIO_PATH}sfx_vote_cast.mp3`),
    action_confirm: makeAudio(`${AUDIO_PATH}sfx_action_confirm.mp3`),
    // Files missing → fallback sang sfx có sẵn
    click:          makeAudio(`${AUDIO_PATH}sfx_vote_cast.mp3`),       // fallback
    chat_receive:   makeAudio(`${AUDIO_PATH}sfx_action_confirm.mp3`),  // fallback
    win:            makeAudio(`${AUDIO_PATH}sfx_day_start.mp3`),       // fallback
    lose:           makeAudio(`${AUDIO_PATH}sfx_night_start.mp3`),     // fallback
    // Role sounds
    role_wolf:          makeAudio(`${AUDIO_PATH}role_wolf.mp3`),
    role_seer:          makeAudio(`${AUDIO_PATH}role_seer.mp3`),
    role_witch_heal:    makeAudio(`${AUDIO_PATH}role_witch_heal.mp3`),
    role_witch_poison:  makeAudio(`${AUDIO_PATH}role_witch_heal.mp3`), // fallback
    role_bodyguard:     makeAudio(`${AUDIO_PATH}role_bodyguard.mp3`),   // ✅ file OK
    role_hunter:        makeAudio(`${AUDIO_PATH}role_hunter.mp3`),
  };

  let currentBgm  = null;
  let pendingBgm  = null; // queue bgm sau user interaction

  // ── BGM: chuyển nhạc nền mượt ────────────────────
  function bgm(type) {
    if (!enabled) return;
    const track = bgmTracks[type];
    if (!track) return;
    if (currentBgm === track) return; // đang chạy đúng nhạc rồi

    if (currentBgm) {
      currentBgm.pause();
      currentBgm.currentTime = 0;
    }
    currentBgm = track;
    const p = currentBgm.play();
    if (p && typeof p.catch === 'function') {
      p.catch(e => {
        // AutoPlay policy: lưu lại để chạy sau khi user tương tác
        console.warn('[BGM] Autoplay blocked, will play on first interaction:', type);
        pendingBgm = type;
      });
    }
  }

  // ── SFX: phát hiệu ứng ───────────────────────────
  function play(type) {
    if (!enabled) return;
    const base = sfxTracks[type];
    if (!base) return;
    try {
      const sound = base.cloneNode();
      sound.volume = 0.75;
      sound.play().catch(e => console.warn('[SFX] Cannot play:', type));
    } catch(e) {}
  }

  // ── STOP ALL ─────────────────────────────────────
  function stopAll() {
    if (currentBgm) {
      currentBgm.pause();
      currentBgm.currentTime = 0;
    }
    currentBgm = null;
    pendingBgm = null;
  }

  // ── TOGGLE SOUND BUTTON ──────────────────────────
  function toggle() {
    enabled = !enabled;
    const btn = document.getElementById('sound-toggle');
    if (btn) btn.textContent = enabled ? '🔊' : '🔇';

    if (!enabled) {
      if (currentBgm) currentBgm.pause();
    } else {
      if (currentBgm) currentBgm.play().catch(() => {});
    }
  }

  // ── AUTO-RESUME sau khi user tương tác (fix autoplay block) ──
  function unlockAudio() {
    if (pendingBgm) {
      bgm(pendingBgm);
      pendingBgm = null;
    }
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
  }
  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });

  return { bgm, play, stopAll, toggle };
})();
