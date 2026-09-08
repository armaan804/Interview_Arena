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

    // ================= MOCK INTERVIEW STATS =================
    const sessions = await prisma.mockInterviewSession.findMany({
      where: { userId },
      include: {
        role: true,
        responses: {
          where: { llmFeedback: { not: null } }, // only fully-evaluated answers
          include: { question: true },
        },
      },
      orderBy: { startedAt: "asc" },
    });

    const completedSessions = sessions.filter((s) => s.endedAt !== null);
    const allResponses = sessions.flatMap((s) => s.responses);

    // ---------- Overall rating breakdown (Gemini) ----------
    const ratingCounts = { Strong: 0, Good: 0, "Needs Improvement": 0 };
    for (const r of allResponses) {
      if (r.llmRating && ratingCounts[r.llmRating] !== undefined) {
        ratingCounts[r.llmRating]++;
      }
    }

    // ---------- Overall ML quality breakdown (our own model) ----------
    const mlQualityCounts = { GOOD: 0, AVERAGE: 0, WEAK: 0 };
    for (const r of allResponses) {
      if (r.mlQualityLabel && mlQualityCounts[r.mlQualityLabel] !== undefined) {
        mlQualityCounts[r.mlQualityLabel]++;
      }
    }

    // ---------- By role ----------
    const interviewRoleMap = new Map();
    for (const s of completedSessions) {
      const key = s.roleId;
      if (!interviewRoleMap.has(key)) {
        interviewRoleMap.set(key, {
          roleId: s.roleId,
          roleName: s.role.name,
          sessionsCompleted: 0,
          questionsAnswered: 0,
          ratingCounts: { Strong: 0, Good: 0, "Needs Improvement": 0 },
        });
      }
      const entry = interviewRoleMap.get(key);
      entry.sessionsCompleted++;
      entry.questionsAnswered += s.responses.length;
      for (const r of s.responses) {
        if (r.llmRating && entry.ratingCounts[r.llmRating] !== undefined) {
          entry.ratingCounts[r.llmRating]++;
        }
      }
    }
    const interviewByRole = Array.from(interviewRoleMap.values());

    // ---------- Recent trend (sessions completed by day, last 14 days) ----------
    const interviewDayMap = new Map();
    for (const s of completedSessions) {
      const day = s.endedAt.toISOString().slice(0, 10);
      if (!interviewDayMap.has(day)) {
        interviewDayMap.set(day, { date: day, sessions: 0 });
      }
      interviewDayMap.get(day).sessions++;
    }
    const interviewTrend = Array.from(interviewDayMap.values()).slice(-14);

    res.json({
      overall: { totalAttempts, correctAttempts, accuracyPct: overallAccuracyPct },
      byTopic,
      byRole,
      recentTrend,
      mockInterview: {
        totalSessions: completedSessions.length,
        totalQuestionsAnswered: allResponses.length,
        ratingCounts,
        mlQualityCounts,
        byRole: interviewByRole,
        recentTrend: interviewTrend,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to compute dashboard stats." });
  }
});

module.exports = router;
