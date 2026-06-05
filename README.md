# ✨ Sakinah – Wedding Planner SaaS

> Platform modern dan elegan untuk membantu pasangan merencanakan pernikahan impian mereka dengan percaya diri. Dari budgeting, manajemen vendor, checklist persiapan, daftar tamu, hingga rundown hari H — semua dalam satu tempat yang cantik dan mudah digunakan.

🌐 **Live Demo:** [https://wedding-planner-app-id.web.app](https://wedding-planner-app-id.web.app)

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🔐 **Auth** | Register & login dengan email/password via Firebase Auth |
| 🏠 **Dashboard** | Countdown hari H, ringkasan budget, status tamu & checklist |
| 💰 **Budget** | Kelola anggaran pernikahan per kategori dengan progress visual |
| 🤝 **Vendor** | Tambah & kelola vendor pilihan dengan status negosiasi |
| ⭐ **Rekomendasi** | 25+ vendor rekomendasi tersebar di 10 region Indonesia |
| ✅ **Checklist** | 20 tugas default persiapan pernikahan dengan prioritas |
| 🎁 **Seserahan** | Kelola seserahan pernikahan dengan kategori lengkap |
| 👥 **Daftar Tamu** | Kelola tamu & RSVP tracker dengan status undangan |
| 🕐 **Timeline** | Rundown acara hari H yang bisa di-print ke PDF |
| 👔 **Panitia** | Kelola tim panitia dan pembagian tugas acara |
| 👤 **Profil** | Edit data pasangan & export laporan budget/tamu ke PDF |

---

## 🗺️ Rekomendasi Vendor per Region

Tersedia vendor rekomendasi di 10 wilayah Indonesia:

- 🌴 **Lampung** — Fotografer, Katering, Dekorasi, Venue, MUA, Videografer, Bunga, Hiburan
- 🏙️ **Jakarta** — Fotografer, Katering, Dekorasi, Venue, MUA, Videografer, Bunga
- 🌿 **Jawa Barat** (Bandung) — Fotografer, Katering, Venue, MUA, Bunga
- 🎯 **Yogyakarta** — Fotografer, Katering, Venue, MUA, Dekorasi, Videografer
- 🌊 **Jawa Timur** (Surabaya) — Fotografer, Katering, Venue, Hiburan, MUA
- 🌺 **Sumatera Utara** (Medan) — Fotografer, Katering, Venue, Dekorasi, MUA
- 🌏 **Sulawesi Selatan** (Makassar) — Fotografer, Katering, Venue, Dekorasi, MUA
- 🏖️ **Bali** — Fotografer, Katering, Venue, Dekorasi, MUA, Videografer
- 🌻 **Sumatera Selatan** (Palembang) — Fotografer, Katering, Venue, Dekorasi
- 🎯 **Jawa Tengah** (Semarang) — Fotografer, Katering, Venue, Dekorasi

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **Database:** Firebase Firestore (NoSQL Cloud Database)
- **Auth:** Firebase Authentication (Email/Password)
- **Hosting:** Firebase Hosting
- **Font:** Google Fonts (Playfair Display + Poppins)
- **Storage:** Firebase Firestore (bukan localStorage)

---

## 📁 Struktur Project

```
wedding-planner/
├── index.html              # Dashboard utama
├── login.html              # Halaman login & register
├── budget.html             # Manajemen budget
├── vendors.html            # Vendor saya
├── recommendations.html    # Rekomendasi vendor per region
├── checklist.html          # Checklist persiapan
├── seserahan.html          # Daftar seserahan pernikahan
├── guestlist.html          # Daftar tamu & RSVP
├── timeline.html           # Timeline / rundown hari H
├── panitia.html            # Kelola panitia acara
├── profile.html            # Profil & export PDF
├── css/
│   └── style.css           # Global styles (tema pink nude)
├── js/
│   ├── firebase.js         # Firebase SDK + semua logic utama
│   ├── nav-fix.js          # Navigation helper
│   └── utils.js            # Utility functions
├── firebase.json           # Firebase hosting & firestore config
├── firestore.rules         # Security rules Firestore
├── .firebaserc             # Firebase project config
├── BUG_FIXES.md            # Dokumentasi bug fixes
└── README.md               # Dokumentasi ini
```

---

## 🚀 Cara Menjalankan Lokal

### Prasyarat
- [Node.js](https://nodejs.org) v16+
- [Firebase CLI](https://firebase.google.com/docs/cli)
- Akun Google & Firebase project

### Langkah

1. **Clone repository**
   ```bash
   git clone https://github.com/luthfiardiansyah272/WeddingPlanner.git
   cd WeddingPlanner
   ```

2. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

3. **Login Firebase**
   ```bash
   firebase login
   ```

4. **Jalankan lokal**
   ```bash
   firebase serve
   ```

5. Buka browser → `http://localhost:5000`

---

## ☁️ Deploy ke Firebase Hosting

```bash
firebase deploy --project wedding-planner-app-id
```

---

## 🔧 Setup Firebase Sendiri

Jika ingin deploy ke Firebase project milik sendiri:

1. Buat project baru di [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password
3. Buat **Firestore Database** → Production mode
4. Daftarkan **Web App** dan copy `firebaseConfig`
5. Update konfigurasi di `js/firebase.js`:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

6. Update `.firebaserc`:
```json
{
  "projects": {
    "default": "YOUR_PROJECT_ID"
  }
}
```

7. Deploy:
```bash
firebase deploy
```

---

## 🔒 Firestore Security Rules

Data setiap user terlindungi — hanya bisa diakses oleh pemiliknya:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /budgets/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /vendors/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /recommendations/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /checklists/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /seserahan/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /guests/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /timelines/{userId}/{jenis}/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /timeline_sessions/{userId}/list/{sessId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /panitia/{userId}/divisi/{divisiId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /panitia/{userId}/anggota/{anggotaId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 📸 Screenshot

### Dashboard
> Countdown hari H real-time, ringkasan budget, status tamu & checklist

### Budget
> Progress bar visual, kalkulasi selisih rencana vs aktual, status pembayaran

### Rekomendasi Vendor
> Filter per region, kategori, rating & harga — langsung bisa dipilih ke vendor saya

### Checklist
> Progress ring animasi, grouping per kategori, prioritas warna

---

## 👨‍💻 Developer

**Luthfi Ardiansyah**
- GitHub: [@luthfiardiansyah272](https://github.com/luthfiardiansyah272)

Rebuilt and optimized as **Sakinah SaaS** — production-ready wedding planning platform.

---

## 🐛 Bug Fixes & Changelog

### v1.1.0 (Latest)
- ✅ Fixed index.html terpotong - Dashboard sekarang load sempurna
- ✅ Fixed race condition di Auth.requireAuth - Data tidak "hilang" lagi
- ✅ Fixed Panitia module tidak di-export - Halaman panitia berfungsi
- ✅ Added menu Panitia ke navigation bar
- ✅ Fixed branding consistency - Semua halaman pakai "💍 Wedding Planner"
- ✅ Updated README dengan dokumentasi lengkap

Lihat detail di [BUG_FIXES.md](./BUG_FIXES.md) dan [MENU_FIX.md](./MENU_FIX.md)

---

## 📄 Lisensi

MIT License — bebas digunakan dan dimodifikasi.

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk membantu pasangan merencanakan hari istimewa mereka</p>
  <p>✨ <strong>Sakinah</strong> — <a href="https://sakinah-wedding.web.app">sakinah-wedding.web.app</a></p>
</div>
