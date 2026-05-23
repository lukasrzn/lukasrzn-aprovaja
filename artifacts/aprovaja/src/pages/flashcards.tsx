import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetFlashcards, useCreateFlashcardDeck } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Layers, Plus, Play, Brain, CheckCircle, Flame,
  Star, Zap, Trophy, BookOpen, Clock,
} from "lucide-react";

const SUBJECT_COLORS: Record<string, string> = {
  "Matemática":     "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Física":         "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  "Química":        "text-purple-400 bg-purple-500/10 border-purple-500/20",
  "Biologia":       "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "História":       "text-amber-400 bg-amber-500/10 border-amber-500/20",
  "Português":      "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "Direito":        "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  "Interdisciplinar": "text-pink-400 bg-pink-500/10 border-pink-500/20",
  "Geografia":      "text-teal-400 bg-teal-500/10 border-teal-500/20",
};

function getSubjectStyle(subject: string) {
  return SUBJECT_COLORS[subject] ?? "text-primary bg-primary/10 border-primary/20";
}

function NewDeckModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const create = useCreateFlashcardDeck();

  const handleCreate = async () => {
    if (!title.trim() || !subject.trim()) return;
    await create.mutateAsync({ data: { title: title.trim(), subject: subject.trim() } });
    setTitle("");
    setSubject("");
    onCreated();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Novo Baralho
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Nome do baralho</Label>
            <Input
              placeholder="Ex: Funções Matemáticas"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-white/[0.04] border-white/[0.1] focus:border-primary/40"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Matéria</Label>
            <Input
              placeholder="Ex: Matemática"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="bg-white/[0.04] border-white/[0.1] focus:border-primary/40"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-primary hover:bg-primary/80"
            onClick={handleCreate}
            disabled={!title.trim() || !subject.trim() || create.isPending}
          >
            {create.isPending ? "Criando..." : "Criar Baralho"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Flashcards() {
  const [, navigate] = useLocation();
  const { data: decks, isLoading, refetch } = useGetFlashcards();
  const [showNewDeck, setShowNewDeck] = useState(false);

  const totalCards = decks?.reduce((acc, d) => acc + d.cardCount, 0) ?? 0;
  const totalDue = decks?.reduce((acc, d) => acc + d.dueCount, 0) ?? 0;
  const totalMastered = decks?.reduce((acc, d) => acc + d.masteredCount, 0) ?? 0;

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Flashcards</h2>
          <p className="text-muted-foreground">Repetição espaçada inteligente com SM-2. Domine conceitos para sempre.</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/80 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] gap-2"
          onClick={() => setShowNewDeck(true)}
        >
          <Plus className="w-4 h-4" /> Novo Baralho
        </Button>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
        {[
          { label: "Cards Totais", value: totalCards, color: "text-white", icon: <Layers className="w-4 h-4 text-muted-foreground" /> },
          { label: "Para Revisar", value: totalDue, color: "text-orange-400", icon: <Clock className="w-4 h-4 text-orange-400" /> },
          { label: "Dominados", value: totalMastered, color: "text-emerald-400", icon: <Star className="w-4 h-4 text-emerald-400" /> },
        ].map((s, i) => (
          <div key={i} className="bg-[#0d0d14] flex flex-col items-center justify-center py-5 px-3 gap-1">
            {s.icon}
            <span className={`text-3xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Due today call-to-action */}
      {totalDue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">
              {totalDue} card{totalDue > 1 ? "s" : ""} esperando revisão!
            </p>
            <p className="text-xs text-muted-foreground">Revisar agora garante mais XP e mantém seu streak</p>
          </div>
        </motion.div>
      )}

      {/* Deck Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          [1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-[300px] rounded-2xl" />)
        ) : decks && decks.length > 0 ? (
          <AnimatePresence>
            {decks.map((deck, idx) => {
              const pct = Math.round((deck.masteredCount / (deck.cardCount || 1)) * 100);
              const subjectStyle = getSubjectStyle(deck.subject);
              const hasDue = deck.dueCount > 0;

              return (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className={`relative flex flex-col bg-white/[0.03] border transition-all duration-200 group rounded-2xl overflow-visible
                    ${hasDue
                      ? "border-primary/30 hover:border-primary/60 shadow-lg shadow-primary/5 hover:shadow-primary/15"
                      : "border-white/[0.07] hover:border-white/[0.15]"
                    }`}
                  >
                    {hasDue && (
                      <div className="absolute -top-2.5 -right-2.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-[#0d0d14] z-10">
                        {deck.dueCount}
                      </div>
                    )}

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <Badge className={`text-[11px] border ${subjectStyle}`}>
                          {deck.subject}
                        </Badge>
                      </div>
                      <CardTitle className="text-base leading-snug">{deck.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="flex-1 pb-3 space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> Aprendizado</span>
                          <span className="font-semibold text-white">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5 bg-white/[0.06]" />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                        <div className="bg-white/[0.03] rounded-lg p-2 text-center border border-white/[0.06]">
                          <div className="font-bold text-white text-sm">{deck.cardCount}</div>
                          <div>Total</div>
                        </div>
                        <div className="bg-white/[0.03] rounded-lg p-2 text-center border border-white/[0.06]">
                          <div className="font-bold text-orange-400 text-sm">{deck.dueCount}</div>
                          <div>Pendentes</div>
                        </div>
                        <div className="bg-white/[0.03] rounded-lg p-2 text-center border border-white/[0.06]">
                          <div className="font-bold text-emerald-400 text-sm flex justify-center items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" />{deck.masteredCount}
                          </div>
                          <div>Mestres</div>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-1 pb-4 px-4">
                      <Button
                        className={`w-full h-10 rounded-xl gap-2 font-semibold transition-all ${
                          hasDue
                            ? "bg-primary hover:bg-primary/80 text-white shadow-md shadow-primary/25"
                            : "bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-muted-foreground hover:text-white"
                        }`}
                        disabled={deck.cardCount === 0}
                        onClick={() => navigate(`/flashcards/revisar/${deck.id}`)}
                      >
                        <Play className="w-3.5 h-3.5" />
                        {hasDue ? `Revisar ${deck.dueCount} cards` : "Estudar Livre"}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="col-span-full">
            <Card className="bg-white/[0.02] border-dashed border-2 border-white/[0.08] text-center py-20 rounded-2xl">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Layers className="w-10 h-10 text-primary/60" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sua memória está vazia</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                Crie seu primeiro baralho para memorizar fórmulas, datas históricas, vocabulário e conceitos-chave para o ENEM.
              </p>
              <Button
                className="bg-primary text-white hover:bg-primary/80 gap-2"
                onClick={() => setShowNewDeck(true)}
              >
                <Plus className="w-4 h-4" /> Criar Primeiro Baralho
              </Button>
            </Card>
          </div>
        )}
      </div>

      <NewDeckModal
        open={showNewDeck}
        onClose={() => setShowNewDeck(false)}
        onCreated={() => refetch()}
      />
    </div>
  );
}
