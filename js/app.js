/**
 * DEPRECATED & UNUSED
 * 
 * This file is legacy and is NO LONGER USED in the project.
 * All functionality has been migrated to firebase.js which uses:
 * - Firebase Firestore (Cloud Database)
 * - Firebase Authentication
 * 
 * The original app.js used localStorage which was replaced with Firestore.
 * This file is kept for historical reference only.
 * 
 * DO NOT import or use this file. Use firebase.js instead.
 */

// ===== STORAGE HELPERS ===== (DEPRECATED - USE FIREBASE.JS INSTEAD)

const store = {
  get: (key) => JSON.parse(localStorage.getItem(key) || 'null'),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

// ===== AUTH =====
const Auth = {
  currentUser: () => store.get('wp_current_user'),
  users: () => store.get('wp_users') || [],

  register(name, email, password, weddingDate, partnerName) {
    const users = this.users();
    if (users.find(u => u.email === email)) return { ok: false, msg: 'Email sudah terdaftar' };
    const user = { id: Date.now(), name, email, password, weddingDate, partnerName };
    users.push(user);
    store.set('wp_users', users);
    store.set('wp_current_user', user);
    return { ok: true };
  },

  login(email, password) {
    const user = this.users().find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, msg: 'Email atau password salah' };
    store.set('wp_current_user', user);
    return { ok: true };
  },

  logout() {
    localStorage.removeItem('wp_current_user');
    window.location.href = 'login.html';
  },

  require() {
    if (!this.currentUser()) window.location.href = 'login.html';
  }
};

// ===== BUDGET =====
const Budget = {
  key: () => `wp_budget_${Auth.currentUser()?.id}`,

  getAll() { return store.get(this.key()) || { total: 0, items: [] }; },

  save(data) { store.set(this.key(), data); },

  setTotal(amount) {
    const data = this.getAll();
    data.total = amount;
    this.save(data);
  },

  addItem(item) {
    const data = this.getAll();
    data.items.push({ ...item, id: Date.now() });
    this.save(data);
  },

  updateItem(id, updated) {
    const data = this.getAll();
    data.items = data.items.map(i => i.id === id ? { ...i, ...updated } : i);
    this.save(data);
  },

  deleteItem(id) {
    const data = this.getAll();
    data.items = data.items.filter(i => i.id !== id);
    this.save(data);
  },

  summary() {
    const data = this.getAll();
    const spent = data.items.reduce((s, i) => s + (i.actual || 0), 0);
    const planned = data.items.reduce((s, i) => s + (i.planned || 0), 0);
    return { total: data.total, spent, planned, remaining: data.total - spent };
  }
};

// ===== VENDORS =====
const Vendor = {
  key: () => `wp_vendors_${Auth.currentUser()?.id}`,

  getAll() { return store.get(this.key()) || []; },

  add(vendor) {
    const vendors = this.getAll();
    vendors.push({ ...vendor, id: Date.now() });
    store.set(this.key(), vendors);
  },

  update(id, updated) {
    const vendors = this.getAll().map(v => v.id === id ? { ...v, ...updated } : v);
    store.set(this.key(), vendors);
  },

  delete(id) {
    store.set(this.key(), this.getAll().filter(v => v.id !== id));
  }
};

