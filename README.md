# Nova AI Chat (versi personal, tanpa login)

Website chat AI mirip ChatGPT, dibangun dengan Next.js 14 + Tailwind CSS. Dibuat sesederhana mungkin untuk **pemakaian pribadi**:

- **Tanpa login** — begitu dibuka, langsung bisa chat (anonim/otomatis).
- **Tanpa database & tanpa Firebase** — riwayat percakapan tersimpan di **cookie browser** kamu sendiri.
- **Tanpa limit** — tidak ada pembatasan jumlah pesan sama sekali.
- Mode **💬 Chat / Coding** — ngobrol biasa, tanya-jawab, atau minta bantuan menulis & memperbaiki kode program (hasil kode otomatis tampil dalam blok kode gelap seperti ChatGPT).
- Mode **🎨 Buat Gambar** — kirim deskripsi, AI akan generate gambar (butuh provider yang mendukung endpoint `/images/generations` — lihat catatan di bawah).
- API key **tidak ditulis di kode** — disimpan lewat Environment Variables, aman untuk deploy ke Vercel.

## 1. Jalankan di lokal

```bash
npm install
cp .env.example .env.local
# isi .env.local sesuai kebutuhan
npm run dev
```

Buka http://localhost:3000 — langsung masuk ke halaman chat, tidak ada halaman login.

## 2. Environment Variables

Isi ini di **Vercel → Project Settings → Environment Variables**:

| Variable | Wajib? | Keterangan |
|---|---|---|
| `CHAT_API_BASE_URL` | Ya | Base URL API AI kamu, contoh: `https://bandelbanget.xyz/v1` |
| `CHAT_API_KEY` | Ya | API key dari provider AI kamu |
| `CHAT_MODEL` | Ya | Nama model untuk chat/coding, contoh `qwen-plus` |
| `CHAT_IMAGE_MODEL` | Opsional | Nama model khusus untuk generate gambar, kalau providernya beda model. Kosongkan kalau tidak tahu / provider tidak mendukung fitur gambar |
| `ASSISTANT_NAME` | Opsional | Nama AI, default "Nova AI" |
| `CREATOR_ANSWER` | Opsional | Jawaban saat ditanya "siapa pembuatmu?" |
| `NAME_ANSWER` | Opsional | Jawaban saat ditanya "siapa namamu?" |

Karena tidak ada panel admin lagi (sesuai permintaan tanpa login), untuk mengganti nama AI / jawaban identitas, tinggal **edit value environment variable** di atas lalu redeploy — tidak perlu login ke mana-mana.

## 3. Deploy ke Vercel

1. Push folder ini ke repository GitHub kamu.
2. Buka https://vercel.com/new, import repo tersebut.
3. Isi semua Environment Variables di atas saat proses import.
4. Klik **Deploy**. Selesai — tidak perlu setting NEXTAUTH, Google OAuth, atau Firebase apa pun.

## 4. Soal fitur "Buat Gambar"

Fitur ini memanggil endpoint `POST {CHAT_API_BASE_URL}/images/generations` (format standar ala OpenAI: `{ model, prompt, n, size }`, respon berisi `data[0].url` atau `data[0].b64_json`). Ini **bergantung pada provider AI kamu** — kalau provider di `CHAT_API_BASE_URL` tidak menyediakan endpoint ini, tombol "Buat Gambar" akan menampilkan pesan error yang jelas, bukan crash diam-diam. Cek dokumentasi provider kamu untuk tahu apakah fitur ini didukung dan model apa yang harus diisi di `CHAT_IMAGE_MODEL`.

## 5. Soal penyimpanan riwayat chat (cookie) — baca ini

Semua riwayat percakapan disimpan di **cookie browser**, bukan di server. Konsekuensinya:
- Riwayat **hanya ada di browser/perangkat itu saja** — buka dari HP lain, riwayatnya kosong.
- Clear cookies / mode incognito = riwayat hilang.
- Cookie browser punya batas ukuran (sekitar 4KB). Aplikasi ini otomatis **membuang percakapan paling lama** kalau ukurannya sudah mepet batas, dan akan menampilkan pemberitahuan kuning di layar saat itu terjadi. Ini konsekuensi dari memilih cookie sebagai tempat penyimpanan (sesuai permintaan) — kalau ke depannya kamu butuh riwayat yang jauh lebih panjang/permanen, opsinya adalah pindah ke `localStorage` (kapasitas jauh lebih besar, tapi tetap hanya di browser itu) atau ke database asli.
- Tidak ada isu privasi lintas-user karena memang tidak ada sistem akun sama sekali — semua orang yang buka website ini punya riwayat masing-masing tersimpan di cookie browser mereka sendiri.

## 6. Struktur folder

```
app/
  page.tsx        -> halaman chat utama (langsung tampil, tanpa login)
  api/
    chat/route.ts   -> teruskan pesan ke AI API (mode Chat/Coding)
    image/route.ts  -> teruskan prompt ke AI API (mode Buat Gambar)
lib/
  cookies.ts   -> helper baca/tulis cookie
  markdown.ts  -> render markdown ringan + blok kode ala ChatGPT
  types.ts     -> tipe data
```
