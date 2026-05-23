import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
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
import { Layout } from "@/components/Layout";

const queryClient = new QueryClient();

// Authenticated layout wrapper
function AuthRoute({ component: Component }: { component: any }) {
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      
      {/* Auth routes */}
      <Route path="/dashboard"><AuthRoute component={Dashboard} /></Route>
      <Route path="/plano-de-estudos"><AuthRoute component={StudyPlans} /></Route>
      <Route path="/simulados"><AuthRoute component={Simulados} /></Route>
      <Route path="/redacao"><AuthRoute component={Redacao} /></Route>
      <Route path="/flashcards"><AuthRoute component={Flashcards} /></Route>
      <Route path="/flashcards/revisar/:deckId"><AuthRoute component={FlashcardReview} /></Route>
      <Route path="/ranking"><AuthRoute component={Ranking} /></Route>
      <Route path="/perfil"><AuthRoute component={Perfil} /></Route>
      <Route path="/missoes"><AuthRoute component={Missoes} /></Route>
      <Route path="/pratica"><AuthRoute component={Pratica} /></Route>
      <Route path="/estude-hoje"><AuthRoute component={EstudeHoje} /></Route>
      <Route path="/professor-ia"><AuthRoute component={ProfessorIA} /></Route>
      <Route path="/ia-conteudo"><AuthRoute component={IaConteudo} /></Route>
      <Route path="/simulados/:id/resultado/:resultId"><AuthRoute component={SimuladoResultado} /></Route>
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
