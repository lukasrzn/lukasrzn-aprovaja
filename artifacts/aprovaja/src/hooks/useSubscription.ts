import { useQuery } from "@tanstack/react-query";

export interface SubscriptionData {
  id: string;
  status: string;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
  _raw_data?: Record<string, unknown>;
}

async function fetchSubscription(): Promise<{ subscription: SubscriptionData | null }> {
  const res = await fetch("/api/stripe/subscription");
  if (!res.ok) throw new Error("Falha ao verificar assinatura");
  return res.json();
}

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscription,
    staleTime: 30_000,
    retry: 1,
  });
}

export function isSubscriptionActive(subscription: SubscriptionData | null | undefined): boolean {
  return subscription?.status === "active" || subscription?.status === "trialing";
}
