import { useGetRedacoes, useSubmitRedacao } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PenTool, BrainCircuit, CheckCircle2, ChevronRight, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Redacao() {
  const { data: redacoes, isLoading: loadingRedacoes, refetch } = useGetRedacoes();
  const submitRedacao = useSubmitRedacao();
  const { toast } = useToast();
  
  const [theme, setTheme] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!theme || !content) return;
    
    submitRedacao.mutate(
      { data: { theme, content } },
      {
        onSuccess: () => {
          toast({
            title: "Redação enviada!",
            description: "A inteligência artificial já está corrigindo seu texto.",
          });
          setTheme("");
          setContent("");
          refetch();
        },
        onError: () => {
          toast({
            title: "Erro",
            description: "Não foi possível enviar a redação. Tente novamente.",
            variant: "destructive",
          });
        }
      }
    );
  };

  const completed = redacoes?.filter(r => r.score !== null) || [];
  const pending = redacoes?.filter(r => r.score === null) || [];

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laboratório de Redação</h2>
          <p className="text-muted-foreground">Correção instantânea pelos critérios do ENEM utilizando IA.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column - Submission Form */}
        <div className="md:col-span-7 space-y-6">
          <Card className="bg-card/40 border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <BrainCircuit className="w-32 h-32 text-primary" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-primary" /> Nova Redação
              </CardTitle>
              <CardDescription>Cole seu texto abaixo. O feedback detalhado sai em até 5 segundos.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme" className="text-foreground">Tema da Redação</Label>
                  <Input 
                    id="theme" 
                    placeholder="Ex: Os desafios da saúde pública no Brasil contemporâneo" 
                    value={theme}
                    onChange={e => setTheme(e.target.value)}
                    className="bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="content" className="text-foreground">Seu Texto</Label>
                    <span className="text-xs text-muted-foreground">{content.split(/\s+/).filter(w => w.length > 0).length} palavras</span>
                  </div>
                  <Textarea 
                    id="content" 
                    placeholder="Digite ou cole sua redação aqui..." 
                    className="min-h-[300px] resize-y bg-background border-border font-serif text-sm leading-relaxed"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white gap-2 font-bold h-12 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                  disabled={submitRedacao.isPending || !theme || content.length < 50}
                >
                  {submitRedacao.isPending ? "Analisando..." : <><Send className="w-4 h-4" /> Enviar para Correção IA</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - History */}
        <div className="md:col-span-5 space-y-6">
          <h3 className="text-xl font-bold border-b border-border pb-2">Suas Redações</h3>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingRedacoes ? (
              [1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : redacoes && redacoes.length > 0 ? (
              <>
                {pending.length > 0 && (
                   <div className="mb-4 space-y-3">
                     <p className="text-xs font-semibold text-muted-foreground uppercase">Corrigindo agora</p>
                     {pending.map(r => (
                       <Card key={r.id} className="bg-card/20 border-primary/30 animate-pulse">
                         <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm line-clamp-1">{r.theme}</p>
                              <p className="text-xs text-primary mt-1">Analisando competências...</p>
                            </div>
                            <BrainCircuit className="w-5 h-5 text-primary" />
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                )}
                
                {completed.map(redacao => (
                  <Card key={redacao.id} className="bg-card/40 border-border hover:border-muted-foreground/30 transition-colors cursor-pointer group">
                    <CardContent className="p-5 flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline" className={redacao.score && redacao.score >= 800 ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-muted text-muted-foreground"}>
                            {redacao.score} / {redacao.maxScore}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{new Date(redacao.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <h4 className="font-bold text-sm leading-snug line-clamp-2 mt-2 group-hover:text-primary transition-colors">
                          {redacao.theme}
                        </h4>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        <span>Ver feedback detalhado</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <div className="text-center p-8 text-muted-foreground border border-dashed border-border rounded-xl bg-card/20">
                <PenTool className="w-8 h-8 mx-auto mb-3 opacity-20" />
                Nenhuma redação enviada ainda. Escreva seu primeiro texto e descubra sua nota!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
