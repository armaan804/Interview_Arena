const express = require("express");
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
    res.json({ roles });
  } catch (error) {
    console.error("Fetch roles error:", error);
    res.status(500).json({ error: "Failed to fetch roles." });
  }
});

module.exports = router;
