# Installation and Environment Setup Guide

## 1. Prerequisites

Before installing BrandGuard, ensure your system meets the following software requirements:

| Tool | Recommended Version | Minimum Version | Verification Command |
|---|---|---|---|
| **Python** | 3.12.x | 3.11.x | `python --version` or `py --version` |
| **Node.js** | 20.x LTS | 18.x LTS | `node --version` |
| **NPM** | 10.x | 9.x | `npm --version` |
| **Git** | 2.40+ | 2.30+ | `git --version` |
| **Tesseract OCR** (Optional) | 5.x | 4.x | `tesseract --version` |

> **Note**: Tesseract OCR is only required if you intend to run image-based ClaimCheck and OCR text extraction locally. Text-only governance functions without OCR installed.

---

## 2. Repository Cloning

Clone the repository to your local development machine:

```bash
git clone https://github.com/YAKSHITH684/BrandGuard-Technical.git
cd BrandGuard-Technical
```

---

## 3. Backend Setup

### 3.1 Create and Activate a Python Virtual Environment

**On Windows (PowerShell / Command Prompt):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
```

**On macOS / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 3.2 Install Python Dependencies
Install runtime packages specified in `requirements.txt`:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3.3 Configure Environment Variables
Copy the template configuration:

```bash
cp .env.example .env
```

Edit `.env` as appropriate:
```dotenv
DATABASE_URL=sqlite:///./brandguard.db
GROQ_API_KEY=gsk_your_groq_api_key_here
JWT_SECRET=super_secret_dev_key_32_characters_long
CONFIDENCE_THRESHOLD=0.65
FRONTEND_URL=http://localhost:3000
```

> **Tip**: If `GROQ_API_KEY` is omitted, BrandGuard runs seamlessly using its deterministic rule engine and fallback heuristic scoring.

---

## 4. Frontend Setup

In a separate terminal window, navigate to the frontend directory:

```bash
cd frontend
npm install
```

Verify that Next.js and Tailwind CSS packages installed cleanly without errors.

---

## 5. Optional: OCR Engine Installation

To support multimodal image governance locally, install Tesseract OCR:

### Windows
1. Download the installer from the [UB-Mannheim Tesseract repository](https://github.com/UB-Mannheim/tesseract/wiki).
2. Install to `C:\Program Files\Tesseract-OCR`.
3. Add `C:\Program Files\Tesseract-OCR` to your system `PATH` environment variable.

### macOS
```bash
brew install tesseract
```

### Linux (Ubuntu / Debian)
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr libtesseract-dev
```

---

## 6. Installation Verification

Verify that both environments are operational:

1. **Verify Backend**:
```bash
cd backend
python -c "import fastapi, sqlalchemy, pydantic; print('Backend dependencies loaded successfully.')"
```

2. **Verify Frontend**:
```bash
cd frontend
npm run lint
```
