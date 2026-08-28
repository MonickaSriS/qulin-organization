import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "qulin-backend" });
});

// Future route mounts (Phase 4+):
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/inventory', inventoryRoutes);

app.use(errorHandler);

export default app;
