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

const router: IRouter = Router();

router.use(healthRouter);
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
router.use(stripeRouter);

export default router;
