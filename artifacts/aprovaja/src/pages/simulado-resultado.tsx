import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import type { SimuladoResult } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Trophy, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  BarChart3, Star, Zap, BookOpen, ArrowRight, RotateCcw
} from "lucide-react";

function CircleScore({ value, max = 1000 }: { value: number; max?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const pct = value / max;
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  useEffect(() => {
    let start = 0;
    const step = value / 60;
    const id = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(id); return; }
      setDisplayed(Math.round(start));
    }, 16);
    return () => clearInterval(id);
  }, [value]);

  const color = value >= 700 ? "#22c55e" : value >= 500 ? "#eab308" : "#ef4444";

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
        <motion.circle
          cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-4xl font-black" style={{ color }}>{displayed}</div>
        <div className="text-xs text-muted-foreground">de {max} pts</div>
      </div>
    </div>
  );
}

export default function SimuladoResultado() {
  const { id, resultId } = useParams<{ id: string; resultId: string }>();
  const [, navigate] = useLocation();
  const [result, setResult] = useState<SimuladoResult | null>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(`simulado_result_${resultId}`);
    if (stored) {
      try { setResult(JSON.parse(stored)); } catch {}
    }
  }, [resultId]);

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-xl font-bold">Resultado não encontrado</p>
          <p className="text-muted-foreground text-sm">Os dados do simulado expiraram.</p>
          <Button onClick={() => navigate("/simulados")}>Ir para Simulados</Button>
        </div>
      </div>
    );
  }

  const triScore = result.triScore ?? Math.round(result.score * 9 + 100);
  const isApproved = triScore >= 600;

  const chartData = (result.subjectBreakdown ?? []).map((s) => ({
    name: s.subject.length > 8 ? s.subject.slice(0, 8) + "…" : s.subject,
    fullName: s.subject,
    score: s.score,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Confetti if approved */}
      {isApproved && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="absolute animate-confetti" style={{
              left: `${Math.random() * 100}%`,
              top: `-10px`,
              width: `${Math.random() * 10 + 6}px`,
              height: `${Math.random() * 10 + 6}px`,
              background: ["#7c3aed","#06b6d4","#22c55e","#eab308","#ec4899"][i % 5],
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
            }} />
          ))}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-2">
            <Trophy className="w-4 h-4" /> Resultado do Simulado
          </div>
          <h1 className="text-3xl md:text-4xl font-black">{result.simuladoTitle}</h1>
        </motion.div>

        {/* Score + stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-1 flex flex-col items-center gap-4 bg-card/60 border border-border rounded-2xl p-6"
          >
            <CircleScore value={triScore} />
            <div className="text-center">
              <p className="font-bold text-lg">{isApproved ? "🎉 Aprovado!" : "Continue treinando!"}</p>
              <p className="text-sm text-muted-foreground">
                {result.correctCount}/{result.totalCount} acertos ({result.score}%)
              </p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" as const }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30"
            >
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-black text-yellow-400 text-xl">+{result.xpEarned} XP</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 bg-card/60 border border-border rounded-2xl p-6"
          >
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Desempenho por Matéria
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#888" }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                    formatter={(v: number, _: string, entry: any) => [`${v}%`, entry.payload.fullName]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.score >= 70 ? "#22c55e" : entry.score >= 50 ? "#eab308" : "#ef4444"}
                        opacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
                Dados de desempenho indisponíveis
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Acertos", value: `${result.correctCount}/${result.totalCount}`, icon: CheckCircle2, color: "text-green-400" },
            { label: "Aproveitamento", value: `${result.score}%`, icon: Star, color: "text-yellow-400" },
            { label: "Tempo gasto", value: `${result.timeSpentMinutes} min`, icon: Zap, color: "text-blue-400" },
            { label: "Nota TRI", value: String(triScore), icon: Trophy, color: "text-primary" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="bg-card/60 border border-border rounded-xl p-4 flex flex-col items-center gap-2 text-center"
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div className="text-xl font-black">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Question review */}
        {result.questionResults && result.questionResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Gabarito Comentado
            </h3>
            <div className="space-y-2">
              {result.questionResults.map((qr, i) => (
                <motion.div
                  key={qr.questionId}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`rounded-xl border overflow-hidden ${
                    qr.isCorrect ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <button
                    onClick={() => setExpandedQ(expandedQ === qr.questionId ? null : qr.questionId)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {qr.isCorrect
                        ? <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      }
                      <div>
                        <span className="font-semibold text-sm">Questão {i + 1}</span>
                        <span className="text-muted-foreground text-xs ml-2">— {qr.topic}</span>
                      </div>
                      <Badge variant="secondary" className="hidden sm:inline-flex text-xs">{qr.subject}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        Você: <span className={qr.isCorrect ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{qr.selectedAlternative}</span>
                        {" · "}Gabarito: <span className="text-green-400 font-bold">{qr.correctAnswer}</span>
                      </span>
                      {expandedQ === qr.questionId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  {expandedQ === qr.questionId && (
                    <div className="px-4 pb-4 border-t border-border/40 pt-3">
                      <div className="flex gap-4 text-sm mb-3">
                        <span>Sua resposta: <Badge variant={qr.isCorrect ? "default" : "destructive"}>{qr.selectedAlternative}</Badge></span>
                        <span>Gabarito: <Badge className="bg-green-500/20 text-green-400 border-green-500/40">{qr.correctAnswer}</Badge></span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{qr.explanation}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center pt-4">
          <Button variant="outline" onClick={() => navigate(`/simulados`)} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Novo Simulado
          </Button>
          <Button variant="outline" onClick={() => navigate("/ranking")} className="gap-2">
            <Trophy className="w-4 h-4" /> Ver Ranking
          </Button>
          <Button onClick={() => navigate("/pratica")} className="gap-2 bg-primary hover:bg-primary/90">
            <ArrowRight className="w-4 h-4" /> Praticar Matérias Fracas
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti-fall linear infinite;
        }
      `}</style>
    </div>
  );
}
