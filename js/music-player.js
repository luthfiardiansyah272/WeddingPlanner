/**
 * Sakinah – Background Music Player
 * Floating mini player, persists across pages via localStorage
 */
(function () {
  const STORAGE_KEY = 'sakinah_music';

  // --- State ---
  let playlist = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  let currentIdx = 0;
  let audio = new Audio();
  let isPlaying = false;
  let expanded = false;

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlist));
  }

  // --- Build UI ---
  const style = document.createElement('style');
  style.textContent = `
    #mp-wrap {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 900;
      font-family: 'Inter', system-ui, sans-serif;
      user-select: none;
    }
    #mp-bar {
      background: #1c1c1e;
      color: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.22);
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      min-width: 260px;
      cursor: default;
      border: 1px solid rgba(255,255,255,0.07);
    }
    #mp-info { flex: 1; min-width: 0; }
    #mp-title {
      font-size: 0.8rem; font-weight: 600; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; color: #fff;
    }
    #mp-sub { font-size: 0.68rem; color: rgba(255,255,255,0.45); margin-top:1px; }
    .mp-btn {
      background: rgba(255,255,255,0.08);
      border: none; border-radius: 8px;
      width: 30px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #fff; flex-shrink: 0;
      transition: background 0.15s;
    }
    .mp-btn:hover { background: rgba(255,255,255,0.18); }
    .mp-btn.primary {
      background: #b08d6e; width: 34px; height: 34px; border-radius: 10px;
    }
    .mp-btn.primary:hover { background: #c9a07a; }
    #mp-vol { width: 60px; -webkit-appearance: none; appearance: none; height: 4px;
      background: rgba(255,255,255,0.2); border-radius: 99px; cursor: pointer; }
    #mp-vol::-webkit-slider-thumb {
      -webkit-appearance: none; width: 12px; height: 12px;
      background: #b08d6e; border-radius: 50%;
    }
    #mp-panel {
      background: #1c1c1e;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      margin-bottom: 8px;
      overflow: hidden;
      max-height: 0;
      transition: max-height 0.3s ease;
    }
    #mp-panel.open { max-height: 360px; }
    #mp-panel-inner { padding: 12px 14px; }
    #mp-panel h4 {
      font-size: 0.72rem; font-weight: 600; color: rgba(255,255,255,0.45);
      text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px;
    }
    .mp-track {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border-radius: 8px; cursor: pointer;
      transition: background 0.12s;
    }
    .mp-track:hover { background: rgba(255,255,255,0.06); }
    .mp-track.active { background: rgba(176,141,110,0.18); }
    .mp-track-name { flex: 1; font-size: 0.8rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mp-track.active .mp-track-name { color: #b08d6e; font-weight: 600; }
    .mp-track-del { background: none; border: none; color: rgba(255,255,255,0.25); cursor: pointer; padding: 2px; font-size: 0.75rem; }
    .mp-track-del:hover { color: #f87171; }
    #mp-add-area {
      margin-top: 10px; padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    #mp-add-area label {
      display: block; font-size: 0.7rem; color: rgba(255,255,255,0.4);
      margin-bottom: 5px; font-weight: 500;
    }
    #mp-add-row { display: flex; gap: 6px; }
    #mp-add-row input {
      flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 7px; color: #fff; font-size: 0.78rem; padding: 6px 9px;
      font-family: inherit; outline: none;
    }
    #mp-add-row input::placeholder { color: rgba(255,255,255,0.3); }
    #mp-add-row input:focus { border-color: #b08d6e; }
    #mp-upload-btn, #mp-url-btn {
      background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
      border-radius: 7px; color: rgba(255,255,255,0.7); font-size: 0.72rem;
      padding: 6px 10px; cursor: pointer; font-family: inherit; white-space: nowrap;
      transition: background 0.12s;
    }
    #mp-upload-btn:hover, #mp-url-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
    #mp-file-input { display: none; }
    #mp-progress-wrap {
      height: 3px; background: rgba(255,255,255,0.1); border-radius: 99px;
      margin-top: 8px; cursor: pointer; overflow: hidden;
    }
    #mp-progress { height: 100%; background: #b08d6e; border-radius: 99px; width: 0%; transition: width 0.5s linear; }
    #mp-toggle-icon { transition: transform 0.25s; }
    #mp-toggle-icon.open { transform: rotate(180deg); }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.id = 'mp-wrap';
  wrap.innerHTML = `
    <div id="mp-panel">
      <div id="mp-panel-inner">
        <h4>Playlist</h4>
        <div id="mp-list"></div>
        <div id="mp-add-area">
          <label>Tambah lagu</label>
          <div id="mp-add-row">
            <input id="mp-url-input" type="text" placeholder="URL audio / nama lagu" />
            <button id="mp-url-btn">Tambah</button>
            <button id="mp-upload-btn">Upload</button>
            <input id="mp-file-input" type="file" accept="audio/*" />
          </div>
        </div>
      </div>
    </div>
    <div id="mp-bar">
      <button class="mp-btn" id="mp-prev" title="Sebelumnya">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="4" x2="5" y2="20"/></svg>
      </button>
      <button class="mp-btn primary" id="mp-play" title="Play / Pause">
        <svg id="mp-play-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
      <button class="mp-btn" id="mp-next" title="Berikutnya">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="4" x2="19" y2="20"/></svg>
      </button>
      <div id="mp-info">
        <div id="mp-title">Tidak ada lagu</div>
        <div id="mp-progress-wrap"><div id="mp-progress"></div></div>
      </div>
      <input id="mp-vol" type="range" min="0" max="1" step="0.05" value="0.7" title="Volume" />
      <button class="mp-btn" id="mp-toggle" title="Playlist">
        <svg id="mp-toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(wrap);

  // --- DOM refs ---
  const playBtn   = document.getElementById('mp-play');
  const playIcon  = document.getElementById('mp-play-icon');
  const prevBtn   = document.getElementById('mp-prev');
  const nextBtn   = document.getElementById('mp-next');
  const titleEl   = document.getElementById('mp-title');
  const volInput  = document.getElementById('mp-vol');
  const panel     = document.getElementById('mp-panel');
  const toggleBtn = document.getElementById('mp-toggle');
  const toggleIcon= document.getElementById('mp-toggle-icon');
  const listEl    = document.getElementById('mp-list');
  const urlInput  = document.getElementById('mp-url-input');
  const urlBtn    = document.getElementById('mp-url-btn');
  const uploadBtn = document.getElementById('mp-upload-btn');
  const fileInput = document.getElementById('mp-file-input');
  const progress  = document.getElementById('mp-progress');

  // --- Helpers ---
  function trackName(t) {
    if (t.name) return t.name;
    try { return decodeURIComponent(t.src.split('/').pop().replace(/\.\w+$/, '')); } catch { return 'Lagu'; }
  }

  function loadTrack(idx) {
    if (!playlist.length) { titleEl.textContent = 'Tidak ada lagu'; progress.style.width = '0%'; return; }
    currentIdx = (idx + playlist.length) % playlist.length;
    const t = playlist[currentIdx];
    audio.src = t.src;
    audio.volume = parseFloat(volInput.value);
    titleEl.textContent = trackName(t);
    renderList();
  }

  function renderList() {
    listEl.innerHTML = playlist.map((t, i) => `
      <div class="mp-track ${i === currentIdx ? 'active' : ''}" onclick="window._mpPlay(${i})">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <span class="mp-track-name">${trackName(t)}</span>
        <button class="mp-track-del" onclick="event.stopPropagation();window._mpDel(${i})">✕</button>
      </div>`).join('') || '<p style="font-size:0.78rem;color:rgba(255,255,255,0.3);text-align:center;padding:8px 0">Playlist kosong</p>';
  }

  function setPlayIcon(playing) {
    playIcon.innerHTML = playing
      ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
      : '<polygon points="5 3 19 12 5 21 5 3"/>';
  }

  // --- Controls ---
  window._mpPlay = (idx) => {
    loadTrack(idx);
    audio.play().then(() => { isPlaying = true; setPlayIcon(true); });
  };

  window._mpDel = (idx) => {
    URL.revokeObjectURL(playlist[idx]?.objectUrl);
    playlist.splice(idx, 1);
    save();
    if (currentIdx >= playlist.length) currentIdx = Math.max(0, playlist.length - 1);
    loadTrack(currentIdx);
    if (isPlaying && playlist.length) audio.play();
  };

  playBtn.addEventListener('click', () => {
    if (!playlist.length) return;
    if (!audio.src && playlist.length) loadTrack(0);
    if (isPlaying) { audio.pause(); isPlaying = false; setPlayIcon(false); }
    else { audio.play().then(() => { isPlaying = true; setPlayIcon(true); }); }
  });

  prevBtn.addEventListener('click', () => { loadTrack(currentIdx - 1); if (isPlaying) audio.play(); });
  nextBtn.addEventListener('click', () => { loadTrack(currentIdx + 1); if (isPlaying) audio.play(); });

  audio.addEventListener('ended', () => { loadTrack(currentIdx + 1); audio.play(); });
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) progress.style.width = (audio.currentTime / audio.duration * 100) + '%';
  });

  volInput.addEventListener('input', () => { audio.volume = parseFloat(volInput.value); });

  toggleBtn.addEventListener('click', () => {
    expanded = !expanded;
    panel.classList.toggle('open', expanded);
    toggleIcon.classList.toggle('open', expanded);
  });

  // --- Add URL ---
  function addUrl(src, name) {
    playlist.push({ src, name: name || '' });
    save(); renderList();
    if (!audio.src) loadTrack(playlist.length - 1);
  }

  urlBtn.addEventListener('click', () => {
    const val = urlInput.value.trim();
    if (!val) return;
    addUrl(val, val.startsWith('http') ? '' : val);
    urlInput.value = '';
  });

  urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') urlBtn.click(); });

  // --- Upload file ---
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    Array.from(fileInput.files).forEach(f => {
      const url = URL.createObjectURL(f);
      playlist.push({ src: url, name: f.name.replace(/\.\w+$/, ''), objectUrl: url });
      renderList();
      if (!audio.src) loadTrack(playlist.length - 1);
    });
    fileInput.value = '';
  });

  // --- Init ---
  audio.volume = 0.7;
  if (playlist.length) loadTrack(0);
  renderList();
})();
