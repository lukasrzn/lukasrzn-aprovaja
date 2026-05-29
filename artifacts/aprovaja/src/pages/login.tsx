import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, CheckCircle2, Star, Sparkles, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const PLANS = [
  {
    id: "pro",
    name: "Pro",
    price: "R$ 34,90",
    period: "/mês",
    color: "primary",
    badge: "Mais popular",
    features: ["Simulados ilimitados", "Flashcards ilimitados", "Plano de estudos com IA", "2 Redações/mês"],
  },
  {
    id: "premium",
    name: "Vitalício",
    price: "R$ 95,90",
    period: "",
    color: "accent",
    badge: "Melhor custo",
    features: ["Tudo do Pro", "Redações ilimitadas", "Professor IA 24/7", "Acesso vitalício"],
  },
] as const;

export default function Login() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const initialPlan = (() => {
    const p = new URLSearchParams(search).get("checkout");
    return p === "pro" || p === "premium" ? p : null;
  })();
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "premium" | null>(initialPlan);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("plano") === "cancelado") {
      toast({
        title: "Pagamento não concluído",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)?.value;

    if (!email || !password) {
      toast({ title: "Preencha email e senha.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error ?? "Erro ao fazer login.");
      }
      // Invalidate caches so app refetches with new identity
      await queryClient.invalidateQueries();

      // If the user came here trying to subscribe (redirected from a checkout
      // attempt while logged out), resume that checkout instead of going to the
      // dashboard.
      const pendingPlan = new URLSearchParams(search).get("checkout");
      if (pendingPlan === "pro" || pendingPlan === "premium") {
        // Login already succeeded — isolate the checkout resume so any failure
        // here (network/runtime) never surfaces as a login error; we simply
        // fall through to the dashboard instead of stranding the user.
        try {
          const checkoutResp = await fetch("/api/stripe/checkout", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planSlug: pendingPlan, cancelPath: "/planos" }),
          });
          const checkoutData = await checkoutResp.json().catch(() => ({}));
          if (checkoutResp.ok && checkoutData.url) {
            (window.top ?? window).location.href = checkoutData.url;
            return;
          }
        } catch {
          // Ignore — fall through to the dashboard below.
        }
      }

      toast({ title: "Bem-vindo de volta!", description: "Seu cockpit de estudos está pronto." });
      setLocation("/dashboard");
    } catch (err: any) {
      toast({
        title: "Erro ao entrar",
        description: err.message ?? "Verifique seus dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const form = e.currentTarget as HTMLFormElement;
    const name = (form.elements.namedItem("name") as HTMLInputElement)?.value;
    const email = (form.elements.namedItem("email-register") as HTMLInputElement)?.value;
    const goal = (form.elements.namedItem("goal") as HTMLInputElement)?.value;
    const password = (form.elements.namedItem("password-register") as HTMLInputElement)?.value;

    if (!name || !email || !password) {
      toast({ title: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Senha muito curta", description: "Use ao menos 8 caracteres.", variant: "destructive" });
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toast({ title: "Senha fraca", description: "Use pelo menos uma letra e um número.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // 1) Create the account (also sets the session cookie)
      const regResp = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, goal }),
      });
      const regData = await regResp.json().catch(() => ({}));
      if (!regResp.ok) {
        throw new Error(regData.error ?? "Erro ao criar conta.");
      }

      await queryClient.invalidateQueries();

      // 2) Start Stripe checkout for the chosen plan
      const checkoutResp = await fetch("/api/stripe/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: selectedPlan }),
      });
      const checkoutData = await checkoutResp.json().catch(() => ({}));
      if (!checkoutResp.ok) {
        throw new Error(checkoutData.error ?? "Erro ao iniciar pagamento.");
      }

      if (checkoutData.url) {
        (window.top ?? window).location.href = checkoutData.url;
      } else {
        throw new Error("Resposta inválida do servidor.");
      }
    } catch (err: any) {
      setIsLoading(false);
      toast({
        title: "Erro ao criar conta",
        description: err.message ?? "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBIMVYxSDBaTTIgMEgzVjFIMlpNMSAxSDJWMkgxWk0zIDFINFYySDNaTTAgMkgxVjNIMFpNMiAySDNWM0gyWk0xIDNIMlY0SDFaTTMgM0g0VjRIM1oiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] pointer-events-none opacity-[0.03]"></div>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none blur-[100px]"></div>

      <Link
        href="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-card/60 backdrop-blur-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-white/20 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </Link>

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
            <form onSubmit={handleLogin}>
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
                    name="email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    required
                    autoComplete="email"
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link href="/recuperar-senha" className="text-sm font-medium text-primary hover:underline">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
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
            <form onSubmit={handleRegister}>
              <CardHeader className="pb-3">
                <CardTitle className="text-2xl">Comece sua aprovação</CardTitle>
                <CardDescription>
                  Escolha seu plano para iniciar sua jornada de aprovação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Escolha seu plano
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {PLANS.map(plan => {
                      const isSelected = selectedPlan === plan.id;
                      const isPro = plan.id === "pro";
                      return (
                        <motion.button
                          key={plan.id}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`relative flex flex-col gap-2 p-3.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? isPro
                                ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(var(--primary),0.2)]"
                                : "border-accent bg-accent/10 shadow-[0_0_16px_rgba(var(--accent),0.2)]"
                              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.18]"
                          }`}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute top-2 right-2"
                              >
                                <CheckCircle2 className={`w-4 h-4 ${isPro ? "text-primary" : "text-accent"}`} />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center gap-1.5">
                            <Star className={`w-3 h-3 ${isPro ? "text-primary" : "text-accent"}`} />
                            <span className={`text-xs font-bold uppercase tracking-wide ${isPro ? "text-primary" : "text-accent"}`}>
                              {plan.badge}
                            </span>
                          </div>

                          <div>
                            <p className="font-black text-white text-base leading-none">{plan.name}</p>
                            <p className={`text-lg font-bold mt-1 ${isPro ? "text-primary" : "text-accent"}`}>
                              {plan.price}<span className="text-xs text-muted-foreground font-normal">{plan.period}</span>
                            </p>
                          </div>

                          <ul className="space-y-1">
                            {plan.features.map(f => (
                              <li key={f} className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-snug">
                                <CheckCircle2 className={`w-3 h-3 shrink-0 mt-0.5 ${isPro ? "text-primary/60" : "text-accent/60"}`} />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </motion.button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {!selectedPlan && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="text-[11px] text-muted-foreground/60 text-center pt-0.5"
                      >
                        É necessário escolher um plano para continuar.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="João Silva"
                    required
                    autoComplete="name"
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-register">E-mail</Label>
                  <Input
                    id="email-register"
                    name="email-register"
                    type="email"
                    placeholder="voce@exemplo.com"
                    required
                    autoComplete="email"
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal">Objetivo Principal</Label>
                  <Input
                    id="goal"
                    name="goal"
                    placeholder="Ex: Medicina ENEM, Concurso PF"
                    required
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-register">Senha</Label>
                  <Input
                    id="password-register"
                    name="password-register"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres com letras e números"
                    className="bg-background/50 border-white/10 focus-visible:ring-primary"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button
                  type="submit"
                  className={`w-full h-12 font-bold text-white transition-all ${
                    selectedPlan === "premium"
                      ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-[0_0_20px_rgba(var(--accent),0.3)]"
                      : "bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                  }`}
                  disabled={isLoading || !selectedPlan}
                >
                  {isLoading
                    ? "Criando sua conta…"
                    : selectedPlan
                      ? `Assinar plano ${selectedPlan === "pro" ? "Pro — R$ 34,90/mês" : "Vitalício — R$ 95,90"}`
                      : "Selecione um plano para continuar"}
                </Button>
                <p className="text-[10px] text-muted-foreground/50 text-center">
                  Cancele quando quiser · Pagamento seguro via cartão
                </p>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>

      <p className="mt-8 text-sm text-muted-foreground relative z-10 text-center max-w-sm">
        Ao continuar, você concorda com nossos{" "}
        <Link href="/termos-de-servico" className="underline hover:text-foreground">Termos de Serviço</Link>
        {" "}e{" "}
        <Link href="/politica-de-privacidade" className="underline hover:text-foreground">Política de Privacidade</Link>.
      </p>
    </div>
  );
}