// ===== RECOMMENDATIONS =====
const Recommendation = {
  key: () => `wp_recs_${Auth.currentUser()?.id}`,

  getAll() {
    const saved = store.get(this.key());
    if (saved) return saved;
    const defaults = [
      // ===== LAMPUNG =====
      { id: 101, name: 'Krakatau Photography', category: 'Fotografer', price: 4500000, rating: 5, location: 'Bandar Lampung', region: 'Lampung', desc: 'Fotografer pernikahan terbaik di Lampung, gaya candid & cinematic.', emoji: '📸', contact: '0812-7891-2345', isDefault: true },
      { id: 102, name: 'Siger Catering', category: 'Katering', price: 85000, rating: 5, location: 'Bandar Lampung', region: 'Lampung', desc: 'Katering khas Lampung & nasional, berpengalaman 15 tahun. Harga per pax.', emoji: '🍽️', contact: '0813-7892-3456', isDefault: true },
      { id: 103, name: 'Pesona Dekorasi Lampung', category: 'Dekorasi', price: 8000000, rating: 4, location: 'Bandar Lampung', region: 'Lampung', desc: 'Dekorasi pernikahan adat Lampung & modern, konsep garden dan indoor.', emoji: '💐', contact: '0814-7893-4567', isDefault: true },
      { id: 104, name: 'Grand Ballroom Lampung', category: 'Venue', price: 15000000, rating: 5, location: 'Bandar Lampung', region: 'Lampung', desc: 'Gedung pernikahan mewah kapasitas 800 orang di pusat kota Bandar Lampung.', emoji: '🏛️', contact: '0815-7894-5678', isDefault: true },
      { id: 105, name: 'Cantik MUA Lampung', category: 'MUA', price: 2000000, rating: 4, location: 'Bandar Lampung', region: 'Lampung', desc: 'Makeup artist profesional spesialis pengantin adat Lampung & modern.', emoji: '💄', contact: '0816-7895-6789', isDefault: true },
      { id: 106, name: 'Tapis Florist', category: 'Bunga', price: 2500000, rating: 4, location: 'Metro, Lampung', region: 'Lampung', desc: 'Rangkaian bunga segar untuk dekorasi & bouquet pengantin khas Lampung.', emoji: '🌸', contact: '0817-7896-7890', isDefault: true },
      { id: 107, name: 'Lampung Sinema Video', category: 'Videografer', price: 3500000, rating: 4, location: 'Bandar Lampung', region: 'Lampung', desc: 'Videografi sinematik & drone untuk pernikahan di Lampung.', emoji: '🎬', contact: '0818-7897-8901', isDefault: true },
      { id: 108, name: 'Harmoni Band Lampung', category: 'Hiburan', price: 3000000, rating: 4, location: 'Bandar Lampung', region: 'Lampung', desc: 'Live band & organ tunggal untuk resepsi pernikahan.', emoji: '🎵', contact: '0819-7898-9012', isDefault: true },

      // ===== JAKARTA =====
      { id: 201, name: 'Amore Photography', category: 'Fotografer', price: 8000000, rating: 5, location: 'Jakarta Selatan', region: 'Jakarta', desc: 'Spesialis foto pernikahan dengan gaya romantis & cinematic premium.', emoji: '📸', contact: '0812-3456-7890', isDefault: true },
      { id: 202, name: 'Royal Catering Jakarta', category: 'Katering', price: 175000, rating: 5, location: 'Jakarta Pusat', region: 'Jakarta', desc: 'Katering premium menu Indonesia, Western & Chinese. Harga per pax.', emoji: '🍽️', contact: '0813-2345-6789', isDefault: true },
      { id: 203, name: 'Elegant Decoration JKT', category: 'Dekorasi', price: 20000000, rating: 5, location: 'Jakarta Barat', region: 'Jakarta', desc: 'Dekorasi mewah konsep garden, rustic, modern & adat.', emoji: '💐', contact: '0814-3456-7891', isDefault: true },
      { id: 204, name: 'Dream Venue Hall', category: 'Venue', price: 35000000, rating: 5, location: 'Jakarta Selatan', region: 'Jakarta', desc: 'Gedung pernikahan mewah kapasitas 1000 orang, fasilitas lengkap.', emoji: '🏛️', contact: '0816-5678-9012', isDefault: true },
      { id: 205, name: 'Glam MUA Jakarta', category: 'MUA', price: 5000000, rating: 5, location: 'Jakarta Timur', region: 'Jakarta', desc: 'Makeup artist top Jakarta, spesialis pengantin modern & adat.', emoji: '💄', contact: '0817-6789-0123', isDefault: true },
      { id: 206, name: 'Floral Fantasy Jakarta', category: 'Bunga', price: 5000000, rating: 5, location: 'Jakarta Utara', region: 'Jakarta', desc: 'Florist premium untuk dekorasi & bouquet pengantin.', emoji: '🌸', contact: '0819-8901-2345', isDefault: true },
      { id: 207, name: 'Cinematic Wedding JKT', category: 'Videografer', price: 9000000, rating: 5, location: 'Jakarta Selatan', region: 'Jakarta', desc: 'Videografi sinematik & drone, hasil film-like berkualitas tinggi.', emoji: '🎬', contact: '0818-7890-1234', isDefault: true },

      // ===== BANDUNG =====
      { id: 301, name: 'Bandung Photography Studio', category: 'Fotografer', price: 6000000, rating: 5, location: 'Bandung', region: 'Jawa Barat', desc: 'Fotografer pernikahan Bandung dengan konsep vintage & modern.', emoji: '📸', contact: '0812-4567-8901', isDefault: true },
      { id: 302, name: 'Blossom Catering Bandung', category: 'Katering', price: 120000, rating: 5, location: 'Bandung', region: 'Jawa Barat', desc: 'Katering premium menu Sunda & Western. Harga per pax.', emoji: '🍽️', contact: '0813-4567-8902', isDefault: true },
      { id: 303, name: 'Villa Istana Bunga', category: 'Venue', price: 20000000, rating: 5, location: 'Lembang, Bandung', region: 'Jawa Barat', desc: 'Venue outdoor & indoor di kawasan Lembang, pemandangan indah.', emoji: '🏛️', contact: '0815-4567-8903', isDefault: true },
      { id: 304, name: 'Bridal Glow MUA Bandung', category: 'MUA', price: 3500000, rating: 5, location: 'Bandung', region: 'Jawa Barat', desc: 'Makeup artist profesional spesialis pengantin Sunda & modern.', emoji: '💄', contact: '0817-4567-8904', isDefault: true },
      { id: 305, name: 'Bunga Rampai Florist', category: 'Bunga', price: 3000000, rating: 4, location: 'Bandung', region: 'Jawa Barat', desc: 'Florist terpercaya untuk dekorasi & bouquet pengantin di Bandung.', emoji: '🌸', contact: '0819-4567-8905', isDefault: true },

      // ===== YOGYAKARTA =====
      { id: 401, name: 'Jogja Wedding Photo', category: 'Fotografer', price: 5000000, rating: 5, location: 'Yogyakarta', region: 'Yogyakarta', desc: 'Fotografer pernikahan Jogja, spesialis konsep Jawa klasik & modern.', emoji: '📸', contact: '0812-5678-9012', isDefault: true },
      { id: 402, name: 'Prambanan Catering', category: 'Katering', price: 90000, rating: 4, location: 'Yogyakarta', region: 'Yogyakarta', desc: 'Katering khas Jawa & nasional, berpengalaman untuk pernikahan adat.', emoji: '🍽️', contact: '0813-5678-9013', isDefault: true },
      { id: 403, name: 'Pendopo Agung Venue', category: 'Venue', price: 18000000, rating: 5, location: 'Yogyakarta', region: 'Yogyakarta', desc: 'Pendopo mewah bergaya Jawa klasik, kapasitas 600 orang.', emoji: '🏛️', contact: '0815-5678-9014', isDefault: true },
      { id: 404, name: 'Sweet Moments Video Jogja', category: 'Videografer', price: 5500000, rating: 5, location: 'Yogyakarta', region: 'Yogyakarta', desc: 'Videografi sinematik & drone untuk pernikahan di Yogyakarta.', emoji: '🎬', contact: '0818-5678-9015', isDefault: true },
      { id: 405, name: 'Melati Dekorasi Jogja', category: 'Dekorasi', price: 10000000, rating: 4, location: 'Yogyakarta', region: 'Yogyakarta', desc: 'Dekorasi pernikahan adat Jawa & modern di Yogyakarta.', emoji: '💐', contact: '0814-5678-9016', isDefault: true },
      { id: 406, name: 'Keraton MUA Jogja', category: 'MUA', price: 2800000, rating: 5, location: 'Yogyakarta', region: 'Yogyakarta', desc: 'Makeup artist spesialis pengantin adat Jawa & modern.', emoji: '💄', contact: '0817-5678-9017', isDefault: true },

      // ===== SURABAYA =====
      { id: 501, name: 'Surabaya Wedding Photo', category: 'Fotografer', price: 7000000, rating: 5, location: 'Surabaya', region: 'Jawa Timur', desc: 'Fotografer pernikahan profesional di Surabaya & sekitarnya.', emoji: '📸', contact: '0812-6789-0123', isDefault: true },
      { id: 502, name: 'Majapahit Catering', category: 'Katering', price: 130000, rating: 5, location: 'Surabaya', region: 'Jawa Timur', desc: 'Katering premium menu Jawa Timur & nasional. Harga per pax.', emoji: '🍽️', contact: '0813-6789-0124', isDefault: true },
      { id: 503, name: 'Grand City Ballroom', category: 'Venue', price: 28000000, rating: 5, location: 'Surabaya', region: 'Jawa Timur', desc: 'Ballroom mewah di pusat kota Surabaya, kapasitas 700 orang.', emoji: '🏛️', contact: '0815-6789-0125', isDefault: true },
      { id: 504, name: 'Harmony Music Surabaya', category: 'Hiburan', price: 5000000, rating: 4, location: 'Surabaya', region: 'Jawa Timur', desc: 'Live band & akustik profesional untuk resepsi pernikahan.', emoji: '🎵', contact: '0815-4567-8901', isDefault: true },
      { id: 505, name: 'Anggrek MUA Surabaya', category: 'MUA', price: 3200000, rating: 4, location: 'Surabaya', region: 'Jawa Timur', desc: 'Makeup artist terpercaya untuk pengantin di Surabaya.', emoji: '💄', contact: '0817-6789-0126', isDefault: true },

      // ===== MEDAN =====
      { id: 601, name: 'Medan Wedding Photography', category: 'Fotografer', price: 5500000, rating: 5, location: 'Medan', region: 'Sumatera Utara', desc: 'Fotografer pernikahan Medan, spesialis adat Batak & modern.', emoji: '📸', contact: '0812-7890-1234', isDefault: true },
      { id: 602, name: 'Batak Catering Medan', category: 'Katering', price: 100000, rating: 4, location: 'Medan', region: 'Sumatera Utara', desc: 'Katering khas Batak & nasional untuk pernikahan adat dan modern.', emoji: '🍽️', contact: '0813-7890-1235', isDefault: true },
      { id: 603, name: 'Tiara Convention Hall', category: 'Venue', price: 20000000, rating: 5, location: 'Medan', region: 'Sumatera Utara', desc: 'Gedung pernikahan terbesar di Medan, kapasitas 1000 orang.', emoji: '🏛️', contact: '0815-7890-1236', isDefault: true },
      { id: 604, name: 'Ulos Dekorasi Medan', category: 'Dekorasi', price: 12000000, rating: 4, location: 'Medan', region: 'Sumatera Utara', desc: 'Dekorasi pernikahan adat Batak & modern di Medan.', emoji: '💐', contact: '0814-7890-1237', isDefault: true },
      { id: 605, name: 'Cantik MUA Medan', category: 'MUA', price: 2500000, rating: 4, location: 'Medan', region: 'Sumatera Utara', desc: 'Makeup artist spesialis pengantin adat Batak & modern.', emoji: '💄', contact: '0817-7890-1238', isDefault: true },

      // ===== MAKASSAR =====
      { id: 701, name: 'Makassar Wedding Photo', category: 'Fotografer', price: 5000000, rating: 5, location: 'Makassar', region: 'Sulawesi Selatan', desc: 'Fotografer pernikahan Makassar, spesialis adat Bugis-Makassar & modern.', emoji: '📸', contact: '0812-8901-2345', isDefault: true },
      { id: 702, name: 'Coto Catering Makassar', category: 'Katering', price: 95000, rating: 5, location: 'Makassar', region: 'Sulawesi Selatan', desc: 'Katering khas Makassar & nasional, berpengalaman untuk pernikahan adat.', emoji: '🍽️', contact: '0813-8901-2346', isDefault: true },
      { id: 703, name: 'Celebes Convention Center', category: 'Venue', price: 22000000, rating: 5, location: 'Makassar', region: 'Sulawesi Selatan', desc: 'Venue pernikahan terbesar di Makassar, kapasitas 800 orang.', emoji: '🏛️', contact: '0815-8901-2347', isDefault: true },
      { id: 704, name: 'Baju Bodo Dekorasi', category: 'Dekorasi', price: 11000000, rating: 4, location: 'Makassar', region: 'Sulawesi Selatan', desc: 'Dekorasi pernikahan adat Bugis-Makassar & modern.', emoji: '💐', contact: '0814-8901-2348', isDefault: true },
      { id: 705, name: 'Sulawesi MUA Studio', category: 'MUA', price: 2800000, rating: 4, location: 'Makassar', region: 'Sulawesi Selatan', desc: 'Makeup artist spesialis pengantin adat Bugis & modern.', emoji: '💄', contact: '0817-8901-2349', isDefault: true },

      // ===== BALI =====
      { id: 801, name: 'Bali Wedding Photography', category: 'Fotografer', price: 10000000, rating: 5, location: 'Denpasar, Bali', region: 'Bali', desc: 'Fotografer pernikahan Bali, spesialis outdoor & beach wedding.', emoji: '📸', contact: '0812-9012-3456', isDefault: true },
      { id: 802, name: 'Ubud Catering Bali', category: 'Katering', price: 200000, rating: 5, location: 'Ubud, Bali', region: 'Bali', desc: 'Katering premium menu Bali & internasional. Harga per pax.', emoji: '🍽️', contact: '0813-9012-3457', isDefault: true },
      { id: 803, name: 'Cliff Venue Uluwatu', category: 'Venue', price: 50000000, rating: 5, location: 'Uluwatu, Bali', region: 'Bali', desc: 'Venue pernikahan tepi tebing dengan pemandangan laut Bali yang memukau.', emoji: '🏛️', contact: '0815-9012-3458', isDefault: true },
      { id: 804, name: 'Frangipani Decoration Bali', category: 'Dekorasi', price: 25000000, rating: 5, location: 'Seminyak, Bali', region: 'Bali', desc: 'Dekorasi pernikahan Bali & internasional, konsep tropical & luxury.', emoji: '💐', contact: '0814-9012-3459', isDefault: true },
      { id: 805, name: 'Bali Bridal MUA', category: 'MUA', price: 6000000, rating: 5, location: 'Kuta, Bali', region: 'Bali', desc: 'Makeup artist internasional spesialis pengantin Bali & modern.', emoji: '💄', contact: '0817-9012-3460', isDefault: true },
      { id: 806, name: 'Bali Drone Videography', category: 'Videografer', price: 12000000, rating: 5, location: 'Denpasar, Bali', region: 'Bali', desc: 'Videografi sinematik & drone aerial untuk pernikahan di Bali.', emoji: '🎬', contact: '0818-9012-3461', isDefault: true },

      // ===== PALEMBANG =====
      { id: 901, name: 'Sriwijaya Wedding Photo', category: 'Fotografer', price: 4000000, rating: 4, location: 'Palembang', region: 'Sumatera Selatan', desc: 'Fotografer pernikahan Palembang, spesialis adat Palembang & modern.', emoji: '📸', contact: '0812-0123-4567', isDefault: true },
      { id: 902, name: 'Pempek Catering Palembang', category: 'Katering', price: 80000, rating: 4, location: 'Palembang', region: 'Sumatera Selatan', desc: 'Katering khas Palembang & nasional untuk pernikahan.', emoji: '🍽️', contact: '0813-0123-4568', isDefault: true },
      { id: 903, name: 'Jakabaring Convention', category: 'Venue', price: 16000000, rating: 4, location: 'Palembang', region: 'Sumatera Selatan', desc: 'Gedung pernikahan modern di Palembang, kapasitas 600 orang.', emoji: '🏛️', contact: '0815-0123-4569', isDefault: true },
      { id: 904, name: 'Songket Dekorasi Palembang', category: 'Dekorasi', price: 9000000, rating: 4, location: 'Palembang', region: 'Sumatera Selatan', desc: 'Dekorasi pernikahan adat Palembang & modern.', emoji: '💐', contact: '0814-0123-4570', isDefault: true },

      // ===== SEMARANG =====
      { id: 1001, name: 'Semarang Wedding Photo', category: 'Fotografer', price: 5000000, rating: 4, location: 'Semarang', region: 'Jawa Tengah', desc: 'Fotografer pernikahan Semarang & sekitarnya.', emoji: '📸', contact: '0812-1234-5678', isDefault: true },
      { id: 1002, name: 'Lawang Sewu Catering', category: 'Katering', price: 100000, rating: 4, location: 'Semarang', region: 'Jawa Tengah', desc: 'Katering khas Jawa Tengah & nasional. Harga per pax.', emoji: '🍽️', contact: '0813-1234-5679', isDefault: true },
      { id: 1003, name: 'Puri Gedeh Venue', category: 'Venue', price: 17000000, rating: 5, location: 'Semarang', region: 'Jawa Tengah', desc: 'Venue pernikahan bersejarah di Semarang, kapasitas 500 orang.', emoji: '🏛️', contact: '0815-1234-5680', isDefault: true },
      { id: 1004, name: 'Batik Dekorasi Semarang', category: 'Dekorasi', price: 9500000, rating: 4, location: 'Semarang', region: 'Jawa Tengah', desc: 'Dekorasi pernikahan adat Jawa & modern di Semarang.', emoji: '💐', contact: '0814-1234-5681', isDefault: true },
    ];
    store.set(this.key(), defaults);
    return defaults;
  },

  add(rec) {
    const recs = this.getAll();
    recs.push({ ...rec, id: Date.now(), isDefault: false });
    store.set(this.key(), recs);
  },

  update(id, updated) {
    const recs = this.getAll().map(r => r.id === id ? { ...r, ...updated } : r);
    store.set(this.key(), recs);
  },

  delete(id) {
    store.set(this.key(), this.getAll().filter(r => r.id !== id));
  }
};

