/* ════════════════════════════════════════════════
   CHARACTER SYSTEM — SVG Vector Avatar (Quizziz Style)
════════════════════════════════════════════════ */
const CharSystem = (() => {

  const SKINS = [
    '#fce1c6', // 0: Fair
    '#f0c7a8', // 1: Light
    '#e0ac69', // 2: Medium Light
    '#c68642', // 3: Medium
    '#8d5524', // 4: Medium Dark
    '#3d2c23'  // 5: Dark
  ];

  const OUTFITS = [
    { label: 'Thường',   color: '#607d8b', draw: (c) => `<path d="M20,100 Q20,65 50,65 Q80,65 80,100 Z" fill="${c}"/><path d="M50,65 L45,75 L55,75 Z" fill="#fff" opacity="0.5"/>` },
    { label: 'Hiệp Sĩ', color: '#b0bec5', draw: (c) => `<path d="M15,100 L25,60 L75,60 L85,100 Z" fill="${c}"/><path d="M35,60 L35,100 M65,60 L65,100 M25,80 L85,80" stroke="#78909c" stroke-width="2"/><path d="M50,65 L40,85 L60,85 Z" fill="#cfd8dc"/>` },
    { label: 'Pháp Sư', color: '#6a1b9a', draw: (c) => `<path d="M20,100 Q20,60 50,60 Q80,60 80,100 Z" fill="${c}"/><path d="M30,60 L50,85 L70,60 Z" fill="#ea80fc"/><circle cx="50" cy="70" r="4" fill="#ffd54f"/>` },
    { label: 'Thợ Săn', color: '#2e7d32', draw: (c) => `<path d="M20,100 Q20,65 50,65 Q80,65 80,100 Z" fill="${c}"/><path d="M25,65 L75,100 M75,65 L25,100" stroke="#5d4037" stroke-width="4"/>` },
    { label: 'Quý Tộc', color: '#f57f17', draw: (c) => `<path d="M20,100 Q20,65 50,65 Q80,65 80,100 Z" fill="${c}"/><path d="M30,65 Q50,80 70,65 Q60,75 50,65 Q40,75 30,65 Z" fill="#fff"/>` },
    { label: 'Hề Vương',color: '#880e4f', draw: (c) => `<path d="M20,100 Q20,65 50,65 Q80,65 80,100 Z" fill="${c}"/><path d="M50,65 L50,100" stroke="#ffeb3b" stroke-width="4"/><circle cx="50" cy="80" r="3" fill="#ffeb3b"/>` },
    { label: 'Sát Thủ', color: '#212121', draw: (c) => `<path d="M20,100 Q20,55 50,55 Q80,55 80,100 Z" fill="${c}"/><path d="M50,75 L30,55 L70,55 Z" fill="#000" opacity="0.5"/>` },
    { label: 'Nông Dân',color: '#8d6e63', draw: (c) => `<path d="M20,100 Q20,65 50,65 Q80,65 80,100 Z" fill="#eceff1"/><path d="M25,100 L30,65 L40,65 L35,100 M75,100 L70,65 L60,65 L65,100" fill="${c}"/>` }
  ];

  const ACCESSORIES = [
    { label: 'Không có', draw: () => `` },
    { label: 'Nón Lễ',   draw: () => `<rect x="30" y="5" width="40" height="20" fill="#212121"/><rect x="20" y="25" width="60" height="5" fill="#212121"/><rect x="30" y="20" width="40" height="5" fill="#f44336"/>` },
    { label: 'Vương Miện',draw:() => `<path d="M25,25 L35,10 L50,20 L65,10 L75,25 L70,30 L30,30 Z" fill="#ffca28"/>` },
    { label: 'Kính Mát', draw: () => `<rect x="28" y="32" width="18" height="12" rx="3" fill="#212121"/><rect x="54" y="32" width="18" height="12" rx="3" fill="#212121"/><path d="M46,35 L54,35" stroke="#212121" stroke-width="2"/><path d="M20,35 L28,35 M72,35 L80,35" stroke="#212121" stroke-width="2"/>` },
    { label: 'Mặt Nạ',   draw: () => `<path d="M25,30 Q50,45 75,30 L80,45 Q50,55 20,45 Z" fill="#d32f2f"/><circle cx="38" cy="37" r="3" fill="#fff"/><circle cx="62" cy="37" r="3" fill="#fff"/>` },
    { label: 'Kính Cận', draw: () => `<circle cx="38" cy="37" r="6" fill="none" stroke="#212121" stroke-width="2"/><circle cx="62" cy="37" r="6" fill="none" stroke="#212121" stroke-width="2"/><path d="M44,37 L56,37" stroke="#212121" stroke-width="2"/>` },
    { label: 'Tai Nghe', draw: () => `<path d="M22,40 A 28 28 0 0 1 78,40" fill="none" stroke="#424242" stroke-width="4"/><rect x="18" y="32" width="8" height="16" rx="3" fill="#ef5350"/><rect x="74" y="32" width="8" height="16" rx="3" fill="#ef5350"/>` },
    { label: 'Khăn Quàng',draw:() => `<path d="M35,65 Q50,75 65,65 L70,75 L60,85 L50,75 L30,70 Z" fill="#e53935"/>` }
  ];

  const DEFAULT_CHAR = { gender: 'male', skin: 0, outfit: 0, accessory: 0 };
  let current = { ...DEFAULT_CHAR };
  try {
    const saved = localStorage.getItem('masoi_character');
    if (saved) current = { ...DEFAULT_CHAR, ...JSON.parse(saved) };
  } catch (e) {}
  let currentTab = 'gender';

  // ── RENDER AVATAR (SVG CORE) ─────────────────
  function generateSVG(char) {
    const skin = SKINS[char.skin] || SKINS[0];
    const outfit = OUTFITS[char.outfit] || OUTFITS[0];
    const accessory = ACCESSORIES[char.accessory] || ACCESSORIES[0];
    
    let backHair = '';
    let frontHair = '';
    if (char.gender === 'female') {
      backHair = `<path d="M25,35 Q15,70 20,85 L40,75 L60,75 L80,85 Q85,70 75,35 Z" fill="#4e342e"/>`;
      frontHair = `<path d="M25,40 Q20,15 50,15 Q80,15 75,40 Q60,25 50,25 Q40,25 25,40 Z" fill="#4e342e"/>`;
    } else {
      frontHair = `<path d="M28,35 Q50,10 72,35 Q65,20 50,20 Q35,20 28,35 Z" fill="#3e2723"/>`;
    }

    const mouth = char.gender === 'female' 
      ? `<path d="M45,49 Q50,54 55,49" fill="none" stroke="#d81b60" stroke-width="2"/>` 
      : `<path d="M45,50 Q50,53 55,50" fill="none" stroke="#5d4037" stroke-width="2"/>`;

    const cheeks = char.gender === 'female' 
      ? `<circle cx="34" cy="44" r="3" fill="#ff8a80" opacity="0.6"/><circle cx="66" cy="44" r="3" fill="#ff8a80" opacity="0.6"/>` 
      : '';

    return `
      <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        ${backHair}
        ${outfit.draw(outfit.color)}
        <!-- Neck -->
        <rect x="42" y="55" width="16" height="15" fill="${skin}"/>
        <rect x="42" y="55" width="16" height="5" fill="#000" opacity="0.1"/>
        <!-- Head -->
        <circle cx="50" cy="40" r="23" fill="${skin}"/>
        <!-- Eyes -->
        <circle cx="38" cy="38" r="3" fill="#212121"/>
        <circle cx="62" cy="38" r="3" fill="#212121"/>
        <!-- Face Details -->
        ${mouth}
        ${cheeks}
        ${frontHair}
        ${accessory.draw()}
      </svg>
    `;
  }

  function renderAvatar(char, size = 'md') {
    const c = char || DEFAULT_CHAR;
    const sz = size === 'lg' ? '70px' : size === 'sm' ? '32px' : '48px';
    return `<div class="char-avatar" style="width:${sz};height:${sz};display:inline-block;border-radius:50%;overflow:hidden;background:linear-gradient(135deg, #1a1a2e, #16213e);border:1px solid rgba(255,255,255,0.1);vertical-align:middle;box-shadow:inset 0 0 10px rgba(0,0,0,0.5);">
      ${generateSVG(c)}
    </div>`;
  }

  // ── EDITOR ───────────────────────────────────
  function buildEditorHTML() {
    return `
<div id="char-editor-overlay" style="display:none;position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.88);align-items:center;justify-content:center;padding:16px">
  <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:24px;width:100%;max-width:480px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5)">
    
    <!-- Header -->
    <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
      <div style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:var(--gold)">✨ Tạo Hình Nhân Vật</div>
      <button onclick="CharSystem.closeEditor()" style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer">✕</button>
    </div>

    <!-- Preview Area -->
    <div style="padding:24px 20px;text-align:center;background:radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 60%)">
      <div id="char-preview-big" style="width:140px;height:140px;margin:0 auto;border-radius:50%;background:linear-gradient(135deg, #1a1a2e, #16213e);border:2px solid var(--gold);box-shadow:0 10px 30px rgba(0,0,0,0.6);overflow:hidden;"></div>
    </div>

    <!-- Tabs Container -->
    <div style="padding:0 20px">
      <div class="char-tabs">
        <button id="tab-btn-gender" class="char-tab-btn active" onclick="CharSystem.switchTab('gender')">Giới Tính</button>
        <button id="tab-btn-skin" class="char-tab-btn" onclick="CharSystem.switchTab('skin')">Màu Da</button>
        <button id="tab-btn-outfit" class="char-tab-btn" onclick="CharSystem.switchTab('outfit')">Trang Phục</button>
        <button id="tab-btn-acc" class="char-tab-btn" onclick="CharSystem.switchTab('acc')">Phụ Kiện</button>
      </div>
    </div>

    <!-- Tab Content -->
    <div style="flex:1;overflow-y:auto;padding:0 20px 20px;">
      
      <!-- Gender Tab -->
      <div id="tab-gender" class="char-grid active" style="grid-template-columns:1fr 1fr;min-height:auto">
        <button id="opt-gender-male" class="char-item-btn" onclick="CharSystem.setGender('male')">
          <div style="width:60px;height:60px;margin-bottom:8px" class="svg-opt">${generateSVG({...DEFAULT_CHAR, gender:'male'})}</div>
          <span class="ci-label">Nam</span>
        </button>
        <button id="opt-gender-female" class="char-item-btn" onclick="CharSystem.setGender('female')">
          <div style="width:60px;height:60px;margin-bottom:8px" class="svg-opt">${generateSVG({...DEFAULT_CHAR, gender:'female'})}</div>
          <span class="ci-label">Nữ</span>
        </button>
      </div>

      <!-- Skin Tab -->
      <div id="tab-skin" class="char-grid">
        ${SKINS.map((c,i) => `<button id="opt-skin-${i}" class="char-item-btn" onclick="CharSystem.setSkin(${i})">
          <div style="width:40px;height:40px;border-radius:50%;background:${c};margin-bottom:8px;border:2px solid rgba(255,255,255,0.2)"></div>
          <span class="ci-label">Tone ${i+1}</span>
        </button>`).join('')}
      </div>

      <!-- Outfit Tab -->
      <div id="tab-outfit" class="char-grid">
        ${OUTFITS.map((o,i) => `<button id="opt-outfit-${i}" class="char-item-btn" onclick="CharSystem.setOutfit(${i})">
          <svg viewBox="0 0 100 100" width="40" height="40" style="margin-bottom:8px">${o.draw(o.color)}</svg>
          <span class="ci-label">${o.label}</span>
        </button>`).join('')}
      </div>

      <!-- Accessory Tab -->
      <div id="tab-acc" class="char-grid">
        ${ACCESSORIES.map((a,i) => `<button id="opt-acc-${i}" class="char-item-btn" onclick="CharSystem.setAccessory(${i})">
          <svg viewBox="0 0 100 100" width="40" height="40" style="margin-bottom:8px">
            <circle cx="50" cy="40" r="23" fill="#424242" opacity="0.3"/>
            ${a.draw()}
          </svg>
          <span class="ci-label">${a.label}</span>
        </button>`).join('')}
      </div>

    </div>

    <!-- Footer -->
    <div style="padding:16px 20px;border-top:1px solid var(--border)">
      <button onclick="CharSystem.saveAndClose()" class="btn btn-gold btn-full">✅ XÁC NHẬN</button>
    </div>
  </div>
</div>`;
  }

  function injectEditor() {
    if (!document.getElementById('char-editor-overlay')) {
      document.body.insertAdjacentHTML('beforeend', buildEditorHTML());
    }
  }

  function openEditor() {
    injectEditor();
    document.getElementById('char-editor-overlay').style.display = 'flex';
    syncUI();
  }

  function closeEditor() {
    const el = document.getElementById('char-editor-overlay');
    if (el) el.style.display = 'none';
  }

  function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.char-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.char-grid').forEach(g => g.classList.remove('active'));
    
    document.getElementById(`tab-btn-${tabId}`).classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
  }

  function syncUI() {
    // Preview
    const previewEl = document.getElementById('char-preview-big');
    if (previewEl) {
      previewEl.innerHTML = generateSVG(current);
    }

    // Update selections
    document.getElementById('opt-gender-male')?.classList.toggle('selected', current.gender === 'male');
    document.getElementById('opt-gender-female')?.classList.toggle('selected', current.gender === 'female');

    for(let i=0; i<6; i++) {
      document.getElementById(`opt-skin-${i}`)?.classList.toggle('selected', current.skin === i);
    }

    OUTFITS.forEach((_, i) => {
      document.getElementById(`opt-outfit-${i}`)?.classList.toggle('selected', current.outfit === i);
    });

    ACCESSORIES.forEach((_, i) => {
      document.getElementById(`opt-acc-${i}`)?.classList.toggle('selected', current.accessory === i);
    });
  }

  // ── SETTERS ──────────────────────────────────
  function setGender(g) { current.gender = g; syncUI(); }
  function setSkin(i) { current.skin = i; syncUI(); }
  function setOutfit(i) { current.outfit = i; syncUI(); }
  function setAccessory(i) { current.accessory = i; syncUI(); }

  function saveAndClose() {
    closeEditor();
    try { localStorage.setItem('masoi_character', JSON.stringify(current)); } catch(e) {}
    if (typeof onCharacterSaved === 'function') onCharacterSaved(current);
  }

  function getCurrent() { return { ...current }; }
  function setCurrent(c) { current = { ...DEFAULT_CHAR, ...c }; }

  return { openEditor, closeEditor, switchTab, saveAndClose, setGender, setSkin, setOutfit, setAccessory, renderAvatar, getCurrent, setCurrent, generateSVG };
})();
