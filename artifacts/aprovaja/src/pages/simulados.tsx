import { useState } from "react";
import { useGetSimulados, useGetRecentSimuladoResults, useCreateSimulado } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Play, Clock, BarChart2, Star, Target, Plus, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Simulados() {
  const { data: simulados, isLoading: loadingSimulados, refetch } = useGetSimulados();
  const { data: results, isLoading: loadingResults } = useGetRecentSimuladoResults();
  const createSimulado = useCreateSimulado();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("Meu Simulado ENEM 2026");
  const [newType, setNewType] = useState("ENEM");
  const [newDifficulty, setNewDifficulty] = useState("medio");
  const [newCount, setNewCount] = useState("10");

  const handleCreate = () => {
    createSimulado.mutate(
      { data: { title: newTitle, type: newType, difficulty: newDifficulty, questionCount: parseInt(newCount, 10) } },
      {
        onSuccess: (created) => {
          toast({ title: "Simulado criado!", description: "Iniciando sua prova…" });
          setDialogOpen(false);
          refetch();
          navigate(`/simulados/${created.id}/exam`);
        },
        onError: () => toast({ title: "Erro ao criar simulado", variant: "destructive" }),
      }
    );
  };

  const pending = (simulados ?? []).filter((s) => !s.completedAt);
  const completed = (simulados ?? []).filter((s) => s.completedAt);

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Simulados ENEM 2026</h2>
          <p className="text-muted-foreground">
            Treine com provas adaptadas no estilo ENEM 2026. Ganhe XP, suba no ranking.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Novo Simulado
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left — Available Exams */}
        <div className="md:col-span-8 space-y-6">
          <h3 className="text-xl font-bold border-b border-border pb-2">Provas Disponíveis</h3>

          <div className="space-y-4">
            {loadingSimulados ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : pending.length > 0 ? (
              pending.map((simulado) => (
                <Card
                  key={simulado.id}
                  className="bg-card/40 border-border hover:border-accent/40 transition-all group overflow-hidden"
                >
                  <CardContent className="p-0 sm:flex items-stretch">
                    <div className="bg-accent/10 sm:w-48 p-6 flex flex-col justify-center items-center text-center border-b sm:border-b-0 sm:border-r border-border group-hover:bg-accent/20 transition-colors">
                      <FileText className="w-10 h-10 text-accent mb-2" />
                      <div className="font-bold tracking-wider">{simulado.type}</div>
                      <Badge variant="outline" className="mt-2 bg-background/50 text-[10px]">
                        {simulado.difficulty.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-xl font-bold">{simulado.title}</h4>
                          {simulado.subject && (
                            <Badge variant="secondary" className="text-xs">
                              {simulado.subject}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                          <span className="flex items-center gap-1.5">
                            <Target className="w-4 h-4" /> {simulado.questionCount} questões
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> {simulado.durationMinutes} min
                          </span>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <Button
                          onClick={() => navigate(`/simulados/${simulado.id}/exam`)}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                        >
                          <Play className="w-4 h-4" /> Iniciar Prova
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-10 text-muted-foreground border border-dashed border-border rounded-xl bg-card/20">
                <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum simulado pendente.</p>
                <p className="text-sm mt-1">Crie um novo para começar a praticar!</p>
              </div>
            )}
          </div>

          {/* Completed */}
          {completed.length > 0 && (
            <>
              <h3 className="text-xl font-bold border-b border-border pb-2 pt-2">Concluídos</h3>
              <div className="space-y-3">
                {completed.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-card/30 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.questionCount} questões · {s.durationMinutes} min</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.score !== null && s.score !== undefined && (
                        <Badge
                          className={s.score >= 70 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}
                          variant="outline"
                        >
                          {s.score}%
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/simulados/${s.id}/exam`)}
                        className="text-xs"
                      >
                        Refazer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right — Recent Results */}
        <div className="md:col-span-4 space-y-6">
          <h3 className="text-xl font-bold border-b border-border pb-2">Últimos Resultados</h3>

          <div className="space-y-4">
            {loadingResults ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
            ) : results && results.length > 0 ? (
              results.slice(-5).reverse().map((result) => (
                <Card key={result.id} className="bg-card/40 border-border relative overflow-hidden">
                  {result.score >= 80 && (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="bg-yellow-500 text-yellow-950 text-[10px] font-bold py-1 px-4 transform rotate-45 translate-x-3 translate-y-2 text-center w-24">
                        TOP
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">
                      {new Date(result.completedAt).toLocaleDateString("pt-BR")}
                    </CardDescription>
                    <CardTitle className="text-lg leading-tight line-clamp-1">
                      {result.simuladoTitle}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-3xl font-bold text-primary">{result.score}%</span>
                      <span className="text-sm text-muted-foreground pb-1">acertos</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Questões: {result.correctCount}/{result.totalCount}</span>
                        <span className="flex items-center gap-1 text-primary">
                          <Star className="w-3 h-3 fill-primary" /> +{result.xpEarned} XP
                        </span>
                      </div>
                      <Progress value={result.score} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => navigate(`/simulados/${result.simuladoId}/resultado/${result.id}`)}
                    >
                      <BarChart2 className="w-3 h-3 mr-2" /> Ver Relatório Completo
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-xl bg-card/20">
                Você ainda não concluiu nenhum simulado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Simulado Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-accent" /> Criar Novo Simulado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Simulado ENEM 2026 - Ciências da Natureza"
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENEM">ENEM</SelectItem>
                    <SelectItem value="Vestibular">Vestibular</SelectItem>
                    <SelectItem value="Concurso">Concurso Público</SelectItem>
                    <SelectItem value="Personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dificuldade</Label>
                <Select value={newDifficulty} onValueChange={setNewDifficulty}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facil">Fácil</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="dificil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Número de questões</Label>
              <Select value={newCount} onValueChange={setNewCount}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 questões (~12 min)</SelectItem>
                  <SelectItem value="10">10 questões (~25 min)</SelectItem>
                  <SelectItem value="15">15 questões (~37 min)</SelectItem>
                  <SelectItem value="20">20 questões (~50 min)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={createSimulado.isPending || !newTitle.trim()}
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              {createSimulado.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Criar e Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
