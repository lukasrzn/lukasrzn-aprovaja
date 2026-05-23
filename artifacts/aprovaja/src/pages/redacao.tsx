import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetRedacoes,
  useSubmitRedacao,
  useGetRedacao,
  useAiGenerateRedacaoSimulado,
} from "@workspace/api-client-react";
import type { RedacaoSimuladoData } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  PenTool, BrainCircuit, Send, ChevronLeft, ChevronRight,
  Star, Zap, TrendingUp, CheckCircle2, AlertCircle,
  Trophy, MessageSquare, BookOpen, Target, Sparkles,
  Lightbulb, Quote, Brain, Maximize2, Minimize2,
  CheckCircle, XCircle, Eye, Loader2, RotateCcw, Clock,
  Library, Wand2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "home"
  | "generating"
  | "reading"
  | "writing"
  | "submitting"
  | "result";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.85) return { bar: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "shadow-emerald-500/20" };
  if (pct >= 0.65) return { bar: "bg-cyan-500",    text: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    glow: "shadow-cyan-500/20" };
  if (pct >= 0.45) return { bar: "bg-amber-500",   text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   glow: "shadow-amber-500/20" };
  return                   { bar: "bg-rose-500",    text: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",    glow: "shadow-rose-500/20" };
}

function gradeLabel(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.90) return { label: "Nota 1000", icon: "🏆" };
  if (pct >= 0.80) return { label: "Excelente",  icon: "⭐" };
  if (pct >= 0.65) return { label: "Muito Bom",  icon: "✅" };
  if (pct >= 0.50) return { label: "Regular",    icon: "📈" };
  return                   { label: "A Melhorar", icon: "📝" };
}

const COMP_ICONS = [BookOpen, Target, TrendingUp, MessageSquare, Sparkles];

// ─── Phase: Home ──────────────────────────────────────────────────────────────