// ===== CHECKLIST =====
const Checklist = {
  key: () => `wp_checklist_${Auth.currentUser()?.id}`,

  getAll() {
    const saved = store.get(this.key());
    if (saved) return saved;
    const defaults = [
      { id: 1, task: 'Tentukan tanggal pernikahan', category: 'Persiapan Awal', done: false, priority: 'Tinggi' },
      { id: 2, task: 'Buat anggaran pernikahan', category: 'Persiapan Awal', done: false, priority: 'Tinggi' },
      { id: 3, task: 'Buat daftar tamu', category: 'Persiapan Awal', done: false, priority: 'Tinggi' },
      { id: 4, task: 'Pilih & booking venue', category: 'Venue', done: false, priority: 'Tinggi' },
      { id: 5, task: 'Pilih katering', category: 'Katering', done: false, priority: 'Tinggi' },
      { id: 6, task: 'Booking fotografer', category: 'Dokumentasi', done: false, priority: 'Tinggi' },
      { id: 7, task: 'Booking videografer', category: 'Dokumentasi', done: false, priority: 'Sedang' },
      { id: 8, task: 'Pilih & fitting gaun pengantin', category: 'Busana', done: false, priority: 'Tinggi' },
      { id: 9, task: 'Pilih jas pengantin pria', category: 'Busana', done: false, priority: 'Tinggi' },
      { id: 10, task: 'Booking MUA', category: 'Kecantikan', done: false, priority: 'Tinggi' },
      { id: 11, task: 'Desain & cetak undangan', category: 'Undangan', done: false, priority: 'Sedang' },
      { id: 12, task: 'Kirim undangan', category: 'Undangan', done: false, priority: 'Sedang' },
      { id: 13, task: 'Pilih dekorasi & florist', category: 'Dekorasi', done: false, priority: 'Sedang' },
      { id: 14, task: 'Pilih cincin pernikahan', category: 'Perhiasan', done: false, priority: 'Tinggi' },
      { id: 15, task: 'Urus dokumen pernikahan (KUA/Catatan Sipil)', category: 'Administrasi', done: false, priority: 'Tinggi' },
      { id: 16, task: 'Booking hiburan / band', category: 'Hiburan', done: false, priority: 'Rendah' },
      { id: 17, task: 'Rencanakan bulan madu', category: 'Bulan Madu', done: false, priority: 'Sedang' },
      { id: 18, task: 'Beli souvenir tamu', category: 'Souvenir', done: false, priority: 'Rendah' },
      { id: 19, task: 'Gladi resik / rehearsal', category: 'Hari H', done: false, priority: 'Tinggi' },
      { id: 20, task: 'Konfirmasi semua vendor H-7', category: 'Hari H', done: false, priority: 'Tinggi' },
    ];
    store.set(this.key(), defaults);
    return defaults;
  },

  add(task) {
    const list = this.getAll();
    list.push({ ...task, id: Date.now() });
    store.set(this.key(), list);
  },

  toggle(id) {
    const list = this.getAll().map(t => t.id === id ? { ...t, done: !t.done } : t);
    store.set(this.key(), list);
  },

  update(id, updated) {
    const list = this.getAll().map(t => t.id === id ? { ...t, ...updated } : t);
    store.set(this.key(), list);
  },

  delete(id) {
    store.set(this.key(), this.getAll().filter(t => t.id !== id));
  },

  progress() {
    const list = this.getAll();
    const done = list.filter(t => t.done).length;
    return { total: list.length, done, pct: list.length ? Math.round(done / list.length * 100) : 0 };
  }
};

