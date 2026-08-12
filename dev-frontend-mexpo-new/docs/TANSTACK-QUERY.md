# TanStack Query — Panduan Implementasi (Mexpo Frontend)

> Dokumen ini menjelaskan bagaimana TanStack Query (`@tanstack/react-query`)
> diimplementasikan di project ini, alur kerjanya, fungsi-fungsi yang tersedia,
> dan keuntungannya. Ditulis dalam bahasa Indonesia agar mudah dibaca seluruh tim.

---

## 1. Apa itu TanStack Query?

TanStack Query adalah **pustaka pengelola data dari server** (server state) di sisi
frontend. Ia mengurus hal-hal yang biasanya ditulis manual:

- **Cache** — data yang sudah pernah diambil tidak perlu di-fetch ulang.
- **Loading / error state** — otomatis, tinggal dipakai di komponen.
- **Refetch / penyegaran data** — otomatis saat fokus kembali ke tab, atau saat
  data berubah (mutasi).
- **Deduplication** — dua komponen yang butuh data sama cukup melakukan 1 request.

**Perbedaan penting:**
- `zustand` (sudah ada di project) = **global state** (auth user, dsb).
- TanStack Query = **server state** (data dari API backend).
  Keduanya saling melengkapi, bukan menggantikan.

---

## 2. Peta file implementasi

```
src/
├── lib/
│   ├── query-client.ts            # QueryClient global + default (staleTime, retry, dsb)
│   ├── query-keys.ts              # Factory "alamat" cache untuk setiap data
│   ├── providers/
│   │   └── QueryProvider.tsx      # Provider client, dipasang di root layout
│   └── hooks/
│       └── useApi.ts              # useApiQuery + useApiMutation + ApiError
└── app/layout.tsx                 # membungkus aplikasi dengan <QueryProvider>
```

Alur data (ringkas):

```
Komponen (useApiQuery / useApiMutation)
        │
        ▼
useApi.ts (normalisasi: status:false → lempar ApiError)
        │
        ▼
services/*.ts (fungsi bisnis, panggil http-client)
        │
        ▼
http-client.ts ("use server") → fetch ke backend
```

---

## 3. Fungsi-fungsi yang tersedia & cara pakainya

### 3.1 `queryClient` — pengaturan global

File: `src/lib/query-client.ts`

```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,               // data SELALU dianggap basi → selalu fresh
      refetchOnWindowFocus: true, // kembali ke tab → refetch otomatis
      retry: 1,                   // 1x coba ulang saat gagal
      gcTime: 5 * 60 * 1000,      // simpan cache di memori 5 menit
    },
  },
});
```

**Keputusan produk:** `staleTime: 0` berarti data tidak pernah disajikan dari
cache yang basi — setiap kali komponen dipasang / tab difokuskan, data di-refetch.
Maka penyegaran setelah mutasi (tambah/ubah/hapus) juga dijamin karena cache
selalu dianggap usang.

> Catatan: `queryClient` juga bisa diimpor langsung di komponen untuk
> `invalidateQueries` manual, misalnya:
> `queryClient.invalidateQueries({ queryKey: keys.events.my({}) })`.

### 3.2 `QueryProvider` — pembungkus aplikasi

File: `src/lib/providers/QueryProvider.tsx`

```tsx
"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

export default function QueryProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

Dipasang **sekali** di `src/app/layout.tsx` (membungkus `AuthProvider`).
Semua komponen di bawahnya otomatis bisa memakai `useApiQuery` / `useApiMutation`.

### 3.3 `keys` — alamat cache

File: `src/lib/query-keys.ts`

Setiap data punya "alamat" unik berupa array. Alamat ini dipakai untuk:

1. Memberi tahu TanStack data mana yang sama (untuk cache & dedup).
2. **Invalidasi** — "data ini sudah basi, refetch!" setelah mutasi.

```ts
keys.events.my({})                    // → ["events","my",{}]
keys.events.detail(uuid)              // → ["events","detail",uuid]
keys.qr.my(eventUuid)                 // → ["qr","my",eventUuid]
keys.reports.range(eventId, from, to) // laporan per rentang tanggal
```

**Aturan:** JANGAN menulis string literal acak di komponen — selalu lewat `keys`
agar invalidasi konsisten. Jika perlu resource baru, tambahkan di `query-keys.ts`.

### 3.4 `useApiQuery` — untuk membaca data (GET)

File: `src/lib/hooks/useApi.ts`

```ts
const { data, isLoading, isError, error, refetch } = useApiQuery<T>(
  keys.events.my({}),   // 1) alamat cache
  () => getMyEvents(),  // 2) fungsi pengambil data (dari service)
);
```

**Yang dihasilkan:**

| Properti | Kegunaan |
|---|---|
| `data` | Data hasil fetch (sudah di-unwrap dari `{data,...}`) |
| `isLoading` | `true` saat pertama kali mengambil (belum ada cache) |
| `isError` / `error` | Status & pesan error (`ApiError` dengan `.code` & `.message`) |
| `refetch` | Paksa fetch ulang manual |
| `enabled` (opsional) | `false` untuk menunda fetch sampai syarat terpenuhi |

**Keistimewaan `useApiQuery`:** service di project ini mengembalikan
`{ status, data, message }` dan TIDAK melempar error. `useApiQuery` menormalkan
kontrak itu — jika `status: false`, ia melempar `ApiError` sehingga
`isError` / `retry` bekerja seperti standar React Query.

### 3.5 `useApiMutation` — untuk mengubah data (POST/PUT/DELETE)

```ts
const approve = useApiMutation(
  (uuid: string) => approveEvent(uuid, { approved: true }), // 1) aksi
  {
    invalidate: [keys.events.approvalQueue(listQuery)],     // 2) data mana yg di-refresh
    successMessage: "Disetujui!",                           // 3) toast sukses
    errorMessage: "Gagal menyetujui.",                      // 4) toast error
    notify: toast,                                          // 5) pemutar toast (sonner)
    onSuccess: (data, vars) => { /* efek tambahan */ },
  },
);

