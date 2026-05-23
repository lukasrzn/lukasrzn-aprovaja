import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  useGetStudyPlans,
  useCreateStudyPlan,
  useDeleteStudyPlan,
  useCreateStudySession,
} from "@workspace/api-client-react";
import type { StudyPlan } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Calendar, Clock, BookOpen, Target, Play, Pause,
  Trash2, Zap, Trophy, Flame, CheckCircle2, Brain,
  ChevronRight, Sparkles, BarChart3, Square, Timer,
  GraduationCap, Star, TrendingUp,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_PRESETS = [
  {
    label: "ENEM 2026",
    goal: "ENEM",
    icon: <GraduationCap className="w-5 h-5" />,
    color: "from-violet-600/20 to-purple-600/10 border-violet-500/30",
    badge: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    subjects: ["Matemática", "Português", "Redação", "História", "Biologia", "Física", "Química", "Filosofia", "Sociologia", "Geografia"],
    hours: 4,
    targetDays: 180,
    tip: "Foco em interdisciplinaridade e redação dissertativa.",
  },
  {
    label: "Vestibular",
    goal: "Vestibular",
    icon: <Star className="w-5 h-5" />,
    color: "from-cyan-600/20 to-blue-600/10 border-cyan-500/30",
    badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    subjects: ["Matemática", "Física", "Química", "Biologia", "Português", "História", "Geografia"],
    hours: 3,
    targetDays: 120,
    tip: "Prepare conteúdos específicos da instituição alvo.",
  },
  {
    label: "Concurso Público",
    goal: "Concurso",
    icon: <Trophy className="w-5 h-5" />,
    color: "from-amber-600/20 to-orange-600/10 border-amber-500/30",
    badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    subjects: ["Português", "Raciocínio Lógico", "Direito Constitucional", "Administração Pública", "Atualidades", "Informática"],
    hours: 3,
    targetDays: 90,
    tip: "Português e Raciocínio Lógico estão em todos os editais.",
  },
  {
    label: "Personalizado",
    goal: "Personalizado",
    icon: <Sparkles className="w-5 h-5" />,
    color: "from-emerald-600/20 to-teal-600/10 border-emerald-500/30",
    badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    subjects: [],
    hours: 2,
    targetDays: 60,
    tip: "Monte seu plano do zero com as matérias que preferir.",
  },
];

const SUBJECT_OPTIONS = [
  "Matemática", "Português", "Física", "Química", "Biologia", "História",
  "Geografia", "Filosofia", "Sociologia", "Inglês", "Redação",
  "Raciocínio Lógico", "Direito Constitucional", "Atualidades", "Informática",
  "Administração Pública", "Geometria", "Trigonometria", "Estatística",
];

