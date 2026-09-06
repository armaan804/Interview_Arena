require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const rolesRoutes = require("./routes/roles.routes");
const topicsRoutes = require("./routes/topics.routes");
const mcqRoutes = require("./routes/mcq.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const mockInterviewRoutes = require("./routes/mockInterview.routes");

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  })
);
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/topics", topicsRoutes);
app.use("/api/mcq", mcqRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/mock-interview", mockInterviewRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Interview Arena backend running on http://localhost:${PORT}`);
});
