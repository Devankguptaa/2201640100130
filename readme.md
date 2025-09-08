# URL Shortener + Logging Middleware (Node.js, JS Only)

A small, production-style **URL Shortener** service built in **plain JavaScript (Node 18+, Express)** with a reusable **Logging Middleware** that ships request/error logs to an external collector via `Bearer` auth.

> This repo follows the assignment’s required structure for **Backend** (and the shared logging lib).  
> Keep secrets in `.env` (never commit it) and commit small, atomic changes.

---

## ✨ Features

- Shorten any `http/https` URL with optional **custom shortcode** and **validity (minutes)**
- **302 redirect** by shortcode; returns **410 Gone** after expiry
- **Stats endpoint**: total clicks and click history (timestamp, referrer, coarse geo)
- **Reusable logging** package: `requestLogger`, `errorLogger`, and `logger.log(...)`
- `.gitignore` protects `node_modules/` and `.env`

---

## 🗂 Repository Layout

```
<ROLL_NO>/
├─ .gitignore
├─ Logging Middleware/
│  ├─ package.json
│  └─ index.js
└─ Backend Test Submission/
   ├─ package.json
   ├─ .env.example
   └─ src/
      ├─ server.js
      ├─ routes.js
      ├─ store.js
      └─ utils.js
```

- **Logging Middleware/**: Standalone, reusable JS package (no build step).
- **Backend Test Submission/**: Express API that imports & uses the middleware.

---

## ✅ Prerequisites

- **Node.js v18+** (uses native `fetch`)
- cURL or Postman/Insomnia for API testing
- Git (optional, for commits/pushes)

---

## 🔐 Environment Variables

Copy `.env.example` → `.env` and fill your **Bearer token**:

```bash
PORT=3000
HOST_BASE_URL=http://localhost:3000
LOG_BASE_URL=http://20.244.56.144
LOG_TOKEN=Bearer <YOUR_ACCESS_TOKEN>
```

- `HOST_BASE_URL` builds the returned `shortLink` in responses.
- `LOG_BASE_URL` + `LOG_TOKEN` configure the external log collector.
- `.env` is **ignored** by `.gitignore` (never commit it).

---

## 🚀 Quick Start

```bash
# from repo root:
cd "Backend Test Submission"
npm install

# create local env
cp .env.example .env
# open .env and paste your real Bearer token for LOG_TOKEN

# run
npm start
# server: http://localhost:3000
```

> The logging library is plain JS (CommonJS). No build step required.

---

## 🔌 API Reference

### 1) Create Short URL  
**POST** `/shorturls`

**Body**
```json
{
  "url": "https://example.com/path?x=1",
  "validity": 30,
  "shortcode": "custom1"
}
```

- `url` *(required)*: absolute `http/https` URL
- `validity` *(optional)*: minutes, default **30**
- `shortcode` *(optional)*: Base62 `a-zA-Z0-9`; must be unique.  
  If omitted, the server auto-generates a 6-char Base62 code.

**201 Created**
```json
{
  "shortLink": "http://localhost:3000/abcd1A",
  "expiry": "2025-01-01T00:30:00.000Z"
}
```

**Errors**
- `400` invalid url / shortcode format  
- `409` shortcode already exists

---

### 2) Redirect by Shortcode  
**GET** `/:shortcode`

- **302** → `Location: <originalUrl>` (also records a click)
- **404** unknown shortcode
- **410** expired

---

### 3) Get Statistics  
**GET** `/shorturls/:shortcode`

**200 OK**
```json
{
  "totalClicks": 3,
  "originalUrl": "https://example.com/path?x=1",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "expiry": "2025-01-01T00:30:00.000Z",
  "clicks": [
    { "timestamp": "2025-01-01T00:05:00.000Z", "referrer": "https://google.com", "geo": "India" }
  ]
}
```

**404** unknown shortcode

---

## 🧪 cURL Examples

```bash
# Create (auto-generate shortcode, 30 min default)
curl -s -X POST http://localhost:3000/shorturls   -H "Content-Type: application/json"   -d '{"url":"https://google.com"}'

# Create with validity and custom shortcode
curl -s -X POST http://localhost:3000/shorturls   -H "Content-Type: application/json"   -d '{"url":"https://example.com","validity":1,"shortcode":"abcd1"}'

# Redirect (observe 302 + Location header)
curl -i http://localhost:3000/abcd1

# Stats
curl -s http://localhost:3000/shorturls/abcd1

# Error: invalid URL
curl -i -X POST http://localhost:3000/shorturls   -H "Content-Type: application/json"   -d '{"url":"not-a-url"}'

# Error: collision
curl -i -X POST http://localhost:3000/shorturls   -H "Content-Type: application/json"   -d '{"url":"https://example.com","shortcode":"abcd1"}'

# Expired (after waiting > validity minutes)
curl -i http://localhost:3000/abcd1
```

---

## 📜 Logging Behavior

- **Automatic**
  - `requestLogger` → `INFO`: `HTTP <METHOD> <path>`
  - `errorLogger` → `ERROR`: route/method + error summary
- **Manual**
  - Create short URL → `INFO` (shortcode, expiry)
  - Redirect → `INFO` (shortcode)
  - Stats → `INFO` (shortcode)
  - Collision/Expired → `WARN`

All logs POST to `${LOG_BASE_URL}/log` with `Authorization: Bearer <token>` and a 2-second timeout.  
Logging is **fire-and-forget** (failures never break requests).

Log payload shape:
```json
{
  "stack": "backend",
  "level": "INFO | WARN | ERROR | DEBUG",
  "package": "url-shortener",
  "message": "string",
  "meta": { "any": "context" }
}
```

---

## 🧩 Implementation Notes

- **Storage (v1)**: In-memory `Map` keyed by shortcode  
  Doc: `{ shortcode, originalUrl, createdAt, expiry, clicks[] }`
- **Shortcode Space**: Base62, length 6 by default (increase length to scale)
- **Expiry**: evaluated at read time; 410 once expired
- **Security**: strict URL validation; secrets only in `.env`
- **Scalability (future)**: Redis (TTL) or Postgres + indexes; queue/stream for analytics

---

## 🧾 Deliverables Checklist

- [ ] Repo name = **your Roll Number**
- [ ] `Logging Middleware/` + `Backend Test Submission/` present
- [ ] `.env` kept local; `.env.example` committed
- [ ] Endpoints implemented with correct status codes
- [ ] Postman/Insomnia screenshots (requests, responses, times) in  
      `Backend Test Submission/screenshots/` (optional but recommended)
- [ ] Clean, small, atomic commits

---

## 🐞 Troubleshooting

- **`fetch is not defined`** → Use **Node 18+**.  
- **401/403 from logging** → Check `LOG_TOKEN` (`Bearer ` prefix required).  
- **No redirect** → Ensure the `shortcode` exists and has not expired.  
- **CORS errors** → Use cURL/Postman (no browser UI included).  

---

## 📄 License

MIT (for this exercise repository)
