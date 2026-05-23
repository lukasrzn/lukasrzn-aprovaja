import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Rocket, 
  Brain, 
  Target, 
  Trophy, 
  Zap, 
  CheckCircle2, 
  BarChart3, 
  Users, 
  BookOpen,
  Layers,
  PenTool,
  CheckCircle,
} from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("saiu") === "true") {
      // Clean the URL without re-triggering navigation
      window.history.replaceState({}, "", window.location.pathname);
      setTimeout(() => {
        toast({
          title: "Sessão encerrada",
          description: "Você saiu da sua conta com sucesso.",
          duration: 4000,
        });
      }, 300);
    }
  }, [toast]);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring" as const, stiffness: 100 }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
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
            <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Entrar
            </Link>
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-6 shadow-[0_0_20px_rgba(var(--primary),0.4)]">
                Assinar Agora
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
                <Rocket className="w-4 h-4" />
                <span>Prepare-se para o ENEM 2026</span>
              </motion.div>
              
              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
                Sua aprovação no ENEM 2026 não é sorte. É <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-300% animate-gradient">ciência de dados.</span>
              </motion.h1>
              
              <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Plano ENEM 2026 Inteligente com IA. Transforme sua preparação com simulados, correção de redação e gamificação que se adapta ao seu ritmo e maximiza seus resultados. Sua aprovação começa agora.
              </motion.p>
              
              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_30px_rgba(var(--primary),0.5)]">
                    Comece sua aprovação hoje
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/10 hover:bg-white/5">
                  Ver demonstração
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-24 bg-card/30 border-y border-white/5 relative">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">O cockpit da sua aprovação no ENEM 2026</h2>
            <p className="text-lg text-muted-foreground">Tudo que você precisa em um único lugar, desenhado para manter seu foco extremo e motivação em alta até o dia da prova.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Plano ENEM 2026 com IA</h3>
                <p className="text-muted-foreground leading-relaxed">Nosso algoritmo analisa seus pontos fracos e fortes e monta o cronograma perfeito para você gabaritar o ENEM 2026, adaptando-se diariamente ao seu ritmo.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-accent/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Gamificação Viciante</h3>
                <p className="text-muted-foreground leading-relaxed">Estudar não precisa ser chato. Ganhe XP, mantenha ofensivas, suba de nível e colecione medalhas enquanto domina os conteúdos.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Simulados ENEM 2026</h3>
                <p className="text-muted-foreground leading-relaxed">Treine com provas no estilo ENEM 2026 e FUVEST com correção TRI instantânea e raio-X completo do seu desempenho por área de conhecimento.</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-accent/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                  <PenTool className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Redação ENEM 2026 com IA</h3>
                <p className="text-muted-foreground leading-relaxed">Envie sua redação e receba correção detalhada pelas 5 competências do ENEM 2026 em segundos, com sugestões práticas e previsão de nota.</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">Flashcards Inteligentes</h3>
                <p className="text-muted-foreground leading-relaxed">Sistema de repetição espaçada integrado para você nunca mais esquecer fórmulas, conceitos e regras importantes.</p>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm hover:border-accent/50 transition-colors">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-3">Ranking Nacional</h3>
                <p className="text-muted-foreground leading-relaxed">Compare seu desempenho com milhares de estudantes de todo o Brasil buscando o mesmo sonho que você.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
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
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Seus dados revelam o caminho</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Não perca tempo revisando o que você já sabe. Nosso painel analítico mostra exatamente onde você está errando e direciona seu foco para as matérias que vão aumentar sua nota rapidamente.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">Diagnóstico Raio-X</h4>
                    <p className="text-muted-foreground">Mapeamento completo das suas forças e fraquezas por disciplina e assunto.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">Previsão de Nota</h4>
                    <p className="text-muted-foreground">Saiba se você passaria hoje no curso dos seus sonhos com base no seu histórico.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">Recomendações Diárias</h4>
                    <p className="text-muted-foreground">Missões personalizadas todos os dias para garantir sua evolução constante.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-24 bg-card/30 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Quem usa, aprova</h2>
            <p className="text-lg text-muted-foreground">Milhares de brasileiros já transformaram suas vidas com o AprovaJá.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-background/50 border-white/5 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4 text-yellow-500">
                  ★ ★ ★ ★ ★
                </div>
                <p className="text-lg text-foreground/90 italic mb-6">"O sistema de gamificação mudou tudo pra mim. Eu estudava 2h arrastado, agora estudo 5h tentando manter minha ofensiva e subir no ranking. Passei em Medicina na federal."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">LM</div>
                  <div>
                    <div className="font-semibold">Lucas Mendes</div>
                    <div className="text-xs text-muted-foreground">Aprovado em Medicina - UFMG</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4 text-yellow-500">
                  ★ ★ ★ ★ ★
                </div>
                <p className="text-lg text-foreground/90 italic mb-6">"A correção de redação por IA é surreal. Em 5 segundos eu sabia exatamente onde estava perdendo ponto na competência 3. Minha nota saltou de 680 pra 940 no ENEM 2026."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">AC</div>
                  <div>
                    <div className="font-semibold">Amanda Costa</div>
                    <div className="text-xs text-muted-foreground">Aprovada em Direito - USP</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/50 border-white/5 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-4 text-yellow-500">
                  ★ ★ ★ ★ ★
                </div>
                <p className="text-lg text-foreground/90 italic mb-6">"Os flashcards e a análise de desempenho mostram o que preciso focar. O AprovaJá foi o melhor investimento que fiz no meu ano de vestibular. Vale cada centavo."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">RF</div>
                  <div>
                    <div className="font-semibold">Rafael Ferreira</div>
                    <div className="text-xs text-muted-foreground">Aprovado em Engenharia - Unicamp</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold text-primary mb-4">
              <Zap className="w-3.5 h-3.5" /> Acesso Premium — Exclusivo
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Invista na sua aprovação</h2>
            <p className="text-lg text-muted-foreground">Planos 100% premium. Acesso completo às ferramentas de IA que aprovam.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Pro */}
            <Card className="bg-background border-primary relative shadow-[0_0_40px_rgba(var(--primary),0.25)] flex flex-col">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                MAIS POPULAR
              </div>
              <CardContent className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold mb-2 text-primary">Pro</h3>
                <p className="text-muted-foreground mb-6">O essencial para sua aprovação</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ 29,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Plano de estudos com IA</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Análise de desempenho (Raio-X)</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Simulados ilimitados</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Flashcards ilimitados</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>2 Correções de Redação/mês</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Gamificação completa (XP, Ranking)</span></div>
                </div>
                <Link href="/login" className="w-full">
                  <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(var(--primary),0.4)]">
                    Assinar Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="bg-background/50 border-accent/40 shadow-[0_0_40px_rgba(var(--accent),0.15)] flex flex-col relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide whitespace-nowrap">
                NOTA 1000 NO ENEM
              </div>
              <CardContent className="p-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold mb-2 text-accent">Premium</h3>
                <p className="text-muted-foreground mb-6">Gabarite o ENEM 2026 e Vestibulares</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">R$ 59,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <div className="space-y-4 mb-8 flex-1">
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent" /> <span>Tudo do plano Pro</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent" /> <span>Correção de Redação ilimitada por IA</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent" /> <span>Professor IA 24/7 para dúvidas</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent" /> <span>Simulados inéditos semanais</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent" /> <span>Métricas avançadas no Ranking</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-accent" /> <span>Suporte prioritário 24h</span></div>
                </div>
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full h-12 border-accent text-accent hover:bg-accent hover:text-white transition-colors font-bold">
                    Assinar Premium
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground/60 mt-8">
            Cancele quando quiser · Pagamento seguro · Acesso imediato
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-white mb-6">
            <Rocket className="w-4 h-4" />
            <span>ENEM 2026 — Sua aprovação começa agora</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-8 max-w-4xl mx-auto leading-tight">
            Pronto para transformar sua preparação para o ENEM 2026?
          </h2>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
            Mais de 50 mil estudantes já escolheram o AprovaJá para garantir sua aprovação. Assine hoje e descubra o caminho mais inteligente e comprovado para o ENEM 2026.
          </p>
          <Link href="/login">
            <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Comece sua aprovação hoje
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-muted-foreground text-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-lg font-bold text-white">AprovaJá</span>
          </div>
          <p>© {new Date().getFullYear()} AprovaJá Educacional. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
