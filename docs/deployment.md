# Production Deployment Guide

## 1. Hosting Architecture Overview

BrandGuard is engineered for zero-maintenance cloud hosting on **Render** using a decoupled multi-service blueprint:

```
+-------------------------------------------------------------------------+
|                  Render CDN (Global Edge Network)                       |
|   Service: brandguard-web (Static Site)                                 |
|   - Built from Next.js static HTML/CSS/JS export (./out)                |
|   - Instant edge delivery, 100% free tier uptime, zero cold starts     |
+------------------------------------+------------------------------------+
                                     | API Requests
                                     v
+-------------------------------------------------------------------------+
|                  Render Web Service (Linux Container)                   |
|   Service: brandguard-api (Python 3.12 + FastAPI + Uvicorn)             |
|   - Asynchronous request handling                                       |
|   - Background workers for OCR & vector retrieval                       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Render Managed PostgreSQL Database                     |
|   Service: brandguard-db                                                |
|   - PostgreSQL 16 with pgvector extension enabled                       |
|   - Automated daily backups and connection pooling                      |
+-------------------------------------------------------------------------+
```

---

## 2. Deploying via Render Blueprint (`render.yaml`)

The repository root includes a declarative `render.yaml` blueprint defining all services and dependencies:

1. **Push your code to GitHub**:
   Ensure your target repository contains the latest commits on branch `main`.

2. **Create New Blueprint Instance**:
   - Navigate to [https://dashboard.render.com/blueprints/new](https://dashboard.render.com/blueprints/new).
   - Select your repository: `YAKSHITH684/BrandGuard-Technical`.
   - Render automatically detects the configuration for `brandguard-web`, `brandguard-api`, and `brandguard-db`.

3. **Provide Secrets**:
   - `GROQ_API_KEY`: Input your API key from [console.groq.com](https://console.groq.com).
   - `JWT_SECRET`: Provide a secure 32+ character random secret string.

4. **Click Apply**:
   Render will automatically provision the PostgreSQL database, compile the Next.js static site, and build the Python web container.

---

## 3. Manual Service Configuration (Step-by-Step)

If configuring services manually within the Render web dashboard:

### 3.1 Frontend Static Site (`brandguard-web`)
- **Service Type**: Static Site
- **Name**: `brandguard-web`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `out`
- **Environment Variables**:
  - `NEXT_PUBLIC_API_URL`: `https://brandguard-api.onrender.com/api`
- **Routing Rules**:
  - Add a Rewrite rule: Source `/*` -> Destination `/index.html` (allows Next.js client-side routing).

### 3.2 Backend Web Service (`brandguard-api`)
- **Service Type**: Web Service
- **Name**: `brandguard-api`
- **Root Directory**: `backend`
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables**:
  - `DATABASE_URL`: Internal Connection String from Render PostgreSQL.
  - `GROQ_API_KEY`: Your Groq API key.
  - `JWT_SECRET`: Random 32+ character string.
  - `CONFIDENCE_THRESHOLD`: `0.65`
  - `FRONTEND_URL`: `https://brandguard-web.onrender.com`

---

## 4. Post-Deployment Verification

1. **Verify Backend Health**:
   Execute a GET request against the root or Swagger endpoint:
   ```bash
   curl -I https://brandguard-api.onrender.com/docs
   ```
   Should return `HTTP/1.1 200 OK`.

2. **Verify Frontend CDN**:
   Open `https://brandguard-web.onrender.com` in a browser. Confirm that the landing page renders without console CORS errors.

3. **Render Free Tier Spin-Down Notice**:
   Free-tier web services on Render sleep after 15 minutes of inactivity. When awoken, the first request takes approximately 30–60 seconds. Subsequent requests execute with sub-second latency.
