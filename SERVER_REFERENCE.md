# PulseWriteX - Server Reference Guide

## Quick Start / Stop
- **Start everything:** Double-click `START_ALL_SERVERS.bat`  
- **Stop everything:** Double-click `STOP_ALL_SERVERS.bat`

---

## Server Details

### 1. MySQL Database Server
| Item | Value |
|------|-------|
| **Port** | 3306 |
| **Version** | MySQL 8.4.8 |
| **Config File** | `C:\ProgramData\MySQL\my.ini` |
| **Data Directory** | `C:\ProgramData\MySQL\data` |
| **Executable** | `C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe` |
| **Root Password** | `password` |
| **Database Name** | `pulsex_db` |

**Manual Start:**
```
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file=C:\ProgramData\MySQL\my.ini
```

**Connect via CLI:**
```
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -p pulsex_db
```

---

### 2. Node.js Backend Server (Express + Prisma)
| Item | Value |
|------|-------|
| **Port** | 3001 |
| **Directory** | `D:\edu(1)\backend-node` |
| **Entry Point** | `src/app.ts` |
| **ORM** | Prisma (MySQL) |
| **Auth** | JWT |

**Manual Start:**
```
cd D:\edu(1)\backend-node
npm run dev
```

**Prisma Commands:**
```
npx prisma db push       # Push schema changes to DB
npx prisma generate      # Regenerate Prisma client
npx prisma studio        # Open DB GUI in browser
```

---

### 3. Python AI Backend (FastAPI + Uvicorn)
| Item | Value |
|------|-------|
| **Port** | 8000 |
| **Directory** | `D:\edu(1)\backend` |
| **Framework** | FastAPI |
| **Purpose** | AI features (GPT, research, etc.) |

**Manual Start:**
```
cd D:\edu(1)\backend
python -m uvicorn api.app:app --host 0.0.0.0 --port 8000
```

---

### 4. Vite Frontend Dev Server (React)
| Item | Value |
|------|-------|
| **Port** | 5173 |
| **Directory** | `D:\edu(1)` |
| **Framework** | React + Vite + TailwindCSS |
| **API Proxy** | `/api` → `http://localhost:3001` (configured in `vite.config.ts`) |

**Manual Start:**
```
cd D:\edu(1)
npm run dev
```

**Access:** Open `http://localhost:5173` in your browser.

---

## Startup Order (Important!)
Always start in this order:
1. **MySQL** first (database must be ready)
2. **Node.js Backend** (depends on MySQL)
3. **Python Backend** (independent, but good to start early)
4. **Frontend** (depends on backend via proxy)

The `START_ALL_SERVERS.bat` script handles this order automatically.

---

## Environment Files
| File | Purpose |
|------|---------|
| `backend-node/.env` | `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` |
| `backend/.env` | Python backend config (OpenAI API key, etc.) |

---

## Admin Accounts
| Email | Password | Role |
|-------|----------|------|
| `prajwalshetty4552@gmail.com` | `K@16el2939` | SUPER_ADMIN |
| `pulsewritexsolutions@gmail.com` | `EdmalaB@2025` | SUPER_ADMIN |
