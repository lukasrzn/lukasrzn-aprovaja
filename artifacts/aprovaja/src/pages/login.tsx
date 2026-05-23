import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sucesso!",
        description: "Bem-vindo de volta ao seu cockpit de estudos.",
      });
      setLocation("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBIMVYxSDBaTTIgMEgzVjFIMlpNMSAxSDJWMkgxWk0zIDFINFYySDNaTTAgMkgxVjNIMFpNMiAySDNWM0gyWk0xIDNIMlY0SDFaTTMgM0g0VjRIM1oiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] pointer-events-none opacity-[0.03]"></div>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none blur-[100px]"></div>
      
      <Link href="/" className="flex items-center gap-2 mb-8 relative z-10 cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.5)]">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          AprovaJá
        </span>
      </Link>

      <Card className="w-full max-w-md bg-card/60 backdrop-blur-xl border-white/10 shadow-2xl relative z-10">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-t-lg rounded-b-none bg-muted/50 p-0 h-14">
            <TabsTrigger value="login" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full data-[state=active]:shadow-none font-semibold">
              Entrar
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full data-[state=active]:shadow-none font-semibold">
              Cadastrar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="m-0">
            <form onSubmit={handleAuth}>
              <CardHeader>
                <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
                <CardDescription>
                  Entre para continuar sua jornada de aprovação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="voce@exemplo.com" 
                    required 
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <a href="#" className="text-sm font-medium text-primary hover:underline">
                      Esqueceu a senha?
                    </a>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-12"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar no Cockpit"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="m-0">
            <form onSubmit={handleAuth}>
              <CardHeader>
                <CardTitle className="text-2xl">Comece sua aprovação</CardTitle>
                <CardDescription>
                  Crie sua conta grátis e transforme seus estudos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input 
                    id="name" 
                    placeholder="João Silva" 
                    required 
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-register">E-mail</Label>
                  <Input 
                    id="email-register" 
                    type="email" 
                    placeholder="voce@exemplo.com" 
                    required 
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">Objetivo Principal</Label>
                  <Input 
                    id="goal" 
                    placeholder="Ex: Medicina ENEM, Concurso PF" 
                    required 
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-register">Senha</Label>
                  <Input 
                    id="password-register" 
                    type="password" 
                    required 
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-12"
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar Conta Grátis"}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
      
      <p className="mt-8 text-sm text-muted-foreground relative z-10 text-center max-w-sm">
        Ao continuar, você concorda com nossos <a href="#" className="underline hover:text-foreground">Termos de Serviço</a> e <a href="#" className="underline hover:text-foreground">Política de Privacidade</a>.
      </p>
    </div>
  );
}
