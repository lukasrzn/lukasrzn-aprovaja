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

export default router;
