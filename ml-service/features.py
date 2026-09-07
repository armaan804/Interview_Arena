"""
Feature extraction for the Answer Confidence/Quality Scorer.

Turns a raw answer (and optionally an ideal/reference answer) into a fixed
set of numeric features that a scikit-learn classifier can consume.
"""

import re

FILLER_WORDS = {
    "um", "uh", "like", "basically", "actually", "literally",
    "sort", "kind", "guess", "stuff", "thing", "things",
}

FILLER_PHRASES = ["you know", "i guess", "sort of", "kind of", "and stuff", "or something"]


def _tokenize(text):
    return re.findall(r"[a-z']+", text.lower())


def _count_filler_words(text_lower, tokens):
    count = sum(1 for t in tokens if t in FILLER_WORDS)
    for phrase in FILLER_PHRASES:
        count += text_lower.count(phrase)
    return count


def extract_features(answer_text: str, ideal_answer: str | None = None) -> dict:
    """
    Returns a dict of numeric features describing the answer.
    Keys here MUST match the FEATURE_ORDER list used at train/predict time.
    """
    text = (answer_text or "").strip()
    text_lower = text.lower()
    tokens = _tokenize(text)
    word_count = len(tokens)
    unique_words = len(set(tokens))
    char_count = len(text)

    filler_count = _count_filler_words(text_lower, tokens)
    filler_ratio = filler_count / word_count if word_count > 0 else 0.0

    unique_word_ratio = unique_words / word_count if word_count > 0 else 0.0
    avg_word_length = char_count / word_count if word_count > 0 else 0.0

    # Keyword overlap with the ideal/reference answer, if one is provided
    if ideal_answer:
        ideal_tokens = set(_tokenize(ideal_answer))
        overlap = len(ideal_tokens.intersection(tokens))
        keyword_overlap_ratio = overlap / len(ideal_tokens) if ideal_tokens else 0.0
    else:
        keyword_overlap_ratio = 0.0

    return {
        "word_count": word_count,
        "unique_word_ratio": unique_word_ratio,
        "avg_word_length": avg_word_length,
        "filler_ratio": filler_ratio,
        "keyword_overlap_ratio": keyword_overlap_ratio,
    }


# Fixed feature order — used to build the numeric vector fed to the model.
FEATURE_ORDER = [
    "word_count",
    "unique_word_ratio",
    "avg_word_length",
    "filler_ratio",
    "keyword_overlap_ratio",
]


def features_to_vector(feature_dict: dict) -> list:
    return [feature_dict[key] for key in FEATURE_ORDER]
