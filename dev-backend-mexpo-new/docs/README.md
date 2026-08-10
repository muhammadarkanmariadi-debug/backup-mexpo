# Mexpo — Backend Documentation (dev-backend-mexpo-new/docs)

Dokumentasi yang spesifik untuk backend NestJS. Dibaca oleh **developer backend** dan
**developer frontend** yang mengintegrasikan API.

| Dokumen | Isi |
|---|---|
| [`api-handbook.md`](./api-handbook.md) | Referensi endpoint lengkap (136 endpoint), konvensi API (auth, error, pagination, sort), skema database, alur pengguna — ditulis untuk frontend developer, dalam Bahasa Indonesia |
| [`Mexpo-API-and-Backend-Design.docx`](./Mexpo-API-and-Backend-Design.docx) | Versi Word dari `api-handbook.md` (regenerasi: `npm run docs:docx`) |
| [`SCHEMA.md`](./SCHEMA.md) | Rincian tabel database satu per satu (sumber: `prisma/schema.prisma`) |
| [`RULES.md`](./RULES.md) | Business rules & validasi + daftar aturan yang `[BLOCKED]` / butuh klarifikasi |
| [`flows/`](./flows) | 9 diagram alur pengguna (Mermaid `.mmd`): auth, event lifecycle, registrasi visitor, workshop, check-in QR, tenant, POS, souvenir, laporan |

## Referensi cepat

- Swagger interaktif: `http://localhost:3500/docs` (JSON: `/docs-json`)
- Skema Prisma asli: `prisma/schema.prisma`
- Sk tim yang dipakai backend: NestJS 11 · Prisma 7 · MySQL/MariaDB · JWT + Basic auth