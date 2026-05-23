import { useGetStudyPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar as CalendarIcon, Clock, BookOpen, Target, Play } from "lucide-react";

export default function StudyPlans() {
  const { data: plans, isLoading } = useGetStudyPlans();

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Plano de Estudos</h2>
          <p className="text-muted-foreground">Seus cronogramas gerados com IA.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_rgba(var(--primary),0.3)]">
          <Plus className="mr-2 h-4 w-4" /> Novo Plano
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-[250px] rounded-xl" />
            <Skeleton className="h-[250px] rounded-xl" />
          </>
        ) : plans && plans.length > 0 ? (
          plans.map(plan => (
            <Card key={plan.id} className="bg-card/40 border-border hover:border-primary/50 transition-colors flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors"></div>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <Target className="w-3 h-3 mr-1" /> {plan.goal}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {plan.targetDate ? new Date(plan.targetDate).toLocaleDateString('pt-BR') : 'Sem data'}
                  </div>
                </div>
                <CardTitle className="text-xl">{plan.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Clock className="w-4 h-4" /> {plan.hoursPerDay}h por dia
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Progresso Global</span>
                    <span className="text-primary">{plan.progress}%</span>
                  </div>
                  <Progress value={plan.progress} className="h-2 bg-muted/50" />
                </div>
                
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Foco principal</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.subjects.slice(0,3).map(subject => (
                      <Badge key={subject} variant="secondary" className="bg-secondary/50 text-secondary-foreground text-xs font-normal">
                        {subject}
                      </Badge>
                    ))}
                    {plan.subjects.length > 3 && (
                      <Badge variant="secondary" className="bg-secondary/50 text-xs font-normal">
                        +{plan.subjects.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border">
                <Button className="w-full gap-2" variant="secondary">
                  <Play className="w-4 h-4" /> Iniciar Sessão de Hoje
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
             <Card className="bg-card/20 border-dashed border-2 border-border text-center py-12">
               <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                 <BookOpen className="w-8 h-8 text-primary" />
               </div>
               <h3 className="text-xl font-bold mb-2">Nenhum plano ativo</h3>
               <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                 A inteligência artificial do AprovaJá pode criar um cronograma perfeito focado nos assuntos que mais caem no seu objetivo.
               </p>
               <Button>Gerar Meu Primeiro Plano</Button>
             </Card>
          </div>
        )}
      </div>
    </div>
  );
}
