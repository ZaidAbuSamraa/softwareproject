"""
Trainix CV Analysis Service
Extracts text from an uploaded CV (PDF/DOC/DOCX) and uses Groq AI to turn it
into structured JSON consumed by the Node backend (CVs.analysis_data) and the
frontend's CV analysis view / AI matching service.
"""

import json
import os

import docx2txt
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from groq import Groq
from pypdf import PdfReader

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "..", "backend")

load_dotenv(os.path.join(BACKEND_DIR, ".env"))

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = "openai/gpt-oss-120b"
MAX_CV_TEXT_CHARS = 12000

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

app = Flask(__name__)
CORS(app)

ANALYSIS_SCHEMA_KEYS = ["Name", "Email", "Phone", "Degree", "GPA", "Skills", "Experience", "work_mode"]

SYSTEM_PROMPT = """You are a CV/resume parser. Extract structured information from the resume text \
you are given and respond with ONLY a JSON object (no markdown, no commentary) matching exactly \
this shape:

{
  "Name": string or null,
  "Email": string or null,
  "Phone": string or null,
  "Degree": string or null,          // highest degree / field of study found
  "GPA": string or null,             // as written in the CV, e.g. "3.8" or "3.8/4.0"
  "Skills": [string, ...],           // flat list of technical skills, tools, languages, frameworks
  "Experience": [                    // work experience entries, most recent first
    {"position": string, "company": string, "duration": string}
  ],
  "work_mode": string or null        // one of "remote", "onsite", "hybrid" ONLY if explicitly stated as a preference, else null
}

Rules:
- If a field cannot be found, use null (or an empty array for Skills/Experience).
- Never invent information that is not in the text.
- Return valid JSON only.
"""


def resolve_cv_path(cv_path):
    """cv_path arrives as something like "/uploads/cvs/cv-123.pdf" from the Node backend."""
    relative = cv_path.lstrip("/\\")
    absolute = os.path.normpath(os.path.join(BACKEND_DIR, relative))
    return absolute


def extract_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        reader = PdfReader(file_path)
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    if ext in (".docx", ".doc"):
        # docx2txt also handles most .doc files saved by modern Word versions;
        # legacy binary .doc files may fail to extract meaningful text.
        return docx2txt.process(file_path)

    raise ValueError(f"Unsupported file type: {ext}")


def analyze_with_groq(cv_text):
    if not groq_client:
        raise RuntimeError("GROQ_API_KEY is not configured in backend/.env")

    completion = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": cv_text[:MAX_CV_TEXT_CHARS]},
        ],
        response_format={"type": "json_object"},
        temperature=0.2,
    )

    raw = completion.choices[0].message.content
    data = json.loads(raw)

    # Ensure every expected key exists so the frontend never chokes on a missing field.
    result = {key: data.get(key) for key in ANALYSIS_SCHEMA_KEYS}
    if not isinstance(result.get("Skills"), list):
        result["Skills"] = []
    if not isinstance(result.get("Experience"), list):
        result["Experience"] = []

    return result


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "groq_configured": bool(GROQ_API_KEY)})


@app.route("/analyze-cv", methods=["POST"])
def analyze_cv():
    body = request.get_json(silent=True) or {}
    cv_path = body.get("cv_path")

    if not cv_path:
        return jsonify({"success": False, "message": "cv_path is required"}), 400

    file_path = resolve_cv_path(cv_path)

    if not os.path.isfile(file_path):
        return jsonify({"success": False, "message": f"CV file not found: {cv_path}"}), 404

    try:
        cv_text = extract_text(file_path)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"success": False, "message": f"Failed to read CV file: {exc}"}), 422

    if not cv_text or not cv_text.strip():
        return jsonify({
            "success": False,
            "message": "Could not extract any text from this file. Please upload a text-based PDF or DOCX."
        }), 422

    try:
        analysis = analyze_with_groq(cv_text)
    except Exception as exc:  # noqa: BLE001
        print(f"❌ Groq analysis failed: {exc}")
        return jsonify({"success": False, "message": f"AI analysis failed: {exc}"}), 502

    return jsonify({"success": True, "analysis": analysis})


if __name__ == "__main__":
    if not GROQ_API_KEY:
        print("⚠️  GROQ_API_KEY not found in backend/.env — /analyze-cv will fail until it's set.")
    print("🤖 CV Analyzer AI service starting on http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
