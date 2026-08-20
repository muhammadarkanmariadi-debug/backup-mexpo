# PAYMENT.md — Pembayaran Tiket (Midtrans Snap) & Settlement Escrow Sederhana

> Fitur A1b — pembayaran event berbayar via **Midtrans Snap** dengan model
> **escrow sederhana**: satu event, satu organizer. Dana peserta ditampung di
> akun platform (Midtrans), lalu disetl manual ke rekening organizer oleh
> SUPERADMIN setelah event/masa refund selesai.

## 1. Alur Ringkas

```
Peserta daftar (public/logged-in)
  └─> ticket dibuat (RESERVED) + transactions (PENDING) + Snap token dibuat server
  └─> Frontend render popup Snap (snap.js + client key)
        ├─ settle/capture ─────> webhook POST /payment/notification ──> transactions=PAID, tickets=PAID
        ├─ expire 24 jam ──────> webhook + lazy-expiry on read ───────> transactions=EXPIRED
        └─ deny/cancel ────────> webhook ───────────────────────────────> transactions=FAILED

Owner/Committee
  └─> isi rekening payout (PUT /events/:id/payout)
  └─> lihat ringkasan dana (GET /events/:id/settlement-summary)

SUPERADMIN (platform, pemegang escrow)
  └─> transfer manual via internet banking ke rekening organizer
  └─> catat settlement (POST /events/:id/settle, double-confirm jumlah) ──> payout_status=SETTLED
  └─> (opsional) refund manual (PUT /transactions/:id/refund)
```

## 2. Environment Variables

| Var | Backend | Keterangan |
|---|---|---|
| `MIDTRANS_IS_PRODUCTION` | ✅ | `true` = prod (`app.midtrans.com`), `false` = sandbox (`app.sandbox.midtrans.com`) |
| `MIDTRANS_SERVER_KEY` | ✅ | rahasia, dipakai server (Basic auth Snap + verifikasi signature webhook) |
| `MIDTRANS_CLIENT_KEY` | ✅ (backend contoh) / ✅ `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` (frontend) | publik, untuk `snap.js` |
| `MIDTRANS_IS_3DS` | ✅ | `true` → `credit_card.secure=true` |
| `MIDTRANS_PAYMENT_EXPIRY` | ✅ | menit (1440 = 24 jam) → set `expiry` di Snap + `expired_at` di DB |
| `PAYMENT_PLATFORM_FEE_PERCENT` | ✅ | % potongan platform per transaksi PAID sebelum payout |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | 🔶 | menentukan URL `snap.js` yang dimuat frontend |

> ⚠️ Jangan pernah commit `MIDTRANS_SERVER_KEY` produksi. Sandbox keys
> (`SB-Mid-*`) boleh di `.env` lokal saja.

## 3. Skema Terkait (Prisma)

- `events` += `payout_bank_name`, `payout_account_number`, `payout_account_holder`, `payout_status` (`NOT_SETTLED|SETTLED`), `settled_at`.
- `transactions` — 1 payment intent per tiket (1:M ke `tickets` karena bisa ada percobaan ulang): `midtrans_order_id @unique`, `amount`/`platform_fee` (Int IDR), `status` (`PENDING|PAID|EXPIRED|FAILED|REFUNDED`), `payment_method`, `snap_token`, `paid_at`, `expired_at`, `refunded_at`, `refund_reason`.
- `event_settlements` — riwayat payout manual oleh SUPERADMIN: `amount_transferred`, `transferred_by`, `proof_of_transfer` (URL S3), `note`.

> Sumber harga = **`ticket_types.price`** (bukan `events.price` — kolom tsb
> tidak ada). `amount` selalu dihitung server saat checkout, frontend tidak
> dipercaya.

## 4. Endpoint

