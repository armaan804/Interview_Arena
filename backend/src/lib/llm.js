const VALID_DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const VALID_OPTIONS = ["A", "B", "C", "D"];
const VALID_RATINGS = ["Strong", "Good", "Needs Improvement"];

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// ---------- Shared Gemini caller (JSON mode, with retry on transient errors) ----------
async function callGeminiJSON(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not set in the backend .env file. Add a real API key to use AI features."
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
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
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("The AI response didn't contain any text content.");
      }
      const cleaned = text
        .trim()
        .replace(/^```(json)?\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      try {
        return JSON.parse(cleaned);
      } catch {
        throw new Error("Could not parse the AI's response as JSON.");
      }
    }

    const errText = await response.text();
    const isTransient = response.status === 503 || response.status === 429;
    lastError = new Error(`Gemini API error (${response.status}): ${errText}`);

    if (!isTransient || attempt === MAX_ATTEMPTS) break;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }

  throw new Error(
    `${lastError.message}\n\nThe AI service is temporarily overloaded. Please wait a moment and try again.`
  );
}

// ---------- Bonus MCQ generation ----------
async function generateBonusMCQs({ roleName, topicName, count, existingQuestions }) {
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

  const parsed = await callGeminiJSON(prompt);

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

// ---------- Mock interview answer evaluation ----------
async function evaluateInterviewAnswer({
  roleName,
  questionText,
  questionType,
  idealAnswer,
  answerText,
}) {
  const isTechnical = questionType === "TECHNICAL";

  const criteria = isTechnical
    ? "technical correctness, depth of understanding, and clarity of explanation"
    : "structure (ideally Situation/Task/Action/Result), specificity of the example given, clarity, and professionalism — also note any vague or filler-heavy phrasing";

  const referenceBlock =
    isTechnical && idealAnswer
      ? `\nReference answer (for your evaluation only — do not reveal this to the candidate):\n${idealAnswer}\n`
      : "";

  const prompt = `You are an experienced ${isTechnical ? "technical" : "HR"} interviewer evaluating a candidate's spoken/written answer for a ${roleName} interview.

Question (${questionType}): ${questionText}
${referenceBlock}
Candidate's answer: ${answerText}

Evaluate the answer on ${criteria}. Give constructive, specific feedback — mention what was good and what could improve. Keep it to 2-4 sentences.

Respond with ONLY raw JSON (no markdown, no code fences):
{
  "feedback": "string, 2-4 sentences of constructive feedback",
  "rating": "Strong" | "Good" | "Needs Improvement"
}`;

  const parsed = await callGeminiJSON(prompt);

  if (!parsed || typeof parsed.feedback !== "string") {
    throw new Error("The AI's response didn't include valid feedback.");
  }

  return {
    feedback: parsed.feedback,
    rating: VALID_RATINGS.includes(parsed.rating) ? parsed.rating : "Good",
  };
}

module.exports = { generateBonusMCQs, evaluateInterviewAnswer };
