(function () {
  var ICONS = {
    brand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 3.5 12 7l3.5-3.5 3 3L12 21 5.5 6.5l3-3Z"/><path d="M8.5 3.5h7M5.5 6.5h13M12 7v14"/></svg>',
    'index.html': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    'budget.html': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/></svg>',
    'vendors.html': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12h8"/><path d="M7 17h10"/><path d="M5 7h14"/><path d="M6 3h12v18H6z"/></svg>',
    'recommendations.html': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z"/></svg>',
    'checklist.html': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11l2 2 4-5"/><path d="M5 4h14v16H5z"/><path d="M8 16h8"/></svg>',
    'seserahan.html': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12v8H4v-8"/><path d="M2 8h20v4H2z"/><path d="M12 8v12"/><path d="M12 8c-3-5-8-2-5 1 2 2 5-1 5-1Zm0 0c3-5 8-2 5 1-2 2-5-1-5-1Z"/></svg>',
    'guestlist.html': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20c0-2.2-1.8-4-4-4s-4 1.8-4 4"/><circle cx="12" cy="9" r="3"/><path d="M22 20c0-1.8-1.2-3.3-2.8-3.8"/><path d="M17 6.4a2.6 2.6 0 0 1 0 5.2"/><path d="M2 20c0-1.8 1.2-3.3 2.8-3.8"/><path d="M7 6.4a2.6 2.6 0 0 0 0 5.2"/></svg>',
    'timeline.html': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    'panitia.html': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 6 6v5c0 4 2.5 7.5 6 10 3.5-2.5 6-6 6-10V6l-6-3Z"/><path d="M9 12l2 2 4-5"/></svg>',
    'profile.html': '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>'
  };

  var LABELS = {
    'index.html': 'Dashboard',
    'budget.html': 'Budget',
    'vendors.html': 'Vendor',
    'recommendations.html': 'Rekomendasi',
    'checklist.html': 'Checklist',
    'seserahan.html': 'Seserahan',
    'guestlist.html': 'Tamu',
    'timeline.html': 'Timeline',
    'panitia.html': 'Panitia',
    'profile.html': 'Profil'
  };

  var PLAYLIST = [
    { title: 'Serenade Akad', tempo: 118, key: 261.63, scale: [0, 4, 7, 11, 12, 7, 4, 2], wave: 'sine' },
    { title: 'Garden Reception', tempo: 104, key: 293.66, scale: [0, 3, 7, 10, 12, 10, 7, 5], wave: 'triangle' },
    { title: 'Golden Vows', tempo: 92, key: 329.63, scale: [0, 5, 7, 9, 12, 9, 7, 4], wave: 'sine' }
  ];
  var USER_TRACKS = JSON.parse(localStorage.getItem('sakinah_user_tracks') || '[]');

  var audio = {
    ctx: null,
    gain: null,
    timer: null,
    el: null,
    playing: false,
    step: 0,
    track: Number(localStorage.getItem('sakinah_track') || 0) || 0,
    volume: Number(localStorage.getItem('sakinah_volume') || 0.25) || 0.25
  };

  function allTracks() {
    return PLAYLIST.concat(USER_TRACKS);
  }

  function currentTrack() {
    var tracks = allTracks();
    if (!tracks[audio.track]) audio.track = 0;
    return tracks[audio.track] || PLAYLIST[0];
  }

  function iconWrap(svg) {
    return '<span class="nav-icon">' + svg + '</span>';
  }

  function scrubNavLinks() {
    var navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    Array.prototype.slice.call(navLinks.childNodes).forEach(function (n) {
      if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) n.remove();
    });

    Array.prototype.forEach.call(navLinks.querySelectorAll('a'), function (a) {
      var href = a.getAttribute('href') || '';
      if (href.indexOf('>') !== -1 || href.indexOf('??') !== -1) {
        a.remove();
        return;
      }
      var file = href.split('/').pop() || 'index.html';
      if (!LABELS[file]) return;
      a.innerHTML = iconWrap(ICONS[file]) + '<span>' + LABELS[file] + '</span>';
      a.setAttribute('aria-label', LABELS[file]);
      a.setAttribute('title', LABELS[file]);
    });
  }

  function upgradeBrand() {
    Array.prototype.forEach.call(document.querySelectorAll('.brand-icon, .logo-icon, .login-visual-icon'), function (brandIcon) {
      brandIcon.innerHTML = ICONS.brand;
      brandIcon.classList.add('brand-mark-svg');
    });
  }

  function upgradePageTitle() {
    var heading = document.querySelector('.page-header h2');
    if (!heading || heading.querySelector('.page-title-icon')) return;
    var file = (window.location.pathname.split('/').pop() || 'index.html');
    var svg = ICONS[file];
    if (!svg) return;
    var text = heading.textContent.replace(/^[^\wÀ-ž]+/u, '').trim();
    heading.innerHTML = '<span class="page-title-icon">' + svg + '</span><span>' + text + '</span>';
  }

  function ensureAudioGraph() {
    if (audio.ctx) return;
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audio.ctx = new AudioContext();
    audio.gain = audio.ctx.createGain();
    audio.gain.gain.value = audio.volume;
    audio.gain.connect(audio.ctx.destination);
    audio.el = new Audio();
    audio.el.loop = true;
    audio.el.volume = audio.volume;
  }

  function frequency(base, semitone) {
    return base * Math.pow(2, semitone / 12);
  }

  function playNote(freq, start, duration, type, level) {
    var osc = audio.ctx.createOscillator();
    var amp = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(level, start + 0.05);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp);
    amp.connect(audio.gain);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function tick() {
    if (!audio.playing || !audio.ctx) return;
    var track = currentTrack();
    if (track.url) return;
    var beat = 60 / track.tempo;
    var now = audio.ctx.currentTime + 0.02;
    var note = track.scale[audio.step % track.scale.length];
    playNote(frequency(track.key, note), now, beat * 0.85, track.wave, 0.09);
    if (audio.step % 2 === 0) playNote(frequency(track.key / 2, track.scale[(audio.step / 2) % track.scale.length]), now, beat * 1.8, 'sine', 0.045);
    audio.step += 1;
    audio.timer = window.setTimeout(tick, beat * 1000);
  }

  function updatePlayer() {
    var player = document.getElementById('wedding-audio-player');
    if (!player) return;
    var tracks = allTracks();
    player.querySelector('[data-role="toggle"]').innerHTML = audio.playing
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>';
    player.querySelector('[data-role="toggle"]').setAttribute('aria-label', audio.playing ? 'Pause playlist' : 'Putar playlist');
    player.querySelector('[data-role="toggle"]').setAttribute('title', audio.playing ? 'Pause playlist' : 'Putar playlist');
    player.querySelector('[data-role="title"]').textContent = currentTrack().title;
    player.querySelector('[data-role="select"]').innerHTML = tracks.map(function (t, i) {
      return '<option value="' + i + '">' + (t.url ? 'Saya - ' : '') + t.title + '</option>';
    }).join('');
    player.querySelector('[data-role="select"]').value = String(audio.track);
    player.classList.toggle('is-playing', audio.playing);
  }

  function stopSynth() {
    window.clearTimeout(audio.timer);
    audio.timer = null;
  }

  function stopMedia() {
    if (!audio.el) return;
    audio.el.pause();
  }

  function playCurrent() {
    ensureAudioGraph();
    if (!audio.ctx) return;
    audio.ctx.resume();
    var track = currentTrack();
    audio.playing = true;
    stopSynth();
    stopMedia();
    if (track.url && audio.el) {
      audio.el.src = track.url;
      audio.el.play().catch(function () {
        audio.playing = false;
        updatePlayer();
      });
    } else {
      tick();
    }
    updatePlayer();
  }

  function persistUserTracks() {
    var persistent = USER_TRACKS.filter(function (track) { return track.persist !== false; });
    localStorage.setItem('sakinah_user_tracks', JSON.stringify(persistent));
  }

  function toggleAudio() {
    ensureAudioGraph();
    if (!audio.ctx) return;
    if (!audio.playing) {
      playCurrent();
      return;
    }
    audio.playing = false;
    stopSynth();
    stopMedia();
    updatePlayer();
  }

  function setTrack(index) {
    var tracks = allTracks();
    audio.track = (index + tracks.length) % tracks.length;
    audio.step = 0;
    localStorage.setItem('sakinah_track', String(audio.track));
    if (audio.playing) playCurrent();
    updatePlayer();
  }

  function addTrack(track, options) {
    var item = {
      title: track.title || 'Lagu Saya',
      url: track.url,
      persist: options && options.persist === false ? false : true
    };
    USER_TRACKS.push(item);
    if (item.persist !== false) persistUserTracks();
    audio.track = allTracks().length - 1;
    localStorage.setItem('sakinah_track', String(audio.track));
    updatePlayer();
    return audio.track;
  }

  function promptUrlTrack() {
    var title = window.prompt('Judul lagu');
    if (!title) return;
    var url = window.prompt('Tempel URL audio publik (MP3/OGG/WAV)');
    if (!url) return;
    addTrack({ title: title.trim(), url: url.trim() });
    playCurrent();
  }

  function handleFileTrack(file) {
    if (!file) return;
    addTrack({ title: file.name.replace(/\.[^.]+$/, ''), url: URL.createObjectURL(file) }, { persist: false });
    playCurrent();
  }

  function injectMusicPlayer() {
    if (document.getElementById('wedding-audio-player')) return;
    var player = document.createElement('aside');
    player.id = 'wedding-audio-player';
    player.className = 'wedding-audio-player';
    player.setAttribute('aria-label', 'Playlist latar belakang');
    player.innerHTML = [
      '<button class="audio-btn audio-toggle" data-role="toggle" type="button" aria-label="Putar playlist" title="Putar playlist"></button>',
      '<div class="audio-meta"><span class="audio-kicker">Playlist</span><strong data-role="title"></strong></div>',
      '<select data-role="select" aria-label="Pilih lagu"></select>',
      '<button class="audio-btn" data-role="next" type="button" aria-label="Lagu berikutnya" title="Lagu berikutnya"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 5 8 7-8 7V5Z"/><path d="M18 5v14"/></svg></button>',
      '<button class="audio-btn" data-role="add-url" type="button" aria-label="Tambah lagu dari URL" title="Tambah lagu dari URL"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>',
      '<label class="audio-btn audio-file" aria-label="Upload lagu" title="Upload lagu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></svg><input data-role="file" type="file" accept="audio/*" /></label>',
      '<input data-role="volume" type="range" min="0" max="0.55" step="0.01" aria-label="Volume playlist" />'
    ].join('');
    document.body.appendChild(player);

    player.querySelector('[data-role="toggle"]').addEventListener('click', toggleAudio);
    player.querySelector('[data-role="next"]').addEventListener('click', function () { setTrack(audio.track + 1); });
    player.querySelector('[data-role="add-url"]').addEventListener('click', promptUrlTrack);
    player.querySelector('[data-role="file"]').addEventListener('change', function (e) { handleFileTrack(e.target.files[0]); e.target.value = ''; });
    player.querySelector('[data-role="select"]').addEventListener('change', function (e) { setTrack(Number(e.target.value)); });
    player.querySelector('[data-role="volume"]').value = String(audio.volume);
    player.querySelector('[data-role="volume"]').addEventListener('input', function (e) {
      audio.volume = Number(e.target.value);
      localStorage.setItem('sakinah_volume', String(audio.volume));
      if (audio.gain) audio.gain.gain.value = audio.volume;
      if (audio.el) audio.el.volume = audio.volume;
    });
    updatePlayer();
  }

  window.SakinahMusic = {
    addTrack: addTrack,
    playTrack: function (track, options) {
      addTrack(track, options);
      playCurrent();
    },
    refresh: updatePlayer,
    tracks: allTracks
  };

  function run() {
    scrubNavLinks();
    upgradeBrand();
    upgradePageTitle();
    injectMusicPlayer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
