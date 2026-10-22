# Deploying BrandGuard to Render

This repository includes a ready-to-use **Render Blueprint** ([`render.yaml`](file:///C:/Users/yaksh/.gemini/antigravity/scratch/brandguard/render.yaml)) that automatically configures:
1. **`brandguard-api`**: FastAPI backend service (Python 3.12)
2. **`brandguard-web`**: Next.js frontend service (Node 20)
3. **`brandguard-db`**: PostgreSQL database with `pgvector` support

---

## Method 1: Instant Blueprint Deployment (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "BrandGuard Initial Commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/brandguard.git
   git push -u origin main
   ```

2. **Go to Render Dashboard**:
   - Navigate to [https://dashboard.render.com](https://dashboard.render.com).
   - Click **New +** in the top navigation and select **Blueprint**.

3. **Connect Repository**:
   - Select your `brandguard` repository.
   - Render will automatically parse `render.yaml` and display the 3 resources (`brandguard-api`, `brandguard-web`, and `brandguard-db`).

4. **Set Environment Variables**:
   - `GROQ_API_KEY`: Enter your free Groq API key from [https://console.groq.com](https://console.groq.com).
   - Click **Apply**.

Render will build and provision all three services automatically!

---

## Method 2: Manual Service Creation

If you prefer deploying services manually in the Render UI:

### 1. PostgreSQL Database
- **Type:** PostgreSQL
- **Name:** `brandguard-db`
- **Database:** `brandguard`
- **User:** `brandguard_user`
- **Region:** Any (e.g. Oregon / Frankfurt)
- **Plan:** Free

### 2. Backend Web Service
- **Type:** Web Service
- **Name:** `brandguard-api`
- **Root Directory:** `backend`
- **Environment:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `DATABASE_URL`: *(Paste Internal Database URL from your Render PostgreSQL instance)*
  - `GROQ_API_KEY`: *(Your Groq API key)*
  - `JWT_SECRET`: *(Any secure random 32-character string)*
  - `CONFIDENCE_THRESHOLD`: `0.65`
  - `FRONTEND_URL`: `https://brandguard-web.onrender.com`

### 3. Frontend Web Service
- **Type:** Web Service
- **Name:** `brandguard-web`
- **Root Directory:** `frontend`
- **Environment:** Node
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start -- -p $PORT`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: `https://brandguard-api.onrender.com/api`

---

## Verifying Deployment
- Backend heartbeat: `https://brandguard-api.onrender.com/api/health`
- Frontend UI: `https://brandguard-web.onrender.com`
- Interactive Swagger docs: `https://brandguard-api.onrender.com/docs`
