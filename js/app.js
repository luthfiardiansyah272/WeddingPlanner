// ===== STORAGE HELPERS =====
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
    // Default recommendations
    const defaults = [
      { id: 1, name: 'Amore Photography', category: 'Fotografer', price: 8000000, rating: 5, location: 'Jakarta', desc: 'Spesialis foto pernikahan dengan gaya romantis & cinematic.', emoji: '📸', contact: '0812-3456-7890', isDefault: true },
      { id: 2, name: 'Blossom Catering', category: 'Katering', price: 150000, rating: 5, location: 'Bandung', desc: 'Katering premium dengan menu Indonesia & Western. Harga per pax.', emoji: '🍽️', contact: '0813-2345-6789', isDefault: true },
      { id: 3, name: 'Elegant Decoration', category: 'Dekorasi', price: 15000000, rating: 4, location: 'Jakarta', desc: 'Dekorasi mewah dengan konsep garden, rustic, dan modern.', emoji: '💐', contact: '0814-3456-7891', isDefault: true },
      { id: 4, name: 'Harmony Music', category: 'Hiburan', price: 5000000, rating: 4, location: 'Surabaya', desc: 'Live band & akustik untuk acara pernikahan.', emoji: '🎵', contact: '0815-4567-8901', isDefault: true },
      { id: 5, name: 'Dream Venue Hall', category: 'Venue', price: 25000000, rating: 5, location: 'Jakarta', desc: 'Gedung pernikahan mewah kapasitas 500 orang.', emoji: '🏛️', contact: '0816-5678-9012', isDefault: true },
      { id: 6, name: 'Bridal Glow MUA', category: 'MUA', price: 3500000, rating: 5, location: 'Bandung', desc: 'Makeup artist profesional untuk pengantin & keluarga.', emoji: '💄', contact: '0817-6789-0123', isDefault: true },
      { id: 7, name: 'Sweet Moments Video', category: 'Videografer', price: 6000000, rating: 4, location: 'Yogyakarta', desc: 'Videografi sinematik untuk momen pernikahan tak terlupakan.', emoji: '🎬', contact: '0818-7890-1234', isDefault: true },
      { id: 8, name: 'Floral Fantasy', category: 'Bunga', price: 4000000, rating: 4, location: 'Jakarta', desc: 'Rangkaian bunga segar untuk dekorasi & bouquet pengantin.', emoji: '🌸', contact: '0819-8901-2345', isDefault: true },
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
