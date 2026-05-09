// ===== FIREBASE CONFIG =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8qqaI6F3ht6Gp1LdE_T-29uAgWAXNJBk",
  authDomain: "wedding-planner-app-id.firebaseapp.com",
  projectId: "wedding-planner-app-id",
  storageBucket: "wedding-planner-app-id.firebasestorage.app",
  messagingSenderId: "539026614183",
  appId: "1:539026614183:web:5e70a5dc8d993e7a7f3882"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== AUTH =====
const Auth = {
  async register(name, email, password, weddingDate, partnerName) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: name || email.split('@')[0],
        email,
        weddingDate: weddingDate || '',
        partnerName: partnerName || '',
        location: '',
        theme: ''
      });
      return { ok: true };
    } catch (e) {
      console.error('Register error:', e.code, e.message);
      const msg = e.code === 'auth/email-already-in-use' ? 'Email sudah terdaftar' :
                  e.code === 'auth/weak-password' ? 'Password minimal 6 karakter' :
                  e.code === 'auth/invalid-email' ? 'Format email tidak valid' :
                  e.code === 'auth/network-request-failed' ? 'Gagal koneksi, cek internet kamu' :
                  e.message;
      return { ok: false, msg };
    }
  },

  async login(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (e) {
      console.error('Login error:', e.code, e.message);
      const msg = e.code === 'auth/user-not-found' ? 'Email tidak terdaftar' :
                  e.code === 'auth/wrong-password' ? 'Password salah' :
                  e.code === 'auth/invalid-credential' ? 'Email atau password salah' :
                  e.code === 'auth/invalid-email' ? 'Format email tidak valid' :
                  e.code === 'auth/user-disabled' ? 'Akun dinonaktifkan' :
                  e.code === 'auth/too-many-requests' ? 'Terlalu banyak percobaan, coba lagi nanti' :
                  e.code === 'auth/network-request-failed' ? 'Gagal koneksi, cek internet kamu' :
                  'Email atau password salah';
      return { ok: false, msg };
    }
  },

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { ok: true };
    } catch (e) {
      const msg = e.code === 'auth/user-not-found' ? 'Email tidak terdaftar' :
                  e.code === 'auth/invalid-email' ? 'Format email tidak valid' : e.message;
      return { ok: false, msg };
    }
  },

  async logout() {
    await signOut(auth);
    window.location.replace('login.html');
  },

  async getProfile() {
    const user = auth.currentUser;
    if (!user) return null;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) return { uid: user.uid, ...snap.data() };
    const fallback = { name: user.email.split('@')[0], email: user.email, partnerName: '', weddingDate: '', location: '', theme: '' };
    await setDoc(doc(db, 'users', user.uid), fallback);
    return { uid: user.uid, ...fallback };
  },

  // Halaman protected: tunggu auth siap, redirect ke login jika belum login
  requireAuth(callback) {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Tunggu sebentar untuk antisipasi race condition saat register
        setTimeout(() => {
          if (!auth.currentUser) window.location.replace('login.html');
        }, 1000);
        return;
      }
      showLoading(true);
      try {
        await callback(user);
      } catch (e) {
        console.error('Error:', e);
        showLoading(false);
      }
    });
  },

  // Halaman login: jika sudah login redirect ke dashboard
  redirectIfLoggedIn() {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub(); // stop listener
        window.location.replace('index.html');
      }
    });
  }
};

// ===== BUDGET =====
const Budget = {
  async get(uid) {
    const snap = await getDoc(doc(db, 'budgets', uid));
    return snap.exists() ? snap.data() : { total: 0, items: [] };
  },
  async setTotal(uid, amount) {
    const data = await this.get(uid);
    data.total = amount;
    await setDoc(doc(db, 'budgets', uid), data);
  },
  async addItem(uid, item) {
    const data = await this.get(uid);
    data.items.push({ ...item, id: Date.now() });
    await setDoc(doc(db, 'budgets', uid), data);
  },
  async updateItem(uid, id, updated) {
    const data = await this.get(uid);
    data.items = data.items.map(i => i.id === id ? { ...i, ...updated } : i);
    await setDoc(doc(db, 'budgets', uid), data);
  },
  async deleteItem(uid, id) {
    const data = await this.get(uid);
    data.items = data.items.filter(i => i.id !== id);
    await setDoc(doc(db, 'budgets', uid), data);
  },
  summary(data) {
    const spent = data.items.reduce((s, i) => s + (i.actual || 0), 0);
    const planned = data.items.reduce((s, i) => s + (i.planned || 0), 0);
    return { total: data.total, spent, planned, remaining: data.total - spent };
  }
};

