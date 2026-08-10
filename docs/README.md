# Mexpo — Documentation Index

Dokumentasi monorepo dibagi ke dalam tiga lingkup. Pilih yang sesuai dengan pekerjaan Anda.

## Struktur

```
docs/                                ← PROJECT-WIDE (root): semua developer
├─ README.md                         ← indeks ini
├─ PRD.md                            ← status fitur & gap (produk vs kode)
└─ ARCHITECTURE.md                   ← arsitektur FE+BE, endpoint map, env, deploy

dev-backend-mexpo-new/docs/           ← BACKEND: developer backend & frontend yang integrasi API
├─ README.md                         ← indeks docs backend
├─ api-handbook.md                   ← referensi endpoint + skema DB + alur (Bahasa Indonesia)
├─ Mexpo-API-and-Backend-Design.docx ← versi .docx dari api-handbook.md (via npm run docs:docx)
├─ SCHEMA.md                         ← tabel database rinci (dari prisma/schema.prisma)
├─ RULES.md                          ← business rules & validasi + flag [BLOCKED]
└─ flows/*.mmd                       ← 9 diagram alur pengguna (Mermaid)

dev-frontend-mexpo-new/docs/          ← FRONTEND: developer UI
├─ README.md                         ← indeks docs frontend
└─ DESIGN.md                         ← design tokens, font, komponen, aturan UI
```

## Panduan memilih dokumen

| Lagi mengerjakan | Baca |
|---|---|
| Fitur baru (bertanya "apa yang dibuat?") | `docs/PRD.md` |
| Arsitektur/endpoint/env/deploy | `docs/ARCHITECTURE.md` |
| Validasi, kuota, aturan, izin | `dev-backend-mexpo-new/docs/RULES.md` |
| Perubahan database | `dev-backend-mexpo-new/docs/SCHEMA.md` + `prisma/schema.prisma` |
| Integrasi API (frontend) | `dev-backend-mexpo-new/docs/api-handbook.md` (+ Swagger `/docs`) |
| Diagram alur | `dev-backend-mexpo-new/docs/flows/*.mmd` |
| Tampilan/komponen UI | `dev-frontend-mexpo-new/docs/DESIGN.md` |
| Backlog produk (mau kerjakan apa) | `scrum.md` (di root) |

## Konten lain di root

- `AGENT.md` — titik masuk untuk AI coding agents (baca dulu).
- `scrum.md` — product backlog + status sprint.
- `Mexpo — Product & Flow Revision Documentation.docx` — produk spec (sumber untuk `[PLANNED]`).
- `.gitignore` — ignore rules level monorepo (masing-masing sub-project punya `.gitignore` sendiri).

> **Regenerasi .docx:** setelah mengubah `api-handbook.md`, jalankan `npm run docs:docx` di `dev-backend-mexpo-new`.