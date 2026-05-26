import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";
import studyPlansRouter from "./study-plans";
import flashcardsRouter from "./flashcards";
import simuladosRouter from "./simulados";
import redacoesRouter from "./redacoes";
import rankingsRouter from "./rankings";
import missionsRouter from "./missions";
import questionsRouter from "./questions";
import studyTodayRouter from "./study-today";
import openaiRouter from "./openai/index";
import aiGenerateRouter from "./ai-generate.js";
import stripeRouter from "./stripe";
import adminRouter from "./admin";
import authRouter from "./auth";
import { requireAuth } from "../middleware/requireAuth";
import { requireSubscription } from "../middleware/requireSubscription";

const router: IRouter = Router();

// Public routes — no auth/subscription required
router.use(healthRouter);
router.use(authRouter);

// Stripe router — handles its own auth per route (plans is public, checkout requires auth)
router.use(stripeRouter);

// Admin routes — requireAdmin (inside adminRouter) also requires auth
router.use(adminRouter);

// Premium routes — require auth + active subscription
router.use(requireAuth);
router.use(requireSubscription);
router.use(usersRouter);
router.use(dashboardRouter);
router.use(studyPlansRouter);
router.use(flashcardsRouter);
router.use(simuladosRouter);
router.use(redacoesRouter);
router.use(rankingsRouter);
router.use(missionsRouter);
router.use(questionsRouter);
router.use(studyTodayRouter);
router.use(openaiRouter);
router.use(aiGenerateRouter);

export default router;