| Method | Path | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/events/:id/checkout` | JWT (VISITOR APPROVED) | buat/pastikan tiket → payment intent → Snap token |
| `POST` | `/payment/notification` | **tanpa guard** | webhook Midtrans — verifikasi SHA512 + idempotent |
| `GET` | `/transactions/my/:event_id` | JWT (pemilik) | transaksi saya (polling klien) + lazy-expiry |
| `GET` | `/transactions/:id` | JWT (pemilik/manager) | status tunggal |
| `GET` | `/events/:id/transactions` | JWT (OWNER/COMMITTEE/SUPERADMIN) | daftar transaksi per event (`?page&quantity&search`) |
| `GET` | `/events/:id/settlement-summary` | JWT (OWNER/COMMITTEE/SUPERADMIN) | gross / fee / net / count / status / riwayat |
| `PUT` | `/events/:id/payout` | JWT (OWNER/COMMITTEE/SUPERADMIN) | simpan rekening payout organizer |
| `POST` | `/events/:id/settle` | **JWT (SUPERADMIN)** | catat settlement manual + proof (multipart, `amount_transferred` harus = net) |
| `PUT` | `/transactions/:id/refund` | JWT (OWNER/COMMITTEE/SUPERADMIN) | refund manual (`reason`) |

> Public (tanpa login): `POST /public-api/registration/:event_id` untuk event
> PAID kini **mengembalikan payment intent** (`data.payment.{transaction_uuid,
> snap_token, order_id, amount, platform_fee}`) sehingga peserta baru bisa
> langsung bayar tanpa login. Gagal membuat Snap token TIDAK menggagalkan
> registrasi (fallback: checkout via JWT nanti).

## 5. Verifikasi Notifikasi (wajib)

`POST /payment/notification` menerima JSON maupun `x-www-form-urlencoded`.
Signature dicek: `sha512(order_id + status_code + gross_amount + server_key)`
harus sama dengan `signature_key` payload. Gagal → `400`, status tidak berubah.

**Idempotency:** setiap update status memakai `updateMany({ where: { uuid,
status: 'PENDING' } })`. Webhook berulang atau status final tidak akan
meng-overwrite `PAID/EXPIRED/FAILED/REFUNDED`.

**Mapping `transaction_status`:**
- `capture` + `fraud=accept` / `settlement` → `PAID` (isi `paid_at`,
  `payment_method`, tiket → `PAID`)
- `capture` + `fraud=reject` → `FAILED`; `cancel`/`deny` → `FAILED`
- `expire` → `EXPIRED`
- `refund`/`chargeback`/`partial_*` → `REFUNDED`
- `pending` → no-op

## 6. Edge Cases

- **Expired:** Snap token diberi `expiry` 24 jam; selain webhook `expire`,
  transaksi PENDING yang lewat `expired_at` ditandai `EXPIRED` secara lazy saat
  dibaca (`GET /transactions/my` & `GET /transactions/:id`).
- **Refund:** manual oleh manager/SUPERADMIN → `status=REFUNDED` + alasan.
  API refund Midtrans (`/v2/{id}/refund`) belum dipakai (deferred).
- **Double payment / race:** `midtrans_order_id` unique + guard `WHERE status='PENDING'`.
- **Quota:** tiket sudah ter-reserve saat registrasi; ringkasan hanya menghitung
  transaksi `PAID`.
- **Konfirmasi manual tetap ada:** panitia masih bisa set `PAID` via
  `PUT /tickets/:id` (CASH/QRIS/TRANSFER offline) — flow Snap tidak menonaktifkannya.

## 7. Sandbox Testing (Runbook)

1. Backend: isi `.env` `MIDTRANS_*` (sandbox), jalankan `npx prisma migrate
   deploy` (Postgres) atau `prisma db execute --file ...` (MySQL), lalu
   `npm run start:dev`.
2. Frontend: `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` = sandbox client key.
3. Buat event `ticket_mode=PAID` + `ticket_types` (harga contoh 50000).
4. Daftar sebagai peserta baru → popup Snap muncul.
5. Bank SANDBOX — Midtrans menyediakan kartu uji: `4811 1111 1111 1114`
   (sukses), `4911 1111 1111 1113` (gagal); VISA apa pun untuk approval
   otomatis. Untuk simulasi status lain (expire/pending) gunakan Virtual
   Account lalu abaikan, atau uji webhook via dashboard Sandbox Midtrans
   ("Simulate Payment" di transaction detail).