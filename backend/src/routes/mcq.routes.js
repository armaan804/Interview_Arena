const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");
const { generateBonusMCQs } = require("../lib/llm");

const router = express.Router();

// GET /api/mcq/questions/:topicId?count=10
// Returns questions WITHOUT correctOption/explanation — grading happens
// server-side via POST /attempt so answers never reach the client early.
router.get("/questions/:topicId", requireAuth, async (req, res) => {
  try {
    const { topicId } = req.params;

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { role: true },
    });

    if (!topic) {
      return res.status(404).json({ error: "Topic not found." });
    }

    const questions = await prisma.mCQQuestion.findMany({
      where: { topicId },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        difficulty: true,
      },
    });

    // Shuffle server-side so repeated sessions vary
    const shuffled = [...questions].sort(() => Math.random() - 0.5);

    const requestedCount = parseInt(req.query.count, 10);
    const count =
      Number.isFinite(requestedCount) && requestedCount > 0
        ? Math.min(requestedCount, shuffled.length)
        : shuffled.length;

    const selected = shuffled.slice(0, count);

    res.json({
      roleName: topic.role.name,
      topicName: topic.name,
      questions: selected,
      totalAvailable: shuffled.length,
    });
  } catch (error) {
    console.error("Fetch questions error:", error);
    res.status(500).json({ error: "Failed to fetch questions." });
  }
});

// POST /api/mcq/attempt
router.post("/attempt", requireAuth, async (req, res) => {
  try {
    const { questionId, selectedOption, timeTakenSec } = req.body;

    if (!questionId || !selectedOption) {
      return res.status(400).json({ error: "questionId and selectedOption are required." });
    }

    const question = await prisma.mCQQuestion.findUnique({ where: { id: questionId } });
    if (!question) {
      return res.status(404).json({ error: "Question not found." });
    }

    const isCorrect = question.correctOption === selectedOption;

    await prisma.mCQAttempt.create({
      data: {
        userId: req.user.userId,
        questionId: question.id,
        selectedOption,
        isCorrect,
        timeTakenSec: timeTakenSec ?? null,
      },
    });

    res.json({
      isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanation,
    });
  } catch (error) {
    console.error("MCQ attempt error:", error);
    res.status(500).json({ error: "Something went wrong grading this question." });
  }
});

// POST /api/mcq/bonus/:topicId
// Generates fresh AI questions via the LLM, saves them to the DB
// (tagged isAIGenerated: true), and returns them sanitized like /questions.
router.post("/bonus/:topicId", requireAuth, async (req, res) => {
  try {
    const { topicId } = req.params;
    const requestedCount = parseInt(req.body.count, 10);
    const count = Number.isFinite(requestedCount)
      ? Math.min(Math.max(requestedCount, 1), 10)
      : 5;

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { role: true },
    });
    if (!topic) {
      return res.status(404).json({ error: "Topic not found." });
    }

    const existing = await prisma.mCQQuestion.findMany({
      where: { topicId },
      select: { questionText: true },
      take: 20,
    });

    const generated = await generateBonusMCQs({
      roleName: topic.role.name,
      topicName: topic.name,
      count,
      existingQuestions: existing.map((e) => e.questionText),
    });

    if (generated.length === 0) {
      return res.status(502).json({
        error: "The AI didn't return any usable questions. Please try again.",
      });
    }

    const created = await Promise.all(
      generated.map((q) =>
        prisma.mCQQuestion.create({
          data: {
            topicId,
            difficulty: q.difficulty,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            explanation: q.explanation,
            isAIGenerated: true,
          },
        })
      )
    );

    const sanitized = created.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      difficulty: q.difficulty,
    }));

    res.json({
      roleName: topic.role.name,
      topicName: topic.name,
      questions: sanitized,
    });
  } catch (error) {
    console.error("Bonus question generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate bonus questions." });
  }
});

module.exports = router;