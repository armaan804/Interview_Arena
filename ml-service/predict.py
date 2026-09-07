"""
Loads the trained model and provides a simple predict function.
"""

import joblib
from features import extract_features, features_to_vector

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = joblib.load("model.pkl")
    return _model


def score_answer(answer_text: str, ideal_answer: str | None = None) -> dict:
    """
    Returns {"qualityLabel": "GOOD" | "AVERAGE" | "WEAK", "confidenceScore": float}
    confidenceScore is the model's predicted probability for the chosen label.
    """
    model = _get_model()
    feats = extract_features(answer_text, ideal_answer)
    vector = [features_to_vector(feats)]

    label = model.predict(vector)[0]
    probabilities = model.predict_proba(vector)[0]
    class_index = list(model.classes_).index(label)
    confidence = float(probabilities[class_index])

    return {
        "qualityLabel": label,
        "confidenceScore": round(confidence, 4),
        "features": feats,
    }
