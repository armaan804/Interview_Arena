const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");
const { evaluateInterviewAnswer } = require("../lib/llm");
const { scoreAnswerQuality } = require("../lib/mlService");

const router = express.Router();

// POST /api/mock-interview/start   { roleId, count }
router.post("/start", requireAuth, async (req, res) => {
  try {
    const { roleId, count } = req.body;
    if (!roleId) {
      return res.status(400).json({ error: "roleId is required." });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      return res.status(404).json({ error: "Role not found." });
    }

    const allQuestions = await prisma.subjectiveQuestion.findMany({
      where: { topic: { roleId } },
      select: { id: true, questionText: true, type: true, difficulty: true },
    });

    if (allQuestions.length === 0) {
      return res
        .status(404)
        .json({ error: "No mock interview questions available for this role yet." });
    }

    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const requestedCount = parseInt(count, 10);
    const n =
      Number.isFinite(requestedCount) && requestedCount > 0
        ? Math.min(requestedCount, shuffled.length)
        : Math.min(5, shuffled.length);
    const selected = shuffled.slice(0, n);

    const session = await prisma.mockInterviewSession.create({
      data: { userId: req.user.userId, roleId },
    });

    res.json({
      sessionId: session.id,
      roleName: role.name,
      questions: selected,
      totalAvailable: shuffled.length,
    });
  } catch (error) {
    console.error("Start mock interview error:", error);
    res.status(500).json({ error: "Failed to start mock interview." });
  }
});

// POST /api/mock-interview/answer   { sessionId, questionId, answerText }
// Just saves the answer — no AI evaluation here. All feedback is generated
// together in /finish, once the whole interview is done.
router.post("/answer", requireAuth, async (req, res) => {
  try {
    const { sessionId, questionId, answerText } = req.body;

    if (!sessionId || !questionId || !answerText || !answerText.trim()) {
      return res
        .status(400)
        .json({ error: "sessionId, questionId, and answerText are required." });
    }

    const session = await prisma.mockInterviewSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== req.user.userId) {
      return res.status(404).json({ error: "Session not found." });
    }

    const question = await prisma.subjectiveQuestion.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      return res.status(404).json({ error: "Question not found." });
    }

    await prisma.interviewResponse.create({
      data: {
        sessionId,
        questionId,
        answerText,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Mock interview answer error:", error);
    res.status(500).json({ error: "Something went wrong saving this answer." });
  }
});

// POST /api/mock-interview/finish   { sessionId }
// Evaluates every saved answer in the session via the LLM, all at once,
// updates each InterviewResponse with feedback, and returns the full set
// of results for the review screen.
router.post("/finish", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await prisma.mockInterviewSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== req.user.userId) {
      return res.status(404).json({ error: "Session not found." });
    }

    const responses = await prisma.interviewResponse.findMany({
      where: { sessionId },
      include: {
        question: { include: { topic: { include: { role: true } } } },
      },
      orderBy: { createdAt: "asc" },
    });

    const results = [];

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const question = response.question;
      let feedback;
      let rating;

      // Space out requests to stay under Gemini's free-tier rate limit.
      // Without this, only the first call in the loop succeeds and the
      // rest get 429'd before the retry logic can recover.
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }

      try {
        const evalResult = await evaluateInterviewAnswer({
          roleName: question.topic.role.name,
          questionText: question.questionText,
          questionType: question.type,
          idealAnswer: question.idealAnswer,
          answerText: response.answerText,
        });
        feedback = evalResult.feedback;
        rating = evalResult.rating;
      } catch (llmError) {
        console.error("LLM evaluation error:", llmError);
        feedback =
          "AI feedback couldn't be generated for this answer right now (the AI service may be busy). Your answer was still saved.";
        rating = null;
      }

      // Second opinion from our own trained ML model — independent of the
      // LLM. Failure here is non-fatal; the interview still completes.
      const mlResult = await scoreAnswerQuality(
        response.answerText,
        question.idealAnswer,
        question.questionText
      );

      await prisma.interviewResponse.update({
        where: { id: response.id },
        data: {
          llmFeedback: feedback,
          llmRating: rating,
          mlQualityLabel: mlResult?.qualityLabel || null,
          mlConfidenceScore: mlResult?.confidenceScore ?? null,
        },
      });

      results.push({
        questionId: question.id,
        questionText: question.questionText,
        type: question.type,
        answerText: response.answerText,
        feedback,
        rating,
        mlQualityLabel: mlResult?.qualityLabel || null,
        mlConfidenceScore: mlResult?.confidenceScore ?? null,
      });
    }

    await prisma.mockInterviewSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });

    res.json({ results });
  } catch (error) {
    console.error("Finish mock interview error:", error);
    res.status(500).json({ error: "Failed to evaluate and finish the session." });
  }
});

module.exports = router;
