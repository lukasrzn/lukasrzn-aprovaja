import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useAiGenerateFlashcards,
  useAiGenerateQuestions,
  useAiGenerateSimulado,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Layers,
  HelpCircle,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Zap,
  Brain,
  Target,
} from "lucide-react";

const SUBJECTS = [
  "Matemática",
  "Física",
  "Química",
  "Biologia",
  "História",
  "Português",
  "Geografia",
  "Filosofia",
  "Sociologia",
  "Inglês",
  "Literatura",
  "Interdisciplinar",
];

const DIFFICULTY_OPTIONS = [
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Médio" },
  { value: "dificil", label: "Difícil" },
];

type Tab = "flashcards" | "questoes" | "simulado";

type ResultState =
  | { kind: "idle" }
  | { kind: "loading"; message: string }
  | { kind: "success"; message: string; action?: { label: string; href: string } }
  | { kind: "error"; message: string };

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  description,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col gap-2 p-4 rounded-xl border text-left transition-all duration-200 ${
        active
          ? `border-primary/60 bg-primary/10 shadow-lg shadow-primary/10`
          : "border-border bg-card/30 hover:bg-card/60 hover:border-border/80"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className={`font-semibold text-sm ${active ? "text-primary" : "text-foreground"}`}>
          {label}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0 rounded-xl ring-1 ring-primary/40"
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
    </button>
  );
}

