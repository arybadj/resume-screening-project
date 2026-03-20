# HireSignal — AI Resume Screener

A **FastAPI + GPT-4o** powered resume screening system. Upload PDF resumes, paste a Job Description, and get a ranked table with scores, strengths, gaps, and recommendations.

---

## 📁 Project Structure

```
hiresignal/
├── main.py                        # FastAPI app entry point
├── .env                           # Your API key (never commit this)
├── requirements.txt
├── .gitignore
│
├── backend/
│   ├── __init__.py
│   ├── config.py                  # Loads .env via pydantic-settings
│   ├── pdf_parser.py              # PDF → text using pypdf
│   └── screener.py                # OpenAI API call + prompt logic
│
├── frontend/
│   ├── templates/
│   │   └── index.html             # Jinja2 template
│   └── static/
│       ├── css/style.css
│       └── js/app.js
│
└── sample-data/
    ├── job_description.txt
    └── generate_sample_resumes.py
```

---

## ⚡ Quick Start

### 1. Clone & install
```bash
git clone https://github.com/arybadj/resume-screening-project.git
cd hiresignal
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set up your API key
```bash
cp  .env
# Edit .env and paste your OpenAI API key
```

Your `.env` should look like:
```
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
MAX_TOKENS=2000
MAX_RESUME_CHARS=3500
APP_HOST=0.0.0.0
APP_PORT=8000
```

### 3. Run the server
```bash
python main.py
# or
uvicorn main:app --reload
```

### 4. Open in browser
```
http://localhost:8000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Web UI |
| POST | `/api/screen` | Screen resumes (form-data) |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI (auto-generated) |

### POST `/api/screen`
**Form fields:**
- `job_description` (string) — full JD text
- `resumes` (file[]) — one or more PDF files

**Response:**
```json
{
  "candidates": [
    {
      "candidate": "Aryash Badjatya",
      "score": 88,
      "strengths": ["Strong SQL (window functions, CTEs)", "3yr Tableau exp at Flipkart", "A/B testing expertise"],
      "gaps": ["No cloud certifications mentioned", "No dbt experience", "Limited ML exposure"],
      "recommendation": "Strong Fit",
      "summary": "Experienced data analyst with strong BI and SQL skills, highly aligned with the role."
    }
  ]
}
```

---

## 🧠 How It Works

```
Browser uploads PDFs + JD text via multipart form
          ↓
FastAPI /api/screen receives files
          ↓
pypdf extracts text from each PDF (server-side)
          ↓
Screener builds structured prompt → calls GPT-4o
          ↓
GPT-4o returns JSON array (score, strengths, gaps, recommendation)
          ↓
FastAPI returns JSON → browser renders ranked table
```

**Key design decisions:**
- `.env` via `pydantic-settings` — clean config, never hardcoded keys
- `pypdf` server-side parsing — more reliable than browser-based PDF.js
- `temperature=0.2` — keeps AI responses consistent and factual
- Structured JSON-only prompt — reliable parsing, no hallucinated formatting
- CSV export — results are immediately usable by HR teams

---

## 🧪 Testing with Sample Data

```bash
pip install fpdf2
python sample-data/generate_sample_resumes.py
```

Then upload the generated PDFs and paste `sample-data/job_description.txt` into the UI.

| Candidate | Expected Score | Expected Recommendation |
|-----------|---------------|------------------------|
| Priya Sharma | 85–92 | Strong Fit |
| Sneha Reddy | 65–75 | Moderate Fit |
| Arjun Mehta | 55–68 | Moderate Fit |
| Rohan Kapoor | 55–65 | Moderate Fit |
| Kavya Nair | 25–40 | Not Fit |

---

## 🔮 Improvements for Production

- [ ] Add authentication (API key or OAuth)
- [ ] Store results in PostgreSQL
- [ ] Export results as formatted PDF report
- [ ] Support DOCX resume format
- [ ] Add interviewer question suggestions per candidate
- [ ] Deploy on Railway / Render / AWS EC2

---

*Built for AI Automation Intern assessment · Tools: FastAPI, OpenAI GPT-4o, pypdf, Jinja2*
