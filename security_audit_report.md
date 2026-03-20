# Antigravity Pre-Deployment Security Report

> **Audited:** 2026-03-20 · **Verdict:** 🔴 **NO-GO**
> **Totals:** ✅ 14 Passed · ❌ 52 Failed · ⚠️ 11 Critical Blockers

---

## Section 1 — Authentication (JWT & Sessions)

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 1.1 | JWT secret ≥32 random bytes | ✅ | 64 hex chars in [.env](file:///d:/pulsex%28prototyping%29/.env) |
| 1.2 | Access tokens expire ≤15 min | ❌ | **`TOKEN_EXPIRY = '24h'`** in [config/auth.ts](file:///d:/pulsex%28prototyping%29/backend-node/src/config/auth.ts) |
| 1.3 | Refresh tokens in HttpOnly cookies | ❌ | No refresh token system exists — single JWT sent via response JSON |
| 1.4 | Token revocation/blacklist | ❌ | No blacklist — tokens valid until expiry |
| 1.5 | JWT algorithm explicitly set | ❌ | `jwt.sign()` uses default (`HS256`) — not explicitly locked |
| 1.6 | bcrypt cost factor ≥12 | ❌ | **`SALT_ROUNDS = 10`** in [config/auth.ts](file:///d:/pulsex%28prototyping%29/backend-node/src/config/auth.ts) |
| 1.7 | Password reset single-use + ≤30 min | ❌ | No password reset flow exists |
| 1.8 | Account lockout after 5 failures | ❌ | No lockout mechanism — unlimited login attempts |

> ⚠️ **CRITICAL BLOCKER — Items 1.2, 1.3, 1.8** must be fixed before proceeding.

**Section 1 Score: 1/8 passed**

---

## Section 2 — Google OAuth

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 2.1 | OAuth state parameter validated | ❌ | No CSRF state parameter in OAuth flow |
| 2.2 | Redirect URIs whitelisted in Console | ⚠️ | Cannot verify — requires Google Console access |
| 2.3 | Client secret only in [.env](file:///d:/pulsex%28prototyping%29/.env) | ✅ | `GOOGLE_CLIENT_ID` read from `process.env` |
| 2.4 | ID token verified server-side | ❌ | Frontend decodes JWT client-side ([decodeJwt](file:///d:/pulsex%28prototyping%29/src/pages/LoginPage.tsx#10-22)), not verified with Google's public key server-side |
| 2.5 | Email verified field checked | ❌ | `email_verified` not checked before granting access |
| 2.6 | Session tied to originating device | ❌ | No device binding — token works from any device |

> ⚠️ **CRITICAL BLOCKER — Item 2.4**: ID token is decoded client-side without cryptographic verification.

**Section 2 Score: 1/6 passed**

---

## Section 3 — WhatsApp OTP Flow

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 3.1 | OTP ≥6 digits + crypto-random | ❌ | 6-digit ✅ but uses **`Math.random()`** not `crypto.randomBytes()` |
| 3.2 | OTP expires ≤10 min | ✅ | `5 * 60 * 1000` (5 min) |
| 3.3 | Max 3 attempts before re-request | ❌ | No attempt counter — unlimited retries |
| 3.4 | Re-send rate limited (1/min) | ❌ | No rate limiting on OTP request endpoint |
| 3.5 | OTP stored hashed in DB | ❌ | **Stored as plaintext** in `VerificationCode` table |
| 3.6 | API credentials in [.env](file:///d:/pulsex%28prototyping%29/.env), never logged | ❌ | **OTP logged to console AND written to `whatsapp_debug.log`** with plain OTP value |

> ⚠️ **CRITICAL BLOCKER — Items 3.1, 3.5, 3.6**: OTP is predictable, stored/logged in plaintext.

**Section 3 Score: 1/6 passed**

---

## Section 4 — Role-Based Access Control (RBAC)

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 4.1 | All routes enforce role middleware | ✅ | Admin routes use `authenticateToken + requireRole(['SUPER_ADMIN'])` |
| 4.2 | USER blocked from /admin/* | ✅ | [requireRole](file:///d:/pulsex%28prototyping%29/backend-node/src/middleware/auth.ts#35-59) middleware checks JWT role |
| 4.3 | SUPER_ADMIN validated server-side from JWT | ✅ | Email whitelist in [requireRole](file:///d:/pulsex%28prototyping%29/backend-node/src/middleware/auth.ts#35-59) middleware |
| 4.4 | INSTITUTION_ADMIN scoped to tenant ID | ❌ | No tenant scoping implemented |
| 4.5 | Agent/triage cannot modify pricing/schema | ✅ | Only `SUPER_ADMIN` can access pricing routes |
| 4.6 | Role escalation via POST body impossible | ✅ | Signup hardcodes `role: 'USER'`; role comes from JWT not body |

**Section 4 Score: 5/6 passed**

---

## Section 5 — File Upload Security

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 5.1 | File type validated by magic bytes | ❌ | No magic byte validation — only extension checked |
| 5.2 | Extension whitelist enforced | ❌ | **No extension whitelist** — any file type accepted |
| 5.3 | 50MB limit at middleware | ✅ | `limits: { fileSize: 50 * 1024 * 1024 }` in multer config |
| 5.4 | Files stored outside web root | ❌ | Stored in `uploads/inquiries` and **served via `express.static`** at `/uploads` |
| 5.5 | Files served via signed/expiring URLs | ❌ | Served as public static files — no auth required |
| 5.6 | File names sanitised (path traversal) | ✅ | Multer generates unique filenames `inquiry-{timestamp}-{random}` |
| 5.7 | Virus scan on upload | ❌ | No antivirus scanning |

> ⚠️ **CRITICAL BLOCKER — Items 5.2, 5.4, 5.5**: Any file type accepted, served publicly without authentication.

**Section 5 Score: 2/7 passed**

---

## Section 6 — API & Express Backend

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 6.1 | Helmet.js configured | ❌ | **Not installed or imported** |
| 6.2 | CORS restricted to production domain | ❌ | Only allows `localhost:5173` and `localhost:3000` — no production domain configured |
| 6.3 | Rate limiting on public endpoints | ❌ | **No rate limiting library installed** (no `express-rate-limit`) |
| 6.4 | Strict rate limit on auth routes | ❌ | No rate limiting at all |
| 6.5 | Request body size capped on non-upload | ❌ | **`express.json({ limit: '50mb' })` globally** — should be ~1MB for non-upload routes |
| 6.6 | No raw SQL — Prisma parameterised only | ✅ | All queries use Prisma ORM |
| 6.7 | API errors return generic messages only | ❌ | Some errors expose internal details (e.g., `console.error` output) |
| 6.8 | Input validation (Zod/Joi) on all bodies | ❌ | **No validation library** — manual string checks only |

> ⚠️ **CRITICAL BLOCKER — Items 6.1, 6.3**: No security headers, no rate limiting.

**Section 6 Score: 1/8 passed**

---

## Section 7 — FastAPI / Python ML Pipeline

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 7.1 | FastAPI not publicly accessible | ❌ | Uvicorn **binds to `0.0.0.0:8000`** — publicly accessible |
| 7.2 | Shared internal secret header | ❌ | No auth header between Node → Python |
| 7.3 | No `os.system()` / `subprocess` / `eval()` | ⚠️ | Not fully audited — requires deeper scan |
| 7.4 | File paths validated before Python access | ❌ | No validation layer |
| 7.5 | Python deps pinned in requirements.txt | ❌ | Uses `>=` ranges, not pinned (e.g., `fastapi>=0.115.0`) |
| 7.6 | Uvicorn bound to 127.0.0.1 only | ❌ | **Bound to `0.0.0.0`** in [app.py](file:///d:/pulsex%28prototyping%29/backend/api/app.py) and START_ALL_SERVERS.bat |

> ⚠️ **CRITICAL BLOCKER — Items 7.1, 7.6**: FastAPI is publicly exposed on `0.0.0.0:8000`.

**Section 7 Score: 0/6 passed**

---

## Section 8 — MySQL & Prisma

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 8.1 | DB user has minimum privileges (not root) | ❌ | `DATABASE_URL` uses **[root](file:///d:/pulsex%28prototyping%29/backend/api/app.py#50-54)** user |
| 8.2 | DATABASE_URL only in [.env](file:///d:/pulsex%28prototyping%29/.env) | ✅ | Only in [backend-node/.env](file:///d:/pulsex%28prototyping%29/backend-node/.env) |
| 8.3 | Prisma migrations reviewed before prod | ⚠️ | Using `prisma db push` (not migrations) — no review trail |
| 8.4 | Sensitive columns excluded from `select *` | ❌ | Password excluded manually per-controller but not at schema level |
| 8.5 | DB not exposed on public port | ⚠️ | MySQL default port 3306 — must verify firewall on VPS |
| 8.6 | Automated daily backups | ❌ | No backup automation configured |
| 8.7 | Soft delete for audit trail | ❌ | Hard deletes used (e.g., `deleteMany` on OTP verification) |

> ⚠️ **CRITICAL BLOCKER — Item 8.1**: Database accessed as [root](file:///d:/pulsex%28prototyping%29/backend/api/app.py#50-54).

**Section 8 Score: 1/7 passed**

---

## Section 9 — Frontend (React / Vite)

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 9.1 | No secrets in VITE_* env vars | ✅ | Only `VITE_GOOGLE_CLIENT_ID` (public by design) |
| 9.2 | No `dangerouslySetInnerHTML` | ❌ | Found in [chart.tsx](file:///d:/pulsex%28prototyping%29/src/app/components/ui/chart.tsx) and [GerberViewer.tsx](file:///d:/pulsex%28prototyping%29/src/app/components/prototyping/GerberViewer.tsx) |
| 9.3 | Protected routes redirect unauthenticated | ✅ | CMSLayout checks `sessionStorage` and redirects |
| 9.4 | Auth state in memory/HttpOnly — not localStorage | ❌ | **Auth tokens stored in `localStorage`** across 19+ files |
| 9.5 | CSP header set server-side | ❌ | No Content-Security-Policy header (no Helmet.js) |
| 9.6 | Source maps disabled in production | ⚠️ | Default Vite config — need to verify `build.sourcemap: false` |

**Section 9 Score: 2/6 passed**

---

## Section 10 — Hostinger VPS Hardening

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 10.1–10.9 | All VPS hardening items | ⚠️ | **Not yet deployed — cannot audit.** Pre-deployment checklist created below. |

**Pre-deployment checklist for VPS setup:**
- [ ] Disable SSH root login
- [ ] SSH key-only auth (disable passwords)
- [ ] UFW: allow only 22, 80, 443
- [ ] Let's Encrypt HTTPS
- [ ] HSTS header
- [ ] Nginx reverse proxy for Node (3001) and Python (8000)
- [ ] Install Fail2ban
- [ ] Enable unattended-upgrades
- [ ] PM2 or systemd for both daemons

**Section 10 Score: 0/9 — N/A (not deployed)**

---

## Section 11 — Secrets & Environment

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 11.1 | [.env](file:///d:/pulsex%28prototyping%29/.env) in `.gitignore` | ❌ | **No `.gitignore` file exists in the project** |
| 11.2 | Separate [.env](file:///d:/pulsex%28prototyping%29/.env) for dev/staging/prod | ❌ | Single [.env](file:///d:/pulsex%28prototyping%29/.env) file per backend |
| 11.3 | No secrets in comments/logs/errors | ❌ | **OTP values logged to console and debug file**; also `auth_debug.log` logs login attempts |
| 11.4 | All API keys rotated before go-live | ❌ | OpenAI and Tavily keys visible in [backend/.env](file:///d:/pulsex%28prototyping%29/backend/.env) |
| 11.5 | Logs never contain passwords/tokens/OTPs/PII | ❌ | OTP plaintext logged; global debug log captures all request URLs |

> ⚠️ **CRITICAL BLOCKER — Item 11.1**: No `.gitignore` — [.env](file:///d:/pulsex%28prototyping%29/.env) files with secrets may be committed to version control.

**Section 11 Score: 0/5 passed**

---

## Section 12 — Monitoring & Incident Response

| # | Check | Result | Finding |
|---|-------|--------|---------|
| 12.1 | Centralised error logging (Winston/Sentry) | ❌ | Using `console.error` and raw file appends — no structured logging |
| 12.2 | Failed logins logged with IP/timestamp | ❌ | Login failures logged to file but without IP address |
| 12.3 | Alerts for traffic spikes/errors | ❌ | No alerting system |
| 12.4 | Incident response plan documented | ❌ | No IR plan |
| 12.5 | `npm audit` / `pip-audit` run before deploy | ❌ | Not performed |

**Section 12 Score: 0/5 passed**

---

## Final Summary

| Section | Passed | Failed | Critical? |
|---------|--------|--------|-----------|
| 1. Authentication | 1/8 | 7 | ⚠️ YES |
| 2. Google OAuth | 1/6 | 5 | ⚠️ YES |
| 3. WhatsApp OTP | 1/6 | 5 | ⚠️ YES |
| 4. RBAC | 5/6 | 1 | — |
| 5. File Upload | 2/7 | 5 | ⚠️ YES |
| 6. Express API | 1/8 | 7 | ⚠️ YES |
| 7. FastAPI/Python | 0/6 | 6 | ⚠️ YES |
| 8. MySQL/Prisma | 1/7 | 6 | ⚠️ YES |
| 9. Frontend | 2/6 | 4 | — |
| 10. VPS Hardening | 0/9 | 9 | N/A |
| 11. Secrets/Env | 0/5 | 5 | ⚠️ YES |
| 12. Monitoring | 0/5 | 5 | — |
| **TOTAL** | **14/79** | **65** | **11 Blockers** |

---

## 🔴 Deployment Verdict: **NO-GO**

### Top 11 Critical Blockers (Must Fix Before Go-Live)

1. **JWT expiry is 24 hours** — reduce to 15 min + add refresh tokens
2. **No account lockout** — add lockout after 5 failed attempts
3. **No refresh token / HttpOnly cookie system** — tokens in response JSON
4. **Google ID token not verified server-side** — use Google's public key
5. **OTP uses `Math.random()`** — replace with `crypto.randomBytes()`
6. **OTP stored/logged in plaintext** — hash before storage, remove logging
7. **No file extension whitelist** — accept only `.gbr, .zip, .stl, .pdf, .dxf, .step`
8. **Uploads served publicly** — move outside web root, add auth middleware
9. **No Helmet.js + no rate limiting** — install and configure both
10. **FastAPI on `0.0.0.0`** — bind to `127.0.0.1`, add internal auth header
11. **No `.gitignore`** — create immediately, verify [.env](file:///d:/pulsex%28prototyping%29/.env) not in version control