function ResultBanner({ result }: { result: ResultState }) {
  const [, navigate] = useLocation();
  if (result.kind === "idle") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`flex items-start gap-3 p-4 rounded-xl border ${
          result.kind === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : result.kind === "error"
            ? "bg-red-500/10 border-red-500/20 text-red-400"
            : "bg-primary/10 border-primary/20 text-primary"
        }`}
      >
        {result.kind === "loading" && <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin" />}
        {result.kind === "success" && <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />}
        {result.kind === "error" && <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{result.message}</p>
          {result.kind === "success" && result.action && (
            <button
              onClick={() => navigate(result.action!.href)}
              className="mt-2 text-xs flex items-center gap-1 underline underline-offset-2 opacity-80 hover:opacity-100"
            >
              {result.action.label} <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function FlashcardsPanel() {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState("10");
  const [difficulty, setDifficulty] = useState("medio");
  const [result, setResult] = useState<ResultState>({ kind: "idle" });
  const generate = useAiGenerateFlashcards();

  const handleGenerate = async () => {
    if (!topic.trim() || !subject) return;
    setResult({ kind: "loading", message: "Gerando flashcards com IA..." } as any);
    try {
      const data = await generate.mutateAsync({
        data: {
          topic: topic.trim(),
          subject,
          count: Number(count),
          difficulty,
        },
      });
      setResult({
        kind: "success",
        message: `✓ Deck "${data.deckTitle}" criado com ${data.cardsCreated} flashcards!`,
        action: { label: "Ir para Flashcards", href: "/flashcards" },
      });
    } catch {
      setResult({ kind: "error", message: "Erro ao gerar flashcards. Tente novamente." });
    }
  };

  const isLoading = result.kind === "loading";

  return (
    <div className="space-y-5">
      <ResultBanner result={result} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Matéria</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="bg-card/50">
              <SelectValue placeholder="Selecione a matéria" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tópico / Assunto</Label>
          <Input
            placeholder="Ex: Revolução Francesa, Equações do 2º grau..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="bg-card/50"
          />
        </div>

        <div className="space-y-2">
          <Label>Quantidade de cards</Label>
          <Select value={count} onValueChange={setCount}>
            <SelectTrigger className="bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 8, 10, 15, 20].map(n => (
                <SelectItem key={n} value={String(n)}>{n} cards</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dificuldade</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map(d => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!topic.trim() || !subject || isLoading}
        className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 font-semibold"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando flashcards...</>
        ) : (
          <><Sparkles className="w-4 h-4 mr-2" />Gerar Flashcards com IA</>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        A IA criará um deck completo com perguntas e respostas otimizadas para memorização e revisão espaçada.
      </p>
    </div>
  );
}

function QuestoesPanel() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState("medio");
  const [category, setCategory] = useState("ENEM");
  const [result, setResult] = useState<ResultState>({ kind: "idle" });
  const generate = useAiGenerateQuestions();

  const handleGenerate = async () => {
    if (!topic.trim() || !subject) return;
    setResult({ kind: "loading", message: "Gerando questões com IA..." } as any);
    try {
      const data = await generate.mutateAsync({
        data: {
          subject,
          topic: topic.trim(),
          count: Number(count),
          difficulty,
          category,
        },
      });
      setResult({
        kind: "success",
        message: `✓ ${data.questionsCreated} questões geradas e adicionadas ao banco!`,
        action: { label: "Ir para Praticar", href: "/pratica" },
      });
    } catch {
      setResult({ kind: "error", message: "Erro ao gerar questões. Tente novamente." });
    }
  };

  const isLoading = result.kind === "loading";

  return (
    <div className="space-y-5">
      <ResultBanner result={result} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Matéria</Label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="bg-card/50">
              <SelectValue placeholder="Selecione a matéria" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tópico</Label>
          <Input
            placeholder="Ex: Imperialismo, Leis de Newton..."
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="bg-card/50"
          />
        </div>

        <div className="space-y-2">
          <Label>Quantidade de questões</Label>
          <Select value={count} onValueChange={setCount}>
            <SelectTrigger className="bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3, 5, 8, 10].map(n => (
                <SelectItem key={n} value={String(n)}>{n} questões</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dificuldade</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map(d => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Estilo de prova</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ENEM">ENEM</SelectItem>
              <SelectItem value="Fuvest">Fuvest</SelectItem>
              <SelectItem value="Unicamp">Unicamp</SelectItem>
              <SelectItem value="Concurso Público">Concurso Público</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!topic.trim() || !subject || isLoading}
        className="w-full h-11 bg-gradient-to-r from-violet-600 to-primary hover:opacity-90 font-semibold"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando questões...</>
        ) : (
          <><HelpCircle className="w-4 h-4 mr-2" />Gerar Questões com IA</>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        As questões serão adicionadas ao banco e disponibilizadas na seção Praticar imediatamente.
      </p>
    </div>
  );
}

function SimuladoPanel() {
  const [title, setTitle] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("medio");
  const [qps, setQps] = useState("3");
  const [result, setResult] = useState<ResultState>({ kind: "idle" });
  const [, navigate] = useLocation();
  const generate = useAiGenerateSimulado();

  const toggleSubject = (s: string) => {
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : prev.length < 6 ? [...prev, s] : prev,
    );
  };

  const totalQuestions = selectedSubjects.length * Number(qps);

  const handleGenerate = async () => {
    if (!title.trim() || selectedSubjects.length === 0) return;
    setResult({ kind: "loading", message: "Gerando simulado com IA... isso pode levar alguns segundos." } as any);
    try {
      const data = await generate.mutateAsync({
        data: {
          title: title.trim(),
          subjects: selectedSubjects,
          difficulty,
          questionsPerSubject: Number(qps),
        },
      });
      setResult({
        kind: "success",
        message: `✓ Simulado "${data.title}" criado com ${data.totalQuestions} questões!`,
      });
      setTimeout(() => navigate(`/simulados/${data.simuladoId}`), 1800);
    } catch {
      setResult({ kind: "error", message: "Erro ao gerar simulado. Tente novamente." });
    }
  };

  const isLoading = result.kind === "loading";

  return (
    <div className="space-y-5">
      <ResultBanner result={result} />

      <div className="space-y-2">
        <Label>Título do simulado</Label>
        <Input
          placeholder="Ex: Simulado ENEM Ciências da Natureza 2026"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="bg-card/50"
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Matérias
          <Badge variant="outline" className="text-xs font-normal">
            {selectedSubjects.length}/6 selecionadas
          </Badge>
        </Label>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map(s => {
            const active = selectedSubjects.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSubject(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Questões por matéria</Label>
          <Select value={qps} onValueChange={setQps}>
            <SelectTrigger className="bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5].map(n => (
                <SelectItem key={n} value={String(n)}>{n} questões</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Dificuldade</Label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="bg-card/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_OPTIONS.map(d => (
                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedSubjects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 rounded-lg bg-card/40 border border-border text-sm"
        >
          <span className="text-muted-foreground">Total estimado:</span>
          <span className="font-semibold text-foreground">
            {totalQuestions} questões · ~{Math.round(totalQuestions * 2.5)} min
          </span>
        </motion.div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={!title.trim() || selectedSubjects.length === 0 || isLoading}
        className="w-full h-11 bg-gradient-to-r from-orange-600 to-rose-600 hover:opacity-90 font-semibold"
      >
        {isLoading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando simulado...</>
        ) : (
          <><FileText className="w-4 h-4 mr-2" />Gerar Simulado com IA</>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        A IA gera questões estilo ENEM para cada matéria e monta o simulado pronto para iniciar.
      </p>
    </div>
  );
}

const TABS: { id: Tab; icon: React.ElementType; label: string; description: string; color: string }[] = [
  {
    id: "flashcards",
    icon: Layers,
    label: "Flashcards",
    description: "Crie decks de revisão espaçada",
    color: "bg-blue-500/20 text-blue-400",
  },
  {
    id: "questoes",
    icon: Brain,
    label: "Questões",
    description: "Gere questões estilo ENEM",
    color: "bg-violet-500/20 text-violet-400",
  },
  {
    id: "simulado",
    icon: Target,
    label: "Simulado",
    description: "Monte um simulado completo",
    color: "bg-orange-500/20 text-orange-400",
  },
];

export default function IaConteudo() {
  const [activeTab, setActiveTab] = useState<Tab>("flashcards");

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-1">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gerar com IA</h1>
            <p className="text-muted-foreground text-sm">
              Crie conteúdo de estudo personalizado em segundos
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Zap, label: "Geração instantânea", color: "text-yellow-400" },
          { icon: Brain, label: "IA especializada ENEM", color: "text-blue-400" },
          { icon: CheckCircle, label: "Conteúdo validado", color: "text-emerald-400" },
        ].map(item => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card/30 border border-border text-center"
          >
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className="text-[11px] text-muted-foreground leading-tight">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Tab selector */}
      <div className="grid grid-cols-3 gap-3">
        {TABS.map(tab => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            icon={tab.icon}
            label={tab.label}
            description={tab.description}
            color={tab.color}
          />
        ))}
      </div>

      {/* Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {(() => {
                  const tab = TABS.find(t => t.id === activeTab)!;
                  return (
                    <>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${tab.color}`}>
                        <tab.icon className="w-4 h-4" />
                      </div>
                      Gerar {tab.label}
                    </>
                  );
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {activeTab === "flashcards" && <FlashcardsPanel />}
              {activeTab === "questoes" && <QuestoesPanel />}
              {activeTab === "simulado" && <SimuladoPanel />}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
