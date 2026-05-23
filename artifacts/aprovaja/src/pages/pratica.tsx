import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetQuestionSubjects,
  useGetQuestions,
  usePracticeQuestion,
} from "@workspace/api-client-react";
import type { QuestionSummary, QuestionWithAnswer } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen, Filter, CheckCircle2, XCircle, Zap, ChevronRight,
  X, Timer, BarChart3
} from "lucide-react";

type Difficulty = "facil" | "medio" | "dificil";
type Category = "ENEM" | "Vestibular" | "Concurso";

function DifficultyBadge({ d }: { d: string }) {
  const map = { facil: { label: "Fácil", cls: "border-green-500/40 text-green-400 bg-green-500/5" }, medio: { label: "Médio", cls: "border-yellow-500/40 text-yellow-400 bg-yellow-500/5" }, dificil: { label: "Difícil", cls: "border-red-500/40 text-red-400 bg-red-500/5" } } as const;
  const style = map[d as keyof typeof map] ?? { label: d, cls: "border-border text-muted-foreground" };
  return <Badge variant="outline" className={`text-xs ${style.cls}`}>{style.label}</Badge>;
}

interface PracticeModalProps {
  question: QuestionSummary;
  onClose: () => void;
}

function PracticeModal({ question, onClose }: PracticeModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; correctAnswer: string; explanation: string; xpEarned: number } | null>(null);
  const practiceQuestion = usePracticeQuestion();
  const { toast } = useToast();

  const handleAnswer = (alternativeId: string) => {
    if (result) return;
    setSelected(alternativeId);
    practiceQuestion.mutate(
      { id: question.id, data: { selectedAlternative: alternativeId } },
      {
        onSuccess: (data) => {
          setResult(data);
          toast({
            title: data.isCorrect ? "✅ Correto!" : "❌ Incorreto",
            description: `+${data.xpEarned} XP ganhos`,
          });
        },
      }
    );
  };

  const alternatives = [
    { id: "A", text: "" }, { id: "B", text: "" },
    { id: "C", text: "" }, { id: "D", text: "" }, { id: "E", text: "" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !result && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{question.subject}</Badge>
            <span className="text-xs text-muted-foreground">{question.topic}</span>
            <DifficultyBadge d={question.difficulty} />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-base leading-relaxed">{question.statement}</p>

          <div className="space-y-2">
            {["A", "B", "C", "D", "E"].map((id) => {
              const isSelected = selected === id;
              const isCorrect = result?.correctAnswer === id;
              const isWrong = isSelected && result && !result.isCorrect;
              return (
                <button
                  key={id}
                  onClick={() => handleAnswer(id)}
                  disabled={Boolean(result) || practiceQuestion.isPending}
                  className={`w-full text-left p-4 rounded-xl border flex items-center gap-3 transition-all ${
                    result
                      ? isCorrect
                        ? "border-green-500/60 bg-green-500/10"
                        : isWrong
                        ? "border-red-500/60 bg-red-500/10"
                        : "border-border bg-card/40 opacity-50"
                      : isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card/40 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    result
                      ? isCorrect ? "border-green-500 bg-green-500 text-white" : isWrong ? "border-red-500 bg-red-500 text-white" : "border-border text-muted-foreground"
                      : isSelected ? "border-primary bg-primary text-white" : "border-border text-muted-foreground"
                  }`}>{id}</span>
                  <span className="text-sm text-muted-foreground">{id === "A" ? "Alternativa A" : id === "B" ? "Alternativa B" : id === "C" ? "Alternativa C" : id === "D" ? "Alternativa D" : "Alternativa E"}</span>
                  {result && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}
                  {result && isWrong && <XCircle className="w-4 h-4 text-red-400 ml-auto" />}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Selecione a alternativa correta para ver a explicação
          </p>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-4 border ${result.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {result.isCorrect
                  ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                  : <XCircle className="w-5 h-5 text-red-400" />
                }
                <span className="font-bold">{result.isCorrect ? "Resposta correta!" : `Incorreto — Gabarito: ${result.correctAnswer}`}</span>
                <div className="ml-auto flex items-center gap-1 text-yellow-400 text-sm font-bold">
                  <Zap className="w-4 h-4 fill-yellow-400" /> +{result.xpEarned} XP
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.explanation}</p>
              <Button className="mt-4 w-full" onClick={onClose}>Próxima Questão</Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Pratica() {
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Category | null>(null);
  const [practicing, setPracticing] = useState<QuestionSummary | null>(null);
  const [page] = useState(0);

  const { data: subjects, isLoading: loadingSubjects } = useGetQuestionSubjects();
  const { data: questionsPage, isLoading: loadingQuestions } = useGetQuestions({
    ...(subjectFilter ? { subject: subjectFilter } : {}),
    ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
    ...(categoryFilter ? { category: categoryFilter } : {}),
    limit: 20,
    offset: page * 20,
  });

  const questions = questionsPage?.questions ?? [];

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 pb-0">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Modo Praticar</h2>
            <p className="text-muted-foreground">Pratique questão a questão, ganhe XP e fortaleça suas matérias</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
            <BarChart3 className="w-4 h-4" />
            {questionsPage?.total ?? 0} questões
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3 pb-4 border-b border-border">
          {/* Difficulty */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3" /> Dificuldade:
            </span>
            {[null, "facil", "medio", "dificil"].map((d) => (
              <button
                key={d ?? "all"}
                onClick={() => setDifficultyFilter(d as Difficulty | null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  difficultyFilter === d
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                {d === null ? "Todas" : d === "facil" ? "Fácil" : d === "medio" ? "Médio" : "Difícil"}
              </button>
            ))}
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider ml-4">Tipo:</span>
            {[null, "ENEM", "Vestibular", "Concurso"].map((c) => (
              <button
                key={c ?? "all"}
                onClick={() => setCategoryFilter(c as Category | null)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  categoryFilter === c
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground hover:border-accent/40"
                }`}
              >
                {c ?? "Todos"}
              </button>
            ))}
          </div>

          {/* Subjects */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSubjectFilter(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                subjectFilter === null ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              Todas as matérias
            </button>
            {loadingSubjects
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)
              : (subjects ?? []).map((s) => (
                <button
                  key={s.subject}
                  onClick={() => setSubjectFilter(subjectFilter === s.subject ? null : s.subject)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    subjectFilter === s.subject ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {s.subject} <span className="opacity-50">({s.questionCount})</span>
                </button>
              ))
            }
          </div>
        </div>
      </div>

      {/* Question list */}
      <div className="flex-1 p-6 pt-4">
        {loadingQuestions ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">Nenhuma questão encontrada</p>
            <p className="text-muted-foreground text-sm mt-1">Tente remover alguns filtros</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="bg-card/40 border-border hover:border-primary/30 transition-all group">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="secondary" className="text-xs">{q.subject}</Badge>
                        <span className="text-xs text-muted-foreground">· {q.topic}</span>
                        <DifficultyBadge d={q.difficulty} />
                        <Badge variant="outline" className="text-xs text-muted-foreground border-muted">{q.category}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Timer className="w-3 h-3" /> {Math.round(q.estimatedTimeSeconds / 60)} min
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{q.statement}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {q.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => setPracticing(q)}
                      className="flex-shrink-0 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white gap-1.5 text-xs"
                      variant="ghost"
                    >
                      Praticar <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Practice modal */}
      <AnimatePresence>
        {practicing && (
          <PracticeModal
            key={practicing.id}
            question={practicing}
            onClose={() => setPracticing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
