const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.get("/:roleId", requireAuth, async (req, res) => {
  try {
    const { roleId } = req.params;

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        topics: {
          include: { _count: { select: { mcqQuestions: true } } },
        },
      },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found." });
    }

    res.json({ role });
  } catch (error) {
    console.error("Fetch topics error:", error);
    res.status(500).json({ error: "Failed to fetch topics." });
  }
});

module.exports = router;
