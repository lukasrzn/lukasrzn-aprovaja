import { useGetTodayMissions, useCompleteMission } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, Zap, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Missoes() {
  const { data: missions, isLoading, refetch } = useGetTodayMissions();
  const completeMission = useCompleteMission();
  const { toast } = useToast();

  const handleCompleteMission = (id: number) => {
    completeMission.mutate(
      { id },
      {
        onSuccess: () => {
          toast({
            title: "Missão Concluída! 🎉",
            description: "Recompensas adicionadas à sua conta.",
          });
          refetch();
        },
        onError: () => {
          toast({
            title: "Ops!",
            description: "Algo deu errado ao coletar sua recompensa.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const completedCount = missions?.filter(m => m.completed).length || 0;
  const totalCount = missions?.length || 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Missões Diárias</h2>
          <p className="text-muted-foreground">Complete tarefas para acelerar sua evolução.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-card/40 border border-border px-4 py-2 rounded-full">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Reseta à meia-noite</span>
        </div>
      </div>

      {/* Daily Progress Banner */}
      <Card className="bg-card/40 border-border overflow-hidden relative">
        {allCompleted && (
           <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 pointer-events-none animate-gradient bg-300%"></div>
        )}
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
               <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                 <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                 <circle 
                   cx="50" cy="50" r="45" fill="none" 
                   stroke={allCompleted ? "hsl(var(--accent))" : "hsl(var(--primary))"} 
                   strokeWidth="8" 
                   strokeLinecap="round"
                   strokeDasharray="283"
                   strokeDashoffset={283 - (283 * progressPercent) / 100}
                   className="transition-all duration-1000 ease-out"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-3xl font-bold">{completedCount}/{totalCount}</span>
               </div>
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-2xl font-bold">
                {allCompleted ? "Todas as missões concluídas!" : "Status do dia"}
              </h3>
              <p className="text-muted-foreground text-lg">
                {allCompleted 
                  ? "Você é uma máquina! Volte amanhã para novos desafios e recompensas." 
                  : `Você já completou ${completedCount} de ${totalCount} missões hoje. Continue o ritmo!`}
              </p>
              
              {allCompleted && (
                <div className="inline-flex items-center gap-2 bg-accent/20 text-accent font-bold px-4 py-2 rounded-lg mt-4 border border-accent/30">
                  <Zap className="w-5 h-5" /> Bônus de conclusão diária ativado!
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {isLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : missions && missions.length > 0 ? (
          missions.map(mission => {
            const isReadyToCollect = !mission.completed && mission.progress >= mission.target;
            
            return (
              <Card key={mission.id} className={`overflow-hidden transition-all ${
                mission.completed ? 'bg-primary/5 border-primary/20 opacity-60' : 
                isReadyToCollect ? 'bg-accent/5 border-accent shadow-[0_0_15px_rgba(var(--accent),0.15)]' : 
                'bg-card/40 border-border hover:border-primary/40'
              }`}>
                <CardContent className="p-0 sm:flex items-stretch">
                  <div className={`p-6 flex items-center justify-center sm:w-24 border-b sm:border-b-0 sm:border-r ${
                     mission.completed ? 'bg-primary/10 border-primary/20' :
                     isReadyToCollect ? 'bg-accent/10 border-accent/20' :
                     'bg-muted/30 border-border'
                  }`}>
                    {mission.completed ? (
                      <CheckCircle2 className="w-10 h-10 text-primary" />
                    ) : (
                      <div className="text-4xl">{mission.icon}</div>
                    )}
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-lg">{mission.title}</h4>
                      <p className="text-muted-foreground text-sm">{mission.description}</p>
                      
                      {!mission.completed && (
                        <div className="mt-4 pt-2 max-w-sm">
                          <div className="flex justify-between text-xs mb-1.5 font-medium">
                            <span className={isReadyToCollect ? 'text-accent' : 'text-muted-foreground'}>
                              Progresso: {mission.progress}/{mission.target}
                            </span>
                            <span className={isReadyToCollect ? 'text-accent' : 'text-muted-foreground'}>
                              {Math.round((mission.progress/mission.target)*100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(mission.progress / mission.target) * 100} 
                            className={`h-2 ${isReadyToCollect ? '[&>div]:bg-accent bg-accent/20' : ''}`} 
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 font-bold px-3 py-1">
                           <Zap className="w-3.5 h-3.5 fill-primary" /> +{mission.xpReward} XP
                         </Badge>
                      </div>
                      
                      {isReadyToCollect && (
                        <Button 
                          className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-[0_0_15px_rgba(var(--accent),0.3)] animate-pulse"
                          onClick={() => handleCompleteMission(mission.id)}
                          disabled={completeMission.isPending}
                        >
                          {completeMission.isPending ? "Coletando..." : "Coletar Recompensa"}
                        </Button>
                      )}
                      
                      {!mission.completed && !isReadyToCollect && (
                        <Button variant="secondary" className="bg-secondary/50 text-secondary-foreground" disabled>
                          Em andamento
                        </Button>
                      )}
                      
                      {mission.completed && (
                        <Button variant="outline" className="border-primary/30 text-primary cursor-default hover:bg-transparent" disabled>
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Concluída
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center p-12 border border-dashed border-border rounded-xl bg-card/20">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">Sem missões para hoje</h3>
            <p className="text-muted-foreground">Volte amanhã para novos desafios.</p>
          </div>
        )}
      </div>
    </div>
  );
}