approve.mutate(event.uuid);   // jalankan aksi
approve.isPending             // untuk spinner tombol
```

**Opsi penting:**

| Opsi | Fungsi |
|---|---|
| `invalidate` | Array `QueryKey` yang di-invalidate otomatis setelah sukses → list terkait refetch. |
| `remove` | Hapus data dari cache (misal setelah delete detail page). |
| `successMessage` / `errorMessage` | Toast otomatis (butuh `notify: toast`). |
| `onSuccess` / `onError` | Callback tambahan (misal `router.refresh()`, reset form). |

### 3.6 `useList` — list + pagination + search + sort (dipakai banyak halaman)

File: `src/features/dashboard/shared/useList.ts`

Hook ini **ditulis ulang di atas `useQuery`** namun **API-nya tidak berubah**,
jadi halaman yang sudah ada (ApprovalQueue, AttendancePage, EventManager,
TenantPortal, TeamManager, UserManager, VerificationPage, WorkshopsManager)
tidak perlu diubah sama sekali.

```ts
const list = useList<Event>((q) => getApprovalQueue(q), [isSuperAdmin]);

list.items        // data halaman ini
list.total        // total data (dari meta.counts)
list.totalPages   // jumlah halaman
list.page         // halaman aktif
list.setPage(n)   // pindah halaman
list.search / list.applySearch(v)
list.sortBy / list.sortDir / list.applySort(field, dir)
list.filters / list.applyFilter(key, value)
list.loading      // = query.isPending
list.refetch()    // invalidate seluruh halaman list → refetch
```

**Cara kerjanya:** seluruh kondisi (page, pageSize, search, sort, filter)
menjadi bagian dari query key, sehingga setiap perubahan filter/halaman
memicu fetch server yang tepat. `refetch()` meng-invalidate semua halaman list
sekaligus (setelah mutasi).

---

## 4. Contoh migrasi (sebelum vs sesudah)

**Sebelum (manual):**

```tsx
const [events, setEvents] = useState<Event[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      const res = await getMyEvents();
      if (!cancelled && res.data) setEvents(res.data);
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, []);
```

**Sesudah (TanStack Query):**

```tsx
const { data: events, isLoading: loading } = useApiQuery<Event[]>(
  keys.events.my({}),
  () => getMyEvents(),
);
```

---

## 5. Keuntungan implementasi TanStack

| # | Keuntungan | Penjelasan |
|---|---|---|
| 1 | **Kode jauh lebih pendek** | Hapus `useState` + `useEffect` + `cancelled` + `setLoading` di tiap halaman. |
| 2 | **Cache otomatis** | Data sama tidak di-fetch ulang; pindah halaman & kembali → instan. |
| 3 | **Data selalu fresh** | `staleTime: 0` + `refetchOnWindowFocus` → refetch saat fokus tab. |
| 4 | **Invalidasi terpusat** | Setelah mutasi, `invalidateQueries(key)` → semua list terkait refresh. Tidak perlu `router.refresh()` manual. |
| 5 | **Error handling rapi** | `status:false` → `ApiError` → tinggal pakai `isError` / `error.message`; ada `retry`. |
| 6 | **Loading state otomatis** | `isLoading` / `isPending` menggantikan `busy` / `loading` manual. |
| 7 | **Deduplication request** | Dua komponen butuh data sama → 1 request. |
| 8 | **Pola seragam** | Semua query lewat `keys`, semua aksi lewat `useApiMutation` → mudah di-review. |

---

## 6. Catatan arsitektur (apa yang TIDAK dipakai TanStack)

- **`AuthContext` + `auth.store.ts` (zustand)** — tetap memakai zustand. Ini
  global state auth, bukan server state.
- **Halaman publik server component** (`src/app/(public)/page.tsx`) — tetap
  fetch di server langsung; `useQuery` hanya untuk client component.
- **`http-client.ts` ("use server")** — tetap menjadi lapisan fetch yang membaca
  token dari cookie httpOnly. TanStack berada **di atasnya**, bukan menggantinya.

---

## 7. Checklist untuk developer baru

1. Saat menambah fitur yang ambil data → pakai `useApiQuery` (bukan useEffect).
2. Saat menambah fitur yang ubah data → pakai `useApiMutation` + `invalidate`.
3. Tambahkan "alamat" data baru di `src/lib/query-keys.ts` (jangan string manual).
4. Jangan panggil service langsung di `useEffect` kecuali untuk kasus khusus.
5. `npx tsc --noEmit` harus tetap 0 error setelah perubahan.
