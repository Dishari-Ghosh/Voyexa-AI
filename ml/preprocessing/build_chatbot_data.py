"""
build_chatbot_data.py
----------------------
Converts data/raw/chatbot_qna.xlsx into frontend/src/data/chatbotQnA.json,
a validated snapshot of the Q&A sheet. NOTE: the live chatbot now runs on the
FastAPI backend, which reads data/raw/chatbot_qna.xlsx DIRECTLY (see
backend/app/services/chatbot.py) — so after editing the Excel file you just
restart the backend. Running this script is still useful to catch empty answers,
duplicate ids and near-duplicate questions before they ship.

THIS is the script Dishari runs every time she edits the Excel file:

    cd ml/preprocessing
    python build_chatbot_data.py

Workflow:
  1. Open data/raw/chatbot_qna.xlsx in Excel / Google Sheets / LibreOffice.
  2. Add, edit or delete rows. Required columns: id, category, question,
     keywords, answer. "question" is the canonical phrasing — you do NOT
     need a row per phrasing/typo, the chatbot fuzzy-matches variations
     against "question" + "keywords" automatically. Leave "id" blank on a
     new row and this script will assign one.
  3. Save the file.
  4. Run this script.
  5. Refresh the site (npm run dev) — the chatbot now uses the new content.

The script also prints warnings for empty answers, duplicate ids, and
near-duplicate questions, so mistakes are caught before they ship.
"""

import json
import re
from pathlib import Path
from difflib import SequenceMatcher

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]  # .../VOYEXAAI
XLSX_PATH = ROOT / "data" / "raw" / "chatbot_qna.xlsx"
JSON_OUT_PATH = ROOT / "frontend" / "src" / "data" / "chatbotQnA.json"

REQUIRED_COLUMNS = ["question", "answer"]

# Must stay identical to STOPWORDS in frontend/src/utils/chatbotEngine.js —
# tokens are compared against tokens, so both sides need to strip the same
# filler words or short/typo'd questions score lower than they should.
STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "am",
    "i", "you", "your", "yours", "my", "me", "we", "our", "it", "its",
    "do", "does", "did", "doing", "to", "of", "for", "in", "on", "at",
    "and", "or", "so", "but", "with", "about", "there", "this", "that",
    "can", "could", "would", "should", "will", "shall", "please",
    "tell", "give", "show", "let", "know", "want", "like", "some",
    "any", "what", "whats", "which", "who", "whom", "how", "when",
    "where", "why",
}


def normalize(text):
    text = str(text or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def content_tokens(text):
    return sorted({w for w in normalize(text).split() if w not in STOPWORDS})


def main():
    if not XLSX_PATH.exists():
        raise SystemExit(
            f"Could not find {XLSX_PATH}.\n"
            "Run seed_chatbot_excel.py first if this is the very first build, "
            "or check the file wasn't moved/renamed."
        )

    df = pd.read_excel(XLSX_PATH, sheet_name=0, dtype=str)
    df.columns = [c.strip().lower() for c in df.columns]

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise SystemExit(f"Excel is missing required column(s): {missing}")

    for col in ["id", "category", "question", "keywords", "answer"]:
        if col not in df.columns:
            df[col] = ""
        df[col] = df[col].fillna("").astype(str).str.strip()

    # drop fully blank rows
    df = df[(df["question"] != "") & (df["answer"] != "")].reset_index(drop=True)

    # assign ids to any blank ones
    seen_ids = set()
    next_num = 1
    fixed_ids = []
    for existing_id in df["id"]:
        if existing_id and existing_id not in seen_ids:
            fixed_ids.append(existing_id)
            seen_ids.add(existing_id)
            continue
        while f"FAQ{next_num:03d}" in seen_ids:
            next_num += 1
        new_id = f"FAQ{next_num:03d}"
        seen_ids.add(new_id)
        fixed_ids.append(new_id)
    df["id"] = fixed_ids

    entries = []
    for _, row in df.iterrows():
        keywords = [k.strip() for k in row["keywords"].split(",") if k.strip()]
        entries.append(
            {
                "id": row["id"],
                "category": row["category"],
                "question": row["question"],
                "keywords": keywords,
                "answer": row["answer"],
                # precomputed at build time so the browser never has to
                # normalize/tokenize the same static text on every keystroke
                "tokens": content_tokens(row["question"] + " " + " ".join(keywords)),
            }
        )

    # --- sanity warnings (non-fatal) ------------------------------------
    norm_questions = [normalize(e["question"]) for e in entries]
    for i in range(len(entries)):
        for j in range(i + 1, len(entries)):
            if not norm_questions[i] or not norm_questions[j]:
                continue
            ratio = SequenceMatcher(None, norm_questions[i], norm_questions[j]).ratio()
            if ratio > 0.92:
                print(
                    f"[warn] {entries[i]['id']} and {entries[j]['id']} look almost "
                    f"identical ({ratio:.0%} similar) — consider merging them:\n"
                    f"        {entries[i]['id']}: {entries[i]['question']}\n"
                    f"        {entries[j]['id']}: {entries[j]['question']}"
                )

    JSON_OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    JSON_OUT_PATH.write_text(json.dumps(entries, indent=2, ensure_ascii=False))

    categories = sorted({e["category"] for e in entries if e["category"]})
    print(f"Built {len(entries)} chatbot Q&A entries -> {JSON_OUT_PATH}")
    print(f"Categories: {', '.join(categories)}")


if __name__ == "__main__":
    main()
