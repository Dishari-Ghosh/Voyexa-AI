"""
Three-layer chatbot, no external AI API involved (deliberately - a public
LLM would answer from general knowledge about travel sites in general,
not from this specific catalogue and this specific product):

  1. FAQ layer: matches against data/raw/chatbot_qna.xlsx (curated by hand).
  2. Dataset layer: answers place-specific questions ("best time for Dal
     Lake", "how much does Pangong cost") straight from travel.csv - no
     manual Excel entry needed per place.
  3. Fallback: logs the unanswered question to Mongo (chatbot_logs) so it
     can be reviewed and turned into a new FAQ row later.

Matching is normalization-first, so "What is Voyexa AI", "what Voyexa AI"
and "voyexa ai?" all hit the exact same row - never three different
answers for the same underlying question.
"""
import re
import difflib
import pandas as pd

from app.config import settings
from app.services.data_store import get_places_df

_qna_df: pd.DataFrame | None = None

_QUESTION_PREFIXES = [
    "what is", "what's", "whats", "what are", "what does", "what do", "what",
    "who is", "who's", "who",
    "tell me about", "tell me", "can you tell me", "explain",
    "where is", "where's", "where",
    "how do i", "how can i", "how to", "how does", "how do", "how is", "how",
    "why does", "why do", "why is", "why are", "why",
    "does", "do", "is", "are",
]

# Trailing filler that adds no matching signal ("how does X work" / "what
# does the explore button do") - stripped from the end after the prefix
# above, so "explore button work" also collapses down to "explore button".
_TRAILING_FILLER = ["work", "works", "do", "does", "mean", "means", "used for", "for"]

# Ignored when comparing token sets in match_faq - common words that appear
# in almost every question and would otherwise dilute the overlap score.
# Deliberately generic only (no product terms like "site"/"voyexa") since a
# short candidate like the "voyexa" row would be wiped out otherwise.
_STOPWORDS = {"a", "an", "the", "is", "are", "do", "does", "to", "of", "for", "in", "on", "my", "i", "me", "it", "this", "that"}


def load():
    global _qna_df
    _qna_df = pd.read_excel(settings.CHATBOT_QNA_PATH)
    _qna_df["_keywords_norm"] = _qna_df["keywords"].apply(
        lambda s: [normalize(k) for k in str(s).split(",")]
    )
    _qna_df["_question_norm"] = _qna_df["question"].apply(normalize)


def _ensure_loaded():
    if _qna_df is None:
        load()


