import "dotenv/config";
import express from "express";
import cors from "cors";
import importRoutes from "./routes/import.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 8080;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

app.use("/api", importRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`GrowEasy CSV Importer API listening on port ${PORT}`);
  console.log(`AI provider: ${process.env.AI_PROVIDER || "anthropic"}`);
});
