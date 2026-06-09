/**
 * Sakinah – Background Music Player
 * File disimpan di IndexedDB (persist permanen)
 * State (track, posisi, playing) disimpan di sessionStorage
 * Auto-resume dengan banner klik karena browser autoplay policy
 */
(function () {
  // ── IndexedDB ────────────────────────────────────────────────────
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
  const tx = (mode) => db.transaction(STORE, mode).objectStore(STORE);
  const dbAll    = () => new Promise((res,rej) => { const r=tx('readonly').getAll(); r.onsuccess=()=>res(r.result); r.onerror=rej; });
  const dbAdd    = (v) => new Promise((res,rej) => { const r=tx('readwrite').add(v);  r.onsuccess=()=>res(r.result); r.onerror=rej; });
  const dbGet    = (id)=> new Promise((res,rej) => { const r=tx('readonly').get(id);  r.onsuccess=()=>res(r.result); r.onerror=rej; });
  const dbDelete = (id)=> new Promise((_,rej)   => { const r=tx('readwrite').delete(id); r.onsuccess=_; r.onerror=rej; });

  // ── Session state ─────────────────────────────────────────────────
  const KEY = 'mp_state';
  const getState  = () => { try { return JSON.parse(sessionStorage.getItem(KEY)||'{}'); } catch { return {}; } };
  const setState  = (s) => sessionStorage.setItem(KEY, JSON.stringify(s));
  const patchState= (p) => setState({ ...getState(), ...p });

  // ── Styles ────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #mp-wrap{position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;font-family:'Inter',system-ui,sans-serif;user-select:none}
    #mp-resume-bar{background:#b08d6e;color:#fff;border-radius:10px;padding:9px 16px;font-size:.8rem;font-weight:600;cursor:pointer;margin-bottom:8px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.2);display:none;animation:mp-fadein .3s ease}
    #mp-resume-bar:hover{background:#c9a07a}
    @keyframes mp-fadein{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    #mp-panel{background:#1c1c1e;border:1px solid rgba(255,255,255,.07);border-radius:12px;margin-bottom:8px;overflow:hidden;max-height:0;transition:max-height .3s ease}
    #mp-panel.open{max-height:380px;overflow-y:auto}
    #mp-panel-inner{padding:12px 14px}
    #mp-panel h4{font-size:.7rem;font-weight:600;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px}
    #mp-bar{background:#1c1c1e;color:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;gap:10px;padding:10px 14px;min-width:270px;border:1px solid rgba(255,255,255,.07)}
    #mp-info{flex:1;min-width:0}
    #mp-title{font-size:.8rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#fff}
    .mp-btn{background:rgba(255,255,255,.08);border:none;border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;flex-shrink:0;transition:background .15s}
    .mp-btn:hover{background:rgba(255,255,255,.18)}
    .mp-btn.primary{background:#b08d6e;width:34px;height:34px;border-radius:10px}
    .mp-btn.primary:hover{background:#c9a07a}
    #mp-vol{width:56px;-webkit-appearance:none;appearance:none;height:4px;background:rgba(255,255,255,.2);border-radius:99px;cursor:pointer;flex-shrink:0}
    #mp-vol::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;background:#b08d6e;border-radius:50%}
    .mp-track{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;cursor:pointer;transition:background .12s}
    .mp-track:hover{background:rgba(255,255,255,.06)}
    .mp-track.active{background:rgba(176,141,110,.18)}
    .mp-track-name{flex:1;font-size:.8rem;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mp-track.active .mp-track-name{color:#b08d6e;font-weight:600}
    .mp-del{background:none;border:none;color:rgba(255,255,255,.25);cursor:pointer;padding:2px;font-size:.8rem;line-height:1}
    .mp-del:hover{color:#f87171}
    #mp-add-area{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06)}
    #mp-add-area label{display:block;font-size:.7rem;color:rgba(255,255,255,.4);margin-bottom:5px;font-weight:500}
    #mp-add-row{display:flex;gap:6px;flex-wrap:wrap}
    #mp-url-input{flex:1;min-width:0;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:7px;color:#fff;font-size:.78rem;padding:6px 9px;font-family:inherit;outline:none}
    #mp-url-input::placeholder{color:rgba(255,255,255,.3)}
    #mp-url-input:focus{border-color:#b08d6e}
    .mp-add-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:7px;color:rgba(255,255,255,.7);font-size:.72rem;padding:6px 10px;cursor:pointer;font-family:inherit;white-space:nowrap;transition:background .12s}
    .mp-add-btn:hover{background:rgba(255,255,255,.16);color:#fff}
    #mp-file-input{display:none}
    #mp-prog-wrap{height:3px;background:rgba(255,255,255,.1);border-radius:99px;margin-top:7px;cursor:pointer}
    #mp-prog{height:100%;background:#b08d6e;border-radius:99px;width:0%;pointer-events:none}
    #mp-toggle-icon{transition:transform .25s}
    #mp-toggle-icon.open{transform:rotate(180deg)}
  `;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.id = 'mp-wrap';
  wrap.innerHTML = `
    <div id="mp-resume-bar">▶ Lanjutkan musik — klik di sini</div>
    <div id="mp-panel"><div id="mp-panel-inner">
      <h4>Playlist</h4>
      <div id="mp-list"></div>
      <div id="mp-add-area">
        <label>Tambah lagu</label>
        <div id="mp-add-row">
          <input id="mp-url-input" type="text" placeholder="URL audio (mp3, ogg...)" />
          <button class="mp-add-btn" id="mp-url-btn">+ URL</button>
          <button class="mp-add-btn" id="mp-upload-btn">Upload File</button>
          <input id="mp-file-input" type="file" accept="audio/*" multiple />
        </div>
      </div>
    </div></div>
    <div id="mp-bar">
      <button class="mp-btn" id="mp-prev"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="4" x2="5" y2="20"/></svg></button>
      <button class="mp-btn primary" id="mp-play"><svg id="mp-play-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
      <button class="mp-btn" id="mp-next"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="4" x2="19" y2="20"/></svg></button>
      <div id="mp-info">
        <div id="mp-title">Tidak ada lagu</div>
        <div id="mp-prog-wrap"><div id="mp-prog"></div></div>
      </div>
      <input id="mp-vol" type="range" min="0" max="1" step="0.05" value="0.7" />
      <button class="mp-btn" id="mp-toggle"><svg id="mp-toggle-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>
    </div>`;
  document.body.appendChild(wrap);

  // ── Refs ──────────────────────────────────────────────────────────
  const playBtn   = document.getElementById('mp-play');
  const playIcon  = document.getElementById('mp-play-icon');
  const prevBtn   = document.getElementById('mp-prev');
  const nextBtn   = document.getElementById('mp-next');
  const titleEl   = document.getElementById('mp-title');
  const volEl     = document.getElementById('mp-vol');
  const panel     = document.getElementById('mp-panel');
  const toggleBtn = document.getElementById('mp-toggle');
  const toggleIcon= document.getElementById('mp-toggle-icon');
  const listEl    = document.getElementById('mp-list');
  const urlInput  = document.getElementById('mp-url-input');
  const urlBtn    = document.getElementById('mp-url-btn');
  const uploadBtn = document.getElementById('mp-upload-btn');
  const fileInput = document.getElementById('mp-file-input');
  const prog      = document.getElementById('mp-prog');
  const progWrap  = document.getElementById('mp-prog-wrap');
  const resumeBar = document.getElementById('mp-resume-bar');

  // ── Audio ─────────────────────────────────────────────────────────
  const audio    = new Audio();
  let playlist   = [];   // [{id, name}]
  let curIdx     = 0;
  let playing    = false;
  let blobUrl    = null;

  const PLAY_SVG  = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  const PAUSE_SVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;

  function setIcon(p) { playIcon.innerHTML = ''; playBtn.querySelector('svg')?.remove(); playBtn.innerHTML = p ? PAUSE_SVG : PLAY_SVG; }

  // ── Render playlist ───────────────────────────────────────────────
  function renderList() {
    if (!playlist.length) {
      listEl.innerHTML = '<p style="font-size:.78rem;color:rgba(255,255,255,.3);text-align:center;padding:8px 0">Playlist kosong. Upload atau tambah URL lagu.</p>';
      return;
    }
    listEl.innerHTML = playlist.map((t, i) => `
      <div class="mp-track ${i===curIdx?'active':''}" onclick="window.__mpGo(${i})">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;opacity:.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <span class="mp-track-name">${t.name}</span>
        <button class="mp-del" onclick="event.stopPropagation();window.__mpDel(${i})">✕</button>
      </div>`).join('');
  }

  // ── Load track ────────────────────────────────────────────────────
  async function loadTrack(idx, autoplay) {
    if (!playlist.length) { titleEl.textContent = 'Tidak ada lagu'; prog.style.width='0%'; setIcon(false); return; }
    curIdx = ((idx % playlist.length) + playlist.length) % playlist.length;
    const t = playlist[curIdx];

    // Revoke lama
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

    audio.volume = parseFloat(volEl.value);
    titleEl.textContent = t.name;
    renderList();
    patchState({ id: t.id, idx: curIdx, vol: audio.volume });

    // Restore posisi
    const st = getState();
    if (st.pos > 0 && st.id === t.id) {
      audio.addEventListener('canplay', () => { audio.currentTime = st.pos; }, { once: true });
    }

    if (autoplay) doPlay();
  }

  function doPlay() {
    audio.play()
      .then(() => { playing = true; setIcon(true); patchState({ playing: true }); resumeBar.style.display = 'none'; })
      .catch(() => {
        // Autoplay blocked → tampilkan banner
        playing = false; setIcon(false);
        resumeBar.style.display = 'block';
      });
  }

  // ── Simpan posisi sebelum navigasi ────────────────────────────────
  window.addEventListener('beforeunload', () => {
    patchState({ pos: audio.currentTime, playing, vol: parseFloat(volEl.value) });
  });

  // ── Resume banner klik ────────────────────────────────────────────
  resumeBar.addEventListener('click', () => {
    resumeBar.style.display = 'none';
    doPlay();
  });

  // ── Controls ──────────────────────────────────────────────────────
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
  window.__mpGo  = (i) => loadTrack(i, true);
  window.__mpDel = async (i) => {
    await dbDelete(playlist[i].id);
    playlist.splice(i, 1);
    if (curIdx >= playlist.length) curIdx = Math.max(0, playlist.length - 1);
    renderList();
    if (playlist.length) loadTrack(curIdx, false);
    else { audio.src=''; titleEl.textContent='Tidak ada lagu'; prog.style.width='0%'; setIcon(false); playing=false; }
  };

  // ── Tambah URL ────────────────────────────────────────────────────
  async function addUrl() {
    const v = urlInput.value.trim(); if (!v) return;
    const name = v.startsWith('http') ? decodeURIComponent(v.split('/').pop().replace(/\?\S*/,'')) : v;
    const id = await dbAdd({ name, url: v.startsWith('http') ? v : null, blob: null });
    playlist.push({ id, name });
    renderList();
    urlInput.value = '';
    if (playlist.length === 1) loadTrack(0, false);
  }
  urlBtn.addEventListener('click', addUrl);
  urlInput.addEventListener('keydown', e => e.key === 'Enter' && addUrl());

  // ── Upload file → simpan blob ke IndexedDB ────────────────────────
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
    const recs = await dbAll();
    playlist = recs.map(r => ({ id: r.id, name: r.name }));

    const st = getState();
    volEl.value    = st.vol ?? 0.7;
    audio.volume   = parseFloat(volEl.value);

    if (!playlist.length) return renderList();

    // Pulihkan track terakhir
    if (st.id) {
      const i = playlist.findIndex(t => t.id === st.id);
      curIdx = i >= 0 ? i : 0;
    }

    await loadTrack(curIdx, false);
    renderList();

    // Coba resume jika sebelumnya playing
    if (st.playing) {
      // Tampilkan banner — user harus klik karena autoplay policy
      resumeBar.style.display = 'block';
    }
  }

  init().catch(console.error);
})();
