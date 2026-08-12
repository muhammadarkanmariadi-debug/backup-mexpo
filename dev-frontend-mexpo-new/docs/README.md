# Mexpo — Frontend Documentation (dev-frontend-mexpo-new/docs)

Dokumentasi yang spesifik untuk frontend Next.js. Dibaca oleh **developer UI** dan
siapa pun yang mengubah tampilan/komponen.

| Dokumen | Isi |
|---|---|
| [`DESIGN.md`](./DESIGN.md) | Design tokens (warna, font, spacing), inventori komponen, panduan UI, dan daftar dead links |
| [`TANSTACK-QUERY.md`](./TANSTACK-QUERY.md) | Cara data dari API dikelola dengan TanStack Query (`useApiQuery` / `useApiMutation` / `useList` / `keys`), alur & keuntungannya (Bahasa Indonesia) |

## Referensi silang

- API & konvensi backend: `../dev-backend-mexpo-new/docs/api-handbook.md` (atau Swagger `/docs`)
- Arsitektur FE+BE & env: root `../docs/ARCHITECTURE.md`
- Status fitur: root `../docs/PRD.md`

> Catatan: project ini memakai Next.js 16 custom build — baca `node_modules/next/dist/docs/`
> sebelum menulis kode frontend (bukan Next.js versi standar).