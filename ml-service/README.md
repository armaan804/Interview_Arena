# Answer Confidence/Quality Scorer

A custom-trained scikit-learn model that scores mock interview answers as
`GOOD`, `AVERAGE`, or `WEAK` — an independent, quantitative second opinion
alongside the Gemini-generated qualitative feedback.

## Pipeline

1. **Dataset** (`data/generate_dataset.py` → `data/labeled_answers.csv`)
   A synthetically constructed, balanced dataset (150 examples, 50 per
   class) built from answer templates at three quality tiers. This is
   documented as a demonstration dataset for the project report — it is
   not human-labeled real interview data, but it exercises the full ML
   pipeline end-to-end.

2. **Feature extraction** (`features.py`)
   Turns raw answer text into 5 numeric features:
   - `word_count` — answer length
   - `unique_word_ratio` — vocabulary richness
   - `avg_word_length` — average characters per word
   - `filler_ratio` — proportion of filler words ("um", "like", "basically", etc.)
   - `keyword_overlap_ratio` — overlap with the reference/ideal answer, if provided

3. **Training** (`train_model.py`)
   `StandardScaler` → `LogisticRegression` (multiclass), trained with an
   80/20 train/test split. Prints accuracy, a classification report, and a
   confusion matrix. Saves the fitted pipeline to `model.pkl`.

4. **Serving** (`app.py`)
   A small Flask API exposing `POST /score`, called by the Express backend
   after every mock interview answer is graded by Gemini.

## Setup

```bash
cd ml-service
pip install -r requirements.txt --break-system-packages   # omit the flag if not needed on your OS
python3 train_model.py     # trains and saves model.pkl (already included, but re-run anytime)
python3 app.py              # starts the API on http://localhost:8000
```

## API

**POST /score**
```json
{ "answerText": "...", "idealAnswer": "..." }
```
Response:
```json
{ "qualityLabel": "GOOD", "confidenceScore": 0.87, "features": { ... } }
```

## Retraining

To regenerate the dataset and retrain from scratch:
```bash
python3 data/generate_dataset.py
python3 train_model.py
```
