/**
 * Sakinah – Background Music Player
 * - File audio disimpan di IndexedDB (persist lintas halaman)
 * - State (index, volume, posisi) disimpan di sessionStorage
 * - Floating player bottom-right
 */
(function () {
  // ── IndexedDB setup ──────────────────────────────────────────────
  const DB_NAME = 'sakinah_music_db';
  const DB_VER  = 1;
  const STORE   = 'tracks';
  let db;

  function openDB() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = e => {
        e.target.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = e => res(e.target.result);
      req.onerror   = e => rej(e);
    });
  }

  function dbGetAll()     { return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readonly'); const all=[]; tx.objectStore(STORE).openCursor().onsuccess=e=>{ const c=e.target.result; if(c){all.push(c.value);c.continue();}else res(all); }; tx.onerror=rej; }); }
  function dbAdd(rec)     { return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readwrite'); const req=tx.objectStore(STORE).add(rec); req.onsuccess=()=>res(req.result); req.onerror=rej; }); }
  function dbDelete(id)   { return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readwrite'); const req=tx.objectStore(STORE).delete(id); req.onsuccess=res; req.onerror=rej; }); }
  function dbGetOne(id)   { return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readonly'); const req=tx.objectStore(STORE).get(id); req.onsuccess=()=>res(req.result); req.onerror=rej; }); }

  // ── State (session-persistent) ──────────────────────────────────
  function getState()   { try { return JSON.parse(sessionStorage.getItem('mp_state')||'{}'); } catch{ return {}; } }
  function saveState(s) { sessionStorage.setItem('mp_state', JSON.stringify(s)); }

  // ── Build UI ────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #mp-wrap { position:fixed; bottom:1.5rem; right:1.5rem; z-index:900; font-family:'Inter',system-ui,sans-serif; user-select:none; }
    #mp-bar { background:#1c1c1e; color:#fff; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,.25); display:flex; align-items:center; gap:10px; padding:10px 14px; min-width:270px; border:1px solid rgba(255,255,255,.07); }
    #mp-info { flex:1; min-width:0; }
    #mp-title { font-size:.8rem; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#fff; }
    #mp-sub   { font-size:.68rem; color:rgba(255,255,255,.4); margin-top:1px; }
    .mp-btn { background:rgba(255,255,255,.08); border:none; border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff; flex-shrink:0; transition:background .15s; }
    .mp-btn:hover { background:rgba(255,255,255,.18); }
    .mp-btn.primary { background:#b08d6e; width:34px; height:34px; border-radius:10px; }
    .mp-btn.primary:hover { background:#c9a07a; }
    #mp-vol { width:56px; -webkit-appearance:none; appearance:none; height:4px; background:rgba(255,255,255,.2); border-radius:99px; cursor:pointer; flex-shrink:0; }
    #mp-vol::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; background:#b08d6e; border-radius:50%; }
    #mp-panel { background:#1c1c1e; border:1px solid rgba(255,255,255,.07); border-radius:12px; margin-bottom:8px; overflow:hidden; max-height:0; transition:max-height .3s ease; }
    #mp-panel.open { max-height:380px; overflow-y:auto; }
    #mp-panel-inner { padding:12px 14px; }
    #mp-panel h4 { font-size:.7rem; font-weight:600; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:.06em; margin-bottom:10px; }
    .mp-track { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:8px; cursor:pointer; transition:background .12s; }
    .mp-track:hover { background:rgba(255,255,255,.06); }
    .mp-track.active { background:rgba(176,141,110,.18); }
    .mp-track-name { flex:1; font-size:.8rem; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .mp-track.active .mp-track-name { color:#b08d6e; font-weight:600; }
    .mp-track-del { background:none; border:none; color:rgba(255,255,255,.25); cursor:pointer; padding:2px; font-size:.8rem; line-height:1; }
    .mp-track-del:hover { color:#f87171; }
    #mp-add-area { margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,.06); }
    #mp-add-area label { display:block; font-size:.7rem; color:rgba(255,255,255,.4); margin-bottom:5px; font-weight:500; }
    #mp-add-row { display:flex; gap:6px; }
    #mp-url-input { flex:1; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:7px; color:#fff; font-size:.78rem; padding:6px 9px; font-family:inherit; outline:none; }
    #mp-url-input::placeholder { color:rgba(255,255,255,.3); }
    #mp-url-input:focus { border-color:#b08d6e; }
    .mp-add-btn { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:7px; color:rgba(255,255,255,.7); font-size:.72rem; padding:6px 10px; cursor:pointer; font-family:inherit; white-space:nowrap; transition:background .12s; }
    .mp-add-btn:hover { background:rgba(255,255,255,.16); color:#fff; }
    #mp-file-input { display:none; }
    #mp-progress-wrap { height:3px; background:rgba(255,255,255,.1); border-radius:99px; margin-top:7px; cursor:pointer; }
    #mp-progress { height:100%; background:#b08d6e; border-radius:99px; width:0%; pointer-events:none; }
    #mp-toggle-icon { transition:transform .25s; }
    #mp-toggle-icon.open { transform:rotate(180deg); }
    #mp-loading { font-size:.7rem; color:rgba(255,255,255,.4); text-align:center; padding:6px 0; }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.id = 'mp-wrap';
  wrap.innerHTML = `
    <div id="mp-panel">
      <div id="mp-panel-inner">
        <h4>Playlist</h4>
        <div id="mp-list"><div id="mp-loading">Memuat...</div></div>
        <div id="mp-add-area">
          <label>Tambah lagu</label>
          <div id="mp-add-row">
            <input id="mp-url-input" type="text" placeholder="Nama / URL audio" />
            <button class="mp-add-btn" id="mp-url-btn">Tambah</button>
            <button class="mp-add-btn" id="mp-upload-btn">Upload File</button>
            <input id="mp-file-input" type="file" accept="audio/*" multiple />
          </div>
        </div>
      </div>
    </div>
    <div id="mp-bar">
      <button class="mp-btn" id="mp-prev" title="Sebelumnya">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="4" x2="5" y2="20"/></svg>
      </button>
      <button class="mp-btn primary" id="mp-play" title="Play / Pause">
        <svg id="mp-play-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
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
    </div>`;
  document.body.appendChild(wrap);

  // ── DOM refs ─────────────────────────────────────────────────────
  const playBtn    = document.getElementById('mp-play');
  const playIcon   = document.getElementById('mp-play-icon');
  const prevBtn    = document.getElementById('mp-prev');
  const nextBtn    = document.getElementById('mp-next');
  const titleEl    = document.getElementById('mp-title');
  const volInput   = document.getElementById('mp-vol');
  const panel      = document.getElementById('mp-panel');
  const toggleBtn  = document.getElementById('mp-toggle');
  const toggleIcon = document.getElementById('mp-toggle-icon');
  const listEl     = document.getElementById('mp-list');
  const urlInput   = document.getElementById('mp-url-input');
  const urlBtn     = document.getElementById('mp-url-btn');
  const uploadBtn  = document.getElementById('mp-upload-btn');
  const fileInput  = document.getElementById('mp-file-input');
  const progress   = document.getElementById('mp-progress');
  const progWrap   = document.getElementById('mp-progress-wrap');

  // ── Audio ────────────────────────────────────────────────────────
  const audio = new Audio();
  let playlist  = [];   // [{id, name, src?}] — src hanya saat sudah di-blob
  let currentIdx = 0;
  let isPlaying  = false;
  let expanded   = false;

  // ── Icons ────────────────────────────────────────────────────────
  const PLAY_PATH  = '<polygon points="5 3 19 12 5 21 5 3"/>';
  const PAUSE_PATH = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

  function setPlayIcon(playing) {
    playIcon.innerHTML = playing ? PAUSE_PATH : PLAY_PATH;
    // switch fill/stroke mode
    playIcon.setAttribute('fill', playing ? 'none' : 'currentColor');
    playIcon.setAttribute('stroke', playing ? 'currentColor' : 'none');
    playIcon.setAttribute('stroke-width', playing ? '2.5' : '0');
  }

  // ── Render list ──────────────────────────────────────────────────
  function renderList() {
    if (!playlist.length) {
      listEl.innerHTML = '<p style="font-size:.78rem;color:rgba(255,255,255,.3);text-align:center;padding:8px 0">Playlist kosong</p>';
      return;
    }
    listEl.innerHTML = playlist.map((t, i) => `
      <div class="mp-track ${i === currentIdx ? 'active' : ''}" onclick="window._mpGoto(${i})">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <span class="mp-track-name">${t.name}</span>
        <button class="mp-track-del" onclick="event.stopPropagation();window._mpDel(${i})" title="Hapus">✕</button>
      </div>`).join('');
  }

  // ── Load track (dari IndexedDB → blob URL) ───────────────────────
  async function loadTrack(idx, autoplay) {
    if (!playlist.length) {
      titleEl.textContent = 'Tidak ada lagu';
      progress.style.width = '0%';
      setPlayIcon(false);
      return;
    }
    currentIdx = ((idx % playlist.length) + playlist.length) % playlist.length;
    const track = playlist[currentIdx];

    // Revoke URL lama
    if (audio._blobUrl) { URL.revokeObjectURL(audio._blobUrl); audio._blobUrl = null; }

    // Ambil dari IndexedDB
    const rec = await dbGetOne(track.id);
    if (rec && rec.blob) {
      audio._blobUrl = URL.createObjectURL(rec.blob);
      audio.src = audio._blobUrl;
    } else if (rec && rec.url) {
      audio.src = rec.url;
    }

    audio.volume = parseFloat(volInput.value);
    titleEl.textContent = track.name;
    renderList();

    const st = getState();
    // Pulihkan posisi jika track sama dengan sebelumnya
    if (st.trackId === track.id && st.pos > 0) {
      audio.addEventListener('loadedmetadata', () => { audio.currentTime = st.pos; }, { once: true });
    }

    saveState({ trackId: track.id, vol: audio.volume, pos: 0 });

    if (autoplay) {
      audio.play().then(() => { isPlaying = true; setPlayIcon(true); }).catch(() => {});
    }
  }

  // ── Simpan posisi sebelum unload ─────────────────────────────────
  window.addEventListener('beforeunload', () => {
    const st = getState();
    saveState({ ...st, pos: audio.currentTime, vol: audio.volume, playing: isPlaying });
  });

  // ── Audio events ─────────────────────────────────────────────────
  audio.addEventListener('ended', () => loadTrack(currentIdx + 1, true));
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) progress.style.width = (audio.currentTime / audio.duration * 100) + '%';
  });

  // Progress click → seek
  progWrap.addEventListener('click', e => {
    if (!audio.duration) return;
    const pct = e.offsetX / progWrap.offsetWidth;
    audio.currentTime = pct * audio.duration;
  });

  // ── Controls ─────────────────────────────────────────────────────
  playBtn.addEventListener('click', () => {
    if (!playlist.length) return;
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      setPlayIcon(false);
    } else {
      if (!audio.src) {
        loadTrack(currentIdx, true);
      } else {
        audio.play().then(() => { isPlaying = true; setPlayIcon(true); }).catch(() => {});
      }
    }
  });

  prevBtn.addEventListener('click', () => loadTrack(currentIdx - 1, isPlaying));
  nextBtn.addEventListener('click', () => loadTrack(currentIdx + 1, isPlaying));

  volInput.addEventListener('input', () => {
    audio.volume = parseFloat(volInput.value);
    const st = getState();
    saveState({ ...st, vol: audio.volume });
  });

  toggleBtn.addEventListener('click', () => {
    expanded = !expanded;
    panel.classList.toggle('open', expanded);
    toggleIcon.classList.toggle('open', expanded);
  });

  // ── Global callbacks (untuk onclick di innerHTML) ─────────────────
  window._mpGoto = (idx) => loadTrack(idx, true);
  window._mpDel  = async (idx) => {
    const id = playlist[idx].id;
    await dbDelete(id);
    playlist.splice(idx, 1);
    if (currentIdx >= playlist.length) currentIdx = Math.max(0, playlist.length - 1);
    renderList();
    if (playlist.length) loadTrack(currentIdx, false);
    else { audio.src = ''; titleEl.textContent = 'Tidak ada lagu'; progress.style.width = '0%'; setPlayIcon(false); isPlaying = false; }
  };

  // ── Tambah via URL ────────────────────────────────────────────────
  async function addUrl(url, name) {
    const id = await dbAdd({ url, name: name || url, blob: null });
    playlist.push({ id, name: name || url });
    renderList();
    if (playlist.length === 1) loadTrack(0, false);
  }

  urlBtn.addEventListener('click', () => {
    const val = urlInput.value.trim();
    if (!val) return;
    addUrl(val.startsWith('http') ? val : '', val.startsWith('http') ? '' : val);
    urlInput.value = '';
  });
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') urlBtn.click(); });

  // ── Upload file (simpan blob ke IndexedDB) ────────────────────────
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    for (const f of fileInput.files) {
      const name = f.name.replace(/\.\w+$/, '');
      const id   = await dbAdd({ name, blob: f, url: null });
      playlist.push({ id, name });
      renderList();
      if (playlist.length === 1) loadTrack(0, false);
    }
    fileInput.value = '';
  });

  // ── Init ──────────────────────────────────────────────────────────
  async function init() {
    db = await openDB();
    const recs = await dbGetAll();
    playlist = recs.map(r => ({ id: r.id, name: r.name }));

    const st = getState();
    volInput.value = st.vol || 0.7;
    audio.volume   = parseFloat(volInput.value);

    // Cari index track terakhir
    if (st.trackId && playlist.length) {
      const idx = playlist.findIndex(t => t.id === st.trackId);
      currentIdx = idx >= 0 ? idx : 0;
    }

    renderList();

    if (playlist.length) {
      await loadTrack(currentIdx, false);
      // Auto-resume jika sebelumnya sedang playing
      if (st.playing) {
        audio.play().then(() => { isPlaying = true; setPlayIcon(true); }).catch(() => {});
      }
    }
  }

  init().catch(console.error);
})();
