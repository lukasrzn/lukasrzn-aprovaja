import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Rocket, Brain, Target, Trophy, Zap, CheckCircle2,
  BarChart3, Users, BookOpen, Layers, PenTool, GraduationCap,
  Building2, School, Award, Lightbulb, FlameIcon, Sparkles,
  ClipboardList, TrendingUp,
} from "lucide-react";

async function startCheckout(planSlug: "pro" | "premium"): Promise<string> {
  const resp = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planSlug, cancelPath: "/planos" }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as any).error ?? `Erro ${resp.status}`);
  }
  const data = await resp.json() as { url?: string };
  if (!data.url) throw new Error("Resposta inválida do servidor.");
  return data.url;
}

function redirectToCheckout(url: string) {
  (window.top ?? window).location.href = url;
}

const studyPaths = [
  { icon: GraduationCap, label: "ENEM 2026", color: "text-primary", bg: "bg-primary/15", border: "border-primary/30" },
  { icon: Building2,    label: "Concursos Públicos", color: "text-accent", bg: "bg-accent/15", border: "border-accent/30" },
  { icon: Award,        label: "Vestibulares", color: "text-yellow-400", bg: "bg-yellow-400/15", border: "border-yellow-400/30" },
  { icon: School,       label: "Ensino Médio", color: "text-emerald-400", bg: "bg-emerald-400/15", border: "border-emerald-400/30" },
  { icon: Lightbulb,   label: "Aprendizado Contínuo", color: "text-sky-400", bg: "bg-sky-400/15", border: "border-sky-400/30" },
];

