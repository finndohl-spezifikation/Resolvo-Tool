import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRouter from "./routes/index.js";
import pagesRouter from "./routes/pages.js";
import authRouter from "./routes/auth.js";

const app = express();

app.use(cors({ origin: "*" }));
app.use(cookieParser());
app.use("/api/premium/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Web dashboard routes (root paths)
app.use(pagesRouter);
app.use(authRouter);

// API routes
app.use("/api", apiRouter);

export default app;