const GOAL_STYLES: Record<string, { border: string; badge: string; glow: string }> = {
  "ENEM":        { border: "border-violet-500/25 hover:border-violet-500/50", badge: "text-violet-400 bg-violet-500/10 border-violet-500/20", glow: "shadow-violet-500/10" },
  "Vestibular":  { border: "border-cyan-500/25 hover:border-cyan-500/50",    badge: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",       glow: "shadow-cyan-500/10" },
  "Concurso":    { border: "border-amber-500/25 hover:border-amber-500/50",  badge: "text-amber-400 bg-amber-500/10 border-amber-500/20",     glow: "shadow-amber-500/10" },
};

function getGoalStyle(goal: string) {
  return GOAL_STYLES[goal] ?? { border: "border-emerald-500/25 hover:border-emerald-500/50", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", glow: "shadow-emerald-500/10" };
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ─── New Plan Modal ────────────────────────────────────────────────────────────

function NewPlanModal({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [step, setStep] = useState<"preset" | "customize">("preset");
  const [selected, setSelected] = useState<typeof GOAL_PRESETS[0] | null>(null);
  const [title, setTitle] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [hours, setHours] = useState(3);
  const [targetDays, setTargetDays] = useState(90);
  const create = useCreateStudyPlan();

  const handlePreset = (preset: typeof GOAL_PRESETS[0]) => {
    setSelected(preset);
    setTitle(preset.label === "Personalizado" ? "" : `Plano ${preset.label}`);
    setSubjects(preset.subjects);
    setHours(preset.hours);
    setTargetDays(preset.targetDays);
    setStep("customize");
  };

  const toggleSubject = (s: string) =>
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleCreate = async () => {
    if (!title.trim() || subjects.length === 0) return;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + targetDays);
    await create.mutateAsync({
      data: { title, goal: selected?.goal ?? "Personalizado", subjects, hoursPerDay: hours, targetDate: targetDate.toISOString() },
    });
    onCreated();
    onClose();
    setStep("preset");
    setSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); setStep("preset"); } }}>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            {step === "preset" ? "Qual é o seu objetivo?" : `Configurar — ${selected?.label}`}
          </DialogTitle>
        </DialogHeader>

        {step === "preset" ? (
          <div className="grid grid-cols-2 gap-3 py-2">
            {GOAL_PRESETS.map(p => (
              <motion.button
                key={p.goal}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePreset(p)}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br border text-center transition-all ${p.color}`}
              >
                <div className="text-white">{p.icon}</div>
                <div>
                  <p className="font-bold text-white text-sm">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{p.tip}</p>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nome do plano</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Plano ENEM 2026"
                className="bg-white/[0.04] border-white/[0.1] focus:border-primary/40"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Horas por dia: <span className="text-primary font-bold">{hours}h</span></Label>
              <Slider value={[hours]} onValueChange={([v]) => setHours(v)} min={1} max={8} step={0.5} className="w-full" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Prazo: <span className="text-primary font-bold">{targetDays} dias</span></Label>
              <Slider value={[targetDays]} onValueChange={([v]) => setTargetDays(v)} min={7} max={365} step={7} className="w-full" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Matérias ({subjects.length} selecionadas)</Label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {SUBJECT_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSubject(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      subjects.includes(s)
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-white/[0.03] border-white/[0.08] text-muted-foreground hover:border-white/20"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === "customize" && (
            <Button variant="ghost" onClick={() => setStep("preset")}>Voltar</Button>
          )}
          {step === "customize" && (
            <Button
              className="bg-primary hover:bg-primary/80 gap-2"
              onClick={handleCreate}
              disabled={!title.trim() || subjects.length === 0 || create.isPending}
            >
              {create.isPending ? "Criando..." : <><Sparkles className="w-4 h-4" /> Criar Plano</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Session Timer Modal ───────────────────────────────────────────────────────

function SessionModal({ plan, open, onClose, onSaved }: {
  plan: StudyPlan; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [selectedSubject, setSelectedSubject] = useState(plan.subjects[0] ?? "");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const createSession = useCreateStudySession();

  useEffect(() => {
    if (!open) {
      setElapsed(0); setRunning(false); setDone(false); setXpEarned(0);
      setSelectedSubject(plan.subjects[0] ?? "");
    }
  }, [open, plan.subjects]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleFinish = useCallback(async () => {
    setRunning(false);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const xp = Math.floor(minutes * 1.5);
    setXpEarned(xp);
    await createSession.mutateAsync({
      id: plan.id,
      data: { subject: selectedSubject, durationMinutes: minutes, notes: null },
    });
    setDone(true);
    onSaved();
  }, [elapsed, plan.id, selectedSubject, createSession, onSaved]);

  const progressPct = Math.min(100, (elapsed / (plan.hoursPerDay * 3600)) * 100);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !running) onClose(); }}>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" /> Sessão de Estudos
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5 py-6 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Sessão concluída!</h3>
              <p className="text-muted-foreground text-sm mt-1">{selectedSubject} · {fmtTime(elapsed)}</p>
            </div>
            <div className="flex items-center gap-2 bg-primary/15 border border-primary/25 rounded-2xl px-6 py-3">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-white">+{xpEarned} XP</span>
            </div>
            <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/80" onClick={onClose}>
              Fechar <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Estudando agora</Label>
              <div className="flex flex-wrap gap-2">
                {plan.subjects.map(s => (
                  <button
                    key={s}
                    disabled={running}
                    onClick={() => setSelectedSubject(s)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                      selectedSubject === s
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-white/[0.03] border-white/[0.08] text-muted-foreground hover:border-white/20"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer display */}
            <div className="relative flex flex-col items-center py-8 gap-3">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <motion.circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - progressPct / 100)}`}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-mono font-bold text-white">{fmtTime(elapsed)}</span>
                  <span className="text-[11px] text-muted-foreground mt-1">{Math.round(progressPct)}% da meta</span>
                </div>
              </div>
              {running && (
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-1.5 text-xs text-emerald-400"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Sessão em andamento
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {!running ? (
                <Button
                  className="col-span-2 h-12 rounded-xl bg-primary hover:bg-primary/80 gap-2 font-semibold"
                  onClick={() => setRunning(true)}
                >
                  <Play className="w-4 h-4" /> {elapsed > 0 ? "Continuar" : "Iniciar Sessão"}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="h-12 rounded-xl border-white/[0.1] hover:bg-white/[0.05] gap-2"
                    onClick={() => setRunning(false)}
                  >
                    <Pause className="w-4 h-4" /> Pausar
                  </Button>
                  <Button
                    className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 gap-2"
                    onClick={handleFinish}
                    disabled={elapsed < 60}
                  >
                    <Square className="w-4 h-4" /> Encerrar
                  </Button>
                </>
              )}
            </div>
            {elapsed > 0 && elapsed < 60 && (
              <p className="text-center text-xs text-muted-foreground/60">Estude pelo menos 1 minuto para salvar a sessão</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, onDelete, onStartSession }: {
  plan: StudyPlan;
  onDelete: () => void;
  onStartSession: () => void;
}) {
  const style = getGoalStyle(plan.goal);
  const days = daysUntil(plan.targetDate);
  const xpPerDay = Math.floor(plan.hoursPerDay * 60 * 1.5);
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long" });

  const todaySubjectIdx = new Date().getDay() % plan.subjects.length;
  const todaySubject = plan.subjects[todaySubjectIdx];
  const tomorrowSubject = plan.subjects[(todaySubjectIdx + 1) % plan.subjects.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={`relative flex flex-col bg-white/[0.03] border rounded-2xl overflow-hidden transition-all duration-200 shadow-lg ${style.border} ${style.glow}`}>
        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-60 ${
          plan.goal === "ENEM" ? "from-violet-500 to-purple-500" :
          plan.goal === "Vestibular" ? "from-cyan-500 to-blue-500" :
          plan.goal === "Concurso" ? "from-amber-500 to-orange-500" :
          "from-emerald-500 to-teal-500"
        }`} />

        <CardHeader className="pb-3 pt-5">
          <div className="flex items-start justify-between mb-3">
            <Badge className={`text-xs border gap-1 ${style.badge}`}>
              <Target className="w-3 h-3" /> {plan.goal}
            </Badge>
            <div className="flex items-center gap-2">
              {days !== null && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {days}d
                </span>
              )}
              <button
                onClick={onDelete}
                className="p-1 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 text-muted-foreground/40 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <CardTitle className="text-lg leading-tight">{plan.title}</CardTitle>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {plan.hoursPerDay}h/dia</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> ~{xpPerDay} XP/dia</span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 pb-3">
          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-muted-foreground text-xs">Progresso geral</span>
              <span className="font-bold text-white text-sm">{plan.progress}%</span>
            </div>
            <Progress value={plan.progress} className="h-2 bg-white/[0.06]" />
          </div>

          {/* Today's schedule */}
          <div className="rounded-xl bg-primary/[0.06] border border-primary/15 p-3 space-y-2">
            <p className="text-[11px] font-semibold text-primary/80 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3 h-3" /> Hoje — {today}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">{todaySubject}</span>
              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{plan.hoursPerDay}h</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">Amanhã: {tomorrowSubject}</p>
          </div>

          {/* Subjects */}
          <div className="flex flex-wrap gap-1.5">
            {plan.subjects.slice(0, 5).map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-muted-foreground">{s}</span>
            ))}
            {plan.subjects.length > 5 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-muted-foreground">+{plan.subjects.length - 5}</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-1 pb-4 px-4">
          <Button
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/80 text-white gap-2 font-semibold"
            onClick={onStartSession}
          >
            <Play className="w-4 h-4" /> Iniciar Sessão de Hoje
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function StudyPlans() {
  const [, navigate] = useLocation();
  const { data: plans, isLoading, refetch } = useGetStudyPlans();
  const deletePlan = useDeleteStudyPlan();

  const [showNew, setShowNew] = useState(false);
  const [sessionPlan, setSessionPlan] = useState<StudyPlan | null>(null);

  const totalHours = plans?.reduce((a, p) => a + p.hoursPerDay, 0) ?? 0;
  const avgProgress = plans?.length
    ? Math.round(plans.reduce((a, p) => a + p.progress, 0) / plans.length)
    : 0;

  const handleDelete = async (id: number) => {
    await deletePlan.mutateAsync({ id });
    refetch();
  };

  const TIPS = [
    "Estudar em sessões de 25–50 min com pausas curtas maximiza a retenção.",
    "Revisar o conteúdo 24h depois fixa 80% mais do que não revisar.",
    "Consistência supera intensidade: 2h todo dia > 14h no fim de semana.",
    "Dormir bem consolida tudo que você aprendeu durante o dia.",
  ];
  const tipOfDay = TIPS[new Date().getDay() % TIPS.length];

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plano de Estudos</h2>
          <p className="text-muted-foreground text-sm mt-1">Cronogramas personalizados e sessões cronometradas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-white/[0.1] hover:bg-white/[0.05] text-sm" onClick={() => navigate("/professor-ia")}>
            <Brain className="w-4 h-4 text-primary" /> Pedir ao Professor IA
          </Button>
          <Button className="bg-primary hover:bg-primary/80 text-white gap-2 shadow-[0_0_20px_rgba(139,92,246,0.25)]" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4" /> Novo Plano
          </Button>
        </div>
      </div>

      {/* Stats */}
      {plans && plans.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden border border-white/[0.06]">
          {[
            { label: "Planos Ativos", value: plans.length, icon: <BookOpen className="w-4 h-4 text-primary" />, color: "text-white" },
            { label: "Horas/dia", value: `${totalHours}h`, icon: <Clock className="w-4 h-4 text-cyan-400" />, color: "text-cyan-400" },
            { label: "Progresso Médio", value: `${avgProgress}%`, icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, color: "text-emerald-400" },
          ].map((s, i) => (
            <div key={i} className="bg-[#0d0d14] flex items-center gap-3 py-4 px-5">
              {s.icon}
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tip of the day */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-400 mb-0.5">Dica do dia</p>
          <p className="text-sm text-muted-foreground">{tipOfDay}</p>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-[420px] rounded-2xl" />)
        ) : plans && plans.length > 0 ? (
          <>
            <AnimatePresence>
              {plans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onDelete={() => handleDelete(plan.id)}
                  onStartSession={() => setSessionPlan(plan)}
                />
              ))}
            </AnimatePresence>

            {/* Add more card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center"
            >
              <button
                onClick={() => setShowNew(true)}
                className="w-full h-full min-h-[200px] rounded-2xl border-2 border-dashed border-white/[0.08] hover:border-primary/30 flex flex-col items-center justify-center gap-3 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] group-hover:bg-primary/10 border border-white/[0.06] group-hover:border-primary/20 flex items-center justify-center transition-all">
                  <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground group-hover:text-white transition-colors">Adicionar Plano</p>
              </button>
            </motion.div>
          </>
        ) : (
          <div className="col-span-full">
            <div className="text-center py-20 rounded-2xl border-2 border-dashed border-white/[0.07] bg-white/[0.01]">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <BarChart3 className="w-10 h-10 text-primary/60" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nenhum plano ativo</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                Crie um cronograma personalizado para ENEM, vestibular ou concurso e comece a estudar com mais foco hoje mesmo.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button className="bg-primary hover:bg-primary/80 gap-2" onClick={() => setShowNew(true)}>
                  <Sparkles className="w-4 h-4" /> Criar Meu Plano
                </Button>
                <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/[0.05]" onClick={() => navigate("/professor-ia")}>
                  <Brain className="w-4 h-4" /> Pedir ao Professor IA
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewPlanModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={() => refetch()}
      />
      {sessionPlan && (
        <SessionModal
          plan={sessionPlan}
          open={!!sessionPlan}
          onClose={() => setSessionPlan(null)}
          onSaved={() => refetch()}
        />
      )}
    </div>
  );
}
