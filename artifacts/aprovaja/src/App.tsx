import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import Sucesso from "@/pages/sucesso";
import Admin from "@/pages/admin";
import RecuperarSenha from "@/pages/recuperar-senha";
import RedefinirSenha from "@/pages/redefinir-senha";
import { Layout } from "@/components/Layout";
import { useSubscription, isSubscriptionActive } from "@/hooks/useSubscription";
import { useSession } from "@/hooks/useSession";

const queryClient = new QueryClient();

// How many times to retry the subscription check before giving up when
// arriving from a successful Stripe payment (webhook may lag behind redirect).
const POST_PAYMENT_MAX_RETRIES = 6;
const POST_PAYMENT_RETRY_DELAY_MS = 2000;

function SubscriptionGuard({ component: Component }: { component: React.ComponentType }) {
  // Detect the ?plano=ativo success redirect from Stripe Checkout
  const isPostPayment = new URLSearchParams(window.location.search).get("plano") === "ativo";
  const [retryCount, setRetryCount] = useState(0);

  // Check session role first — admin users bypass subscription entirely
  const { data: session, isLoading: isSessionLoading } = useSession();
  const { data, isLoading: isSubLoading, isError, refetch } = useSubscription();

  const isAdmin = session?.isAdmin === true;
  const active = isSubscriptionActive(data?.subscription);

  // After a successful payment, Stripe redirects here before the webhook has
  // necessarily updated the DB. Retry the subscription check a few times so
  // the user isn't bounced back to /planos just because the webhook lagged.
  useEffect(() => {
    if (isAdmin) return; // admins never need to retry
    if (!isPostPayment) return;
    if (isSubLoading || active) return;
    if (retryCount >= POST_PAYMENT_MAX_RETRIES) return;

    const timer = setTimeout(() => {
      setRetryCount((n) => n + 1);
      refetch();
    }, POST_PAYMENT_RETRY_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isAdmin, isPostPayment, isSubLoading, active, retryCount, refetch]);

  const waitingForWebhook =
    !isAdmin && isPostPayment && !active && retryCount < POST_PAYMENT_MAX_RETRIES;

  // Wait until we know session (and subscription if not admin)
  const isLoading = isSessionLoading || (!isAdmin && isSubLoading);

  if (isLoading || waitingForWebhook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        {waitingForWebhook && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Ativando sua assinatura…
          </p>
        )}
      </div>
    );
  }

  // Admins always get in regardless of subscription status
  if (isAdmin) {
    return (
      <Layout>
        <Component />
      </Layout>
    );
  }

  // Non-admin without an active subscription → plans page
  if (isError || !active) {
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
      <Route path="/sucesso" component={Sucesso} />
      <Route path="/recuperar-senha" component={RecuperarSenha} />
      <Route path="/recuperar-senha/redefinir" component={RedefinirSenha} />
      <Route path="/admin" component={Admin} />
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
