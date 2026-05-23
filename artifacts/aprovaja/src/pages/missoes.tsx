import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetTodayMissions, useCompleteMission } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Layers, FileText, PenTool, CheckCircle2,
  Zap, Clock, Trophy, Star, Target, Flame, Brain,
  ChevronRight, Sparkles, Gift,
} from "lucide-react";

// ─── Icon registry: maps stored string → Lucide component ────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Layers, FileText, PenTool, Brain, Target,
  Trophy, Star, Flame, Zap, Sparkles,
};

// ─── Type-based config (color + icon fallback) ────────────────────────────────
const TYPE_CONFIG: Record<string, {
  color: string; glow: string; bg: string; border: string;
  label: string; Icon: React.ElementType;
}> = {
  study:     { color: "text-cyan-400",    glow: "shadow-cyan-500/20",    bg: "bg-cyan-500/10",    border: "border-cyan-500/25",    label: "Estudos",    Icon: BookOpen  },
  flashcard: { color: "text-violet-400",  glow: "shadow-violet-500/20",  bg: "bg-violet-500/10",  border: "border-violet-500/25",  label: "Flashcards", Icon: Layers    },
  simulado:  { color: "text-amber-400",   glow: "shadow-amber-500/20",   bg: "bg-amber-500/10",   border: "border-amber-500/25",   label: "Simulado",   Icon: FileText  },
  redacao:   { color: "text-emerald-400", glow: "shadow-emerald-500/20", bg: "bg-emerald-500/10", border: "border-emerald-500/25", label: "Redação",    Icon: PenTool   },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    color: "text-primary", glow: "shadow-primary/20", bg: "bg-primary/10",
    border: "border-primary/25", label: "Missão", Icon: Target,
  };
}

// ─── Confetti burst ───────────────────────────────────────────────────────────
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 260,
    y: -(Math.random() * 180 + 60),
    r: Math.random() * 360,
    color: ["#a855f7","#06b6d4","#f59e0b","#10b981","#ec4899","#6366f1"][i % 6],
    size: Math.random() * 7 + 5,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.r, opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─── Circular progress ring ───────────────────────────────────────────────────
