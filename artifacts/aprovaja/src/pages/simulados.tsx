import { useGetSimulados, useGetRecentSimuladoResults } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Play, Clock, BarChart2, Star, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Simulados() {
  const { data: simulados, isLoading: loadingSimulados } = useGetSimulados();
  const { data: results, isLoading: loadingResults } = useGetRecentSimuladoResults();

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Simulados ENEM 2026</h2>
          <p className="text-muted-foreground">Treine com provas no estilo ENEM 2026. Ganhe resistência, precisão e domine cada área de conhecimento.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column - Available Exams */}
        <div className="md:col-span-8 space-y-6">
          <h3 className="text-xl font-bold border-b border-border pb-2">Provas Disponíveis</h3>
          
          <div className="space-y-4">
            {loadingSimulados ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : simulados && simulados.length > 0 ? (
              simulados.filter(s => !s.completedAt).map(simulado => (
                <Card key={simulado.id} className="bg-card/40 border-border hover:border-accent/40 transition-all group overflow-hidden">
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
                            <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-xs">
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
                        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                          <Play className="w-4 h-4" /> Começar Agora
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-xl bg-card/20">
                Nenhum simulado novo disponível.
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Recent Results */}
        <div className="md:col-span-4 space-y-6">
          <h3 className="text-xl font-bold border-b border-border pb-2">Últimos Resultados</h3>
          
          <div className="space-y-4">
            {loadingResults ? (
               [1,2].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
            ) : results && results.length > 0 ? (
              results.map(result => (
                <Card key={result.id} className="bg-card/40 border-border relative overflow-hidden">
                  {result.score >= 80 && (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="bg-yellow-500 text-yellow-950 text-[10px] font-bold py-1 px-4 transform rotate-45 translate-x-3 translate-y-2 text-center w-24">
                        TOP
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">{new Date(result.completedAt).toLocaleDateString('pt-BR')}</CardDescription>
                    <CardTitle className="text-lg leading-tight line-clamp-1">{result.simuladoTitle}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-3xl font-bold text-primary">{result.score}%</span>
                      <span className="text-sm text-muted-foreground pb-1">acertos</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Questões: {result.correctCount}/{result.totalCount}</span>
                        <span className="flex items-center gap-1 text-primary"><Star className="w-3 h-3 fill-primary" /> +{result.xpEarned} XP</span>
                      </div>
                      <Progress value={result.score} className="h-2" />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                     <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground">
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
    </div>
  );
}
