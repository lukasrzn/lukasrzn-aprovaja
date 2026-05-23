import { useGetFlashcards } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Layers, Plus, Play, Brain, CheckCircle } from "lucide-react";

export default function Flashcards() {
  const { data: decks, isLoading } = useGetFlashcards();

  return (
    <div className="flex-1 space-y-8 p-6 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Flashcards</h2>
          <p className="text-muted-foreground">Repetição espaçada inteligente. Domine conceitos para sempre.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] gap-2">
          <Plus className="w-4 h-4" /> Novo Baralho
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 border-y border-border py-6 bg-card/10">
        <div className="flex flex-col items-center text-center px-4 border-r border-border">
          <span className="text-3xl font-bold text-foreground">
            {decks?.reduce((acc, d) => acc + d.cardCount, 0) || 0}
          </span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Cards Totais</span>
        </div>
        <div className="flex flex-col items-center text-center px-4 border-r border-border">
          <span className="text-3xl font-bold text-orange-500">
            {decks?.reduce((acc, d) => acc + d.dueCount, 0) || 0}
          </span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Para Revisar</span>
        </div>
        <div className="flex flex-col items-center text-center px-4">
          <span className="text-3xl font-bold text-green-500">
            {decks?.reduce((acc, d) => acc + d.masteredCount, 0) || 0}
          </span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">Dominados</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-[280px] rounded-xl" />)
        ) : decks && decks.length > 0 ? (
          decks.map(deck => (
            <Card key={deck.id} className="bg-card/40 border-border hover:border-blue-500/50 transition-colors flex flex-col group relative">
              {deck.dueCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-background z-10">
                  {deck.dueCount}
                </div>
              )}
              <CardHeader className="pb-3 border-b border-border bg-card/20">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-blue-500" />
                  </div>
                  <Badge variant="outline" className="bg-background text-xs">
                    {deck.subject}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight mt-2">{deck.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pt-4 pb-2">
                <div className="flex items-center justify-between text-sm mb-2 text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Brain className="w-3 h-3" /> Aprendizado</span>
                  <span>{Math.round((deck.masteredCount / (deck.cardCount || 1)) * 100)}%</span>
                </div>
                <Progress value={(deck.masteredCount / (deck.cardCount || 1)) * 100} className="h-1.5 bg-muted mb-6" />
                
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="bg-background rounded p-2 text-center border border-border">
                    <div className="font-bold text-foreground text-sm">{deck.cardCount}</div>
                    <div>Cards</div>
                  </div>
                  <div className="bg-background rounded p-2 text-center border border-border">
                    <div className="font-bold text-green-500 text-sm flex justify-center items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {deck.masteredCount}
                    </div>
                    <div>Dominados</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button 
                  className={`w-full gap-2 ${deck.dueCount > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                  disabled={deck.cardCount === 0}
                >
                  <Play className="w-4 h-4" /> 
                  {deck.dueCount > 0 ? `Revisar ${deck.dueCount} cards` : 'Estudar Livre'}
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card className="bg-card/20 border-dashed border-2 border-border text-center py-16">
              <div className="mx-auto w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <Layers className="w-10 h-10 text-blue-500 opacity-80" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sua memória está vazia</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Crie seu primeiro baralho de flashcards para memorizar fórmulas, datas históricas, vocabulário ou conceitos-chave.
              </p>
              <Button className="bg-blue-600 text-white hover:bg-blue-700 gap-2">
                <Plus className="w-4 h-4" /> Criar Primeiro Baralho
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