function RingProgress({ pct, done, total }: { pct: number; done: number; total: number }) {
  const R = 46;
  const circ = 2 * Math.PI * R;
  const offset = circ - (circ * pct) / 100;
  const allDone = done === total && total > 0;
  return (
    <div className="relative w-32 h-32 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <motion.circle
          cx="50" cy="50" r={R} fill="none"
          stroke={allDone ? "#10b981" : "rgb(139,92,246)"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        {allDone
          ? <Trophy className="w-8 h-8 text-emerald-400" />
          : <>
              <span className="text-2xl font-black text-white leading-none">{done}</span>
              <span className="text-xs text-muted-foreground">/ {total}</span>
            </>
        }
      </div>
    </div>
  );
}

// ─── Single mission card ──────────────────────────────────────────────────────
function MissionCard({
  mission,
  index,
  onCollect,
  collecting,
}: {
  mission: {
    id: number; title: string; description: string; icon: string;
    xpReward: number; coinReward: number; completed: boolean;
    progress: number; target: number; type: string;
  };
  index: number;
  onCollect: (id: number) => void;
  collecting: boolean;
}) {
  const [burst, setBurst] = useState(false);
  const cfg = getTypeConfig(mission.type);
  const IconComp = ICON_MAP[mission.icon] ?? cfg.Icon;
  const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
  const isReadyToCollect = !mission.completed && mission.progress >= mission.target;

  function handleCollect() {
    setBurst(true);
    onCollect(mission.id);
    setTimeout(() => setBurst(false), 1000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${
        mission.completed
          ? "bg-white/[0.02] border-white/[0.05] opacity-55"
          : isReadyToCollect
            ? `${cfg.bg} ${cfg.border} shadow-lg ${cfg.glow}`
            : "bg-white/[0.03] border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.05]"
      }`}
    >
      <Confetti active={burst} />

      {/* Ready-to-collect glow strip */}
      {isReadyToCollect && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.color.replace("text-","")}, transparent)` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="flex items-stretch">
        {/* Icon column */}
        <div className={`flex items-center justify-center w-20 shrink-0 border-r ${
          mission.completed ? "bg-white/[0.02] border-white/[0.05]"
          : isReadyToCollect ? `${cfg.bg} ${cfg.border}`
          : "bg-white/[0.02] border-white/[0.06]"
        }`}>
          {mission.completed
            ? <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            : <IconComp className={`w-8 h-8 ${isReadyToCollect ? cfg.color : "text-muted-foreground"}`} />
          }
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-white">{mission.title}</h4>
              <Badge className={`text-[10px] px-2 py-0 ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                {cfg.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{mission.description}</p>

            {!mission.completed && (
              <div className="pt-2 space-y-1.5 max-w-xs">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className={isReadyToCollect ? cfg.color : "text-muted-foreground"}>
                    {mission.progress} / {mission.target}
                    {isReadyToCollect && " ✓ Pronto!"}
                  </span>
                  <span className={isReadyToCollect ? cfg.color : "text-muted-foreground"}>{pct}%</span>
                </div>
                <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className={`absolute left-0 top-0 h-full rounded-full ${
                      isReadyToCollect ? cfg.color.replace("text-","bg-").replace("400","500") : "bg-primary"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right: rewards + action */}
          <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <Badge className="bg-primary/10 text-primary border border-primary/20 gap-1 text-xs font-bold px-2.5">
                <Zap className="w-3 h-3 fill-primary" /> +{mission.xpReward} XP
              </Badge>
              {mission.coinReward > 0 && (
                <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-2.5">
                  🪙 {mission.coinReward}
                </Badge>
              )}
            </div>

            {isReadyToCollect && (
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Button
                  size="sm"
                  className={`gap-1.5 font-bold text-xs rounded-xl shadow-lg ${cfg.glow} text-white`}
                  style={{ background: cfg.color.replace("text-","").includes("cyan") ? "rgb(6,182,212)"
                    : cfg.color.includes("violet") ? "rgb(139,92,246)"
                    : cfg.color.includes("amber") ? "rgb(245,158,11)"
                    : "rgb(16,185,129)" }}
                  onClick={handleCollect}
                  disabled={collecting}
                >
                  <Gift className="w-3.5 h-3.5" />
                  {collecting ? "Coletando..." : "Coletar"}
                </Button>
              </motion.div>
            )}

            {!mission.completed && !isReadyToCollect && (
              <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Em andamento
              </span>
            )}

            {mission.completed && (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Concluída
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tips banner ──────────────────────────────────────────────────────────────
const TIPS = [
  { Icon: BookOpen,  color: "text-cyan-400",    tip: "Complete sessões de estudo para avançar na missão de Estudos." },
  { Icon: Layers,    color: "text-violet-400",  tip: "Revise flashcards no Praticar para marcar progresso de flashcards." },
  { Icon: FileText,  color: "text-amber-400",   tip: "Finalize um Simulado para completar a missão de simulados." },
  { Icon: PenTool,   color: "text-emerald-400", tip: "Envie uma redação no Laboratório para completar a missão de redação." },
];

function HowItWorks() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Como funciona</p>
      <div className="grid grid-cols-2 gap-3">
        {TIPS.map(({ Icon, color, tip }) => (
          <div key={tip} className="flex items-start gap-2.5">
            <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
            <p className="text-[11px] text-muted-foreground leading-relaxed">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Missoes() {
  const { data: missions, isLoading, refetch } = useGetTodayMissions();
  const completeMission = useCompleteMission();
  const { toast } = useToast();
  const [justCompleted, setJustCompleted] = useState<number | null>(null);

  // Auto-refresh every 30 s to catch server-side auto-progress from other actions
  useEffect(() => {
    const id = setInterval(() => { refetch(); }, 30_000);
    return () => clearInterval(id);
  }, [refetch]);

  const completedCount = missions?.filter(m => m.completed).length ?? 0;
  const totalCount     = missions?.length ?? 0;
  const progressPct    = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allDone        = totalCount > 0 && completedCount === totalCount;

  // Time until midnight reset
  const now        = new Date();
  const midnight   = new Date(now); midnight.setHours(24, 0, 0, 0);
  const hoursLeft  = Math.floor((midnight.getTime() - now.getTime()) / 3_600_000);
  const minutesLeft = Math.floor(((midnight.getTime() - now.getTime()) % 3_600_000) / 60_000);

  function handleCollect(id: number) {
    completeMission.mutate(
      { id },
      {
        onSuccess: (data) => {
          setJustCompleted(id);
          setTimeout(() => setJustCompleted(null), 2000);
          refetch();
          toast({
            title: `🎉 Missão concluída!`,
            description: `+${data.xpReward} XP e ${data.coinReward} moedas adicionados!`,
          });
        },
        onError: () => {
          toast({ title: "Ops!", description: "Erro ao coletar recompensa.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 pt-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Missões Diárias</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Complete tarefas para ganhar XP, moedas e acelerar sua evolução.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">
            {hoursLeft}h {minutesLeft}m restantes
          </span>
        </div>
      </div>

      {/* Progress hero */}
      <motion.div
        className={`rounded-2xl border overflow-hidden relative ${
          allDone
            ? "border-emerald-500/30 bg-emerald-500/[0.06]"
            : "border-white/[0.08] bg-white/[0.03]"
        }`}
        animate={allDone ? { boxShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 30px rgba(16,185,129,0.15)", "0 0 0px rgba(16,185,129,0)"] } : {}}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        {allDone && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-violet-500/5" />
          </div>
        )}
        <div className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <RingProgress pct={progressPct} done={completedCount} total={totalCount} />

          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h3 className="text-xl font-bold text-white">
                {allDone ? "Dia perfeito! 🏆" : completedCount > 0 ? `${completedCount} missão${completedCount > 1 ? "s" : ""} concluída${completedCount > 1 ? "s" : ""}` : "Comece sua jornada"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {allDone
                  ? "Você completou todas as missões de hoje. Volte amanhã para novos desafios!"
                  : `Faltam ${totalCount - completedCount} missão${totalCount - completedCount > 1 ? "s" : ""} para o bônus diário.`}
              </p>
            </div>

            {/* XP summary */}
            {missions && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge className="bg-primary/10 border border-primary/20 text-primary gap-1 text-xs font-bold">
                  <Zap className="w-3 h-3 fill-primary" />
                  {missions.filter(m => m.completed).reduce((s, m) => s + m.xpReward, 0)} / {missions.reduce((s, m) => s + m.xpReward, 0)} XP coletados
                </Badge>
                {allDone && (
                  <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 gap-1 text-xs font-bold">
                    <Star className="w-3 h-3" /> Bônus diário ativo!
                  </Badge>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div className="max-w-xs mx-auto sm:mx-0 space-y-1">
              <Progress value={progressPct} className="h-2 bg-white/[0.06]" />
              <p className="text-[11px] text-muted-foreground">{Math.round(progressPct)}% do dia completo</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mission cards */}
      <div className="space-y-3">
        {isLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)
        ) : missions && missions.length > 0 ? (
          <AnimatePresence>
            {missions.map((mission, i) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                index={i}
                onCollect={handleCollect}
                collecting={completeMission.isPending && justCompleted === null}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-white/[0.06]">
            <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Sem missões para hoje. Volte amanhã!</p>
          </div>
        )}
      </div>

      {/* How it works */}
      <HowItWorks />

      {/* Weekly overview teaser */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Missões resetam à meia-noite</p>
          <p className="text-xs text-muted-foreground">Complete todas as missões diárias para manter seu streak ativo e ganhar bônus especiais.</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </div>
  );
}
