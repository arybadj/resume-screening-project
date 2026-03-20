import io
from pypdf import PdfReader


def extract_text_from_pdf(content: bytes, filename: str = "resume") -> str:
    """Extract plain text from PDF bytes using pypdf."""
    try:
        reader = PdfReader(io.BytesIO(content))
        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        full_text = "\n".join(text_parts).strip()
        if not full_text:
            return f"[Could not extract text from {filename}]"
        return full_text
    except Exception as e:
        return f"[Error reading {filename}: {str(e)}]"
