# 🔧 Menu & Branding Fixes

## Masalah yang Ditemukan:

### 1. ❌ **Menu Panitia Hilang**
- **Masalah**: Menu Panitia tidak muncul di navigation bar semua halaman
- **Penyebab**: Tidak ditambahkan ke HTML navigation menu
- **File yang terpengaruh**: Semua file HTML (index, budget, vendors, checklist, dll)

### 2. ⚠️ **Branding Tidak Konsisten**
- Beberapa file pakai: `💍 Wedding Planner`
- Beberapa file pakai: `✨ Sakinah`
- **Seharusnya konsisten**: `✨ Sakinah` (sesuai README.md)

---

## ✅ Solusi:

### Navigation Menu yang Benar:
```html
<div class="nav-links" id="nav-links">
  <a href="index.html">🏠 <span>Dashboard</span></a>
  <a href="budget.html">💰 <span>Budget</span></a>
  <a href="vendors.html">🤝 <span>Vendor</span></a>
  <a href="recommendations.html">⭐ <span>Rekomendasi</span></a>
  <a href="checklist.html">✅ <span>Checklist</span></a>
  <a href="seserahan.html">🎁 <span>Seserahan</span></a>
  <a href="guestlist.html">👥 <span>Tamu</span></a>
  <a href="timeline.html">🕐 <span>Timeline</span></a>
  <a href="panitia.html">👔 <span>Panitia</span></a>  <!-- ✅ DITAMBAHKAN -->
  <a href="profile.html">👤 <span>Profil</span></a>
</div>
```

### Branding yang Benar:
```html
<a href="index.html" class="nav-brand">✨ Sakinah</a>
```

---

## 📝 File yang Perlu Di-update:

Semua file HTML berikut perlu update:
- [x] ✅ index.html - sudah ditambahkan menu Panitia
- [ ] ⏳ budget.html
- [ ] ⏳ vendors.html
- [ ] ⏳ recommendations.html
- [ ] ⏳ checklist.html
- [ ] ⏳ seserahan.html
- [ ] ⏳ guestlist.html
- [ ] ⏳ timeline.html
- [ ] ⏳ profile.html
- [ ] ⏳ panitia.html (cek juga self-reference)
- [ ] ⏳ login.html (mungkin tidak perlu, tapi cek branding)

---

## 🎯 Manual Update Required

Karena banyak file yang perlu diupdate dengan pattern yang sama, saya rekomendasikan:

### Option 1: Manual Update via Find & Replace
1. Buka setiap file HTML
2. Find: navigation menu tanpa Panitia
3. Replace dengan: navigation menu + Panitia

### Option 2: Gunakan Script
Buat script PowerShell/Bash untuk update semua file sekaligus

---

## ✅ Verifikasi Setelah Update:

1. Semua halaman punya menu Panitia di posisi ke-9
2. Branding konsisten: "✨ Sakinah"
3. Halaman panitia.html bisa diakses tanpa error
4. Active menu highlight berfungsi di semua halaman

---

## 🚀 Next Steps:

1. Update semua file HTML dengan menu Panitia
2. Commit changes ke Git
3. Push ke GitHub
4. Deploy ke Firebase Hosting
5. Test di live app