function PhaseHome({
  onStart,
  isGenerating,
}: {
  onStart: (difficulty: string) => void;
  isGenerating: boolean;
}) {
  const [difficulty, setDifficulty] = useState("medio");
  const { data: redacoes } = useGetRedacoes();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const completed = redacoes?.filter(r => r.score !== null) ?? [];

  const diffOpts = [
    { value: "facil",   label: "Básico",     sub: "Temas acessíveis", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
    { value: "medio",   label: "Intermediário", sub: "Nível ENEM real", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
    { value: "dificil", label: "Avançado",   sub: "Desafio máximo",   color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-6 md:p-8"
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <BrainCircuit className="w-96 h-96 absolute -right-20 -top-20 text-primary" />
        </div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                <PenTool className="w-4 h-4 text-primary" />
              </div>
              <Badge className="bg-primary/15 text-primary border-primary/20 text-xs">
                IA Gerativa • ENEM 2026
              </Badge>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              Laboratório de Redação IA
            </h2>
            <p className="text-muted-foreground text-sm max-w-md">
              Cada simulado é único: tema gerado por IA, textos de apoio, exercícios de interpretação e correção real pelas 5 competências do ENEM.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            <div className="grid grid-cols-3 gap-2">
              {diffOpts.map(d => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                    difficulty === d.value
                      ? d.color
                      : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/[0.15]"
                  }`}
                >
                  {difficulty === d.value && (
                    <motion.div layoutId="diff-pill" className="absolute inset-0 rounded-xl ring-1 ring-current opacity-50" transition={{ type: "spring", bounce: 0.2, duration: 0.35 }} />
                  )}
                  <span className="text-xs font-bold relative">{d.label}</span>
                  <span className="text-[10px] opacity-70 relative">{d.sub}</span>
                </button>
              ))}
            </div>
            <Button
              onClick={() => onStart(difficulty)}
              disabled={isGenerating}
              className="h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 font-bold text-white gap-2 shadow-lg shadow-primary/25 w-full"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Gerando simulado...</>
              ) : (
                <><Wand2 className="w-4 h-4" /> Iniciar Simulado com IA</>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Brain,    label: "Temas únicos por IA",     val: "∞",   color: "text-primary" },
          { icon: Zap,      label: "Correção em segundos",     val: "≈15s", color: "text-amber-400" },
          { icon: Trophy,   label: "Competências avaliadas",   val: "5",   color: "text-emerald-400" },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/30 border border-white/[0.06] text-center">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <span className="text-lg font-black text-white">{s.val}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      {/* History */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Library className="w-4 h-4" /> Histórico de Redações
          </h3>
          <AnimatePresence>
            {selectedId ? (
              <FeedbackPanel key="fp" id={selectedId} onBack={() => setSelectedId(null)} />
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                {completed.slice(0, 5).map((r, i) => {
                  const sc = scoreColor(r.score ?? 0, r.maxScore ?? 1000);
                  const pct = Math.round(((r.score ?? 0) / (r.maxScore ?? 1000)) * 100);
                  return (
                    <motion.button
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ x: 3 }}
                      onClick={() => setSelectedId(r.id)}
                      className="w-full text-left rounded-xl border border-white/[0.07] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.05] p-4 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="text-sm font-semibold text-white line-clamp-1 group-hover:text-primary transition-colors">{r.theme}</p>
                        <Badge className={`shrink-0 text-xs font-bold border ${sc.text} bg-white/[0.04] border-white/[0.08]`}>{r.score}/{r.maxScore}</Badge>
                      </div>
                      <div className="space-y-1">
                        <Progress value={pct} className="h-1.5 bg-white/[0.06]" />
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{new Date(r.createdAt).toLocaleDateString("pt-BR")}</span>
                          <span className="flex items-center gap-1 text-primary">Ver feedback <Eye className="w-3 h-3" /></span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Phase: Generating ────────────────────────────────────────────────────────

function PhaseGenerating() {
  const [step, setStep] = useState(0);
  const steps = [
    "Selecionando tema inédito…",
    "Gerando textos de apoio…",
    "Criando questões de interpretação…",
    "Preparando dicas de argumentation…",
    "Finalizando simulado…",
  ];

  useEffect(() => {
    const id = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-full border-2 border-primary/20 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-2 rounded-full border-2 border-t-primary border-transparent" />
        </motion.div>
        <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-white">Gerando seu simulado…</h3>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-muted-foreground text-sm"
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="flex gap-1.5">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full bg-primary/30"
            animate={{ width: i <= step ? 32 : 8, opacity: i <= step ? 1 : 0.3 }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Phase: Reading ───────────────────────────────────────────────────────────

function PhaseReading({
  simulado,
  onContinue,
}: {
  simulado: RedacaoSimuladoData;
  onContinue: () => void;
}) {
  const [activeText, setActiveText] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const allAnswered = simulado.interpretationQuestions.every(q => answers[q.id] !== undefined);

  const handleAnswer = (qId: number, optIdx: number) => {
    if (answers[qId] !== undefined) return;
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
    setTimeout(() => setRevealed(prev => ({ ...prev, [qId]: true })), 500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">1</div>
          <div className="w-8 h-px bg-primary/30" />
          <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-xs text-muted-foreground">2</div>
          <div className="w-8 h-px bg-white/[0.06]" />
          <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-xs text-muted-foreground">3</div>
        </div>
        <span className="text-xs text-muted-foreground">Etapa 1 — Leitura e Compreensão</span>
      </div>

      {/* Theme card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 overflow-hidden"
      >
        <div className="absolute top-3 right-3">
          <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px]">Tema ENEM IA</Badge>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold mb-2">Proposta de Redação</p>
        <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-3">{simulado.theme}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{simulado.themeContext}</p>
      </motion.div>

      {/* Support texts */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Quote className="w-3.5 h-3.5" /> Textos de Apoio
        </p>
        <div className="flex gap-2">
          {simulado.supportTexts.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActiveText(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                activeText === i
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-white/[0.03] text-muted-foreground border-white/[0.08] hover:border-white/[0.15]"
              }`}
            >
              Texto {i + 1}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeText}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-semibold text-white text-sm">{simulado.supportTexts[activeText].title}</h4>
              <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5">{simulado.supportTexts[activeText].source}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{simulado.supportTexts[activeText].content}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Interpretation questions */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-3.5 h-3.5" /> Questões de Interpretação
        </p>
        {simulado.interpretationQuestions.map((q, qi) => {
          const answered = answers[q.id] !== undefined;
          const rev = revealed[q.id];
          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qi * 0.1 }}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-3"
            >
              <p className="text-sm font-semibold text-white leading-snug">{qi + 1}. {q.question}</p>
              <div className="grid grid-cols-1 gap-2">
                {q.options.map((opt, oi) => {
                  const isSelected = answers[q.id] === oi;
                  const isCorrect = oi === q.correct;
                  let style = "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/[0.2] hover:text-white";
                  if (rev) {
                    if (isCorrect) style = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
                    else if (isSelected && !isCorrect) style = "border-rose-500/40 bg-rose-500/10 text-rose-400";
                  } else if (answered && isSelected) {
                    style = "border-primary/40 bg-primary/10 text-primary";
                  }
                  return (
                    <button
                      key={oi}
                      onClick={() => handleAnswer(q.id, oi)}
                      disabled={answered}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all ${style}`}
                    >
                      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {rev && isCorrect && <CheckCircle className="w-4 h-4 shrink-0" />}
                      {rev && isSelected && !isCorrect && <XCircle className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Proposal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5"
      >
        <p className="text-[10px] uppercase tracking-widest text-amber-400/70 font-semibold mb-2 flex items-center gap-1.5">
          <Target className="w-3 h-3" /> Proposta de Redação
        </p>
        <p className="text-sm text-white/80 leading-relaxed">{simulado.writingProposal}</p>
      </motion.div>

      <Button
        onClick={onContinue}
        className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 font-bold text-white gap-2"
      >
        Começar a Escrever <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Phase: Writing ───────────────────────────────────────────────────────────

function PhaseWriting({
  simulado,
  onSubmit,
  isSubmitting,
}: {
  simulado: RedacaoSimuladoData;
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
}) {
  const [content, setContent] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [activeHint, setActiveHint] = useState<"thesis" | "repertorio" | "strategies">("thesis");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startTime = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;
  const progress = Math.min(100, (wordCount / 300) * 100);
  const isReady = wordCount >= 50;

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const writingChecks = [
    { label: "Introdução",      ok: wordCount >= 60 },
    { label: "1º Argumento",    ok: wordCount >= 150 },
    { label: "2º Argumento",    ok: wordCount >= 230 },
    { label: "Proposta",        ok: wordCount >= 270 },
    { label: "250+ palavras",   ok: wordCount >= 250 },
  ];

  const hintTabs = [
    { id: "thesis" as const,       icon: Lightbulb, label: "Teses",       items: simulado.thesisSuggestions },
    { id: "repertorio" as const,   icon: Quote,     label: "Repertório",  items: simulado.repertorio },
    { id: "strategies" as const,   icon: Brain,     label: "Argumentos",  items: simulado.argumentStrategies },
  ];

  return (
    <div className={`space-y-4 transition-all ${focusMode ? "fixed inset-0 z-50 bg-background p-6 overflow-auto" : ""}`}>
      {/* Step indicator + controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-xs text-muted-foreground">1</div>
          <div className="w-8 h-px bg-primary/50" />
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">2</div>
          <div className="w-8 h-px bg-white/[0.06]" />
          <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center text-xs text-muted-foreground">3</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5">
            <Clock className="w-3.5 h-3.5" /> {formatTime(elapsed)}
          </div>
          <button
            onClick={() => setFocusMode(f => !f)}
            className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-muted-foreground hover:text-white transition-colors"
          >
            {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Theme reminder */}
      <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-2.5 flex items-center gap-2">
        <PenTool className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="text-xs text-white/70 leading-snug line-clamp-1"><span className="text-primary font-semibold">Tema: </span>{simulado.theme}</p>
      </div>

      <div className={`grid gap-4 ${focusMode ? "grid-cols-1" : "md:grid-cols-12"}`}>
        {/* Writing area */}
        <div className={`space-y-3 ${focusMode ? "" : "md:col-span-8"}`}>
          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span className={wordCount >= 250 ? "text-emerald-400 font-semibold" : ""}>{wordCount} palavras</span>
              <span>{charCount} caracteres</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/[0.06]" />
          </div>

          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            placeholder="Escreva sua redação dissertativa-argumentativa aqui…&#10;&#10;Dica: comece com uma introdução que apresente o tema e sua tese principal."
            className="min-h-[420px] resize-none bg-white/[0.03] border-white/[0.1] focus:border-primary/40 rounded-xl font-serif text-sm leading-loose p-5 placeholder:text-muted-foreground/30"
            value={content}
            onChange={e => setContent(e.target.value)}
            autoFocus
          />

          {/* Writing checks */}
          <div className="flex flex-wrap gap-2">
            {writingChecks.map(c => (
              <span key={c.label} className={`flex items-center gap-1.5 text-[11px] rounded-full px-2.5 py-1 border transition-all ${c.ok ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" : "text-muted-foreground/50 border-white/[0.06] bg-transparent"}`}>
                <CheckCircle2 className={`w-3 h-3 ${c.ok ? "text-emerald-400" : "text-muted-foreground/30"}`} />
                {c.label}
              </span>
            ))}
          </div>

          {/* Submit button */}
          <Button
            onClick={() => onSubmit(content)}
            disabled={!isReady || isSubmitting}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 font-bold text-white gap-2 shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <motion.span className="flex items-center gap-2" animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>
                <BrainCircuit className="w-4 h-4" /> Analisando 5 competências…
              </motion.span>
            ) : (
              <><Send className="w-4 h-4" /> Enviar para Correção IA</>
            )}
          </Button>
        </div>

        {/* AI Hints sidebar */}
        {!focusMode && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:col-span-4 space-y-3"
          >
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
              <div className="flex border-b border-white/[0.06]">
                {hintTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveHint(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors ${
                      activeHint === tab.id
                        ? "text-primary bg-primary/10 border-b-2 border-primary"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    <tab.icon className="w-3 h-3" />
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="p-4 space-y-2.5 max-h-[360px] overflow-y-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHint}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2.5"
                  >
                    {hintTabs.find(t => t.id === activeHint)?.items.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="group flex gap-2.5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer"
                        onClick={() => {
                          if (textareaRef.current) textareaRef.current.focus();
                        }}
                      >
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/25 transition-colors">
                          {i + 1}
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed group-hover:text-white/80 transition-colors">{item}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Score guide */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Guia de Pontuação</p>
              {[
                { range: "850–1000", label: "Excelente", color: "text-emerald-400" },
                { range: "650–849",  label: "Muito Bom", color: "text-cyan-400" },
                { range: "450–649",  label: "Regular",   color: "text-amber-400" },
                { range: "0–449",    label: "Melhore",   color: "text-rose-400" },
              ].map(s => (
                <div key={s.range} className="flex items-center justify-between text-[11px]">
                  <span className={`flex items-center gap-1.5 ${s.color}`}>
                    <span className={`w-2 h-2 rounded-full ${s.color.replace("text-", "bg-")}`} />
                    {s.label}
                  </span>
                  <span className="text-muted-foreground/60">{s.range}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Phase: Result ────────────────────────────────────────────────────────────

function FeedbackPanel({ id, onBack }: { id: number; onBack: () => void }) {
  const { data: redacao, isLoading } = useGetRedacao(id);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!redacao) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="text-muted-foreground">Redação não encontrada.</p>
        <Button variant="outline" onClick={onBack}>Voltar</Button>
      </div>
    );
  }

  const score = redacao.score ?? 0;
  const maxScore = redacao.maxScore ?? 1000;
  const color = scoreColor(score, maxScore);
  const grade = gradeLabel(score, maxScore);
  const pct = Math.round((score / maxScore) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 max-w-3xl mx-auto"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-xs text-emerald-400">✓</div>
          <div className="w-8 h-px bg-emerald-500/40" />
          <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center text-xs text-emerald-400">✓</div>
          <div className="w-8 h-px bg-emerald-500/40" />
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">3</div>
        </div>
        <span className="text-xs text-muted-foreground">Etapa 3 — Resultado & Feedback IA</span>
      </div>

      {/* Back + theme */}
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-white px-2" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
        )}
        <h3 className="font-bold text-white text-sm truncate flex-1">{redacao.theme}</h3>
        <span className="text-xs text-muted-foreground shrink-0">{new Date(redacao.createdAt).toLocaleDateString("pt-BR")}</span>
      </div>

      {/* Score hero */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`relative rounded-2xl border bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-xl ${color.glow} ${color.border}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Pontuação Final</p>
            <div className="flex items-end gap-2">
              <motion.span
                className={`text-6xl font-black ${color.text}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.3 }}
              >
                {score}
              </motion.span>
              <span className="text-xl text-muted-foreground mb-2">/ {maxScore}</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08]">
            <span className="text-3xl">{grade.icon}</span>
            <span className={`text-sm font-bold ${color.text}`}>{grade.label}</span>
          </div>
        </div>
        <Progress value={pct} className="h-3 bg-white/[0.07] rounded-full" />
        <p className="text-xs text-muted-foreground mt-2 text-right">{pct}% da nota máxima</p>
      </motion.div>

      {/* Overall feedback */}
      {redacao.feedback && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-5 flex gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-primary font-semibold mb-1.5 uppercase tracking-wider">Parecer Geral da IA</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{redacao.feedback}</p>
          </div>
        </motion.div>
      )}

      {/* Competencias */}
      {redacao.competencias && redacao.competencias.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avaliação por Competência</p>
          {redacao.competencias.map((comp, i) => {
            const Icon = COMP_ICONS[i] ?? Star;
            const c = scoreColor(comp.score, comp.maxScore);
            const cpct = Math.round((comp.score / comp.maxScore) * 100);
            return (
              <motion.div
                key={comp.number}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">C{comp.number}</p>
                      <span className={`text-sm font-black ${c.text}`}>
                        {comp.score}<span className="text-xs text-muted-foreground font-normal">/{comp.maxScore}</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">{comp.description}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Progress value={cpct} className="h-2 bg-white/[0.06]" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{comp.feedback}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* XP + actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
      >
        <Zap className="w-5 h-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">XP conquistado</p>
          <p className="font-bold text-white">+{Math.floor(score / 20)} XP</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <Button size="sm" variant="outline" onClick={onBack} className="gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Novo Simulado
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Skeleton shim (imported inline since shadcn Skeleton is available)
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/[0.06] ${className ?? ""}`} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Redacao() {
  const [phase, setPhase] = useState<Phase>("home");
  const [simulado, setSimulado] = useState<RedacaoSimuladoData | null>(null);
  const [resultId, setResultId] = useState<number | null>(null);
  const { toast } = useToast();
  const { refetch: refetchList } = useGetRedacoes();

  const generateMutation = useAiGenerateRedacaoSimulado();
  const submitMutation = useSubmitRedacao();

  const handleStart = useCallback(async (difficulty: string) => {
    setPhase("generating");
    try {
      const data = await generateMutation.mutateAsync({ data: { difficulty } });
      setSimulado(data);
      setPhase("reading");
    } catch {
      toast({ title: "Erro ao gerar simulado", description: "Verifique sua conexão e tente novamente.", variant: "destructive" });
      setPhase("home");
    }
  }, [generateMutation, toast]);

  const handleSubmit = useCallback(async (content: string) => {
    if (!simulado) return;
    setPhase("submitting");
    try {
      const result = await submitMutation.mutateAsync({
        data: { theme: simulado.theme, content },
      });
      setResultId(result.id);
      await refetchList();
      setPhase("result");
    } catch {
      toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
      setPhase("writing");
    }
  }, [simulado, submitMutation, refetchList, toast]);

  const handleReset = useCallback(() => {
    setPhase("home");
    setSimulado(null);
    setResultId(null);
  }, []);

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laboratório de Redação</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Correção real pelas 5 competências do ENEM com inteligência artificial.
          </p>
        </div>
        {phase !== "home" && phase !== "generating" && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> Recomeçar
          </Button>
        )}
      </div>

      {/* Phase content */}
      <AnimatePresence mode="wait">
        {phase === "home" && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PhaseHome onStart={handleStart} isGenerating={generateMutation.isPending} />
          </motion.div>
        )}
        {phase === "generating" && (
          <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PhaseGenerating />
          </motion.div>
        )}
        {phase === "reading" && simulado && (
          <motion.div key="reading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PhaseReading simulado={simulado} onContinue={() => setPhase("writing")} />
          </motion.div>
        )}
        {(phase === "writing" || phase === "submitting") && simulado && (
          <motion.div key="writing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PhaseWriting
              simulado={simulado}
              onSubmit={handleSubmit}
              isSubmitting={phase === "submitting"}
            />
          </motion.div>
        )}
        {phase === "result" && resultId !== null && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FeedbackPanel id={resultId} onBack={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
