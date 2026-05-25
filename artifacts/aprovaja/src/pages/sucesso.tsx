import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Zap, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLAN_INFO = {
  pro: {
    name: "Pro",
    price: "R$ 29,90/mês",
    color: "text-primary",
    glow: "shadow-[0_0_60px_rgba(var(--primary),0.3)]",
    border: "border-primary/40",
    features: [
      "Plano de estudos com IA",
      "Simulados ilimitados",
      "Flashcards com repetição espaçada",
      "Análise de desempenho (Raio-X)",
      "Gamificação completa (XP, Ranking)",
    ],
  },
  premium: {
    name: "Vitalício",
    price: "R$ 95,90 · Acesso vitalício",
    color: "text-accent",
    glow: "shadow-[0_0_60px_rgba(var(--accent),0.25)]",
    border: "border-accent/40",
    features: [
      "Tudo do plano Pro",
      "Correção de Redação ilimitada por IA",
      "Professor IA 24/7 para dúvidas",
      "Simulados inéditos semanais",
      "Suporte prioritário 24h",
    ],
  },
};

const REDIRECT_AFTER_SECONDS = 6;

export default function Sucesso() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const planSlug = (params.get("plan") ?? "pro") as keyof typeof PLAN_INFO;
  const sessionId = params.get("session_id");
  const plan = PLAN_INFO[planSlug] ?? PLAN_INFO.pro;

  const [countdown, setCountdown] = useState(REDIRECT_AFTER_SECONDS);

  // For lifetime plans (one-time payment), verify the session with the backend
  // so it can flip the user's lifetime_access flag. Idempotent — safe on reload.
  useEffect(() => {
    if (!sessionId || planSlug !== "premium") return;
    fetch("/api/stripe/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => {
      // Non-fatal — webhook flow or a retry from the dashboard will resolve it.
    });
  }, [sessionId, planSlug]);

  // Auto-redirect to dashboard after countdown — passes ?plano=ativo so
  // SubscriptionGuard knows to retry the subscription check while webhook settles.
  useEffect(() => {
    if (countdown <= 0) {
      navigate("/dashboard?plano=ativo");
      return;
    }
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center overflow-hidden relative">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-green-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-16 flex flex-col items-center text-center">

        {/* Animated check icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative w-28 h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-green-500/10" />
            <CheckCircle2 className="w-16 h-16 text-green-400 relative z-10" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <p className="text-sm font-semibold text-green-400 tracking-widest uppercase mb-3">
            Pagamento confirmado
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 leading-tight">
            Bem-vindo ao{" "}
            <span className={`bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent`}>
              AprovaJá {plan.name}!
            </span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Sua assinatura está ativa. Você tem acesso completo a todas as ferramentas.
          </p>
        </motion.div>

        {/* Plan summary card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className={`w-full rounded-2xl border ${plan.border} bg-background/60 backdrop-blur-sm p-6 mb-8 ${plan.glow}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${plan.color}`} />
              <span className={`font-bold text-lg ${plan.color}`}>Plano {plan.name}</span>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">{plan.price}</span>
          </div>
          <ul className="space-y-2 text-left">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.color}`} />
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="flex flex-col items-center gap-3 w-full"
        >
          <Button
            size="lg"
            onClick={() => navigate("/dashboard?plano=ativo")}
            className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(var(--primary),0.5)] rounded-xl gap-2"
          >
            Acessar a plataforma
            <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-xs text-muted-foreground/50 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-primary/60" />
            Redirecionando automaticamente em{" "}
            <span className="font-semibold text-muted-foreground">{countdown}s</span>
          </p>
        </motion.div>

      </div>
    </div>
  );
}
