import json
import re
from openai import AsyncOpenAI
from config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


SYSTEM_PROMPT = """You are a senior HR recruiter and talent acquisition expert. 
Your job is to evaluate resumes against job descriptions with precision and fairness.
Always return ONLY valid JSON — no markdown, no extra text, no code fences."""


def build_prompt(job_description: str, resumes: list[dict]) -> str:
    resume_block = "\n\n".join(
        f"--- RESUME {i+1}: {r['name']} ---\n{r['text']}"
        for i, r in enumerate(resumes)
    )

    return f"""Analyze the resumes below against the job description and return a JSON array of evaluations.

JOB DESCRIPTION:
{job_description}

RESUMES:
{resume_block}

Return ONLY a valid JSON array with this exact structure for each candidate:
[
  {{
    "candidate": "full name inferred from resume or filename if not found",
    "score": <integer 0-100>,
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "gaps": ["specific gap 1", "specific gap 2", "specific gap 3"],
    "recommendation": "Strong Fit" | "Moderate Fit" | "Not Fit",
    "summary": "One crisp sentence summarizing the candidate's fit."
  }}
]

Scoring rules:
- 80–100 → Strong Fit
- 55–79 → Moderate Fit  
- 0–54  → Not Fit

Sort output by score descending.
Be specific — mention actual skills, tools, and years. Never write generic observations."""


async def screen_resumes(job_description: str, resumes: list[dict]) -> list[dict]:
    prompt = build_prompt(job_description, resumes)

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        max_tokens=settings.MAX_TOKENS,
        temperature=0.2,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ]
    )

    raw = response.choices[0].message.content.strip()
    # Strip accidental markdown fences
    clean = re.sub(r"```json|```", "", raw).strip()

    try:
        candidates = json.loads(clean)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse OpenAI response as JSON: {e}\nRaw: {raw[:300]}")

    return candidates
