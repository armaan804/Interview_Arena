const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

// GET /api/mcq/questions/:topicId
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

    res.json({
      roleName: topic.role.name,
      topicName: topic.name,
      questions: shuffled,
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

module.exports = router;
