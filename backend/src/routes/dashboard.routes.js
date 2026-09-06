const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const attempts = await prisma.mCQAttempt.findMany({
      where: { userId },
      orderBy: { attemptedAt: "asc" },
      include: {
        question: {
          include: {
            topic: { include: { role: true } },
          },
        },
      },
    });

    // ---------- Overall ----------
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter((a) => a.isCorrect).length;
    const overallAccuracyPct =
      totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    // ---------- By topic ----------
    const topicMap = new Map();
    for (const a of attempts) {
      const topic = a.question.topic;
      const key = topic.id;
      if (!topicMap.has(key)) {
        topicMap.set(key, {
          topicId: topic.id,
          topicName: topic.name,
          roleName: topic.role.name,
          attempts: 0,
          correct: 0,
        });
      }
      const entry = topicMap.get(key);
      entry.attempts++;
      if (a.isCorrect) entry.correct++;
    }
    const byTopic = Array.from(topicMap.values()).map((t) => ({
      ...t,
      accuracyPct: Math.round((t.correct / t.attempts) * 100),
    }));

    // ---------- By role (readiness) ----------
    const roleIds = [
      ...new Set(attempts.map((a) => a.question.topic.role.id)),
    ];

    const byRole = [];
    for (const roleId of roleIds) {
      const roleAttempts = attempts.filter(
        (a) => a.question.topic.role.id === roleId
      );
      const roleName = roleAttempts[0].question.topic.role.name;

      const distinctQuestionsAttempted = new Set(
        roleAttempts.map((a) => a.questionId)
      ).size;

      const totalQuestionsInRole = await prisma.mCQQuestion.count({
        where: { topic: { roleId } },
      });

      const roleCorrect = roleAttempts.filter((a) => a.isCorrect).length;
      const accuracyPct = Math.round(
        (roleCorrect / roleAttempts.length) * 100
      );
      const coveragePct =
        totalQuestionsInRole > 0
          ? Math.round((distinctQuestionsAttempted / totalQuestionsInRole) * 100)
          : 0;
      const readinessScore = Math.round((accuracyPct + coveragePct) / 2);

      byRole.push({
        roleId,
        roleName,
        questionsAttempted: distinctQuestionsAttempted,
        totalQuestionsInRole,
        coveragePct,
        accuracyPct,
        readinessScore,
      });
    }

    // ---------- Recent trend (by day, last 14 days with activity) ----------
    const dayMap = new Map();
    for (const a of attempts) {
      const day = a.attemptedAt.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!dayMap.has(day)) {
        dayMap.set(day, { date: day, attempts: 0, correct: 0 });
      }
      const entry = dayMap.get(day);
      entry.attempts++;
      if (a.isCorrect) entry.correct++;
    }
    const recentTrend = Array.from(dayMap.values())
      .map((d) => ({
        date: d.date,
        attempts: d.attempts,
        accuracyPct: Math.round((d.correct / d.attempts) * 100),
      }))
      .slice(-14);

    res.json({
      overall: { totalAttempts, correctAttempts, accuracyPct: overallAccuracyPct },
      byTopic,
      byRole,
      recentTrend,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to compute dashboard stats." });
  }
});

module.exports = router;
