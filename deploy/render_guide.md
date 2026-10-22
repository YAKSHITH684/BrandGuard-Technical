# Deploying BrandGuard to Render (Static Site + Web Service)

Render allows you to deploy BrandGuard using two distinct service types for maximum performance and cost-efficiency:

1. **`brandguard-web` (Static Site)**:
   * **Type:** Render **Static Site**
   * **Advantage:** 100% Free on Render, global CDN distribution, never sleeps or spins down, zero cold start latency.
   * **Publish Path:** `./out` (Next.js statically exported HTML/CSS/JS)

2. **`brandguard-api` (Web Service)**:
   * **Type:** Render **Web Service**
   * **Advantage:** Dedicated Python 3.12 runtime with Uvicorn, background workers, and pgvector support.
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **`brandguard-db` (PostgreSQL Database)**:
   * Render managed PostgreSQL database with `pgvector` extension enabled.

---

## Option 1: 1-Click Blueprint (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "feat: configure static site and web service for Render"
   git push origin main
   ```

2. **Open Render Blueprint Dashboard**:
   - Visit [https://dashboard.render.com/blueprints/new](https://dashboard.render.com/blueprints/new).
   - Select your repository: **`YAKSHITH684/BrandGuard-Technical`**.

3. **Render Automatically Discovers Both Services**:
   - **`brandguard-api`** (Web Service): Python FastAPI backend.
   - **`brandguard-web`** (Static Site): Next.js static frontend.
   - **`brandguard-db`** (Postgres DB).

4. **Add your `GROQ_API_KEY`**:
   - Provide your free key from [console.groq.com](https://console.groq.com).
   - Click **Apply**.

---

## Option 2: Creating the Two Services Manually in Render Dashboard

If you prefer setting up the two services manually in the Render UI:

### Service 1: The Static Website (`brandguard-web`)
1. Click **New +** → **Static Site**.
2. Connect your repository: `YAKSHITH684/BrandGuard-Technical`.
3. Fill in the configuration:
   * **Name:** `brandguard-web`
   * **Root Directory:** `frontend`
   * **Build Command:** `npm install && npm run build`
   * **Publish Directory:** `out`
4. In **Environment Variables**, add:
   * `NEXT_PUBLIC_API_URL`: `https://brandguard-api.onrender.com/api`
5. In **Redirects/Rewrites**, add:
   * **Type:** Rewrite
   * **Source:** `/*`
   * **Destination:** `/index.html`
6. Click **Create Static Site**.

---

### Service 2: The Web Service (`brandguard-api`)
1. Click **New +** → **Web Service**.
2. Connect your repository: `YAKSHITH684/BrandGuard-Technical`.
3. Fill in the configuration:
   * **Name:** `brandguard-api`
   * **Root Directory:** `backend`
   * **Runtime:** `Python 3`
   * **Build Command:** `pip install -r requirements.txt`
   * **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. In **Environment Variables**, add:
   * `DATABASE_URL`: *(Internal Database URL from Render Postgres, or omit for SQLite fallback)*
   * `GROQ_API_KEY`: *(Your Groq API key)*
   * `JWT_SECRET`: *(A secure 32+ character random string)*
   * `CONFIDENCE_THRESHOLD`: `0.65`
   * `FRONTEND_URL`: `https://brandguard-web.onrender.com`
5. Click **Create Web Service**.
