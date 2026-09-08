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

# Common words that don't carry topical meaning -- excluded when measuring
# whether an answer actually engages with the specific question asked.
STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "to", "of", "in", "on", "at", "for", "with", "and", "or", "but", "if",
    "how", "what", "why", "when", "where", "who", "which", "this", "that",
    "you", "your", "i", "me", "my", "it", "its", "as", "by", "from", "do",
    "did", "does", "have", "has", "had", "can", "would", "will", "about",
    "describe", "tell", "explain", "would", "should",
}


def _tokenize(text):
    return re.findall(r"[a-z']+", text.lower())


def _content_words(tokens):
    return {t for t in tokens if t not in STOPWORDS and len(t) > 2}


def _count_filler_words(text_lower, tokens):
    count = sum(1 for t in tokens if t in FILLER_WORDS)
    for phrase in FILLER_PHRASES:
        count += text_lower.count(phrase)
    return count


def extract_features(
    answer_text: str,
    ideal_answer: str | None = None,
    question_text: str | None = None,
) -> dict:
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

    # Keyword overlap with the ideal/reference answer, if one is provided.
    # Often unavailable for HR/behavioral questions.
    if ideal_answer:
        ideal_tokens = set(_tokenize(ideal_answer))
        overlap = len(ideal_tokens.intersection(tokens))
        keyword_overlap_ratio = overlap / len(ideal_tokens) if ideal_tokens else 0.0
    else:
        keyword_overlap_ratio = 0.0

    # Question overlap: does the answer actually engage with THIS question's
    # topic words? Works even when there's no ideal answer, and catches
    # fluent-but-off-topic or reused/templated answers that keyword_overlap
    # alone would miss.
    if question_text:
        question_content_words = _content_words(_tokenize(question_text))
        answer_content_words = _content_words(tokens)
        overlap = len(question_content_words.intersection(answer_content_words))
        question_overlap_ratio = (
            overlap / len(question_content_words) if question_content_words else 0.0
        )
    else:
        question_overlap_ratio = 0.0

    return {
        "word_count": word_count,
        "unique_word_ratio": unique_word_ratio,
        "avg_word_length": avg_word_length,
        "filler_ratio": filler_ratio,
        "keyword_overlap_ratio": keyword_overlap_ratio,
        "question_overlap_ratio": question_overlap_ratio,
    }


# Fixed feature order — used to build the numeric vector fed to the model.
FEATURE_ORDER = [
    "word_count",
    "unique_word_ratio",
    "avg_word_length",
    "filler_ratio",
    "keyword_overlap_ratio",
    "question_overlap_ratio",
]


def features_to_vector(feature_dict: dict) -> list:
    return [feature_dict[key] for key in FEATURE_ORDER]
