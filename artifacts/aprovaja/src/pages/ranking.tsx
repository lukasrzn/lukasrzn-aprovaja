import { useGetGlobalRanking, useGetWeeklyRanking } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Flame, Target, Medal, Crown } from "lucide-react";

export default function Ranking() {
  const { data: globalRanking, isLoading: loadingGlobal } = useGetGlobalRanking();
  const { data: weeklyRanking, isLoading: loadingWeekly } = useGetWeeklyRanking();

  const renderRankingList = (rankingData: any[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[1,2,3,4,5,6,7].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      );
    }

    if (!rankingData || rankingData.length === 0) {
      return <div className="text-center p-8 text-muted-foreground">Nenhum dado disponível.</div>;
    }

    return (
      <div className="space-y-3">
        {rankingData.map((entry) => (
          <div 
            key={entry.userId} 
            className={`flex items-center gap-4 p-4 rounded-xl border ${
              entry.isCurrentUser 
                ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.15)]' 
                : 'bg-card/40 border-border hover:bg-card/60'
            } transition-colors`}
          >
            <div className={`w-8 font-bold text-center ${
              entry.rank === 1 ? 'text-yellow-400 text-xl' :
              entry.rank === 2 ? 'text-gray-300 text-lg' :
              entry.rank === 3 ? 'text-amber-600 text-lg' :
              'text-muted-foreground'
            }`}>
              {entry.rank === 1 ? <Crown className="w-6 h-6 mx-auto fill-yellow-400" /> : `#${entry.rank}`}
            </div>
            
            <Avatar className={`w-12 h-12 border-2 ${entry.isCurrentUser ? 'border-primary' : 'border-transparent'}`}>
              <AvatarImage src={entry.avatarUrl || ""} />
              <AvatarFallback className="bg-muted text-foreground font-semibold">{entry.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-bold truncate ${entry.isCurrentUser ? 'text-primary' : ''}`}>
                  {entry.name}
                </span>
                {entry.isCurrentUser && (
                  <Badge variant="default" className="text-[9px] h-4 px-1.5 bg-primary hover:bg-primary">VOCÊ</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1" title="Objetivo">
                  <Target className="w-3 h-3" /> {entry.goal}
                </span>
                <span className="flex items-center gap-1 text-orange-400/80" title="Ofensiva">
                  <Flame className="w-3 h-3" /> {entry.streak}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-lg">{entry.xp.toLocaleString('pt-BR')} XP</div>
              <div className="text-xs font-semibold text-muted-foreground">Nível {entry.level}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" /> Hall da Fama
          </h2>
          <p className="text-muted-foreground">Compare seu desempenho com os melhores estudantes do Brasil.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-8">
          <Card className="bg-card/30 border-border">
            <Tabs defaultValue="weekly" className="w-full">
              <CardHeader className="pb-0 pt-6 px-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <CardTitle className="text-xl">Ranking</CardTitle>
                    <CardDescription>Estude mais para subir nas posições.</CardDescription>
                  </div>
                  <TabsList className="bg-background/50">
                    <TabsTrigger value="weekly" className="data-[state=active]:bg-primary data-[state=active]:text-white">Semanal</TabsTrigger>
                    <TabsTrigger value="global" className="data-[state=active]:bg-primary data-[state=active]:text-white">Global</TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <TabsContent value="weekly" className="mt-0">
                  {renderRankingList(weeklyRanking || [], loadingWeekly)}
                </TabsContent>
                <TabsContent value="global" className="mt-0">
                  {renderRankingList(globalRanking || [], loadingGlobal)}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        <div className="md:col-span-4 space-y-6">
          <Card className="bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
               <Medal className="w-24 h-24 text-white" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Como subir de ranking?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">1</div>
                <div>
                  <p className="font-semibold text-sm">Cumpra missões diárias</p>
                  <p className="text-xs text-muted-foreground">Rendem bônus massivos de XP.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">2</div>
                <div>
                  <p className="font-semibold text-sm">Mantenha a ofensiva</p>
                  <p className="text-xs text-muted-foreground">Cada dia seguido aumenta o multiplicador de XP.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-0.5">3</div>
                <div>
                  <p className="font-semibold text-sm">Faça simulados</p>
                  <p className="text-xs text-muted-foreground">A maior fonte de XP da plataforma.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border">
            <CardHeader>
              <CardTitle className="text-lg">Sua Posição</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWeekly ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="text-center p-4">
                   <div className="text-4xl font-bold text-primary mb-2">
                     #{weeklyRanking?.find(r => r.isCurrentUser)?.rank || '-'}
                   </div>
                   <p className="text-sm text-muted-foreground">No ranking semanal</p>
                   
                   <div className="mt-6 p-3 bg-background rounded-lg border border-border text-xs text-muted-foreground">
                     Faltam <span className="font-bold text-foreground">{(weeklyRanking?.[(weeklyRanking?.findIndex(r => r.isCurrentUser) || 1) - 1]?.xp || 0) - (weeklyRanking?.find(r => r.isCurrentUser)?.xp || 0)} XP</span> para ultrapassar o próximo competidor.
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
