from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os

from config import settings
from screener import screen_resumes
from pdf_parser import extract_text_from_pdf

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 HireSignal running at http://{settings.APP_HOST}:{settings.APP_PORT}")
    print(f"🤖 Using model: {settings.OPENAI_MODEL}")
    yield

app = FastAPI(
    title="HireSignal – AI Resume Screener",
    description="Screen resumes against a job description using GPT-4o",
    version="1.0.0",
    lifespan=lifespan
)

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
templates = Jinja2Templates(directory="frontend/templates")


@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/screen")
async def screen(
    job_description: str = Form(...),
    resumes: list[UploadFile] = File(...)
):
    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Job description cannot be empty.")
    if not resumes:
        raise HTTPException(status_code=400, detail="Please upload at least one resume.")
    if len(resumes) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 resumes allowed.")

    # Parse PDFs
    parsed_resumes = []
    for file in resumes:
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF.")
        content = await file.read()
        text = extract_text_from_pdf(content, file.filename)
        parsed_resumes.append({
            "name": file.filename.replace(".pdf", ""),
            "text": text[:settings.MAX_RESUME_CHARS]
        })

    # Call OpenAI
    try:
        results = await screen_resumes(job_description, parsed_resumes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return JSONResponse(content={"candidates": results})


@app.get("/health")
async def health():
    return {"status": "ok", "model": settings.OPENAI_MODEL}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=True
    )
