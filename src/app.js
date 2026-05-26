import express from "express";
  import cors from "cors";
  import router from "./routes/index.js";

  const app = express();

  app.use(cors({ origin: "*" }));
  app.use("/api/premium/webhook", express.raw({ type: "application/json" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", router);
  app.get("/", (_req, res) => res.redirect("/api/terms"));
  app.use("/terms", (_req, res) => res.redirect("/api/terms"));
  app.use("/privacy", (_req, res) => res.redirect("/api/privacy"));

  export default app;
  