// ===== GUEST LIST =====
const GuestList = {
  key: () => `wp_guests_${Auth.currentUser()?.id}`,

  getAll() { return store.get(this.key()) || []; },

  add(guest) {
    const list = this.getAll();
    list.push({ ...guest, id: Date.now() });
    store.set(this.key(), list);
  },

  update(id, updated) {
    const list = this.getAll().map(g => g.id === id ? { ...g, ...updated } : g);
    store.set(this.key(), list);
  },

  delete(id) {
    store.set(this.key(), this.getAll().filter(g => g.id !== id));
  },

  summary() {
    const list = this.getAll();
    const confirmed = list.filter(g => g.rsvp === 'Hadir').length;
    const declined = list.filter(g => g.rsvp === 'Tidak Hadir').length;
    const pending = list.filter(g => g.rsvp === 'Belum Konfirmasi').length;
    const totalPax = list.filter(g => g.rsvp === 'Hadir').reduce((s, g) => s + (g.pax || 1), 0);
    return { total: list.length, confirmed, declined, pending, totalPax };
  }
};

// ===== TIMELINE =====
const Timeline = {
  key: () => `wp_timeline_${Auth.currentUser()?.id}`,

  getAll() {
    const saved = store.get(this.key());
    if (saved) return saved;
    const defaults = [
      { id: 1, time: '06:00', event: 'Persiapan Pengantin Wanita', desc: 'Makeup, hair do, dan pemakaian busana', pic: 'Tim MUA', category: 'Persiapan' },
      { id: 2, time: '07:00', event: 'Persiapan Pengantin Pria', desc: 'Grooming dan pemakaian jas', pic: 'Keluarga', category: 'Persiapan' },
      { id: 3, time: '08:00', event: 'Dekorasi Venue Selesai', desc: 'Pengecekan akhir dekorasi', pic: 'Tim Dekorasi', category: 'Venue' },
      { id: 4, time: '09:00', event: 'Tamu Mulai Berdatangan', desc: 'Registrasi tamu & penyambutan', pic: 'Panitia', category: 'Acara' },
      { id: 5, time: '10:00', event: 'Prosesi Akad Nikah', desc: 'Ijab kabul & penandatanganan dokumen', pic: 'Penghulu', category: 'Akad' },
      { id: 6, time: '11:00', event: 'Sesi Foto Resmi', desc: 'Foto bersama keluarga & sesi couple', pic: 'Fotografer', category: 'Dokumentasi' },
      { id: 7, time: '12:00', event: 'Makan Siang & Resepsi', desc: 'Pembukaan resepsi & makan bersama', pic: 'MC', category: 'Resepsi' },
      { id: 8, time: '13:00', event: 'Hiburan & Penampilan', desc: 'Live music & entertainment', pic: 'Band/Hiburan', category: 'Hiburan' },
      { id: 9, time: '14:00', event: 'Potong Kue & Lempar Buket', desc: 'Tradisi potong kue pengantin', pic: 'MC', category: 'Resepsi' },
      { id: 10, time: '15:00', event: 'Penutupan Resepsi', desc: 'Ucapan terima kasih & pelepasan tamu', pic: 'MC', category: 'Penutup' },
    ];
    store.set(this.key(), defaults);
    return defaults;
  },

  add(item) {
    const list = this.getAll();
    list.push({ ...item, id: Date.now() });
    list.sort((a, b) => a.time.localeCompare(b.time));
    store.set(this.key(), list);
  },

  update(id, updated) {
    const list = this.getAll().map(t => t.id === id ? { ...t, ...updated } : t);
    list.sort((a, b) => a.time.localeCompare(b.time));
    store.set(this.key(), list);
  },

  delete(id) {
    store.set(this.key(), this.getAll().filter(t => t.id !== id));
  }
};

// ===== PROFILE =====
const Profile = {
  update(data) {
    const user = Auth.currentUser();
    const updated = { ...user, ...data };
    store.set('wp_current_user', updated);
    const users = Auth.users().map(u => u.id === user.id ? updated : u);
    store.set('wp_users', users);
    return updated;
  }
};

// ===== UTILS =====
const fmt = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function toast(msg, type = 'success') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = `toast show ${type}`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function setupNav() {
  const user = Auth.currentUser();
  if (!user) return;
  const el = document.getElementById('nav-user-name');
  if (el) el.textContent = user.name;
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});
