# Mexpo Docker Compose Environment Guide

This setup provides a complete, containerized environment for the entire Mexpo ecosystem with all default environment variables pre-configured.

---

## 🏗️ Architecture & Services

The Docker Compose configuration (`docker-compose.yml`) orchestrates 5 services:

| Service | Technology | Port (Host:Container) | Description |
|---|---|---|---|
| **frontend** | Next.js 16 + React 19 | `3000:3000` | Web application (public pages, event dashboard, visitor/tenant portal) |
| **backend** | NestJS 11 + Prisma | `3500:3500` | REST API, Auth, Tickets, Reports, WebSocket & Midtrans integration |
| **postgres** | PostgreSQL 16 Alpine | `5432:5432` | Local PostgreSQL database with persistent volume storage |
| **minio** | MinIO (S3 Compatible) | `9000:9000` (API)<br>`9001:9001` (Console) | Object storage for event assets, certificate templates, avatars, proofs |
| **minio-init** | MinIO Client (`mc`) | *(internal)* | Automated bucket creation & public read policy configuration |

---

## 🚀 Quick Start

### 1. Start all services
Run the following command in the root directory:

```bash
docker compose up --build -d
```

### 2. View logs
```bash
# All logs
docker compose logs -f

# Backend logs only
docker compose logs -f backend

# Frontend logs only
docker compose logs -f frontend
```

### 3. Service URLs
- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs:** [http://localhost:3500/docs](http://localhost:3500/docs)
- **MinIO Console UI:** [http://localhost:9001](http://localhost:9001)
  - *Username:* `minioadmin`
  - *Password:* `minioadmin123`

---

## ⚙️ Environment Variables Configuration

The `.env` file in the root directory is automatically loaded by Docker Compose. All default values from your development setup are already pre-filled.

### 🔄 Switching Database: Local Docker Postgres vs Remote Supabase

#### Option A: Local Docker PostgreSQL (Default)
In `.env`:
```env
DB_PROVIDER=postgresql
DB_HOST=postgres
DB_PORT=5432
DB_USER=mexpo_user
DB_PASSWORD=mexpo_password_2026
DB_NAME=mexpo_db
DB_SSLMODE=
```

#### Option B: Remote Supabase PostgreSQL
To connect the Docker backend to your Supabase instance, uncomment and update the Supabase section in `.env`:
```env
DB_PROVIDER=postgresql
DB_HOST=aws-0-ap-southeast-2.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.dqzbpbycvchbifnkdtzr
DB_PASSWORD=I0OXdrJUnx40Y1Ku
DB_NAME=postgres
DB_SSLMODE=no-verify
```
Then restart the backend:
```bash
docker compose up -d backend
```

---

## 🗄️ Database Management & Seeding

### Run Prisma Migrations
Migrations automatically run on container startup (`prisma migrate deploy`). To run manually:
```bash
docker compose exec backend npx prisma migrate deploy
```

### Seed Database with Demo Data
To seed initial demo events and users into the database:
```bash
docker compose exec backend npx prisma db seed
```

### Access PostgreSQL CLI (`psql`)
```bash
docker compose exec postgres psql -U mexpo_user -d mexpo_db
```

---

## 📦 MinIO Auto-Configured Buckets

The `minio-init` service automatically provisions the following buckets with public read permissions on startup:
- `expo-project` (User avatars)
- `expo-project-event` (Event banners & photos)
- `expo-project-sponsor` (Sponsor logos)
- `expo-project-speaker` (Speaker photos)
- `expo-project-tenant` (Tenant logos & profiles)
- `expo-project-product` (Tenant product catalogs)
- `expo-project-transaction` (Transaction receipts & proofs)
- `expo-project-certificate` (Certificate background templates)
- `expo-project-proof` (Settlement transfer proofs)

---

## 🛑 Stopping & Resetting the Environment

### Stop all containers
```bash
docker compose down
```

### Stop containers and remove persistent volumes (fresh reset)
```bash
docker compose down -v
```
