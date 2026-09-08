const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Calls the Python ML service to score an answer's quality.
 * Returns null on failure (the ML score is a "nice to have" second opinion
 * alongside the LLM feedback — a failure here should never break the
 * interview flow).
 */
async function scoreAnswerQuality(answerText, idealAnswer, questionText) {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answerText,
        idealAnswer: idealAnswer || undefined,
        questionText: questionText || undefined,
      }),
    });

    if (!response.ok) {
      console.error("ML service error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return {
      qualityLabel: data.qualityLabel,
      confidenceScore: data.confidenceScore,
    };
  } catch (error) {
    console.error("ML service unreachable:", error.message);
    return null;
  }
}

module.exports = { scoreAnswerQuality };
