import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Brain, Zap, RefreshCw, AlertCircle, Play, Clock, Target,
  ChevronRight, Flame, Star, TrendingUp, BookOpen, Timer,
  Sparkles, Award, BarChart3, ArrowRight, CheckCircle2,
  RotateCcw, Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useGetStudyTodayRecommendation, useGetGamificationStats } from "@workspace/api-client-react";
import type { StudyCard } from "@workspace/api-client-react";

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  facil:   { bg: "bg-emerald-500/15",  text: "text-emerald-400",  border: "border-emerald-500/30",  label: "Fácil" },
  medio:   { bg: "bg-amber-500/15",    text: "text-amber-400",    border: "border-amber-500/30",    label: "Médio" },
  dificil: { bg: "bg-rose-500/15",     text: "text-rose-400",     border: "border-rose-500/30",     label: "Difícil" },
};

const PRIORITY_CONFIG: Record<string, { gradient: string; glow: string; badge: string; badgeText: string; icon: React.ReactNode; label: string }> = {
  urgente:    { gradient: "from-rose-500/20 via-rose-900/10 to-transparent", glow: "shadow-rose-500/20",    badge: "bg-rose-500/20 border-rose-500/40",    badgeText: "text-rose-300",    icon: <AlertCircle className="w-3.5 h-3.5" />, label: "URGENTE" },
  importante: { gradient: "from-violet-500/20 via-violet-900/10 to-transparent", glow: "shadow-violet-500/20", badge: "bg-violet-500/20 border-violet-500/40", badgeText: "text-violet-300", icon: <Target className="w-3.5 h-3.5" />,      label: "IMPORTANTE" },
  reforço:    { gradient: "from-cyan-500/20 via-cyan-900/10 to-transparent",   glow: "shadow-cyan-500/20",   badge: "bg-cyan-500/20 border-cyan-500/40",     badgeText: "text-cyan-300",    icon: <TrendingUp className="w-3.5 h-3.5" />,  label: "REFORÇO" },
};

const MOTIVATIONAL = [
  "Cada questão certa é um passo a mais em direção à aprovação!",
  "Os aprovados estudam quando ninguém está vendo. Continue!",
  "Consistência bate intensidade. Você está construindo o futuro.",
  "Sua dedicação de hoje é o resultado de amanhã. Não pare!",
  "O ENEM recompensa quem estuda com método. Você está no caminho.",
];

function EnemProbabilityRing({ value }: { value: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;
  const color = value >= 75 ? "#f59e0b" : value >= 50 ? "#8b5cf6" : "#06b6d4";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 68 68">
          <circle cx="34" cy="34" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
          <motion.circle
            cx="34" cy="34" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - dash }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{value}%</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">Chance<br/>ENEM</span>
    </div>
  );
}

function AILoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    "Analisando seu histórico de desempenho...",
    "Identificando lacunas críticas de conhecimento...",
    "Cruzando com o banco de questões ENEM 2026...",
    "Calibrando nível de dificuldade ideal...",
    "Gerando recomendações personalizadas...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % steps.length);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Brain className="w-12 h-12 text-primary" />
        </motion.div>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-primary/20"
            animate={{ scale: [1, 1.8 + i * 0.4], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`p-${i}`}
            className="absolute w-2 h-2 rounded-full bg-primary/60"
            style={{
              top: "50%", left: "50%",
              transformOrigin: "0 0",
            }}
            animate={{
              x: [0, Math.cos((i * 60 * Math.PI) / 180) * 52 - 4],
              y: [0, Math.sin((i * 60 * Math.PI) / 180) * 52 - 4],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <div className="text-center space-y-3">
        <h3 className="text-lg font-semibold text-white">IA analisando seu perfil</h3>
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            className="text-sm text-muted-foreground max-w-xs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>
        <div className="flex gap-1.5 justify-center mt-2">
          {[0,1,2,3,4].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PomodoroTimer({ minutes }: { minutes: number }) {
  const total = minutes * 60;
  const [seconds, setSeconds] = useState(total);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(intervalRef.current!); setRunning(false); return total; }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const pct = ((total - seconds) / total) * 100;
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");

  return (
    <motion.div
      className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3"
      whileHover={{ borderColor: "rgba(139,92,246,0.3)" }}
    >
      <Timer className="w-4 h-4 text-violet-400" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Pomodoro</span>
          <span className="text-sm font-mono font-bold text-white">{mm}:{ss}</span>
        </div>
        <Progress value={pct} className="h-1 bg-white/10" />
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="w-8 h-8 p-0 rounded-full hover:bg-violet-500/20"
        onClick={() => {
          if (!running && seconds === 0) setSeconds(total);
          setRunning(r => !r);
        }}
      >
        {running ? <Pause className="w-3.5 h-3.5 text-violet-400" /> : <Play className="w-3.5 h-3.5 text-violet-400" />}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="w-8 h-8 p-0 rounded-full hover:bg-white/10"
        onClick={() => { setRunning(false); setSeconds(total); }}
      >
        <RotateCcw className="w-3 h-3 text-muted-foreground" />
      </Button>
    </motion.div>
  );
}

function StudyCardComponent({ card, index, onStart, onDifficulty, onSwap }: {
  card: StudyCard;
  index: number;
  onStart: (card: StudyCard) => void;
  onDifficulty: (card: StudyCard) => void;
  onSwap: (index: number) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const diff = DIFFICULTY_COLORS[card.difficulty] ?? DIFFICULTY_COLORS.medio;
  const prio = PRIORITY_CONFIG[card.priorityLevel] ?? PRIORITY_CONFIG.importante;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="group relative"
    >
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${prio.gradient} blur-xl opacity-80 group-hover:opacity-100 transition-opacity`} />
      <motion.div
        className={`relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl overflow-hidden shadow-2xl ${prio.glow} group-hover:border-white/20 transition-all duration-300`}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${prio.badge} ${prio.badgeText}`}>
                  {prio.icon}{prio.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${diff.bg} ${diff.text} ${diff.border}`}>
                  {diff.label}
                </span>
              </div>
              <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">{card.subject}</p>
              <h3 className="text-lg font-bold text-white leading-snug">{card.topic}</h3>
            </div>
            <EnemProbabilityRing value={card.enemProbability} />
          </div>

          <AnimatePresence mode="wait">
            {!flipped ? (
              <motion.div
                key="front"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Seu progresso</span>
                    <span className="font-semibold text-white">{card.studentProgress}%</span>
                  </div>
                  <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${card.studentProgress}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.15 }}
                      style={{ boxShadow: "0 0 8px rgba(139,92,246,0.5)" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center gap-1 bg-white/[0.04] rounded-xl p-2.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">{card.estimatedMinutes}min</span>
                    <span className="text-[9px] text-muted-foreground">Duração</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 bg-white/[0.04] rounded-xl p-2.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-white">+{card.xpReward} XP</span>
                    <span className="text-[9px] text-muted-foreground">Recompensa</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 bg-white/[0.04] rounded-xl p-2.5">
                    <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-semibold text-white">{card.questionCount}</span>
                    <span className="text-[9px] text-muted-foreground">Questões</span>
                  </div>
                </div>

                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.miniSummary}</p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
                  <Brain className="w-3 h-3 text-primary/60" />
                  <span className="italic">{card.reason}</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="text-sm font-semibold text-white mb-1">Modo adaptado ativado</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Recomendamos começar com questões de nível <span className="text-amber-400 font-semibold">Fácil</span> para construir confiança antes de avançar. A IA reduzirá a dificuldade nas próximas sugestões.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xs text-amber-300">💡 Dica: assista ao resumo do tópico antes de praticar. Isso aumenta em 40% a taxa de acerto!</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-white"
                  onClick={() => setFlipped(false)}
                >
                  ← Voltar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {!flipped && (
            <div className="flex flex-col gap-2 pt-1">
              <Button
                className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/25"
                onClick={() => onStart(card)}
              >
                <Play className="w-4 h-4 mr-2" />
                Começar agora
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 rounded-lg text-xs border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-white"
                  onClick={() => { setFlipped(true); onDifficulty(card); }}
                >
                  <AlertCircle className="w-3 h-3 mr-1.5" />
                  Estou com dificuldade
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-lg text-xs border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-white"
                  onClick={() => onSwap(index)}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-4 flex gap-1.5 flex-wrap">
          {card.tags.map(tag => (
            <span key={tag} className="text-[9px] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground border border-white/[0.06]">
              #{tag}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function EstudeHoje() {
  const [, navigate] = useLocation();
  const [refreshKey, setRefreshKey] = useState(false);
  const [swappedIndexes, setSwappedIndexes] = useState<Set<number>>(new Set());
  const [startedCard, setStartedCard] = useState<string | null>(null);
  const motivational = MOTIVATIONAL[Math.floor(Date.now() / 86400000) % MOTIVATIONAL.length];

  const { data, isLoading, refetch } = useGetStudyTodayRecommendation(
    refreshKey ? { refresh: "true" } : {}
  );
  const { data: stats } = useGetGamificationStats();

  const handleRefresh = () => {
    setRefreshKey(k => !k);
    setSwappedIndexes(new Set());
    refetch();
  };

  const handleStart = (card: StudyCard) => {
    setStartedCard(card.id);
    setTimeout(() => navigate(`/pratica?subject=${encodeURIComponent(card.subject)}`), 600);
  };

  const handleDifficulty = (_card: StudyCard) => {};

  const handleSwap = (index: number) => {
    setSwappedIndexes(s => { const n = new Set(s); n.add(index); return n; });
  };

  const recommendations = data?.recommendations ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-1"
            >
              <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                </motion.div>
                <span className="text-xs text-primary font-semibold">IA Ativa</span>
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/60 leading-tight"
            >
              Qual tópico iremos<br className="hidden sm:block" /> estudar hoje?
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-muted-foreground max-w-md"
            >
              Sua IA selecionou o melhor conteúdo para acelerar sua aprovação.
            </motion.p>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="shrink-0">
            <Button
              variant="outline"
              className="h-10 rounded-xl border-white/10 bg-white/[0.03] hover:bg-white/[0.08] gap-2"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <motion.span animate={isLoading ? { rotate: 360 } : {}} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <RefreshCw className="w-4 h-4" />
              </motion.span>
              <span className="hidden sm:inline">Nova sugestão</span>
            </Button>
          </motion.div>
        </div>

        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { icon: <Flame className="w-4 h-4 text-orange-400" />, value: `${stats.streak} dias`, label: "Sequência", color: "text-orange-400" },
              { icon: <Zap className="w-4 h-4 text-amber-400" />, value: `${stats.xp} XP`, label: "Total XP", color: "text-amber-400" },
              { icon: <Star className="w-4 h-4 text-violet-400" />, value: `Nível ${stats.level}`, label: "Nível atual", color: "text-violet-400" },
              { icon: <Award className="w-4 h-4 text-cyan-400" />, value: `${stats.coins} 🪙`, label: "Moedas", color: "text-cyan-400" },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 py-3"
                whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.12)" }}
              >
                <div className="shrink-0">{item.icon}</div>
                <div>
                  <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {data?.analysisInsight && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-2xl px-5 py-4"
          >
            <Brain className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary mb-0.5">Análise da IA</p>
              <p className="text-sm text-muted-foreground">{data.analysisInsight}</p>
            </div>
            {data.totalQuestionsAvailable > 0 && (
              <div className="ml-auto shrink-0 text-right">
                <p className="text-lg font-bold text-white">{data.totalQuestionsAvailable}</p>
                <p className="text-[10px] text-muted-foreground">questões<br/>disponíveis</p>
              </div>
            )}
          </motion.div>
        )}

        {isLoading ? (
          <AILoadingScreen />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {recommendations.map((card, i) => (
              <AnimatePresence key={`${card.id}-${swappedIndexes.has(i) ? "swapped" : "orig"}`}>
                <StudyCardComponent
                  card={swappedIndexes.has(i)
                    ? { ...card, subject: recommendations[(i + 1) % recommendations.length]?.subject ?? card.subject, topic: recommendations[(i + 1) % recommendations.length]?.topic ?? card.topic }
                    : card
                  }
                  index={i}
                  onStart={handleStart}
                  onDifficulty={handleDifficulty}
                  onSwap={handleSwap}
                />
              </AnimatePresence>
            ))}
          </div>
        )}

        {!isLoading && data && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Timer className="w-4 h-4 text-violet-400" />
                Técnica Pomodoro
              </h3>
              <PomodoroTimer minutes={data.pomodoroSuggestion} />
              <p className="text-xs text-muted-foreground px-1">
                A IA recomenda sessões de {data.pomodoroSuggestion} minutos com pausas de 5 min para máximo aproveitamento.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Meta de hoje
              </h3>
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 space-y-3">
                {[
                  { label: "Completar 1 tópico recomendado", done: false, xp: 80 },
                  { label: "Responder 10 questões", done: false, xp: 50 },
                  { label: "Manter sua sequência de estudos", done: (stats?.streak ?? 0) > 0, xp: 30 },
                ].map((goal, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${goal.done ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
                      {goal.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-xs flex-1 ${goal.done ? "line-through text-muted-foreground/50" : "text-muted-foreground"}`}>
                      {goal.label}
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold">+{goal.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm text-muted-foreground italic flex-1">"{motivational}"</p>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
          </motion.div>
        )}

        {startedCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
              >
                <Play className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="text-white font-semibold text-lg">Carregando questões...</p>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-primary" animate={{ y: [0, -8, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