export default function Landing() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [checkoutLoading, setCheckoutLoading] = useState<"pro" | "premium" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("saiu") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => {
        toast({ title: "Sessão encerrada", description: "Você saiu da sua conta com sucesso.", duration: 4000 });
      }, 300);
    }
  }, [toast]);

  const handleDirectCheckout = async (plan: "pro" | "premium") => {
    setCheckoutLoading(plan);
    try {
      const url = await startCheckout(plan);
      redirectToCheckout(url);
    } catch (err: unknown) {
      setCheckoutLoading(null);
      toast({
        title: "Erro ao iniciar pagamento",
        description: err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      {/* grain overlay */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBIMVYxSDBaTTIgMEgzVjFIMlpNMSAxSDJWMkgxWk0zIDFINFYySDNaTTAgMkgxVjNIMFpNMiAySDNWM0gyWk0xIDNIMlY0SDFaTTMgM0g0VjRIM1oiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] pointer-events-none z-50 opacity-[0.03]"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              AprovaJá
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#para-quem" className="hover:text-foreground transition-colors">Para quem</a>
            <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Entrar
            </Link>
            <Button
              onClick={() => navigate("/planos")}
              className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-6 shadow-[0_0_20px_rgba(var(--primary),0.4)]"
            >
              Assinar Agora
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="max-w-2xl"
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-primary mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Plataforma educacional completa com IA</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Estude para ENEM, concursos, vestibulares e{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-300% animate-gradient">
                  muito mais.
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Uma plataforma de IA adaptativa que se molda ao seu objetivo — ENEM, concurso público, vestibular, reforço escolar ou desenvolvimento contínuo. O caminho mais inteligente para a sua aprovação começa aqui.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/planos")}
                  className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(var(--primary),0.5)]"
                >
                  Comece sua aprovação hoje
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/planos")}
                  className="h-14 px-8 text-lg rounded-full border-white/10 hover:bg-white/5 gap-2"
                >
                  <span>Ver planos e preços</span>
                  <span className="text-xs opacity-60 font-normal">→</span>
                </Button>
              </motion.div>

              <motion.div variants={itemVariants} className="mt-12 flex items-center gap-8 border-t border-white/5 pt-8">
                <div>
                  <div className="text-3xl font-bold text-foreground">+50k</div>
                  <div className="text-sm text-muted-foreground">Alunos aprovados</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">89%</div>
                  <div className="text-sm text-muted-foreground">Taxa de aprovação</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">+2M</div>
                  <div className="text-sm text-muted-foreground">Horas estudadas</div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] aspect-video md:aspect-[4/3] group"
            >
              <img
                src="/images/hero-bg.png"
                alt="AprovaJá Interface"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>

              {/* floating badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="absolute bottom-5 left-5 flex flex-wrap gap-2"
              >
                {studyPaths.map(p => (
                  <span key={p.label} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm bg-background/60 ${p.color} ${p.border}`}>
                    <p.icon className="w-3 h-3" />
                    {p.label}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Para quem é ── */}
      <section id="para-quem" className="py-20 border-y border-white/5 bg-card/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">Para qual objetivo você está estudando?</h2>
            <p className="text-muted-foreground">O AprovaJá se adapta ao seu perfil. Escolha seu caminho — nós traçamos o plano.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: GraduationCap, title: "ENEM", desc: "Notas altas com plano adaptativo e simulados estilo ENEM", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", hover: "hover:border-primary/50" },
              { icon: Building2, title: "Concursos Públicos", desc: "Edital personalizado, flashcards por banca e questões de concurso", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20", hover: "hover:border-accent/50" },
              { icon: Award, title: "Vestibulares", desc: "FUVEST, UNICAMP, FAMERP e mais — simulados e análise TRI", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", hover: "hover:border-yellow-400/50" },
              { icon: School, title: "Ensino Médio", desc: "Reforço por disciplina, roteiros de aula e revisão gamificada", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", hover: "hover:border-emerald-400/50" },
              { icon: Lightbulb, title: "Aprendizado Geral", desc: "Desenvolvimento contínuo, idiomas e novas habilidades com IA", color: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20", hover: "hover:border-sky-400/50" },
            ].map(item => (
              <Card key={item.title} className={`bg-background/50 border ${item.border} backdrop-blur-sm ${item.hover} transition-all duration-200 cursor-pointer group`}>
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className={`font-bold text-sm md:text-base ${item.color}`}>{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed hidden md:block">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Conteúdo adaptado para qualquer nível de estudo · Uma plataforma para sua jornada educacional completa
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="recursos" className="py-24 bg-card/30 border-y border-white/5 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Um ecossistema educacional completo</h2>
            <p className="text-lg text-muted-foreground">Ferramentas de IA construídas para aprovação — seja no ENEM, concurso, vestibular ou qualquer outro desafio acadêmico.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Plano de Estudos com IA</h3>
                <p className="text-muted-foreground leading-relaxed">Nosso algoritmo analisa seus pontos fracos e fortes e monta um cronograma inteligente para qualquer objetivo — ENEM, concurso ou vestibular — adaptando-se diariamente ao seu ritmo.</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-accent/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Gamificação Viciante</h3>
                <p className="text-muted-foreground leading-relaxed">Estudar não precisa ser chato. Ganhe XP, mantenha ofensivas, suba de nível e colecione medalhas enquanto domina os conteúdos da sua área de estudo.</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Simulados Adaptativos</h3>
                <p className="text-muted-foreground leading-relaxed">Treine com provas no estilo ENEM, FUVEST, concursos e vestibulares com correção instantânea e raio-X completo do seu desempenho por área de conhecimento.</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-accent/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                  <PenTool className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Correção de Redação com IA</h3>
                <p className="text-muted-foreground leading-relaxed">Envie sua redação e receba correção detalhada pelas competências do ENEM ou critérios da banca em segundos, com sugestões práticas e previsão de nota.</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Flashcards Inteligentes</h3>
                <p className="text-muted-foreground leading-relaxed">Sistema de repetição espaçada (SM-2) para nunca mais esquecer fórmulas, conceitos e regras de qualquer disciplina — perfeito para concursos e vestibulares.</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-accent/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Ranking Nacional</h3>
                <p className="text-muted-foreground leading-relaxed">Compare seu desempenho com milhares de estudantes de todo o Brasil — concurseiros, vestibulandos, estudantes do ensino médio — que compartilham o mesmo sonho.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Feature Highlight ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] aspect-square md:aspect-[4/3]">
              <img
                src="/images/feature-ai.png"
                alt="AI Dashboard"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-muted-foreground mb-6">
                <TrendingUp className="w-3.5 h-3.5 text-primary" /> IA adaptativa para qualquer objetivo
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Seus dados revelam o caminho certo</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Não importa se você estuda para o ENEM, um concurso federal ou uma prova do ensino médio — nosso painel analítico mostra exatamente onde você está errando e direciona seu foco para o que mais impacta sua nota.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">Diagnóstico Raio-X</h4>
                    <p className="text-muted-foreground">Mapeamento completo das suas forças e fraquezas por disciplina, assunto e banca.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">Previsão de Desempenho</h4>
                    <p className="text-muted-foreground">Saiba sua nota estimada, vagas disponíveis e probabilidade de aprovação com base no seu histórico.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">Missões Diárias Personalizadas</h4>
                    <p className="text-muted-foreground">Tarefas diárias adaptadas ao seu objetivo para garantir evolução constante e foco no que importa.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <FlameIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">Mais de uma forma de aprender</h4>
                    <p className="text-muted-foreground">Flashcards, simulados, redação, aulas com IA e ranking — toda a jornada educacional em um único ecossistema.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="py-12 border-y border-white/5 bg-card/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "+50k", label: "Estudantes ativos", icon: Users },
              { value: "89%", label: "Taxa de aprovação", icon: Target },
              { value: "+2M", label: "Horas estudadas", icon: BookOpen },
              { value: "5★", label: "Avaliação média", icon: Award },
            ].map(stat => (
              <div key={stat.label} className="flex flex-col items-center gap-2">
                <stat.icon className="w-5 h-5 text-primary mb-1" />
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="depoimentos" className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Quem usa, aprova</h2>
            <p className="text-lg text-muted-foreground">De vestibulandos a concurseiros — milhares de brasileiros já transformaram suas vidas com o AprovaJá.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-background/50 border-white/5 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-2 text-yellow-500">★ ★ ★ ★ ★</div>
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary mb-4">ENEM</span>
                <p className="text-lg text-foreground/90 italic mb-6">"O sistema de gamificação mudou tudo pra mim. Eu estudava 2h arrastado, agora estudo 5h tentando manter minha ofensiva e subir no ranking. Passei em Medicina na federal."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">LM</div>
                  <div>
                    <div className="font-semibold">Lucas Mendes</div>
                    <div className="text-xs text-muted-foreground">Aprovado em Medicina — UFMG</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-2 text-yellow-500">★ ★ ★ ★ ★</div>
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-accent/20 text-accent mb-4">CONCURSO PÚBLICO</span>
                <p className="text-lg text-foreground/90 italic mb-6">"Usei o AprovaJá para o concurso da Receita Federal. Os flashcards segmentados por banca e os simulados específicos me deram exatamente o foco que eu precisava. Aprovada em 1ª tentativa!"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">AC</div>
                  <div>
                    <div className="font-semibold">Amanda Costa</div>
                    <div className="text-xs text-muted-foreground">Aprovada na Receita Federal</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-2 text-yellow-500">★ ★ ★ ★ ★</div>
                <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-400/20 text-yellow-400 mb-4">VESTIBULAR</span>
                <p className="text-lg text-foreground/90 italic mb-6">"Os flashcards e a análise de desempenho mostraram o que eu precisava focar para a FUVEST. O AprovaJá foi o melhor investimento que fiz no meu ano de vestibular. Vale cada centavo."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">RF</div>
                  <div>
                    <div className="font-semibold">Rafael Ferreira</div>
                    <div className="text-xs text-muted-foreground">Aprovado em Engenharia — Unicamp</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="planos" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold text-primary mb-4">
              <Zap className="w-3.5 h-3.5" /> Acesso Premium — Exclusivo
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Invista na sua aprovação</h2>
            <p className="text-lg text-muted-foreground">Planos 100% premium para ENEM, concursos, vestibulares e qualquer outro objetivo educacional.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Pro */}
            <Card className="bg-background border-primary relative shadow-[0_0_40px_rgba(var(--primary),0.25)] flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                MAIS POPULAR
              </div>
              <CardContent className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold mb-2 text-primary">Pro</h3>
                <p className="text-muted-foreground mb-6">O essencial para qualquer aprovação</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ 29,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Plano de estudos com IA adaptativa</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Análise de desempenho (Raio-X)</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Simulados ilimitados (ENEM, concursos, vestibulares)</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Flashcards ilimitados</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>2 Correções de Redação/mês</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> <span>Gamificação completa (XP, Ranking)</span></div>
                </div>
                <Button
                  onClick={() => handleDirectCheckout("pro")}
                  disabled={checkoutLoading !== null}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(var(--primary),0.4)]"
                >
                  {checkoutLoading === "pro" ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Abrindo checkout…</span>
                  ) : "Assinar Pro"}
                </Button>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="bg-background/50 border-accent/40 shadow-[0_0_40px_rgba(var(--accent),0.15)] flex flex-col relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide whitespace-nowrap">
                APROVAÇÃO GARANTIDA
              </div>
              <CardContent className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold mb-2 text-accent">Vitalício</h3>
                <p className="text-muted-foreground mb-6">Pague uma vez. Estude para sempre.</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ 95,90</span>
                  <span className="text-muted-foreground"> · pagamento único</span>
                  <p className="text-xs text-accent font-semibold mt-1.5 uppercase tracking-wider">Acesso vitalício</p>
                </div>
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> <span>Tudo do plano Pro</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> <span>Correção de Redação ilimitada por IA</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> <span>Professor IA 24/7 para dúvidas</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> <span>Simulados inéditos semanais</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> <span>Métricas avançadas no Ranking</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent shrink-0" /> <span>Suporte prioritário 24h</span></div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleDirectCheckout("premium")}
                  disabled={checkoutLoading !== null}
                  className="w-full h-12 border-accent text-accent hover:bg-accent hover:text-white transition-colors font-bold"
                >
                  {checkoutLoading === "premium" ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Abrindo checkout…</span>
                  ) : "Garantir acesso Vitalício"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground/60 mt-8">
            Cancele quando quiser · Pagamento seguro · Acesso imediato
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-white mb-6">
            <Rocket className="w-4 h-4" />
            <span>ENEM · Concursos · Vestibulares · e muito mais</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Pronto para transformar sua jornada educacional?
          </h2>
          <p className="text-lg text-white/70 mb-4 max-w-2xl mx-auto">
            Mais de 50 mil estudantes já escolheram o AprovaJá — do ensino fundamental à aprovação em concursos públicos. Assine hoje e descubra o caminho mais inteligente para o seu objetivo.
          </p>
          <p className="text-sm text-white/50 mb-10 max-w-xl mx-auto">
            "Conteúdo adaptado para qualquer nível de estudo. Uma plataforma para toda a sua jornada."
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/planos")}
            className="h-16 px-10 text-xl rounded-full bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            Comece sua aprovação hoje
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-white/5 text-muted-foreground text-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold text-white">AprovaJá</span>
            </div>
            <p className="text-center text-muted-foreground/60 text-xs">
              © {new Date().getFullYear()} AprovaJá Educacional. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-xs">
              <Link href="/politica-de-privacidade" className="hover:text-white transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/termos-de-servico" className="hover:text-white transition-colors">
                Termos de Serviço
              </Link>
              <a href="mailto:cttvertice@gmail.com" className="hover:text-white transition-colors">
                Suporte
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
