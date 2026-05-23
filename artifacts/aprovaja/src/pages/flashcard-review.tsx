import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft, RotateCcw, CheckCircle2, XCircle, Minus,
  Zap, Trophy, Flame, ChevronRight, Brain, Star,
  Volume2, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  useGetFlashcardCards,
  useGetFlashcards,
  useReviewFlashcard,
} from "@workspace/api-client-react";
import type { Flashcard } from "@workspace/api-client-react";

type Rating = "again" | "hard" | "good" | "easy";

const RATING_CONFIG: Record<Rating, { label: string; quality: number; color: string; glow: string; icon: React.ReactNode }> = {
  again: { label: "Errei", quality: 0, color: "bg-rose-600 hover:bg-rose-500 border-rose-500", glow: "shadow-rose-500/40", icon: <XCircle className="w-4 h-4" /> },
  hard: { label: "Difícil", quality: 2, color: "bg-orange-600 hover:bg-orange-500 border-orange-500", glow: "shadow-orange-500/40", icon: <Minus className="w-4 h-4" /> },
  good: { label: "Bom", quality: 4, color: "bg-emerald-600 hover:bg-emerald-500 border-emerald-500", glow: "shadow-emerald-500/40", icon: <CheckCircle2 className="w-4 h-4" /> },
  easy: { label: "Fácil", quality: 5, color: "bg-cyan-600 hover:bg-cyan-500 border-cyan-500", glow: "shadow-cyan-500/40", icon: <Star className="w-4 h-4" /> },
};

function XPPopup({ amount, onDone }: { amount: number; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 1200); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{ opacity: 1, y: -60, scale: 1 }}
      exit={{ opacity: 0, y: -100 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 pointer-events-none z-50"
    >
      <div className="flex items-center gap-1 bg-primary/90 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-primary/30">
        <Zap className="w-3.5 h-3.5" /> +{amount} XP
      </div>
    </motion.div>
  );
}

