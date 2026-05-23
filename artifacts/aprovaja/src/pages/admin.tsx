import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, Users, CreditCard, BarChart3, BookOpen,
  Layers, PenTool, FileText, TrendingUp, CheckCircle2,
  AlertCircle, Loader2, Settings, LogOut
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

interface AdminStats {
  user: { id: number; name: string; email: string; role: string };
  subscriptions: { total: number; active: number; trialing: number; canceled: number };
  revenue: { monthlyEstimateCentavos: number };
  content: { flashcards: number; studyPlans: number; simulados: number; redacoes: number };
}

async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Acesso negado");
  }
  return res.json();
}

function formatBRL(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
    .format(centavos / 100);
}

export default function Admin() {
  const [, navigate] = useLocation();
  const { data: subData } = useSubscription();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    retry: 0,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Carregando painel admin…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-bold">Acesso Restrito</h2>
          <p className="text-muted-foreground text-sm">
            {(error as Error)?.message ?? "Apenas administradores podem acessar esta área."}
          </p>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const stats = data!;
  const monthlyRevenue = formatBRL(stats.revenue.monthlyEstimateCentavos);

  const statCards = [
    {
      label: "Assinaturas Ativas",
      value: stats.subscriptions.active,
      icon: CreditCard,
      color: "text-primary",
      bg: "bg-primary/10",
      sub: `${stats.subscriptions.total} total`,
    },
    {
      label: "Receita Mensal Est.",
      value: monthlyRevenue,
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10",
      sub: `${stats.subscriptions.trialing} em trial`,
    },
    {
      label: "Cancelamentos",
      value: stats.subscriptions.canceled,
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      sub: "histórico total",
    },
    {
      label: "Flashcards",
      value: stats.content.flashcards,
      icon: Layers,
      color: "text-accent",
      bg: "bg-accent/10",
      sub: "criados na plataforma",
    },
    {
      label: "Simulados",
      value: stats.content.simulados,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
      sub: "disponíveis",
    },
    {
      label: "Redações",
      value: stats.content.redacoes,
      icon: PenTool,
      color: "text-accent",
      bg: "bg-accent/10",
      sub: "enviadas e corrigidas",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-none">Painel Admin</h1>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">AprovaJá</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              {stats.user.email}
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                {stats.user.role}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Admin
            </span>
          </div>
          <h2 className="text-3xl font-bold">Olá, {stats.user.name.split(" ")[0]}!</h2>
          <p className="text-muted-foreground mt-1">
            Visão geral da plataforma AprovaJá em tempo real.
          </p>
        </motion.div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <Card className="bg-card/50 border-white/5 hover:border-white/10 transition-colors">
                <CardContent className="p-5">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                    <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
                  </div>
                  <div className={`text-2xl font-bold ${card.color} mb-0.5`}>{card.value}</div>
                  <div className="text-sm font-medium text-foreground/80">{card.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{card.sub}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* User info + Subscription status */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card className="bg-card/50 border-white/5 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Usuário Administrador</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-medium">{stats.user.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium text-xs">{stats.user.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-medium">#{stats.user.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Perfil</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      {stats.user.role.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card className="bg-card/50 border-white/5 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-accent" />
                  <h3 className="font-semibold">Status das Assinaturas</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Ativas", value: stats.subscriptions.active, color: "bg-green-500" },
                    { label: "Em trial", value: stats.subscriptions.trialing, color: "bg-primary" },
                    { label: "Canceladas", value: stats.subscriptions.canceled, color: "bg-destructive" },
                  ].map((row) => {
                    const pct = stats.subscriptions.total > 0
                      ? Math.round((row.value / stats.subscriptions.total) * 100)
                      : 0;
                    return (
                      <div key={row.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{row.label}</span>
                          <span className="font-medium">{row.value} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${row.color} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Receita mensal estimada</span>
                    <span className="font-bold text-green-400">{monthlyRevenue}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Content summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-4"
        >
          <Card className="bg-card/50 border-white/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Conteúdo da Plataforma</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { label: "Planos de Estudo", value: stats.content.studyPlans, icon: BookOpen },
                  { label: "Simulados", value: stats.content.simulados, icon: FileText },
                  { label: "Flashcards", value: stats.content.flashcards, icon: Layers },
                  { label: "Redações", value: stats.content.redacoes, icon: PenTool },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <item.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <div className="text-xl font-bold">{item.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
