"""
Trains the Answer Confidence/Quality Scorer.

Pipeline: StandardScaler -> LogisticRegression (multiclass), trained on
hand-engineered features extracted from each answer (see features.py).

Run: python3 train_model.py
Outputs: model.pkl (the fitted sklearn Pipeline, saved with joblib)
"""

import csv
import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from features import extract_features, features_to_vector, FEATURE_ORDER

DATA_PATH = "data/labeled_answers.csv"
MODEL_PATH = "model.pkl"


def load_dataset(path):
    X, y = [], []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            feats = extract_features(row["answerText"], row.get("idealAnswer"))
            X.append(features_to_vector(feats))
            y.append(row["qualityLabel"])
    return np.array(X, dtype=float), np.array(y)


def main():
    print("Loading dataset...")
    X, y = load_dataset(DATA_PATH)
    print(f"Loaded {len(X)} examples. Features: {FEATURE_ORDER}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(max_iter=1000)),
    ])

    print("Training...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print(f"\nTest accuracy: {acc:.2%}\n")
    print("Classification report:")
    print(classification_report(y_test, y_pred))
    print("Confusion matrix (rows=actual, cols=predicted):")
    labels = sorted(set(y))
    print(f"Labels order: {labels}")
    print(confusion_matrix(y_test, y_pred, labels=labels))

    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nModel saved to {MODEL_PATH}")


if __name__ == "__main__":
    main()
