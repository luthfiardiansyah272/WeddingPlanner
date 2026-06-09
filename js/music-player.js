/**
 * Sakinah – Background Music Player
 * - Upload lagu: preview nama → Simpan / Batal
 * - Hapus lagu dari playlist (per track)
 * - Musik tetap berjalan saat pindah halaman (resume otomatis via sessionStorage)
 */
(function () {
  // ── IndexedDB ─────────────────────────────────────────────────────
  const DB_NAME = 'sakinah_music_db', DB_VER = 1, STORE = 'tracks';
  let db;

  function openDB() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, DB_VER);
      r.onupgradeneeded = e => e.target.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      r.onsuccess = e => res(e.target.result);
      r.onerror   = rej;
    });
  }
  const tx     = (m) => db.transaction(STORE, m).objectStore(STORE);
  const dbAll  = ()  => new Promise((res,rej) => { const r=tx('readonly').getAll(); r.onsuccess=()=>res(r.result); r.onerror=rej; });
  const dbAdd  = (v) => new Promise((res,rej) => { const r=tx('readwrite').add(v);  r.onsuccess=()=>res(r.result); r.onerror=rej; });
  const dbGet  = (id)=> new Promise((res,rej) => { const r=tx('readonly').get(id);  r.onsuccess=()=>res(r.result); r.onerror=rej; });
  const dbDel  = (id)=> new Promise((res,rej) => { const r=tx('readwrite').delete(id); r.onsuccess=()=>res(); r.onerror=rej; });

  // ── Session state ─────────────────────────────────────────────────
  const KEY       = 'mp_state';
  const getState  = () => { try { return JSON.parse(sessionStorage.getItem(KEY)||'{}'); } catch { return {}; } };
  const setState  = (s) => sessionStorage.setItem(KEY, JSON.stringify(s));
  const patchState= (p) => setState({ ...getState(), ...p });

  // ── Styles ────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #mp-wrap{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;font-family:'Inter',system-ui,sans-serif;user-select:none}

    /* Resume banner */
    #mp-resume-bar{background:#b08d6e;color:#fff;border-radius:10px;padding:9px 16px;font-size:.8rem;font-weight:600;cursor:pointer;margin-bottom:8px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.25);display:none;animation:mp-fadein .3s ease}
    #mp-resume-bar:hover{background:#c9a07a}
    @keyframes mp-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

    /* Panel */
    #mp-panel{background:#1c1c1e;border:1px solid rgba(255,255,255,.07);border-radius:12px;margin-bottom:8px;overflow:hidden;max-height:0;transition:max-height .3s ease}
    #mp-panel.open{max-height:420px;overflow-y:auto}
    #mp-panel-inner{padding:12px 14px}
    #mp-panel h4{font-size:.7rem;font-weight:600;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}

    /* Bar bawah */
    #mp-bar{background:#1c1c1e;color:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;gap:10px;padding:10px 14px;min-width:270px;border:1px solid rgba(255,255,255,.07)}
    #mp-info{flex:1;min-width:0}
    #mp-title{font-size:.8rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}

    /* Tombol */
    .mp-btn{background:rgba(255,255,255,.08);border:none;border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;flex-shrink:0;transition:background .15s}
    .mp-btn:hover{background:rgba(255,255,255,.18)}
    .mp-btn.primary{background:#b08d6e;width:34px;height:34px;border-radius:10px}
    .mp-btn.primary:hover{background:#c9a07a}

    /* Volume */
    #mp-vol{width:56px;-webkit-appearance:none;appearance:none;height:4px;background:rgba(255,255,255,.2);border-radius:99px;cursor:pointer;flex-shrink:0}
    #mp-vol::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;background:#b08d6e;border-radius:50%}

    /* Progress */
    #mp-prog-wrap{height:3px;background:rgba(255,255,255,.1);border-radius:99px;margin-top:7px;cursor:pointer}
    #mp-prog{height:100%;background:#b08d6e;border-radius:99px;width:0%;pointer-events:none}

    /* Playlist item */
    .mp-track{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;cursor:pointer;transition:background .12s}
    .mp-track:hover{background:rgba(255,255,255,.06)}
    .mp-track.active{background:rgba(176,141,110,.18)}
    .mp-track-name{flex:1;font-size:.8rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mp-track.active .mp-track-name{color:#b08d6e;font-weight:600}
    .mp-del{background:none;border:none;color:rgba(255,255,255,.25);cursor:pointer;padding:2px 4px;font-size:.75rem;line-height:1;border-radius:4px;transition:background .12s,color .12s}
    .mp-del:hover{background:rgba(248,113,113,.15);color:#f87171}

    /* Tambah lagu */
    #mp-add-area{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}
    #mp-add-area label{display:block;font-size:.7rem;color:rgba(255,255,255,.4);margin-bottom:5px;font-weight:500}
    #mp-add-row{display:flex;gap:6px;flex-wrap:wrap}
    #mp-url-input{flex:1;min-width:0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#fff;font-size:.78rem;padding:6px 9px;font-family:inherit;outline:none}
    #mp-url-input::placeholder{color:rgba(255,255,255,.3)}
    #mp-url-input:focus{border-color:#b08d6e}
    .mp-add-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:7px;color:rgba(255,255,255,.7);font-size:.72rem;padding:6px 10px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:background .12s}
    .mp-add-btn:hover{background:rgba(255,255,255,.16);color:#fff}
    #mp-file-input{display:none}

    /* Upload preview modal */
    #mp-upload-preview{margin-top:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:10px 12px;display:none}
    #mp-preview-title{font-size:.72rem;font-weight:600;color:rgba(255,255,255,.5);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em}
    #mp-preview-list{max-height:110px;overflow-y:auto;margin-bottom:10px}
    .mp-preview-item{display:flex;align-items:center;gap:6px;padding:4px 0}
    .mp-preview-item-name{flex:1;font-size:.78rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mp-preview-item-remove{background:none;border:none;color:rgba(255,255,255,.3);cursor:pointer;font-size:.75rem;padding:0 4px}
    .mp-preview-item-remove:hover{color:#f87171}
    #mp-preview-actions{display:flex;gap:6px}
    .mp-save-btn{background:#b08d6e;border:none;border-radius:7px;color:#fff;font-size:.78rem;font-weight:600;padding:7px 14px;cursor:pointer;font-family:inherit;flex:1;transition:background .12s}
    .mp-save-btn:hover{background:#c9a07a}
    .mp-cancel-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:rgba(255,255,255,.5);font-size:.78rem;padding:7px 14px;cursor:pointer;font-family:inherit;transition:background .12s}
    .mp-cancel-btn:hover{background:rgba(255,255,255,.12);color:#fff}

    #mp-toggle-icon{transition:transform .25s}
    #mp-toggle-icon.open{transform:rotate(180deg)}
  `;
  document.head.appendChild(style);

  // ── DOM ───────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.id = 'mp-wrap';
  wrap.innerHTML = `
    <div id="mp-resume-bar">▶ Musik sedang berjalan — klik untuk lanjutkan</div>
    <div id="mp-panel"><div id="mp-panel-inner">
      <h4>Playlist</h4>
      <div id="mp-list"></div>
      <div id="mp-add-area">
        <label>Tambah lagu</label>
        <div id="mp-add-row">
          <input id="mp-url-input" type="text" placeholder="URL audio (mp3, ogg...)" />
          <button class="mp-add-btn" id="mp-url-btn">+ URL</button>
          <button class="mp-add-btn" id="mp-upload-btn">⬆ Upload File</button>
          <input id="mp-file-input" type="file" accept="audio/*" multiple />
        </div>
        <div id="mp-upload-preview">
          <div id="mp-preview-title">File dipilih — periksa lalu simpan</div>
          <div id="mp-preview-list"></div>
          <div id="mp-preview-actions">
            <button class="mp-save-btn" id="mp-save-btn">💾 Simpan ke Playlist</button>
            <button class="mp-cancel-btn" id="mp-cancel-btn">Batal</button>
          </div>
        </div>
      </div>
    </div></div>
    <div id="mp-bar">
      <button class="mp-btn" id="mp-prev" title="Sebelumnya"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="4" x2="5" y2="20"/></svg></button>
      <button class="mp-btn primary" id="mp-play"><svg id="mp-play-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
      <button class="mp-btn" id="mp-next" title="Berikutnya"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="4" x2="19" y2="20"/></svg></button>
      <div id="mp-info">
        <div id="mp-title">Tidak ada lagu</div>
        <div id="mp-prog-wrap"><div id="mp-prog"></div></div>
      </div>
      <input id="mp-vol" type="range" min="0" max="1" step="0.05" value="0.7" title="Volume" />
      <button class="mp-btn" id="mp-toggle" title="Playlist"><svg id="mp-toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
    </div>`;
  document.body.appendChild(wrap);

  // ── Refs ──────────────────────────────────────────────────────────
  const playBtn       = document.getElementById('mp-play');
  const prevBtn       = document.getElementById('mp-prev');
  const nextBtn       = document.getElementById('mp-next');
  const titleEl       = document.getElementById('mp-title');
  const volEl         = document.getElementById('mp-vol');
  const panel         = document.getElementById('mp-panel');
  const toggleBtn     = document.getElementById('mp-toggle');
  const toggleIcon    = document.getElementById('mp-toggle-icon');
  const listEl        = document.getElementById('mp-list');
  const urlInput      = document.getElementById('mp-url-input');
  const urlBtn        = document.getElementById('mp-url-btn');
  const uploadBtn     = document.getElementById('mp-upload-btn');
  const fileInput     = document.getElementById('mp-file-input');
  const prog          = document.getElementById('mp-prog');
  const progWrap      = document.getElementById('mp-prog-wrap');
  const resumeBar     = document.getElementById('mp-resume-bar');
  const uploadPreview = document.getElementById('mp-upload-preview');
  const previewList   = document.getElementById('mp-preview-list');
  const saveBtn       = document.getElementById('mp-save-btn');
  const cancelBtn     = document.getElementById('mp-cancel-btn');

  // ── Audio & state ─────────────────────────────────────────────────
  const audio  = new Audio();
  let playlist = [];      // [{id, name}]
  let curIdx   = 0;
  let playing  = false;
  let blobUrl  = null;
  let pendingFiles = []; // File[] menunggu konfirmasi simpan

  const PLAY_SVG  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  const PAUSE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

  function setIcon(p) { playBtn.innerHTML = p ? PAUSE_SVG : PLAY_SVG; }

  // ── Render playlist ───────────────────────────────────────────────
  function renderList() {
    if (!playlist.length) {
      listEl.innerHTML = '<p style="font-size:.78rem;color:rgba(255,255,255,.3);text-align:center;padding:8px 0">Playlist kosong. Upload atau tambah URL lagu.</p>';
      return;
    }
    listEl.innerHTML = playlist.map((t, i) => `
      <div class="mp-track ${i===curIdx?'active':''}" onclick="window.__mpGo(${i})">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:.4"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <span class="mp-track-name">${escHtml(t.name)}</span>
        <button class="mp-del" title="Hapus dari playlist" onclick="event.stopPropagation();window.__mpDel(${i})">✕ Hapus</button>
      </div>`).join('');
  }

  function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // ── Load & play track ─────────────────────────────────────────────
  async function loadTrack(idx, autoplay) {
    if (!playlist.length) {
      titleEl.textContent = 'Tidak ada lagu';
      prog.style.width = '0%';
      setIcon(false);
      return;
    }
    curIdx = ((idx % playlist.length) + playlist.length) % playlist.length;
    const t = playlist[curIdx];

    if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
    audio.pause();

    const rec = await dbGet(t.id);
    if (!rec) return;

    if (rec.blob) {
      blobUrl   = URL.createObjectURL(rec.blob);
      audio.src = blobUrl;
    } else {
      audio.src = rec.url || '';
    }

    audio.volume     = parseFloat(volEl.value);
    titleEl.textContent = t.name;
    renderList();
    patchState({ id: t.id, idx: curIdx, vol: audio.volume });

    // Restore posisi jika track sama
    const st = getState();
    if (st.pos > 0 && st.id === t.id) {
      audio.addEventListener('canplay', () => { audio.currentTime = st.pos; }, { once: true });
    }

    if (autoplay) doPlay();
  }

  function doPlay() {
    audio.play()
      .then(() => {
        playing = true;
        setIcon(true);
        patchState({ playing: true });
        resumeBar.style.display = 'none';
      })
      .catch(() => {
        // Autoplay diblokir browser → tampilkan banner
        playing = false;
        setIcon(false);
        resumeBar.style.display = 'block';
      });
  }

  // ── Simpan posisi sebelum navigasi ────────────────────────────────
  window.addEventListener('beforeunload', () => {
    patchState({ pos: audio.currentTime, playing, vol: parseFloat(volEl.value) });
  });

  // ── Resume banner ─────────────────────────────────────────────────
  resumeBar.addEventListener('click', () => {
    resumeBar.style.display = 'none';
    doPlay();
  });

  // ── Play / Pause ──────────────────────────────────────────────────
  playBtn.addEventListener('click', () => {
    if (!playlist.length) return;
    if (playing) {
      audio.pause();
      playing = false;
      setIcon(false);
      patchState({ playing: false });
    } else {
      if (!audio.src) loadTrack(curIdx, true);
      else doPlay();
    }
  });

  prevBtn.addEventListener('click', () => loadTrack(curIdx - 1, playing));
  nextBtn.addEventListener('click', () => loadTrack(curIdx + 1, playing));

  audio.addEventListener('ended', () => loadTrack(curIdx + 1, true));
  audio.addEventListener('timeupdate', () => {
    if (audio.duration) prog.style.width = (audio.currentTime / audio.duration * 100) + '%';
  });

  progWrap.addEventListener('click', e => {
    if (audio.duration) audio.currentTime = (e.offsetX / progWrap.offsetWidth) * audio.duration;
  });

  volEl.addEventListener('input', () => {
    audio.volume = parseFloat(volEl.value);
    patchState({ vol: audio.volume });
  });

  toggleBtn.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    toggleIcon.classList.toggle('open', open);
  });

  // ── Global callbacks ──────────────────────────────────────────────
  window.__mpGo = (i) => loadTrack(i, true);

  window.__mpDel = async (i) => {
    const t = playlist[i];
    if (!t) return;
    // Jika track yang sedang aktif dihapus, hentikan audio
    if (i === curIdx) {
      audio.pause();
      playing = false;
      setIcon(false);
      if (blobUrl) { URL.revokeObjectURL(blobUrl); blobUrl = null; }
      audio.src = '';
    }
    await dbDel(t.id);
    playlist.splice(i, 1);
    if (curIdx >= playlist.length) curIdx = Math.max(0, playlist.length - 1);
    renderList();
    if (playlist.length) {
      await loadTrack(curIdx, false);
    } else {
      titleEl.textContent = 'Tidak ada lagu';
      prog.style.width = '0%';
      patchState({ id: null, idx: 0, playing: false, pos: 0 });
    }
  };

  // ── Tambah URL ────────────────────────────────────────────────────
  async function addUrl() {
    const v = urlInput.value.trim();
    if (!v) return;
    const name = decodeURIComponent(v.split('/').pop().replace(/\?\S*/,'')) || v;
    const id   = await dbAdd({ name, url: v, blob: null });
    playlist.push({ id, name });
    urlInput.value = '';
    renderList();
    if (playlist.length === 1) loadTrack(0, false);
  }
  urlBtn.addEventListener('click', addUrl);
  urlInput.addEventListener('keydown', e => e.key === 'Enter' && addUrl());

  // ── Upload file: pilih → preview → Simpan / Batal ─────────────────
  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (!fileInput.files.length) return;
    pendingFiles = Array.from(fileInput.files);
    fileInput.value = '';
    renderPreview();
    uploadPreview.style.display = 'block';
    // Pastikan panel terbuka
    if (!panel.classList.contains('open')) {
      panel.classList.add('open');
      toggleIcon.classList.add('open');
    }
  });

  function renderPreview() {
    previewList.innerHTML = pendingFiles.map((f, i) => `
      <div class="mp-preview-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b08d6e" stroke-width="2" style="flex-shrink:0"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <span class="mp-preview-item-name">${escHtml(f.name.replace(/\.\w+$/,''))}</span>
        <button class="mp-preview-item-remove" title="Hapus dari daftar" onclick="window.__mpRemovePending(${i})">✕</button>
      </div>`).join('');
  }

  window.__mpRemovePending = (i) => {
    pendingFiles.splice(i, 1);
    if (!pendingFiles.length) {
      uploadPreview.style.display = 'none';
    } else {
      renderPreview();
    }
  };

  // Tombol Simpan → masukkan semua ke IndexedDB
  saveBtn.addEventListener('click', async () => {
    const wasEmpty = playlist.length === 0;
    for (const f of pendingFiles) {
      const name = f.name.replace(/\.\w+$/, '');
      const id   = await dbAdd({ name, blob: f, url: null });
      playlist.push({ id, name });
    }
    pendingFiles = [];
    uploadPreview.style.display = 'none';
    renderList();
    // Auto-load track pertama jika playlist tadi kosong
    if (wasEmpty && playlist.length > 0) loadTrack(0, false);
  });

  // Tombol Batal → buang pending
  cancelBtn.addEventListener('click', () => {
    pendingFiles = [];
    uploadPreview.style.display = 'none';
  });

  // ── Init ──────────────────────────────────────────────────────────
  async function init() {
    db = await openDB();
    const recs = await dbAll();
    playlist   = recs.map(r => ({ id: r.id, name: r.name }));

    const st   = getState();
    volEl.value  = st.vol ?? 0.7;
    audio.volume = parseFloat(volEl.value);

    if (!playlist.length) { renderList(); return; }

    // Pulihkan track terakhir
    curIdx = 0;
    if (st.id) {
      const i = playlist.findIndex(t => t.id === st.id);
      if (i >= 0) curIdx = i;
    }

    await loadTrack(curIdx, false);
    renderList();

    // Jika sebelumnya playing → tampilkan banner resume
    if (st.playing) {
      resumeBar.style.display = 'block';
      // Coba auto-resume setelah user pertama kali berinteraksi dengan halaman
      const tryAutoResume = () => {
        doPlay();
        document.removeEventListener('click', tryAutoResume, true);
        document.removeEventListener('keydown', tryAutoResume, true);
      };
      document.addEventListener('click', tryAutoResume, { once: true, capture: true });
      document.addEventListener('keydown', tryAutoResume, { once: true, capture: true });
    }
  }

  init().catch(console.error);
})();
