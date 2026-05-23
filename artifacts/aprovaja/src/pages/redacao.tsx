import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetRedacoes,
  useSubmitRedacao,
  useGetRedacao,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  PenTool, BrainCircuit, Send, ChevronLeft,
  Star, Zap, TrendingUp, CheckCircle2, AlertCircle,
  Trophy, MessageSquare, BookOpen, Target, Sparkles,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number, max: number) {
  const pct = score / max;
  if (pct >= 0.85) return { bar: "bg-emerald-500", text: "text-emerald-400", glow: "shadow-emerald-500/20" };
  if (pct >= 0.65) return { bar: "bg-cyan-500",    text: "text-cyan-400",    glow: "shadow-cyan-500/20" };
  if (pct >= 0.45) return { bar: "bg-amber-500",   text: "text-amber-400",   glow: "shadow-amber-500/20" };
  return                    { bar: "bg-rose-500",   text: "text-rose-400",    glow: "shadow-rose-500/20" };
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

// ─── Feedback Panel ───────────────────────────────────────────────────────────

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
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-white px-2"
          onClick={onBack}
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <h3 className="font-bold text-white text-sm truncate flex-1">{redacao.theme}</h3>
        <span className="text-xs text-muted-foreground shrink-0">
          {new Date(redacao.createdAt).toLocaleDateString("pt-BR")}
        </span>
      </div>

      {/* Score hero card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`relative rounded-2xl border bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-xl ${color.glow} border-white/[0.08]`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Pontuação Final</p>
            <div className="flex items-end gap-2">
              <span className={`text-5xl font-black ${color.text}`}>{score}</span>
              <span className="text-xl text-muted-foreground mb-1">/ {maxScore}</span>
            </div>
          </div>
          <div className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/[0.05] border border-white/[0.08]`}>
            <span className="text-2xl">{grade.icon}</span>
            <span className={`text-xs font-bold ${color.text}`}>{grade.label}</span>
          </div>
        </div>
        <Progress value={pct} className={`h-3 bg-white/[0.07] rounded-full`} />
        <p className="text-xs text-muted-foreground mt-2 text-right">{pct}% da nota máxima</p>
      </motion.div>

      {/* AI Feedback */}
      {redacao.feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4 flex gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
            <BrainCircuit className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-primary font-semibold mb-1 uppercase tracking-wider">Parecer Geral da IA</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{redacao.feedback}</p>
          </div>
        </motion.div>
      )}

      {/* Competencias */}
      {redacao.competencias && redacao.competencias.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Avaliação por Competência
          </p>
          {redacao.competencias.map((comp, i) => {
            const Icon = COMP_ICONS[i] ?? Star;
            const c = scoreColor(comp.score, comp.maxScore);
            const cpct = Math.round((comp.score / comp.maxScore) * 100);
            return (
              <motion.div
                key={comp.number}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                        C{comp.number}
                      </p>
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

      {/* XP earned */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
      >
        <Zap className="w-5 h-5 text-primary" />
        <div>
          <p className="text-xs text-muted-foreground">XP conquistado com esta redação</p>
          <p className="font-bold text-white">+{Math.floor(score / 20)} XP</p>
        </div>
        <div className="ml-auto">
          <Trophy className="w-5 h-5 text-amber-400" />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Essay List ───────────────────────────────────────────────────────────────

function EssayList({ onSelect }: { onSelect: (id: number) => void }) {
  const { data: redacoes, isLoading } = useGetRedacoes();
  const completed = redacoes?.filter(r => r.score !== null) ?? [];
  const pending   = redacoes?.filter(r => r.score === null) ?? [];

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  }

  if (!redacoes || redacoes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center rounded-2xl border-2 border-dashed border-white/[0.07]">
        <PenTool className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground max-w-xs">
          Nenhuma redação enviada ainda. Escreva seu primeiro texto e receba feedback instantâneo!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Processando</p>
          {pending.map(r => (
            <motion.div
              key={r.id}
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="rounded-2xl border border-primary/30 bg-primary/[0.05] p-4 flex items-center gap-3"
            >
              <BrainCircuit className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{r.theme}</p>
                <p className="text-xs text-primary mt-0.5">Analisando 5 competências...</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          {pending.length > 0 && <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-4">Corrigidas</p>}
          <AnimatePresence>
            {completed.map((r, i) => {
              const score = r.score ?? 0;
              const max   = r.maxScore ?? 1000;
              const c     = scoreColor(score, max);
              const pct   = Math.round((score / max) * 100);
              return (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 3 }}
                  onClick={() => onSelect(r.id)}
                  className="w-full text-left rounded-2xl border border-white/[0.07] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.05] p-4 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {r.theme}
                    </p>
                    <Badge className={`shrink-0 text-xs font-bold border ${c.text} bg-white/[0.04] border-white/[0.08]`}>
                      {score}/{max}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <Progress value={pct} className="h-1.5 bg-white/[0.06]" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{new Date(r.createdAt).toLocaleDateString("pt-BR")}</span>
                      <span className="flex items-center gap-1 text-primary group-hover:gap-2 transition-all">
                        Ver feedback <ChevronLeft className="w-3 h-3 rotate-180" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ─── Submission Form ──────────────────────────────────────────────────────────

const ENEM_THEMES = [
  "O impacto das redes sociais na saúde mental dos jovens brasileiros",
  "Desafios da segurança pública nas periferias urbanas do Brasil",
  "A importância da educação financeira nas escolas públicas",
  "Crise hídrica: responsabilidades e soluções para o Brasil",
  "Desigualdade racial no mercado de trabalho brasileiro",
];

function SubmissionForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [theme, setTheme] = useState("");
  const [content, setContent] = useState("");
  const submitRedacao = useSubmitRedacao();
  const { toast } = useToast();

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = content.length;
  const isReady = theme.trim().length > 0 && wordCount >= 10;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    submitRedacao.mutate(
      { data: { theme: theme.trim(), content: content.trim() } },
      {
        onSuccess: () => {
          toast({ title: "Redação enviada!", description: "Feedback da IA disponível em instantes." });
          setTheme("");
          setContent("");
          onSubmitted();
        },
        onError: () => {
          toast({ title: "Erro ao enviar", description: "Tente novamente.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.04] pointer-events-none">
        <BrainCircuit className="w-40 h-40 text-primary" />
      </div>

      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <PenTool className="w-5 h-5 text-primary" /> Nova Redação
        </CardTitle>
        <CardDescription>Feedback completo pelas 5 competências do ENEM em segundos.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Tema da redação</Label>
            <Input
              placeholder="Ex: Os desafios da saúde pública no Brasil"
              value={theme}
              onChange={e => setTheme(e.target.value)}
              className="bg-white/[0.04] border-white/[0.1] focus:border-primary/40 rounded-xl"
            />
            {/* Quick theme suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ENEM_THEMES.slice(0, 3).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                >
                  {t.slice(0, 40)}…
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-muted-foreground">Seu texto</Label>
              <span className={`text-xs ${wordCount >= 150 ? "text-emerald-400" : wordCount >= 10 ? "text-amber-400" : "text-muted-foreground"}`}>
                {wordCount} palavras
              </span>
            </div>
            <Textarea
              placeholder="Digite ou cole sua redação dissertativa aqui..."
              className="min-h-[280px] resize-y bg-white/[0.04] border-white/[0.1] focus:border-primary/40 rounded-xl font-serif text-sm leading-relaxed"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            {/* Writing tips */}
            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground/60">
              {[
                { label: "Introdução",     ok: wordCount >= 80 },
                { label: "2 Argumentos",   ok: wordCount >= 200 },
                { label: "Conclusão",      ok: wordCount >= 280 },
                { label: "250+ palavras",  ok: wordCount >= 250 },
              ].map(tip => (
                <span key={tip.label} className={`flex items-center gap-1 ${tip.ok ? "text-emerald-400" : ""}`}>
                  <CheckCircle2 className={`w-3 h-3 ${tip.ok ? "text-emerald-400" : "text-muted-foreground/30"}`} />
                  {tip.label}
                </span>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/80 text-white gap-2 font-bold shadow-[0_0_20px_rgba(139,92,246,0.25)] transition-all"
            disabled={submitRedacao.isPending || !isReady}
          >
            {submitRedacao.isPending ? (
              <motion.span
                className="flex items-center gap-2"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <BrainCircuit className="w-4 h-4" /> Analisando 5 competências...
              </motion.span>
            ) : (
              <><Send className="w-4 h-4" /> Enviar para Correção IA</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Redacao() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { refetch } = useGetRedacoes();

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Laboratório de Redação</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Correção instantânea pelas 5 competências do ENEM com inteligência artificial.
        </p>
      </div>

      {/* Score legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {[
          { range: "850–1000", label: "Excelente", color: "text-emerald-400" },
          { range: "650–849",  label: "Muito Bom", color: "text-cyan-400" },
          { range: "450–649",  label: "Regular",   color: "text-amber-400" },
          { range: "0–449",    label: "A melhorar", color: "text-rose-400" },
        ].map(s => (
          <span key={s.range} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${s.color.replace("text-", "bg-")}`} />
            <span className={s.color}>{s.range}</span> — {s.label}
          </span>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left: form */}
        <div className="md:col-span-7">
          <SubmissionForm onSubmitted={() => { refetch(); setSelectedId(null); }} />
        </div>

        {/* Right: list + feedback */}
        <div className="md:col-span-5 space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-white/[0.06] pb-3 flex items-center gap-2">
            {selectedId ? (
              <><Star className="w-4 h-4 text-primary" /> Feedback Detalhado</>
            ) : (
              <><BookOpen className="w-4 h-4 text-primary" /> Suas Redações</>
            )}
          </h3>

          <div className="max-h-[700px] overflow-y-auto pr-1 space-y-2">
            <AnimatePresence mode="wait">
              {selectedId ? (
                <FeedbackPanel
                  key={`feedback-${selectedId}`}
                  id={selectedId}
                  onBack={() => setSelectedId(null)}
                />
              ) : (
                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <EssayList onSelect={setSelectedId} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