function FlipCard({ card, isFlipped, onClick }: { card: Flashcard; isFlipped: boolean; onClick: () => void }) {
  return (
    <div
      className="relative w-full cursor-pointer"
      style={{ perspective: 1400 }}
      onClick={onClick}
    >
      <motion.div
        className="relative w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120, damping: 18 }}
      >
        {/* Front */}
        <div
          className="w-full min-h-[320px] rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl flex flex-col items-center justify-center p-8 gap-6 shadow-2xl"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <p className="text-xl md:text-2xl font-semibold text-center text-white leading-relaxed">{card.front}</p>
          <div className="flex items-center gap-2 text-muted-foreground/60 text-sm mt-2">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clique para revelar a resposta</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 w-full min-h-[320px] rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-cyan-950/30 backdrop-blur-xl flex flex-col items-center justify-center p-8 gap-5 shadow-2xl shadow-emerald-900/20"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-xs text-emerald-400/60 font-semibold uppercase tracking-widest">Resposta</p>
          <p className="text-xl md:text-2xl font-semibold text-center text-white leading-relaxed">{card.back}</p>
          {card.mastered && (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-xs gap-1">
              <Star className="w-3 h-3" /> Dominado
            </Badge>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SessionComplete({ stats, deckTitle, onRestart, onBack }: {
  stats: { correct: number; hard: number; again: number; total: number; xpEarned: number };
  deckTitle: string;
  onRestart: () => void;
  onBack: () => void;
}) {
  const pct = Math.round((stats.correct / (stats.total || 1)) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center gap-8 py-12 max-w-lg mx-auto"
    >
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/30 to-cyan-600/20 border border-primary/20 flex items-center justify-center shadow-xl shadow-primary/20">
        <Trophy className="w-12 h-12 text-primary" />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Sessão Concluída!</h2>
        <p className="text-muted-foreground">{deckTitle}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {[
          { label: "Acertos", val: stats.correct, color: "text-emerald-400" },
          { label: "Difíceis", val: stats.hard, color: "text-orange-400" },
          { label: "Erros", val: stats.again, color: "text-rose-400" },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <div className={`text-3xl font-bold ${s.color}`}>{s.val}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
          <Zap className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm text-muted-foreground">XP conquistado</p>
          <p className="text-2xl font-bold text-white">+{stats.xpEarned} XP</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Aproveitamento</p>
          <p className="text-2xl font-bold text-white">{pct}%</p>
        </div>
      </div>

      <div className="flex gap-3 w-full">
        <Button variant="outline" className="flex-1 h-12 rounded-xl border-white/10 hover:bg-white/[0.05]" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Baralhos
        </Button>
        <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/80 gap-2" onClick={onRestart}>
          <RotateCcw className="w-4 h-4" /> Revisar de novo
        </Button>
      </div>
    </motion.div>
  );
}

export default function FlashcardReview() {
  const [, params] = useRoute("/flashcards/revisar/:deckId");
  const [, navigate] = useLocation();
  const deckId = Number(params?.deckId ?? 0);

  const { data: decks } = useGetFlashcards();
  const { data: allCards, isLoading } = useGetFlashcardCards(deckId, { query: { enabled: !!deckId, queryKey: ["flashcard-cards", deckId] } });
  const reviewMutation = useReviewFlashcard();

  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showXP, setShowXP] = useState<{ id: number; amount: number } | null>(null);
  const [sessionDone, setSessionDone] = useState(false);
  const [stats, setStats] = useState({ correct: 0, hard: 0, again: 0, total: 0, xpEarned: 0 });

  const deck = decks?.find(d => d.id === deckId);

  useEffect(() => {
    if (!allCards) return;
    const now = new Date();
    const due = allCards.filter(c => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
    const rest = allCards.filter(c => c.nextReviewAt && new Date(c.nextReviewAt) > now);
    setQueue(due.length > 0 ? due : rest);
    setCurrentIdx(0);
    setSessionDone(false);
    setStats({ correct: 0, hard: 0, again: 0, total: 0, xpEarned: 0 });
  }, [allCards]);

  const currentCard = queue[currentIdx];
  const progress = queue.length > 0 ? (currentIdx / queue.length) * 100 : 0;

  const handleRate = useCallback(async (rating: Rating) => {
    if (!currentCard) return;

    const { quality } = RATING_CONFIG[rating];
    const xpAmount = rating === "easy" ? 15 : rating === "good" ? 10 : rating === "hard" ? 5 : 2;

    setShowXP({ id: Date.now(), amount: xpAmount });

    const newStats = { ...stats };
    newStats.total += 1;
    newStats.xpEarned += xpAmount;
    if (rating === "good" || rating === "easy") newStats.correct += 1;
    else if (rating === "hard") newStats.hard += 1;
    else newStats.again += 1;
    setStats(newStats);

    reviewMutation.mutate({ deckId, cardId: currentCard.id, data: { quality } });

    setIsFlipped(false);
    setTimeout(() => {
      if (currentIdx + 1 >= queue.length) {
        setSessionDone(true);
      } else {
        setCurrentIdx(i => i + 1);
      }
    }, 300);
  }, [currentCard, currentIdx, deckId, queue.length, reviewMutation, stats]);

  const handleRestart = useCallback(() => {
    if (!allCards) return;
    setQueue([...allCards].sort(() => Math.random() - 0.5));
    setCurrentIdx(0);
    setSessionDone(false);
    setStats({ correct: 0, hard: 0, again: 0, total: 0, xpEarned: 0 });
    setIsFlipped(false);
  }, [allCards]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div className="flex gap-2" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }}>
          {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-primary" style={{ animationDelay: `${i * 0.2}s` }} />)}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white" onClick={() => navigate("/flashcards")}>
          <ArrowLeft className="w-4 h-4" /> Baralhos
        </Button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-lg">{deck?.title ?? "Flashcards"}</h1>
          <p className="text-xs text-muted-foreground">{deck?.subject} · {queue.length} cards</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/15 text-primary border-primary/25 gap-1">
            <Flame className="w-3 h-3" /> {stats.xpEarned} XP
          </Badge>
        </div>
      </div>

      {sessionDone ? (
        <SessionComplete
          stats={stats}
          deckTitle={deck?.title ?? ""}
          onRestart={handleRestart}
          onBack={() => navigate("/flashcards")}
        />
      ) : queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Tudo em dia! 🎉</h2>
            <p className="text-muted-foreground">Nenhum card para revisar agora. Volte mais tarde.</p>
          </div>
          <Button className="gap-2 h-11 px-6 rounded-xl" onClick={() => navigate("/flashcards")}>
            <ArrowLeft className="w-4 h-4" /> Ver Baralhos
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full gap-6">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-8 text-right">{currentIdx}</span>
            <Progress value={progress} className="flex-1 h-2 bg-white/[0.06]" />
            <span className="text-xs text-muted-foreground w-8">{queue.length}</span>
          </div>

          {/* Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="relative flex-1"
            >
              <FlipCard
                card={currentCard}
                isFlipped={isFlipped}
                onClick={() => setIsFlipped(f => !f)}
              />
              <AnimatePresence>
                {showXP && (
                  <XPPopup key={showXP.id} amount={showXP.amount} onDone={() => setShowXP(null)} />
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="space-y-3 pb-4">
            {!isFlipped ? (
              <Button
                className="w-full h-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] text-white gap-2"
                onClick={() => setIsFlipped(true)}
              >
                <RotateCcw className="w-4 h-4" /> Revelar Resposta
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-4 gap-2"
              >
                {(["again", "hard", "good", "easy"] as Rating[]).map(rating => {
                  const cfg = RATING_CONFIG[rating];
                  return (
                    <button
                      key={rating}
                      onClick={() => handleRate(rating)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border ${cfg.color} shadow-lg ${cfg.glow} transition-all duration-150 active:scale-95 text-white font-semibold text-xs`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
            <p className="text-center text-[11px] text-muted-foreground/50">
              {isFlipped ? "Como você se saiu? Seja honesto — isso melhora sua aprendizagem." : "Tente responder antes de revelar."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
