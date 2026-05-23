import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Planos from "@/pages/planos";
import Dashboard from "@/pages/dashboard";
import StudyPlans from "@/pages/study-plans";
import Simulados from "@/pages/simulados";
import Redacao from "@/pages/redacao";
import Flashcards from "@/pages/flashcards";
import FlashcardReview from "@/pages/flashcard-review";
import Ranking from "@/pages/ranking";
import Perfil from "@/pages/perfil";
import Missoes from "@/pages/missoes";
import SimuladoExam from "@/pages/simulado-exam";
import SimuladoResultado from "@/pages/simulado-resultado";
import Pratica from "@/pages/pratica";
import EstudeHoje from "@/pages/estude-hoje";
import ProfessorIA from "@/pages/professor-ia";
import IaConteudo from "@/pages/ia-conteudo";
import PoliticaDePrivacidade from "@/pages/politica-de-privacidade";
import TermosDeServico from "@/pages/termos-de-servico";
import { Layout } from "@/components/Layout";
import { useSubscription, isSubscriptionActive } from "@/hooks/useSubscription";

const queryClient = new QueryClient();

function SubscriptionGuard({ component: Component }: { component: React.ComponentType }) {
  const { data, isLoading, isError } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !isSubscriptionActive(data?.subscription)) {
    return <Redirect to="/planos" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/planos" component={Planos} />
      <Route path="/politica-de-privacidade" component={PoliticaDePrivacidade} />
      <Route path="/termos-de-servico" component={TermosDeServico} />

      {/* Protected routes — require active subscription */}
      <Route path="/dashboard"><SubscriptionGuard component={Dashboard} /></Route>
      <Route path="/plano-de-estudos"><SubscriptionGuard component={StudyPlans} /></Route>
      <Route path="/simulados"><SubscriptionGuard component={Simulados} /></Route>
      <Route path="/redacao"><SubscriptionGuard component={Redacao} /></Route>
      <Route path="/flashcards"><SubscriptionGuard component={Flashcards} /></Route>
      <Route path="/flashcards/revisar/:deckId"><SubscriptionGuard component={FlashcardReview} /></Route>
      <Route path="/ranking"><SubscriptionGuard component={Ranking} /></Route>
      <Route path="/perfil"><SubscriptionGuard component={Perfil} /></Route>
      <Route path="/missoes"><SubscriptionGuard component={Missoes} /></Route>
      <Route path="/pratica"><SubscriptionGuard component={Pratica} /></Route>
      <Route path="/estude-hoje"><SubscriptionGuard component={EstudeHoje} /></Route>
      <Route path="/professor-ia"><SubscriptionGuard component={ProfessorIA} /></Route>
      <Route path="/ia-conteudo"><SubscriptionGuard component={IaConteudo} /></Route>
      <Route path="/simulados/:id/resultado/:resultId"><SubscriptionGuard component={SimuladoResultado} /></Route>
      <Route path="/simulados/:id/exam" component={SimuladoExam} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
