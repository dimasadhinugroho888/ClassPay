# 🚀 ClassPay - Sistem Manajemen Tagihan & Kas Kelas Digital

ClassPay adalah aplikasi web modern, cepat, responsif, aman, dan mudah digunakan yang dirancang khusus untuk memanajemen tagihan dan kas kelas secara digital. Aplikasi ini ditujukan untuk digunakan oleh **Ketua Kelas**, **Bendahara**, dan **Anggota/Siswa**.

Pembayaran dilakukan secara langsung kepada bendahara secara fisik/manual (cash), kemudian dicatat di aplikasi oleh Bendahara. Sistem ini tidak menggunakan Payment Gateway atau unggah bukti transfer guna menjaga kesederhanaan proses pencatatan kas kelas.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 / 16 (App Router)
- **Bahasa**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS, Lucide React, Framer Motion
- **Database**: Neon PostgreSQL (Satu-satunya Database)
- **ORM**: Prisma ORM (Client, Migrate, and Schema)
- **Autentikasi**: Auth.js v5 (Credentials Provider) dengan Role-based Protection
- **Validasi**: Zod Validation
- **Grafik**: Recharts
- **Ekspor**: ExcelJS & jsPDF (Client-side)

---

## 🔑 Hak Akses Peran (Role Based)

### 👑 Ketua Kelas
- Dashboard dengan ringkasan visual (total anggota, pemasukan, pengeluaran, saldo, belum lunas).
- Menambah, mengedit, dan menghapus Anggota/Siswa.
- Menunjuk/mengganti Bendahara kelas secara langsung.
- Melihat seluruh pembayaran, pengeluaran, audit log sistem, dan laporan kas.
- Mengekspor laporan kas ke format Excel dan PDF.
- *Ketua Kelas tidak dapat mencatat/mengubah status pembayaran.*

### 💰 Bendahara Kelas
- Dashboard keuangan (saldo, tagihan aktif, total pemasukan/pengeluaran, pembayaran terbaru).
- Membuat, mengedit, dan menghapus tagihan kelas.
- Menandai siswa Lunas atau membatalkan status Lunas (dengan update instan / Optimistic UI).
- Mencatat, mengedit, dan menghapus pengeluaran kas kelas.
- Mengirim pengingat WhatsApp manual (template pesan otomatis berisi detail nominal & tagihan).
- Mengekspor laporan keuangan kas kelas ke format Excel dan PDF.

### 👤 Anggota / Siswa
- Dashboard pribadi (tagihan aktif miliknya, total tunggakan, riwayat pembayaran miliknya).
- Anggota **hanya dapat melihat data miliknya sendiri** dan tidak diizinkan melihat data anggota/siswa lainnya.
- Kewajiban mengubah password default pada login pertama kali.

---

## 📦 Struktur Folder Proyek

Struktur folder mengadopsi Clean Architecture yang modular dan mudah dikembangkan:
```text
classpay/
├── prisma/
│   ├── schema.prisma   # Skema Database PostgreSQL, Enum, Indeks & Relasi
│   └── seed.ts         # Data awal default (1 Ketua, 1 Bendahara, 10 Anggota, dll)
├── src/
│   ├── actions/
│   │   └── classpay.ts # Server Actions untuk mutasi database & validasi Zod
│   ├── app/
│   │   ├── (app)/      # Halaman utama aplikasi (dilindungi middleware)
│   │   ├── api/        # API handler Auth.js
│   │   ├── login/      # Halaman masuk
│   │   ├── globals.css # Konfigurasi CSS Tailwind v4
│   │   ├── layout.tsx  # Root layout
│   │   └── page.tsx    # Pengalihan halaman awal ke dashboard
│   ├── components/
│   │   ├── app-shell.tsx       # Sidebar, navigasi adaptif peran & proteksi sandi
│   │   ├── dashboard-chart.tsx # Grafik arus kas Recharts (Client Component)
│   │   ├── payment-row.tsx     # Baris tabel pembayaran dengan Optimistic UI
│   │   └── report-actions.tsx  # Pengendali ekspor ExcelJS & jsPDF
│   ├── lib/
│   │   ├── access.ts   # Helper otorisasi sesi & proteksi server-side
│   │   ├── prisma.ts   # Inisialisasi Prisma Client singleton
│   │   └── utils.ts    # Formatter rupiah, tanggal & normalisasi nomor WA
│   ├── types/
│   │   └── next-auth.d.ts      # Ekstensi tipe NextAuth untuk session/JWT
│   └── middleware.ts   # Middleware proteksi rute & paksa ganti kata sandi
```

---

## 🚀 Instalasi & Konfigurasi Lokal

### 1. Prasyarat
Pastikan Anda telah menginstal:
- Node.js LTS (versi 18 ke atas)
- Akun Neon PostgreSQL (untuk mendapatkan URL Database)

### 2. Klon Repositori & Instal Dependensi
```bash
git clone https://github.com/dimasadhinugroho888/ClassPay.git
cd ClassPay
npm install
```

### 3. Konfigurasi Environment Variables
Buat berkas `.env` di direktori utama proyek dengan menyalin `.env.example`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
AUTH_SECRET="ganti-dengan-secret-yang-panjang-dan-acak-minimal-32-karakter"
```

### 4. Prisma Migrations & Generate
Buat tabel-tabel database pada Neon PostgreSQL dan generate Prisma Client:
```bash
# Menghasilkan Prisma Client
npm run db:generate

# Menerapkan migrasi skema database ke Neon
npm run db:migrate
```

### 5. Seeding Data Awal (Demo)
Jalankan perintah berikut untuk mengisi database Anda dengan data awal/demo:
```bash
npm run db:seed
```

### 6. Menjalankan Aplikasi di Lokal
```bash
npm run dev
```
Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000).

---

## 🔑 Login Demo

Gunakan akun-akun berikut setelah menjalankan perintah seed:

| Peran | Username | Password |
| :--- | :--- | :--- |
| **Ketua Kelas** | `ketua` | `classpay123` |
| **Bendahara** | `bendahara` | `classpay123` |
| **Anggota Kelas** | `anggota1` | `classpay123` |

*(Catatan: Saat login pertama kali, akun yang baru dibuat oleh Ketua Kelas wajib mengganti password pada menu Pengaturan sebelum dapat mengakses halaman lain).*

---

## ☁️ Deployment ke Vercel

1. Hubungkan repositori GitHub Anda ke **Vercel**.
2. Di Vercel, masuk ke halaman pengaturan proyek dan tambahkan **Environment Variables**:
   - `DATABASE_URL` (Gunakan pooled connection string dari Neon dengan tambahan parameter `?sslmode=require`)
   - `AUTH_SECRET` (Dapat dihasilkan dengan menjalankan `openssl rand -base64 32`)
3. Konfigurasikan build setting di Vercel:
   - **Build Command**: `prisma migrate deploy && tsx prisma/seed.ts && next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Jalankan deploy. Database Anda akan otomatis dimigrasi dan diisi dengan data seed pada saat proses build di Vercel selesai.