def normalize(text: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace, and drop common
    question-phrasing prefixes/suffixes - so 'What is X?', 'how does X
    work', 'what X', and 'x' all normalize down to the same core string
    and hit the same FAQ row.

    NOTE: the prefix loop below only ever strips ONE prefix (it breaks on
    the first match), which used to leave a stray "does"/"do" in front of
    anything phrased as "how does X work" - "how does" wasn't in the list
    at all, so only the bare "how" prefix matched, e.g. "how does explore
    work" -> "does explore work" instead of "explore work". That stray
    leading word broke every substring/keyword match for that phrasing.
    "how does", "why does", etc. are now in the list (and checked before
    the shorter "how"/"why" alone, since the list is sorted longest-first),
    so the whole question-phrase prefix comes off in one pass."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)  # strip punctuation
    text = re.sub(r"\s+", " ", text).strip()
    for prefix in sorted(_QUESTION_PREFIXES, key=len, reverse=True):
        if text.startswith(prefix + " "):
            text = text[len(prefix):].strip()
            break
    for filler in _TRAILING_FILLER:
        if text.endswith(" " + filler):
            text = text[: -len(filler)].strip()
    return text


def _tokens(s: str) -> set[str]:
    return {w for w in s.split() if w not in _STOPWORDS}


def match_faq(user_message: str) -> dict | None:
    _ensure_loaded()
    norm = normalize(user_message)
    if not norm:
        return None
    norm_tokens = _tokens(norm)

    best_row = None
    best_score = 0.0
    best_kind = None

    for _, row in _qna_df.iterrows():
        candidates = [row["_question_norm"]] + row["_keywords_norm"]
        for candidate in candidates:
            if not candidate:
                continue
            if norm == candidate:
                return {"answer": row["answer"], "category": row["category"], "match": "exact"}

            # Token-overlap check FIRST: catches reordered/reworded phrasing
            # like "how does the explore button work" -> tokens {explore,
            # button} vs a keyword "explore places" -> tokens {explore,
            # places} (partial overlap) or a keyword "explore" alone (full
            # containment). This is what a plain substring check misses,
            # since the user's extra words ("the", "button") never appear
            # verbatim in the stored keyword phrase.
            cand_tokens = _tokens(candidate)
            if cand_tokens and norm_tokens:
                overlap = cand_tokens & norm_tokens
                if overlap:
                    # how much of the (usually short, specific) keyword
                    # phrase is actually present in what the user typed
                    containment = len(overlap) / len(cand_tokens)
                    # prefer the candidate that explains more of the
                    # keyword, tie-broken by it being the longer/more
                    # specific phrase (avoids a 1-word generic keyword
                    # beating a 2-word specific one on a partial hit)
                    score = containment + 0.01 * len(cand_tokens)
                    if containment >= 0.6 and score > best_score:
                        best_score, best_row, best_kind = score, row, "keyword"

            if candidate in norm or norm in candidate:
                score = len(candidate) / max(len(norm), 1)
                if score > best_score:
                    best_score, best_row, best_kind = score, row, "fuzzy"
            else:
                ratio = difflib.SequenceMatcher(None, norm, candidate).ratio()
                if ratio > best_score and ratio > 0.8:
                    best_score, best_row, best_kind = ratio, row, "fuzzy"

    if best_row is not None and (best_kind == "keyword" or best_score > 0.5):
        return {"answer": best_row["answer"], "category": best_row["category"], "match": "fuzzy"}
    return None


_COST_WORDS = ["cost", "price", "budget", "how much", "expensive", "cheap"]
_SEASON_WORDS = ["best time", "best month", "season", "when should i go", "when to visit"]
_DIFFICULTY_WORDS = ["difficulty", "difficult", "hard", "easy", "strenuous", "tough"]
_DURATION_WORDS = ["duration", "how long", "how many days"]
_SUITABLE_WORDS = ["suitable for", "good for", "family", "solo", "couple", "friends"]

_MONTH_NAMES = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def match_dataset(user_message: str) -> dict | None:
    """Finds a place name mentioned in the message and answers a
    cost/season/difficulty/duration/suitability question about it directly
    from the dataset - no manual Excel row needed per place."""
    df = get_places_df()
    norm = normalize(user_message)
    if not norm:
        return None

    place_row = None
    best_len = 0
    for _, row in df.iterrows():
        place_name_norm = normalize(row["Place_Name"])
        if place_name_norm and place_name_norm in norm and len(place_name_norm) > best_len:
            place_row = row
            best_len = len(place_name_norm)

    if place_row is None:
        return None

    if any(w in norm for w in _COST_WORDS):
        total_min = (
            place_row["Entry_Fee_INR"] + place_row["Activity_Cost_Min"]
            + place_row["HotelcostpernightINR_Min"] + place_row["FoodcostperdayINR_Min"]
        )
        answer = (
            f"{place_row['Place_Name']} costs roughly ₹{int(total_min):,} per day at the low end "
            f"(entry + activity + hotel + food), based on our dataset."
        )
    elif any(w in norm for w in _SEASON_WORDS):
        start, end = int(place_row["Best_Month_Start"]), int(place_row["Best_Month_End"])
        answer = f"The best time to visit {place_row['Place_Name']} is {_MONTH_NAMES[start]}\u2013{_MONTH_NAMES[end]}."
    elif any(w in norm for w in _DIFFICULTY_WORDS):
        answer = f"{place_row['Place_Name']} is rated '{place_row['Difficulty_Level']}' difficulty in our dataset."
    elif any(w in norm for w in _DURATION_WORDS):
        answer = f"A typical visit to {place_row['Place_Name']} takes about {place_row['Typical_Duration']}."
    elif any(w in norm for w in _SUITABLE_WORDS):
        answer = f"{place_row['Place_Name']} is best suited for: {place_row['Suitable_For']}."
    else:
        # place mentioned but no specific question type detected - give an overview
        answer = (
            f"{place_row['Place_Name']} ({place_row['City']}, {place_row['State']}) is a "
            f"{place_row['Terrain_Type'].lower()} spot rated {place_row['Popularity_Rating']}/5, "
            f"suited for {place_row['Suitable_For']}. Ask me about its cost, best season, or "
            f"difficulty for more detail."
        )

    return {"answer": answer, "category": "dataset_lookup", "match": "dataset", "place_id": int(place_row["place_id"])}


FALLBACK_MESSAGE = (
    "This isn't something I can answer yet — I've noted your question so the team can add it. "
    "In the meantime, try asking about a specific place, or how a feature on the site works."
)


def answer(user_message: str) -> dict:
    faq_hit = match_faq(user_message)
    if faq_hit:
        return {**faq_hit, "answered": True}

    dataset_hit = match_dataset(user_message)
    if dataset_hit:
        return {**dataset_hit, "answered": True}

    return {"answer": FALLBACK_MESSAGE, "category": "fallback", "match": None, "answered": False}
