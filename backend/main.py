import os
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from services.scanner import run_quick_scan
from services.pdf_generator import generate_audit_pdf

load_dotenv()

app = FastAPI(
    title="RankIN API",
    description="Backend engine for AI Visibility Tracker & GEO Audits",
    version="1.0.0"
)

# Allow requests from frontend development server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QuickScanRequest(BaseModel):
    business_name: str
    city: str
    category: Optional[str] = "Local Business"

@app.get("/api/health")
def health_check():
    api_key_configured = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status": "healthy",
        "app": "RankIN API",
        "gemini_api_configured": api_key_configured
    }

@app.post("/api/scan/quick")
def quick_scan(req: QuickScanRequest):
    if not req.business_name.strip() or not req.city.strip():
        raise HTTPException(status_code=400, detail="Business name and city are required.")

    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured in backend/.env. Please add your API key."
        )

    try:
        results = run_quick_scan(
            business_name=req.business_name,
            city=req.city,
            category=req.category or "Local Business"
        )
        return results
    except Exception as e:
        print(f"[Error] Quick scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/audit/pdf")
def download_audit_pdf(audit_data: dict):
    if not audit_data:
        raise HTTPException(status_code=400, detail="Audit data is required.")

    try:
        pdf_buffer = generate_audit_pdf(audit_data)
        biz_name = audit_data.get("business_name", "business").strip().replace(" ", "_")
        filename = f"RankIN_Audit_{biz_name}.pdf"

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        print(f"[Error] PDF generation error: {e}")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
