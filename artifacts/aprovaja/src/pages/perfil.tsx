import { useGetMe, useGetGamificationStats, useGetMedals } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Settings, Target, Flame, Zap, Clock, Medal as MedalIcon, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Perfil() {
  const { data: user, isLoading: loadingUser } = useGetMe();
  const { data: stats, isLoading: loadingStats } = useGetGamificationStats();
  const { data: medals, isLoading: loadingMedals } = useGetMedals();

  const getRarityColor = (rarity: string) => {
    switch(rarity.toLowerCase()) {
      case 'legendary': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10 shadow-[0_0_15px_rgba(250,204,21,0.3)]';
      case 'epic': return 'text-purple-400 border-purple-400 bg-purple-400/10 shadow-[0_0_10px_rgba(192,132,252,0.2)]';
      case 'rare': return 'text-blue-400 border-blue-400 bg-blue-400/10';
      default: return 'text-zinc-400 border-zinc-500 bg-zinc-500/10';
    }
  };

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8 pt-6 max-w-6xl mx-auto">
      {/* Header Profile Section */}
      <div className="relative rounded-2xl overflow-hidden mb-8">
        <div className="h-48 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/20 w-full relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBIMVYxSDBaTTIgMEgzVjFIMlpNMSAxSDJWMkgxWk0zIDFINFYySDNaTTAgMkgxVjNIMFpNMiAySDNWM0gyWk0xIDNIMlY0SDFaTTMgM0g0VjRIM1oiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-50 mix-blend-overlay"></div>
        </div>
        
        <div className="bg-card/80 backdrop-blur-xl border-x border-b border-border px-8 pb-8 pt-0 flex flex-col md:flex-row items-center md:items-end md:justify-between gap-6 relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 relative z-10">
            {loadingUser ? (
              <Skeleton className="w-32 h-32 rounded-full border-4 border-background" />
            ) : (
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-background shadow-xl shadow-black/50">
                  <AvatarImage src={user?.avatarUrl || ""} />
                  <AvatarFallback className="text-4xl bg-primary/20 text-primary font-bold">
                    {user?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {stats && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-white font-bold text-sm px-3 py-1 rounded-full border-2 border-background shadow-lg whitespace-nowrap">
                    Nível {stats.level}
                  </div>
                )}
              </div>
            )}
            
            <div className="text-center md:text-left pb-2">
              {loadingUser ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold">{user?.name}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                    <Badge variant="outline" className="bg-background border-border text-muted-foreground">
                      <Target className="w-3 h-3 mr-1" /> {user?.goal}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Membro desde {new Date(user?.createdAt || Date.now()).getFullYear()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="pb-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Edit2 className="w-4 h-4" /> Editar Perfil
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Stats Column */}
        <div className="md:col-span-4 space-y-6">
          <Card className="bg-card/40 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Estatísticas Vitais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingStats ? (
                <div className="space-y-4">
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
                </div>
              ) : stats ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Experiência</span>
                      <span className="font-bold">{stats.xp} XP</span>
                    </div>
                    <Progress value={(stats.xp / (stats.xp + stats.xpToNextLevel)) * 100} className="h-2" />
                    <p className="text-xs text-right text-muted-foreground">Faltam {stats.xpToNextLevel} para o Nível {stats.level + 1}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background/50 p-3 rounded-lg border border-border flex flex-col items-center justify-center text-center">
                      <Flame className="w-6 h-6 text-orange-500 mb-1" />
                      <span className="font-bold text-xl">{stats.streak}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Dias Seguidos</span>
                    </div>
                    <div className="bg-background/50 p-3 rounded-lg border border-border flex flex-col items-center justify-center text-center">
                      <Clock className="w-6 h-6 text-blue-500 mb-1" />
                      <span className="font-bold text-xl">{Math.floor(stats.totalStudyMinutes / 60)}h</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Tempo Total</span>
                    </div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
          
          <Card className="bg-card/40 border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Configurações</CardTitle>
              <Settings className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                 Preferências de Notificação
              </Button>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                 Privacidade
              </Button>
              <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
                 Sair da Conta
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Medals Showcase */}
        <div className="md:col-span-8">
          <Card className="bg-card/40 border-border h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <MedalIcon className="w-6 h-6 text-yellow-400" /> Suas Conquistas
                  </CardTitle>
                  <CardDescription>Coleção de medalhas desbloqueadas durante seus estudos.</CardDescription>
                </div>
                {stats && (
                  <Badge variant="secondary" className="bg-secondary/50 text-base py-1">
                    {stats.medalsEarned} / {medals?.length || 0}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingMedals ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
                </div>
              ) : medals && medals.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {medals.map((medal) => (
                    <div 
                      key={medal.id} 
                      className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-4 text-center transition-all ${
                        medal.earned 
                          ? `border-2 bg-card ${getRarityColor(medal.rarity)}` 
                          : 'border border-dashed border-border/50 bg-background/30 opacity-50 grayscale'
                      }`}
                    >
                      <div className="text-4xl mb-2">{medal.icon}</div>
                      <h4 className="font-bold text-sm leading-tight mb-1 text-foreground">{medal.name}</h4>
                      <p className="text-[10px] text-muted-foreground leading-tight">{medal.description}</p>
                      
                      {medal.earned && medal.earnedAt && (
                         <div className="absolute bottom-2 text-[8px] font-mono text-muted-foreground">
                           {new Date(medal.earnedAt).toLocaleDateString('pt-BR')}
                         </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 text-muted-foreground border border-dashed border-border rounded-xl">
                  Nenhuma medalha carregada.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
