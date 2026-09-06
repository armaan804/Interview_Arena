const VALID_DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const VALID_OPTIONS = ["A", "B", "C", "D"];

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

async function generateBonusMCQs({ roleName, topicName, count, existingQuestions }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not set in the backend .env file. Add a real API key to use bonus questions."
    );
  }

  const avoidList =
    existingQuestions.length > 0
      ? `Avoid duplicating or closely rephrasing any of these existing questions:\n${existingQuestions
          .map((q) => `- ${q}`)
          .join("\n")}\n\n`
      : "";

  const prompt = `You are generating multiple-choice interview practice questions for a job-interview prep app.

Role: ${roleName}
Topic: ${topicName}

${avoidList}Generate exactly ${count} NEW multiple-choice questions on this topic, suitable for interview practice. Vary difficulty across BEGINNER, INTERMEDIATE, and ADVANCED roughly evenly. Each question must have exactly one correct option.

Respond with ONLY a raw JSON array (no markdown, no code fences, no prose before or after). Each element must have exactly this shape:
{
  "questionText": "string",
  "optionA": "string",
  "optionB": "string",
  "optionC": "string",
  "optionD": "string",
  "correctOption": "A" | "B" | "C" | "D",
  "difficulty": "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
  "explanation": "string, 1-2 sentences explaining the correct answer"
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      // Gemini's JSON mode - forces the model to return valid JSON only
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const MAX_ATTEMPTS = 3;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    });

    if (response.ok) {
      return parseGeminiResponse(await response.json(), count);
    }

    const errText = await response.text();

    // 503 (model overloaded) and 429 (rate limited) are transient —
    // worth a short retry. Anything else, fail immediately.
    const isTransient = response.status === 503 || response.status === 429;
    lastError = new Error(`Gemini API error (${response.status}): ${errText}`);

    if (!isTransient || attempt === MAX_ATTEMPTS) {
      break;
    }

    const delayMs = attempt * 1500; // 1.5s, then 3s
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error(
    `${lastError.message}\n\nThe AI service is temporarily overloaded. Please wait a moment and try again.`
  );
}

function parseGeminiResponse(data, count) {
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("The AI response didn't contain any text content.");
  }

  let cleaned = text.trim();
  // Strip accidental markdown code fences, just in case
  cleaned = cleaned.replace(/^```(json)?\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Could not parse the AI's response as JSON.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("The AI's response was not a JSON array.");
  }

  const valid = parsed.filter(
    (q) =>
      q &&
      typeof q.questionText === "string" &&
      typeof q.optionA === "string" &&
      typeof q.optionB === "string" &&
      typeof q.optionC === "string" &&
      typeof q.optionD === "string" &&
      VALID_OPTIONS.includes(q.correctOption) &&
      typeof q.explanation === "string"
  );

  return valid.slice(0, count).map((q) => ({
    ...q,
    difficulty: VALID_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : "INTERMEDIATE",
  }));
}

module.exports = { generateBonusMCQs };