# Mexpo — Diagram Alur Pengguna

Alur pengguna backend dalam format **Mermaid** (`.mmd`). Buka dengan:
- VS Code (Mermaid Preview) / JetBrains
- [Mermaid Live Editor](https://mermaid.live)
- GitHub (`.mmd` didukung langsung)

| File | Alur | Deskripsi singkat |
|---|---|---|
| [`auth-flow.mmd`](./auth-flow.mmd) | Autentikasi | Daftar → verifikasi email → login → JWT |
| [`event-lifecycle.mmd`](./event-lifecycle.mmd) | Siklus hidup event | Buat → konfigurasi → ajukan publikasi → persetujuan super admin → published |
| [`visitor-registration.mmd`](./visitor-registration.mmd) | Registrasi pengunjung | Halaman event publik → formulir dinamis + tiket → gabung event |
| [`workshop-booking.mmd`](./workshop-booking.mmd) | Pemesanan workshop | Pesan → check-in di lokasi → sertifikat |
| [`check-in.mmd`](./check-in.mmd) | Check-in QR | Pindai QR → resolve user → venue / booth / souvenir |
| [`tenant-lifecycle.mmd`](./tenant-lifecycle.mmd) | Siklus hidup tenant | Ajukan → verifikasi → undang rekan → portal |
| [`pos-transaction.mmd`](./pos-transaction.mmd) | Transaksi POS | Pindai pengunjung (opsional) → item → nota |
| [`souvenir-redemption.mmd`](./souvenir-redemption.mmd) | Penukaran souvenir | Resolve QR → aturan kelayakan → serahkan |
| [`reports-export.mmd`](./reports-export.mmd) | Laporan & export | Agregasi → grafik → unduh Excel |

## Dokumen terkait

- `../api-handbook.md` / `Mexpo-API-and-Backend-Design.docx` — referensi lengkap endpoint, konvensi, dan skema database.
- Swagger interaktif: `http://localhost:3500/docs` (OpenAPI JSON: `/docs-json`).