// ===== VENDORS =====
const Vendor = {
  async getAll(uid) {
    const snap = await getDocs(collection(db, 'vendors', uid, 'items'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async add(uid, vendor) {
    await addDoc(collection(db, 'vendors', uid, 'items'), vendor);
  },
  async update(uid, id, updated) {
    await updateDoc(doc(db, 'vendors', uid, 'items', id), updated);
  },
  async delete(uid, id) {
    await deleteDoc(doc(db, 'vendors', uid, 'items', id));
  }
};

// ===== RECOMMENDATIONS =====
const DEFAULT_RECS = [
  { name: 'Krakatau Photography', category: 'Fotografer', price: 4500000, rating: 5, location: 'Bandar Lampung', region: 'Lampung', desc: 'Fotografer pernikahan terbaik di Lampung, gaya candid & cinematic.', emoji: '📸', contact: '0812-7891-2345', isDefault: true },
  { name: 'Siger Catering', category: 'Katering', price: 85000, rating: 5, location: 'Bandar Lampung', region: 'Lampung', desc: 'Katering khas Lampung & nasional, berpengalaman 15 tahun. Harga per pax.', emoji: '🍽️', contact: '0813-7892-3456', isDefault: true },
  { name: 'Pesona Dekorasi Lampung', category: 'Dekorasi', price: 8000000, rating: 4, location: 'Bandar Lampung', region: 'Lampung', desc: 'Dekorasi pernikahan adat Lampung & modern.', emoji: '💐', contact: '0814-7893-4567', isDefault: true },
  { name: 'Grand Ballroom Lampung', category: 'Venue', price: 15000000, rating: 5, location: 'Bandar Lampung', region: 'Lampung', desc: 'Gedung pernikahan mewah kapasitas 800 orang di pusat kota Bandar Lampung.', emoji: '🏛️', contact: '0815-7894-5678', isDefault: true },
  { name: 'Cantik MUA Lampung', category: 'MUA', price: 2000000, rating: 4, location: 'Bandar Lampung', region: 'Lampung', desc: 'Makeup artist profesional spesialis pengantin adat Lampung & modern.', emoji: '💄', contact: '0816-7895-6789', isDefault: true },
  { name: 'Lampung Sinema Video', category: 'Videografer', price: 3500000, rating: 4, location: 'Bandar Lampung', region: 'Lampung', desc: 'Videografi sinematik & drone untuk pernikahan di Lampung.', emoji: '🎬', contact: '0818-7897-8901', isDefault: true },
  { name: 'Amore Photography', category: 'Fotografer', price: 8000000, rating: 5, location: 'Jakarta Selatan', region: 'Jakarta', desc: 'Spesialis foto pernikahan dengan gaya romantis & cinematic premium.', emoji: '📸', contact: '0812-3456-7890', isDefault: true },
  { name: 'Royal Catering Jakarta', category: 'Katering', price: 175000, rating: 5, location: 'Jakarta Pusat', region: 'Jakarta', desc: 'Katering premium menu Indonesia, Western & Chinese. Harga per pax.', emoji: '🍽️', contact: '0813-2345-6789', isDefault: true },
  { name: 'Dream Venue Hall', category: 'Venue', price: 35000000, rating: 5, location: 'Jakarta Selatan', region: 'Jakarta', desc: 'Gedung pernikahan mewah kapasitas 1000 orang, fasilitas lengkap.', emoji: '🏛️', contact: '0816-5678-9012', isDefault: true },
  { name: 'Glam MUA Jakarta', category: 'MUA', price: 5000000, rating: 5, location: 'Jakarta Timur', region: 'Jakarta', desc: 'Makeup artist top Jakarta, spesialis pengantin modern & adat.', emoji: '💄', contact: '0817-6789-0123', isDefault: true },
  { name: 'Bandung Photography Studio', category: 'Fotografer', price: 6000000, rating: 5, location: 'Bandung', region: 'Jawa Barat', desc: 'Fotografer pernikahan Bandung dengan konsep vintage & modern.', emoji: '📸', contact: '0812-4567-8901', isDefault: true },
  { name: 'Blossom Catering Bandung', category: 'Katering', price: 120000, rating: 5, location: 'Bandung', region: 'Jawa Barat', desc: 'Katering premium menu Sunda & Western. Harga per pax.', emoji: '🍽️', contact: '0813-4567-8902', isDefault: true },
  { name: 'Villa Istana Bunga', category: 'Venue', price: 20000000, rating: 5, location: 'Lembang, Bandung', region: 'Jawa Barat', desc: 'Venue outdoor & indoor di kawasan Lembang, pemandangan indah.', emoji: '🏛️', contact: '0815-4567-8903', isDefault: true },
  { name: 'Jogja Wedding Photo', category: 'Fotografer', price: 5000000, rating: 5, location: 'Yogyakarta', region: 'Yogyakarta', desc: 'Fotografer pernikahan Jogja, spesialis konsep Jawa klasik & modern.', emoji: '📸', contact: '0812-5678-9012', isDefault: true },
  { name: 'Pendopo Agung Venue', category: 'Venue', price: 18000000, rating: 5, location: 'Yogyakarta', region: 'Yogyakarta', desc: 'Pendopo mewah bergaya Jawa klasik, kapasitas 600 orang.', emoji: '🏛️', contact: '0815-5678-9014', isDefault: true },
  { name: 'Keraton MUA Jogja', category: 'MUA', price: 2800000, rating: 5, location: 'Yogyakarta', region: 'Yogyakarta', desc: 'Makeup artist spesialis pengantin adat Jawa & modern.', emoji: '💄', contact: '0817-5678-9017', isDefault: true },
  { name: 'Surabaya Wedding Photo', category: 'Fotografer', price: 7000000, rating: 5, location: 'Surabaya', region: 'Jawa Timur', desc: 'Fotografer pernikahan profesional di Surabaya & sekitarnya.', emoji: '📸', contact: '0812-6789-0123', isDefault: true },
  { name: 'Grand City Ballroom', category: 'Venue', price: 28000000, rating: 5, location: 'Surabaya', region: 'Jawa Timur', desc: 'Ballroom mewah di pusat kota Surabaya, kapasitas 700 orang.', emoji: '🏛️', contact: '0815-6789-0125', isDefault: true },
  { name: 'Medan Wedding Photography', category: 'Fotografer', price: 5500000, rating: 5, location: 'Medan', region: 'Sumatera Utara', desc: 'Fotografer pernikahan Medan, spesialis adat Batak & modern.', emoji: '📸', contact: '0812-7890-1234', isDefault: true },
  { name: 'Tiara Convention Hall', category: 'Venue', price: 20000000, rating: 5, location: 'Medan', region: 'Sumatera Utara', desc: 'Gedung pernikahan terbesar di Medan, kapasitas 1000 orang.', emoji: '🏛️', contact: '0815-7890-1236', isDefault: true },
  { name: 'Bali Wedding Photography', category: 'Fotografer', price: 10000000, rating: 5, location: 'Denpasar, Bali', region: 'Bali', desc: 'Fotografer pernikahan Bali, spesialis outdoor & beach wedding.', emoji: '📸', contact: '0812-9012-3456', isDefault: true },
  { name: 'Cliff Venue Uluwatu', category: 'Venue', price: 50000000, rating: 5, location: 'Uluwatu, Bali', region: 'Bali', desc: 'Venue pernikahan tepi tebing dengan pemandangan laut Bali yang memukau.', emoji: '🏛️', contact: '0815-9012-3458', isDefault: true },
  { name: 'Bali Bridal MUA', category: 'MUA', price: 6000000, rating: 5, location: 'Kuta, Bali', region: 'Bali', desc: 'Makeup artist internasional spesialis pengantin Bali & modern.', emoji: '💄', contact: '0817-9012-3460', isDefault: true },
  { name: 'Makassar Wedding Photo', category: 'Fotografer', price: 5000000, rating: 5, location: 'Makassar', region: 'Sulawesi Selatan', desc: 'Fotografer pernikahan Makassar, spesialis adat Bugis-Makassar & modern.', emoji: '📸', contact: '0812-8901-2345', isDefault: true },
  { name: 'Celebes Convention Center', category: 'Venue', price: 22000000, rating: 5, location: 'Makassar', region: 'Sulawesi Selatan', desc: 'Venue pernikahan terbesar di Makassar, kapasitas 800 orang.', emoji: '🏛️', contact: '0815-8901-2347', isDefault: true },
];

const Recommendation = {
  async getAll(uid) {
    const snap = await getDocs(collection(db, 'recommendations', uid, 'items'));
    if (snap.empty) {
      // Seed default data
      for (const rec of DEFAULT_RECS) {
        await addDoc(collection(db, 'recommendations', uid, 'items'), rec);
      }
      const snap2 = await getDocs(collection(db, 'recommendations', uid, 'items'));
      return snap2.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async add(uid, rec) {
    await addDoc(collection(db, 'recommendations', uid, 'items'), { ...rec, isDefault: false });
  },
  async update(uid, id, updated) {
    await updateDoc(doc(db, 'recommendations', uid, 'items', id), updated);
  },
  async delete(uid, id) {
    await deleteDoc(doc(db, 'recommendations', uid, 'items', id));
  }
};

// ===== CHECKLIST =====
const DEFAULT_CHECKLIST = [
  { task: 'Tentukan tanggal pernikahan', category: 'Persiapan Awal', done: false, priority: 'Tinggi' },
  { task: 'Buat anggaran pernikahan', category: 'Persiapan Awal', done: false, priority: 'Tinggi' },
  { task: 'Buat daftar tamu', category: 'Persiapan Awal', done: false, priority: 'Tinggi' },
  { task: 'Pilih & booking venue', category: 'Venue', done: false, priority: 'Tinggi' },
  { task: 'Pilih katering', category: 'Katering', done: false, priority: 'Tinggi' },
  { task: 'Booking fotografer', category: 'Dokumentasi', done: false, priority: 'Tinggi' },
  { task: 'Booking videografer', category: 'Dokumentasi', done: false, priority: 'Sedang' },
  { task: 'Pilih & fitting gaun pengantin', category: 'Busana', done: false, priority: 'Tinggi' },
  { task: 'Pilih jas pengantin pria', category: 'Busana', done: false, priority: 'Tinggi' },
  { task: 'Booking MUA', category: 'Kecantikan', done: false, priority: 'Tinggi' },
  { task: 'Desain & cetak undangan', category: 'Undangan', done: false, priority: 'Sedang' },
  { task: 'Kirim undangan', category: 'Undangan', done: false, priority: 'Sedang' },
  { task: 'Pilih dekorasi & florist', category: 'Dekorasi', done: false, priority: 'Sedang' },
  { task: 'Pilih cincin pernikahan', category: 'Perhiasan', done: false, priority: 'Tinggi' },
  { task: 'Urus dokumen pernikahan (KUA/Catatan Sipil)', category: 'Administrasi', done: false, priority: 'Tinggi' },
  { task: 'Booking hiburan / band', category: 'Hiburan', done: false, priority: 'Rendah' },
  { task: 'Rencanakan bulan madu', category: 'Bulan Madu', done: false, priority: 'Sedang' },
  { task: 'Beli souvenir tamu', category: 'Souvenir', done: false, priority: 'Rendah' },
  { task: 'Gladi resik / rehearsal', category: 'Hari H', done: false, priority: 'Tinggi' },
  { task: 'Konfirmasi semua vendor H-7', category: 'Hari H', done: false, priority: 'Tinggi' },
];

const Checklist = {
  async getAll(uid) {
    const snap = await getDocs(collection(db, 'checklists', uid, 'items'));
    if (snap.empty) {
      for (const t of DEFAULT_CHECKLIST) await addDoc(collection(db, 'checklists', uid, 'items'), t);
      const snap2 = await getDocs(collection(db, 'checklists', uid, 'items'));
      return snap2.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async add(uid, task) { await addDoc(collection(db, 'checklists', uid, 'items'), task); },
  async toggle(uid, id, currentDone) { await updateDoc(doc(db, 'checklists', uid, 'items', id), { done: !currentDone }); },
  async update(uid, id, updated) { await updateDoc(doc(db, 'checklists', uid, 'items', id), updated); },
  async delete(uid, id) { await deleteDoc(doc(db, 'checklists', uid, 'items', id)); },
  progress(list) {
    const done = list.filter(t => t.done).length;
    return { total: list.length, done, pct: list.length ? Math.round(done / list.length * 100) : 0 };
  }
};

// ===== GUEST LIST =====
const GuestList = {
  async getAll(uid) {
    const snap = await getDocs(collection(db, 'guests', uid, 'items'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async add(uid, guest) { await addDoc(collection(db, 'guests', uid, 'items'), guest); },
  async update(uid, id, updated) { await updateDoc(doc(db, 'guests', uid, 'items', id), updated); },
  async delete(uid, id) { await deleteDoc(doc(db, 'guests', uid, 'items', id)); },
  summary(list) {
    const confirmed = list.filter(g => g.rsvp === 'Hadir').length;
    const declined = list.filter(g => g.rsvp === 'Tidak Hadir').length;
    const pending = list.filter(g => g.rsvp === 'Belum Konfirmasi').length;
    const totalPax = list.filter(g => g.rsvp === 'Hadir').reduce((s, g) => s + (g.pax || 1), 0);
    return { total: list.length, confirmed, declined, pending, totalPax };
  }
};

// ===== TIMELINE =====
const DEFAULT_TIMELINE = [
  { time: '06:00', event: 'Persiapan Pengantin Wanita', desc: 'Makeup, hair do, dan pemakaian busana', pic: 'Tim MUA', category: 'Persiapan' },
  { time: '07:00', event: 'Persiapan Pengantin Pria', desc: 'Grooming dan pemakaian jas', pic: 'Keluarga', category: 'Persiapan' },
  { time: '08:00', event: 'Dekorasi Venue Selesai', desc: 'Pengecekan akhir dekorasi', pic: 'Tim Dekorasi', category: 'Venue' },
  { time: '09:00', event: 'Tamu Mulai Berdatangan', desc: 'Registrasi tamu & penyambutan', pic: 'Panitia', category: 'Acara' },
  { time: '10:00', event: 'Prosesi Akad Nikah', desc: 'Ijab kabul & penandatanganan dokumen', pic: 'Penghulu', category: 'Akad' },
  { time: '11:00', event: 'Sesi Foto Resmi', desc: 'Foto bersama keluarga & sesi couple', pic: 'Fotografer', category: 'Dokumentasi' },
  { time: '12:00', event: 'Makan Siang & Resepsi', desc: 'Pembukaan resepsi & makan bersama', pic: 'MC', category: 'Resepsi' },
  { time: '13:00', event: 'Hiburan & Penampilan', desc: 'Live music & entertainment', pic: 'Band/Hiburan', category: 'Hiburan' },
  { time: '14:00', event: 'Potong Kue & Lempar Buket', desc: 'Tradisi potong kue pengantin', pic: 'MC', category: 'Resepsi' },
  { time: '15:00', event: 'Penutupan Resepsi', desc: 'Ucapan terima kasih & pelepasan tamu', pic: 'MC', category: 'Penutup' },
];

const Timeline = {
  async getAll(uid) {
    const snap = await getDocs(collection(db, 'timelines', uid, 'items'));
    if (snap.empty) {
      for (const t of DEFAULT_TIMELINE) await addDoc(collection(db, 'timelines', uid, 'items'), t);
      const snap2 = await getDocs(collection(db, 'timelines', uid, 'items'));
      return snap2.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.time.localeCompare(b.time));
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.time.localeCompare(b.time));
  },
  async add(uid, item) { await addDoc(collection(db, 'timelines', uid, 'items'), item); },
  async update(uid, id, updated) { await updateDoc(doc(db, 'timelines', uid, 'items', id), updated); },
  async delete(uid, id) { await deleteDoc(doc(db, 'timelines', uid, 'items', id)); }
};

// ===== PROFILE =====
const Profile = {
  async update(uid, data) {
    await updateDoc(doc(db, 'users', uid), data);
  }
};

// ===== UTILS =====
const fmt = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');
function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

function toast(msg, type = 'success') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.className = `toast show ${type}`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function setupNav(profile) {
  const el = document.getElementById('nav-user-name');
  if (el && profile) el.textContent = profile.name;
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

function showLoading(show = true) {
  let el = document.getElementById('page-loading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'page-loading';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(245,235,224,0.8);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:Poppins,sans-serif;color:#a07070;font-size:1rem;gap:10px';
    el.innerHTML = '<div style="width:24px;height:24px;border:3px solid #e8c9c9;border-top-color:#a07070;border-radius:50%;animation:spin 0.8s linear infinite"></div> Memuat...';
    const style = document.createElement('style');
    style.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
    document.body.appendChild(el);
  }
  el.style.display = show ? 'flex' : 'none';
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('active');
});

export { auth, db, Auth, Budget, Vendor, Recommendation, Checklist, GuestList, Timeline, Profile, fmt, stars, toast, openModal, closeModal, setupNav, showLoading };
