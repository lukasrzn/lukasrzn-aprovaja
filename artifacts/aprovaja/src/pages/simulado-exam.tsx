import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useStartSimulado, useSubmitSimulado } from "@workspace/api-client-react";
import type { ExamQuestion, SimuladoResult } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Timer, ChevronLeft, ChevronRight, Flag, CheckCircle2,
  AlertTriangle, Send, BookOpen, Loader2
} from "lucide-react";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SimuladoExam() {
  const { id } = useParams<{ id: string }>();
  const simuladoId = parseInt(id ?? "0", 10);
  const [, navigate] = useLocation();

  const startSimulado = useStartSimulado();
  const submitSimulado = useSubmitSimulado();

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [sessionId, setSessionId] = useState<number>(0);
  const [title, setTitle] = useState("Simulado");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    startSimulado.mutate(
      { id: simuladoId, data: {} },
      {
        onSuccess: (data) => {
          setQuestions(data.questions);
          setSessionId(data.sessionId);
          setTitle(data.title);
          setDurationMinutes(data.durationMinutes);
          setTimeLeft(data.durationMinutes * 60);
          setStarted(true);
        },
      }
    );
  }, [simuladoId]);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started]);

  const handleSubmit = useCallback(() => {
    const startedAt = Date.now() - (durationMinutes * 60 - timeLeft) * 1000;
    const timeSpentSeconds = Math.round((Date.now() - startedAt) / 1000) || durationMinutes * 60;
    const answerList = questions.map((q) => ({
      questionId: q.id,
      selectedAlternative: answers[q.id] ?? "A",
    }));

    submitSimulado.mutate(
      { id: simuladoId, data: { answers: answerList, timeSpentSeconds } },
      {
        onSuccess: (result: SimuladoResult) => {
          sessionStorage.setItem(`simulado_result_${result.id}`, JSON.stringify(result));
          navigate(`/simulados/${simuladoId}/resultado/${result.id}`);
        },
      }
    );
  }, [questions, answers, timeLeft, durationMinutes, simuladoId]);

  const goTo = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const toggleFlag = (qId: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const answeredCount = Object.keys(answers).length;
  const totalTime = durationMinutes * 60;
  const elapsed = totalTime - timeLeft;
  const timePct = Math.min((elapsed / totalTime) * 100, 100);
  const isUrgent = timeLeft < 300 && timeLeft > 0;
  const isCritical = timeLeft < 60 && timeLeft > 0;

  if (startSimulado.isPending || !started) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <BookOpen className="w-8 h-8 text-primary absolute inset-0 m-auto" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">Carregando questões...</p>
          <p className="text-sm text-muted-foreground mt-1">Preparando sua prova personalizada</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-xl font-bold">Nenhuma questão encontrada</p>
          <Button className="mt-4" onClick={() => navigate("/simulados")}>Voltar</Button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{title}</p>
              <p className="text-xs text-muted-foreground">
                {answeredCount}/{questions.length} respondidas
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-lg transition-all ${
            isCritical
              ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse"
              : isUrgent
              ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
              : "border-primary/30 bg-primary/5 text-primary"
          }`}>
            <Timer className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitSimulado.isPending || answeredCount === 0}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 flex-shrink-0"
          >
            {submitSimulado.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Finalizar Prova</span>
          </Button>
        </div>
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-6 gap-6">
        {/* Question area */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Question header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary font-bold">
                Questão {currentIndex + 1}/{questions.length}
              </Badge>
              <Badge variant="secondary">{q.subject}</Badge>
              <Badge variant="outline" className={
                q.difficulty === "dificil" ? "border-red-500/40 text-red-400" :
                q.difficulty === "medio" ? "border-yellow-500/40 text-yellow-400" :
                "border-green-500/40 text-green-400"
              }>
                {q.difficulty === "dificil" ? "Difícil" : q.difficulty === "medio" ? "Médio" : "Fácil"}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFlag(q.id)}
              className={flagged.has(q.id) ? "text-yellow-400 bg-yellow-400/10" : "text-muted-foreground"}
            >
              <Flag className="w-4 h-4 mr-1" />
              {flagged.has(q.id) ? "Marcada" : "Marcar"}
            </Button>
          </div>

          {/* Question content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={q.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-6"
            >
              {q.contextText && (
                <blockquote className="border-l-4 border-primary/40 pl-4 py-2 bg-primary/5 rounded-r-xl text-sm text-muted-foreground leading-relaxed italic">
                  {q.contextText}
                </blockquote>
              )}

              <div className="bg-card/60 border border-border rounded-2xl p-6">
                <p className="text-base md:text-lg leading-relaxed text-foreground">{q.statement}</p>
              </div>

              <div className="space-y-3">
                {q.alternatives.map((alt) => {
                  const selected = answers[q.id] === alt.id;
                  return (
                    <button
                      key={alt.id}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: alt.id }))}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-4 group ${
                        selected
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.15)]"
                          : "border-border bg-card/40 hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all ${
                        selected ? "border-primary bg-primary text-white" : "border-border text-muted-foreground group-hover:border-primary/40"
                      }`}>
                        {alt.id}
                      </span>
                      <span className={`text-sm leading-relaxed ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                        {alt.text}
                      </span>
                      {selected && <CheckCircle2 className="w-5 h-5 text-primary ml-auto flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {Math.round((answeredCount / questions.length) * 100)}% completo
            </span>
            <Button
              variant="outline"
              onClick={() => goTo(currentIndex + 1)}
              disabled={currentIndex === questions.length - 1}
              className="gap-2"
            >
              Próxima <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Question navigator sidebar */}
        <aside className="hidden lg:flex flex-col gap-3 w-56 flex-shrink-0">
          <div className="sticky top-24 bg-card/60 border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Navegador
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((question, idx) => {
                const isAnswered = Boolean(answers[question.id]);
                const isFlagged = flagged.has(question.id);
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={question.id}
                    onClick={() => goTo(idx)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-[0_0_10px_rgba(var(--primary),0.4)] scale-110"
                        : isFlagged
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                        : isAnswered
                        ? "bg-green-500/20 text-green-400 border border-green-500/40"
                        : "bg-muted text-muted-foreground border border-border hover:border-primary/40"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-primary" /> Atual
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/40" /> Respondida
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/40" /> Marcada
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-muted border border-border" /> Não respondida
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
