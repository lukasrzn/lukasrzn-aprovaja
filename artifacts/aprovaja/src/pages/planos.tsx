import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSubscription, isSubscriptionActive } from "@/hooks/useSubscription";
import { Zap, CheckCircle2, Star, Loader2, ShieldCheck, Lock } from "lucide-react";

const PLANS = [
  {
    id: "pro" as const,
    name: "Pro",
    price: "R$ 29,90",
    period: "/mês",
    badge: "Mais popular",
    color: "primary" as const,
    glow: "shadow-[0_0_40px_rgba(var(--primary),0.25)]",
    borderActive: "border-primary",
    badgeBg: "bg-primary",
    features: [
      "Plano de estudos com IA",
      "Análise de desempenho (Raio-X)",
      "Simulados ilimitados",
      "Flashcards ilimitados",
      "2 Correções de Redação/mês",
      "Gamificação completa (XP, Ranking)",
    ],
  },
  {
    id: "premium" as const,
    name: "Premium",
    price: "R$ 100",
    period: " · Vitalício",
    badge: "Acesso vitalício",
    color: "accent" as const,
    glow: "shadow-[0_0_40px_rgba(var(--accent),0.2)]",
    borderActive: "border-accent",
    badgeBg: "bg-gradient-to-r from-primary to-accent",
    features: [
      "Tudo do plano Pro",
      "Correção de Redação ilimitada por IA",
      "Professor IA 24/7 para dúvidas",
      "Simulados inéditos semanais",
      "Métricas avançadas no Ranking",
      "Suporte prioritário 24h",
    ],
  },
];

export default function Planos() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { data: subData, isLoading: checkingSubscription } = useSubscription();

  useEffect(() => {
    if (!checkingSubscription && isSubscriptionActive(subData?.subscription)) {
      navigate("/dashboard");
    }
  }, [subData, checkingSubscription]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("plano") === "cancelado") {
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => {
        toast({
          title: "Pagamento não concluído",
          description: "Você pode tentar novamente quando quiser.",
          variant: "destructive",
        });
      }, 300);
    }
  }, []);

  const handleCheckout = async (planId: "pro" | "premium") => {
    setLoadingPlan(planId);
    try {
      const resp = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: planId, cancelPath: "/planos" }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as any).error ?? `Erro ${resp.status}`);
      }

      const data = await resp.json() as { url?: string };
      if (data.url) {
        // Break out of any iframe (Replit preview pane) so Stripe Checkout
        // loads at the top-level browsing context — Stripe blocks iframes.
        (window.top ?? window).location.href = data.url;
      } else {
        throw new Error("Resposta inválida do servidor.");
      }
    } catch (err: unknown) {
      setLoadingPlan(null);
      toast({
        title: "Erro ao iniciar pagamento",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBIMVYxSDBaTTIgMEgzVjFIMlpNMSAxSDJWMkgxWk0zIDFINFYySDNaTTAgMkgxVjNIMFpNMiAySDNWM0gyWk0xIDNIMlY0SDFaTTMgM0g0VjRIM1oiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] pointer-events-none opacity-[0.03]"></div>

      {/* Nav */}
      <nav className="fixed top-0 w-full z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              AprovaJá
            </span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Já tenho uma conta →
          </Link>
        </div>
      </nav>

      {/* Hero glow */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/15 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-4 pt-36 pb-20 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-sm font-semibold text-amber-400 mb-5">
            <Lock className="w-3.5 h-3.5" />
            Acesso exclusivo para assinantes
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
            Escolha seu plano e comece{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
              a aprovar hoje
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Plataforma 100% premium. Acesso completo às ferramentas de IA que já aprovaram mais de 50 mil estudantes no ENEM.
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {PLANS.map((plan, i) => {
            const isPro = plan.id === "pro";
            const isLoading = loadingPlan === plan.id;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className={`relative flex flex-col h-full bg-background ${plan.borderActive} ${plan.glow}`}>
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 ${plan.badgeBg} text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide whitespace-nowrap`}>
                    {plan.badge}
                  </div>
                  <CardContent className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className={`w-4 h-4 ${isPro ? "text-primary" : "text-accent"}`} />
                      <h2 className={`text-2xl font-bold ${isPro ? "text-primary" : "text-accent"}`}>{plan.name}</h2>
                    </div>
                    <p className="text-muted-foreground text-sm mb-6">
                      {isPro ? "O essencial para sua aprovação" : "Gabarite o ENEM 2026 e vestibulares"}
                    </p>

                    <div className="mb-8">
                      <span className="text-5xl font-black">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>

                    <ul className="space-y-3 mb-10 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-3 text-sm">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${isPro ? "text-primary" : "text-accent"}`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <Button
                      size="lg"
                      onClick={() => handleCheckout(plan.id)}
                      disabled={loadingPlan !== null}
                      className={`w-full h-13 text-base font-bold transition-all ${
                        isPro
                          ? "bg-primary hover:bg-primary/90 text-white shadow-[0_0_24px_rgba(var(--primary),0.4)]"
                          : "bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-[0_0_24px_rgba(var(--accent),0.3)]"
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Abrindo checkout seguro…
                        </span>
                      ) : (
                        `Assinar ${plan.name} — ${plan.price}${plan.period}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center gap-4 mt-10"
        >
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground/70">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-500" /> Pagamento 100% seguro via Stripe</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cancele quando quiser</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary" /> Acesso imediato após o pagamento</span>
          </div>
          <p className="text-xs text-muted-foreground/40 max-w-sm text-center">
            Ao assinar, você concorda com nossos{" "}
            <Link href="/termos-de-servico" className="underline hover:text-muted-foreground">Termos de Serviço</Link>
            {" "}e{" "}
            <Link href="/politica-de-privacidade" className="underline hover:text-muted-foreground">Política de Privacidade</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
