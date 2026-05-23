import { useGetDashboardSummary, useGetPerformanceData, useGetGamificationStats, useGetWeakSubjects, useGetTodayMissions, useCompleteMission } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Target, Trophy, Clock, CheckCircle2, TrendingUp, AlertCircle, Zap, Coins } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: performance, isLoading: loadingPerf } = useGetPerformanceData();
  const { data: stats, isLoading: loadingStats } = useGetGamificationStats();
  const { data: weakSubjects, isLoading: loadingWeak } = useGetWeakSubjects();
  const { data: missions, isLoading: loadingMissions, refetch: refetchMissions } = useGetTodayMissions();
  const completeMission = useCompleteMission();
  const { toast } = useToast();

  const handleCompleteMission = (id: number) => {
    completeMission.mutate(
      { id },
      {
        onSuccess: () => {
          toast({
            title: "Missão Concluída!",
            description: "Você ganhou XP e moedas.",
          });
          refetchMissions();
        },
        onError: () => {
          toast({
            title: "Erro",
            description: "Não foi possível completar a missão.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Seu cockpit de desempenho diário.</p>
        </div>
        
        {/* Top Stats Bar */}
        {loadingStats ? (
          <Skeleton className="h-12 w-64 rounded-full" />
        ) : stats ? (
          <div className="flex items-center gap-4 bg-card/50 backdrop-blur-md border border-border px-4 py-2 rounded-full shadow-sm">
            <div className="flex items-center gap-1.5" title="Ofensiva">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-orange-500">{stats.streak}</span>
            </div>
            <div className="w-px h-6 bg-border"></div>
            <div className="flex items-center gap-1.5" title="Nível">
              <Zap className="w-5 h-5 text-primary" />
              <span className="font-bold text-primary">Lvl {stats.level}</span>
            </div>
            <div className="w-px h-6 bg-border"></div>
            <div className="flex items-center gap-1.5" title="Moedas">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-yellow-400">{stats.coins}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40 border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Estudado Hoje</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.studyMinutesToday} min</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +15% em relação a ontem
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questões Resolvidas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.questionsAnsweredToday}</div>
                <p className="text-xs text-muted-foreground mt-1 text-green-400 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> 82% de acerto
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flashcards Revisados</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
             {loadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-2xl font-bold">{summary?.flashcardsReviewedToday}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Faltam 45 para zerar a fila
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Marco</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <>
                <div className="text-xl font-bold truncate" title={summary?.nextMilestone}>{summary?.nextMilestone}</div>
                <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                   <div className="h-full bg-yellow-400 w-[75%]" />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Performance Chart */}
        <Card className="col-span-4 bg-card/30 border-border">
          <CardHeader>
            <CardTitle>Desempenho Semanal</CardTitle>
            <CardDescription>Minutos estudados nos últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            {loadingPerf ? (
              <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-[250px] w-full mx-4" /></div>
            ) : performance ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { weekday: 'short' })}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}m`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="minutesStudied" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorMin)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sem dados disponíveis</div>
            )}
          </CardContent>
        </Card>

        {/* Weak Subjects Radar */}
        <Card className="col-span-3 bg-card/30 border-border">
          <CardHeader>
            <CardTitle>Atenção Prioritária</CardTitle>
            <CardDescription>Assuntos com menor taxa de acerto</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWeak ? (
               <div className="h-[300px] flex items-center justify-center"><Skeleton className="h-[250px] w-[250px] rounded-full" /></div>
            ) : weakSubjects && weakSubjects.length > 0 ? (
              <div className="h-[300px] w-full flex flex-col items-center">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={weakSubjects}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Acertos %" dataKey="score" stroke="hsl(var(--destructive))" strokeWidth={2} fill="hsl(var(--destructive))" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-4 space-y-2">
                  {weakSubjects.slice(0,2).map(ws => (
                    <div key={ws.subject} className="flex items-center justify-between text-sm bg-destructive/10 p-2 rounded border border-destructive/20">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">{ws.subject}</span>
                      </div>
                      <span className="font-bold text-destructive">{ws.score}% acertos</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-xl">
                 <CheckCircle2 className="w-12 h-12 text-primary mb-3" />
                 <p className="text-muted-foreground">Você não tem matérias críticas no momento! Continue o bom trabalho.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Missions */}
      <Card className="bg-card/40 border-border">
        <CardHeader>
          <CardTitle>Missões Diárias</CardTitle>
          <CardDescription>Complete tarefas para ganhar bônus de XP e manter sua ofensiva.</CardDescription>
        </CardHeader>
        <CardContent>
           {loadingMissions ? (
             <div className="space-y-4">
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
               <Skeleton className="h-16 w-full" />
             </div>
           ) : missions && missions.length > 0 ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
               {missions.map((mission) => (
                 <div key={mission.id} className={`p-4 rounded-xl border flex flex-col gap-3 transition-colors ${mission.completed ? 'bg-primary/5 border-primary/20 opacity-70' : 'bg-background border-border hover:border-primary/40'}`}>
                   <div className="flex justify-between items-start">
                     <div className="flex items-center gap-2">
                       <div className={`p-2 rounded-lg ${mission.completed ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {mission.completed ? <CheckCircle2 className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                       </div>
                       <h4 className="font-semibold text-sm">{mission.title}</h4>
                     </div>
                     <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                       <Zap className="w-3 h-3" /> +{mission.xpReward}
                     </div>
                   </div>
                   <p className="text-xs text-muted-foreground">{mission.description}</p>
                   
                   <div className="mt-auto pt-2 space-y-1.5">
                     <div className="flex justify-between text-[10px] text-muted-foreground">
                       <span>Progresso</span>
                       <span>{mission.progress} / {mission.target}</span>
                     </div>
                     <Progress value={(mission.progress / mission.target) * 100} className="h-1.5" />
                   </div>
                   
                   {!mission.completed && mission.progress >= mission.target && (
                     <Button 
                       size="sm" 
                       className="w-full mt-2" 
                       onClick={() => handleCompleteMission(mission.id)}
                       disabled={completeMission.isPending}
                     >
                       Coletar Recompensa
                     </Button>
                   )}
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center p-8 text-muted-foreground">Nenhuma missão disponível hoje.</div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
