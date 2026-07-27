# ClassPay

Sistem manajemen tagihan dan kas kelas berbasis Next.js, Prisma, dan Neon PostgreSQL. Pembayaran dicatat manual oleh bendahara—tanpa payment gateway maupun unggah bukti.

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env`, kemudian isi `DATABASE_URL` Neon dan `AUTH_SECRET`.
2. Jalankan `npm install`.
3. Jalankan `npm run db:generate`, lalu `npm run db:migrate`.
4. Isi data demo dengan `npm run db:seed` dan mulai aplikasi dengan `npm run dev`.

Login demo: `ketua` / `classpay123`, atau `bendahara` / `classpay123`.

## Deployment Vercel

Impor repositori ke Vercel, lalu tambahkan `DATABASE_URL` dan `AUTH_SECRET` pada Environment Variables. Pada Neon gunakan pooled connection string dengan `?sslmode=require`. Build command standar `npm run build`; jalankan migrasi melalui pipeline/terminal sebelum deployment pertama.

## Struktur

- `src/app` — halaman App Router dan API Auth.js
- `src/auth.ts` — Credentials Provider dan klaim role sesi
- `src/lib` — Prisma client serta formatter
- `prisma/schema.prisma` — model, enum, indeks, dan relasi PostgreSQL
- `prisma/seed.ts` — data awal Ketua, Bendahara, anggota, tagihan, dan transaksi
