"""
Small Flask API that wraps the trained Answer Confidence/Quality Scorer.

Run: python3 app.py
Exposes: POST /score  { "answerText": "...", "idealAnswer": "..." (optional) }
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from predict import score_answer

app = Flask(__name__)
CORS(app, origins=[os.environ.get("CORS_ORIGIN", "http://localhost:5000")])


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/score", methods=["POST"])
def score():
    data = request.get_json(silent=True) or {}
    answer_text = data.get("answerText")
    ideal_answer = data.get("idealAnswer")

    if not answer_text or not answer_text.strip():
        return jsonify({"error": "answerText is required."}), 400

    try:
        result = score_answer(answer_text, ideal_answer)
        return jsonify(result)
    except FileNotFoundError:
        return jsonify({
            "error": "Model not found. Run 'python3 train_model.py' first to train and save model.pkl."
        }), 500
    except Exception as e:
        return jsonify({"error": f"Scoring failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
